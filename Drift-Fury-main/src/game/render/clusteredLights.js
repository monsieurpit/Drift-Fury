// Many real lights: clustered forward lighting.
//
// three.js shades every pixel of every lit material with every light in the scene, so a WebGL game can
// only afford a handful of real lights, and the city used to have six moving point lights near the player
// and a few nearly invisible ones at the gas stations. Here every light in the world (street lamps, the
// gas stations' canopy tubes, shop windows and signs, police light bars and headlights, the player's tail
// lights) lives in one list, and the ground around the camera is divided into 8 m cells that each know
// the few lights able to reach them. Each pixel finds its cell and lights itself with just those, through
// the same physically based light model as three.js's own lights: hundreds of lights, a handful each.
//
// The light list and the cells are two small float textures, rebuilt on the CPU: the world's lights when
// the camera has moved by a cell, the moving lights (cars) every frame on top of those.
import { DataTexture, FloatType, NearestFilter, RGBAFormat, Vector2 } from "three";
import { useWorldVarying } from "./worldVarying.js";

const CELL = 8; // metres
const GRID = 36; // cells per side: 288 m around the camera
const PER_CELL = 16; // lights per cell at most (the strongest at the cell are kept)
const TEXELS_PER_CELL = PER_CELL / 4;
const MAX_LIGHTS = 512;
const ROWS = 4; // texels per light, one row each
// Lights fade out with distance from the camera, so the edge of the grid never shows.
const FADE_START = 80;
const FADE_END = 112;

/** Light flags. */
export const LIGHT_LAMP = 1; // a street lamp: the ground takes it from its baked map instead (lampLighting.js)

const DECLARATIONS = /* glsl */ `
uniform sampler2D clusterLights; // ${MAX_LIGHTS} x ${ROWS}: position+range, colour*intensity+flags, direction+cos outer, cos inner
uniform sampler2D clusterCells; // ${GRID * TEXELS_PER_CELL} x ${GRID}: light indices, 4 per texel, -1 ends the list
uniform vec2 clusterOrigin; // world x, z of the grid's corner
uniform float clusterEnabled;
`;


// `skipFlags`: lights with any of these flags are left out (the ground skips the lamps it has baked).
function lighting(skipFlags) {
  return /* glsl */ `
#if defined( RE_Direct )
if (clusterEnabled > 0.5) {
  ivec2 cell = ivec2(floor((vClusterWorld.xz - clusterOrigin) / ${CELL.toFixed(1)}));
  if (cell.x >= 0 && cell.y >= 0 && cell.x < ${GRID} && cell.y < ${GRID}) {
    bool listEnded = false;
    for (int t = 0; t < ${TEXELS_PER_CELL}; t++) {
      vec4 ids = texelFetch(clusterCells, ivec2(cell.x * ${TEXELS_PER_CELL} + t, cell.y), 0);
      for (int k = 0; k < 4; k++) {
        float id = ids[k];
        if (id < 0.0) { listEnded = true; break; }
        int index = int(id);
        vec4 positionRange = texelFetch(clusterLights, ivec2(index, 0), 0);
        vec4 colourFlags = texelFetch(clusterLights, ivec2(index, 1), 0);
        ${skipFlags ? `if ((int(colourFlags.w) & ${skipFlags}) != 0) continue;` : ""}
        vec3 toLight = (viewMatrix * vec4(positionRange.xyz, 1.0)).xyz - geometryPosition;
        float distanceSquared = dot(toLight, toLight);
        float range = positionRange.w;
        if (distanceSquared > range * range) continue;
        IncidentLight clusterLight;
        clusterLight.direction = toLight * inversesqrt(max(distanceSquared, 1e-6));
        vec4 directionOuter = texelFetch(clusterLights, ivec2(index, 2), 0);
        float spot = 1.0;
        if (directionOuter.w > -1.5) {
          vec3 axis = normalize(mat3(viewMatrix) * directionOuter.xyz);
          float cosInner = texelFetch(clusterLights, ivec2(index, 3), 0).x;
          spot = smoothstep(directionOuter.w, cosInner, dot(-clusterLight.direction, axis));
        }
        float window = 1.0 - distanceSquared * distanceSquared / (range * range * range * range);
        clusterLight.color = colourFlags.rgb * (spot * window * window / max(distanceSquared, 1.0));
        clusterLight.visible = true;
        RE_Direct( clusterLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
      }
      if (listEnded) break;
    }
  }
}
#endif
#include <lights_fragment_end>
`;
}

/**
 * A light: { x, y, z, color (three Color, linear), intensity, range, flags = 0,
 *            direction: [x, y, z] (a spot light) or null (a point light), cosOuter, cosInner }.
 */
/** `enabled: false`: a device whose GPU could not compile these shaders (patching does nothing). */
export function createClusteredLights({ enabled = true } = {}) {
  const lightData = new Float32Array(MAX_LIGHTS * ROWS * 4);
  const lightTexture = new DataTexture(lightData, MAX_LIGHTS, ROWS, RGBAFormat, FloatType);
  const cellData = new Float32Array(GRID * TEXELS_PER_CELL * GRID * 4).fill(-1);
  const cellTexture = new DataTexture(cellData, GRID * TEXELS_PER_CELL, GRID, RGBAFormat, FloatType);
  for (const texture of [lightTexture, cellTexture]) {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  }
  const uniforms = {
    clusterLights: { value: lightTexture },
    clusterCells: { value: cellTexture },
    clusterOrigin: { value: new Vector2(-1e6, -1e6) },
    clusterEnabled: { value: 1 },
  };

  const patched = new WeakSet(); // (not userData: clones copy it, but not the shader patch)
  const staticLights = [];
  const buckets = new Map(); // 32 m buckets of the world's lights, to find those around the camera fast
  const BUCKET = 32;
  const bucketKey = (i, j) => i * 65536 + j;

  // The world's lights around the camera, their cells (kept until the camera moves by a cell) and scores.
  const staticCellIds = new Int16Array(GRID * GRID * PER_CELL).fill(-1);
  const staticCellScores = new Float32Array(GRID * GRID * PER_CELL);
  const cellIds = new Int16Array(GRID * GRID * PER_CELL);
  const cellScores = new Float32Array(GRID * GRID * PER_CELL);
  let nearby = []; // static lights in the current grid, in light-texture order
  let originI = Infinity;
  let originJ = Infinity;
  const dynamicLights = [];
  let dynamicWritten = 0;

  function writeLight(slot, light, fade) {
    const o = slot * 4;
    const rowStride = MAX_LIGHTS * 4;
    lightData[o] = light.x;
    lightData[o + 1] = light.y;
    lightData[o + 2] = light.z;
    lightData[o + 3] = light.range;
    const strength = light.intensity * fade;
    lightData[rowStride + o] = light.color.r * strength;
    lightData[rowStride + o + 1] = light.color.g * strength;
    lightData[rowStride + o + 2] = light.color.b * strength;
    lightData[rowStride + o + 3] = light.flags || 0;
    if (light.direction) {
      const [dx, dy, dz] = light.direction;
      lightData[2 * rowStride + o] = dx;
      lightData[2 * rowStride + o + 1] = dy;
      lightData[2 * rowStride + o + 2] = dz;
      lightData[2 * rowStride + o + 3] = light.cosOuter ?? 0;
      lightData[3 * rowStride + o] = light.cosInner ?? 0.5;
    } else {
      lightData[2 * rowStride + o + 3] = -2; // a point light
    }
  }

  /** Adds `id` (light index) with `score` to a cell's list, keeping the PER_CELL strongest. */
  function insert(ids, scores, cell, id, score) {
    const base = cell * PER_CELL;
    let weakest = base;
    for (let k = base; k < base + PER_CELL; k++) {
      if (ids[k] < 0) {
        ids[k] = id;
        scores[k] = score;
        return;
      }
      if (scores[k] < scores[weakest]) weakest = k;
    }
    if (score > scores[weakest]) {
      ids[weakest] = id;
      scores[weakest] = score;
    }
  }

  /** Adds a light to every cell it reaches; the score is its strength at the cell (not faded, so stable). */
  function rasterize(ids, scores, light, id) {
    const x0 = originI * CELL;
    const z0 = originJ * CELL;
    const range = light.range;
    const i0 = Math.max(0, Math.floor((light.x - range - x0) / CELL));
    const i1 = Math.min(GRID - 1, Math.floor((light.x + range - x0) / CELL));
    const j0 = Math.max(0, Math.floor((light.z - range - z0) / CELL));
    const j1 = Math.min(GRID - 1, Math.floor((light.z + range - z0) / CELL));
    const range2 = range * range;
    for (let j = j0; j <= j1; j++) {
      const cz = Math.max(z0 + j * CELL, Math.min(light.z, z0 + (j + 1) * CELL)) - light.z;
      for (let i = i0; i <= i1; i++) {
        const cx = Math.max(x0 + i * CELL, Math.min(light.x, x0 + (i + 1) * CELL)) - light.x;
        const d2 = cx * cx + cz * cz;
        if (d2 > range2) continue;
        insert(ids, scores, j * GRID + i, id, light.intensity / Math.max(d2 + 1, 1));
      }
    }
  }

  function rebuildStatic() {
    staticCellIds.fill(-1);
    nearby = [];
    const x0 = originI * CELL;
    const z0 = originJ * CELL;
    const x1 = x0 + GRID * CELL;
    const z1 = z0 + GRID * CELL;
    for (let bi = Math.floor(x0 / BUCKET) - 1; bi <= Math.floor(x1 / BUCKET) + 1; bi++) {
      for (let bj = Math.floor(z0 / BUCKET) - 1; bj <= Math.floor(z1 / BUCKET) + 1; bj++) {
        const bucket = buckets.get(bucketKey(bi, bj));
        if (!bucket) continue;
        for (const light of bucket) {
          if (light.x + light.range < x0 || light.x - light.range > x1) continue;
          if (light.z + light.range < z0 || light.z - light.range > z1) continue;
          if (nearby.length >= MAX_LIGHTS - 64) continue; // room kept for the moving lights
          rasterize(staticCellIds, staticCellScores, light, nearby.length);
          nearby.push(light);
        }
      }
    }
  }

  return {
    /** Adds a light that never moves (call while building the world). */
    addStatic(light) {
      staticLights.push(light);
      const key = bucketKey(Math.floor(light.x / BUCKET), Math.floor(light.z / BUCKET));
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(light);
      originI = Infinity; // rebuild on the next update
    },
    /** Moving lights for this frame: call before update(), every frame (they last one frame). */
    addDynamic(light) {
      if (dynamicLights.length < 64) dynamicLights.push(light);
    },
    get staticCount() {
      return staticLights.length;
    },
    /** Rebuilds the lights around `camera` (call once per frame, after the dynamic lights are added). */
    update(camera) {
      const eyeX = camera.position.x;
      const eyeZ = camera.position.z;
      const eyeY = camera.position.y;
      const i = Math.floor(eyeX / CELL) - GRID / 2;
      const j = Math.floor(eyeZ / CELL) - GRID / 2;
      let cellsChanged = false;
      if (i !== originI || j !== originJ) {
        originI = i;
        originJ = j;
        uniforms.clusterOrigin.value.set(i * CELL, j * CELL);
        rebuildStatic();
        cellsChanged = true;
      }
      // Fade every light with its distance from the camera.
      const fadeOf = (light) => {
        const d = Math.hypot(light.x - eyeX, light.y - eyeY, light.z - eyeZ);
        const t = Math.min(1, Math.max(0, (FADE_END - d) / (FADE_END - FADE_START)));
        return t * t * (3 - 2 * t);
      };
      for (let k = 0; k < nearby.length; k++) writeLight(k, nearby[k], fadeOf(nearby[k]));
      // Moving lights on top of the world's (in the slots after them).
      if (dynamicLights.length || dynamicWritten || cellsChanged) {
        cellIds.set(staticCellIds);
        cellScores.set(staticCellScores);
        for (let k = 0; k < dynamicLights.length; k++) {
          const slot = nearby.length + k;
          writeLight(slot, dynamicLights[k], fadeOf(dynamicLights[k]));
          rasterize(cellIds, cellScores, dynamicLights[k], slot);
        }
        for (let k = 0; k < cellIds.length; k++) cellData[k] = cellIds[k];
        cellTexture.needsUpdate = true;
        dynamicWritten = dynamicLights.length;
      }
      dynamicLights.length = 0;
      lightTexture.needsUpdate = true;
    },
    /** Turns the lights off (for cube-map captures) or back on. */
    setEnabled(enabled) {
      uniforms.clusterEnabled.value = enabled ? 1 : 0;
    },
    /**
     * Lights a standard, physical, Lambert or Phong material with the clustered lights. `skipFlags` leaves
     * some lights out (the ground passes LIGHT_LAMP: it has the lamps baked in).
     */
    patch(material, { skipFlags = 0 } = {}) {
      if (!enabled || patched.has(material)) return material;
      patched.add(material);
      const previous = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        previous?.call(material, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\n" + DECLARATIONS)
          .replace("#include <lights_fragment_end>", lighting(skipFlags));
        useWorldVarying(shader, "vClusterWorld");
      };
      const key = material.customProgramCacheKey?.() ?? "";
      material.customProgramCacheKey = () => key + "|cluster" + skipFlags;
      material.needsUpdate = true;
      return material;
    },
    /** Patches every lit material under `root` that is not patched yet. */
    patchAll(root) {
      root.traverse((object) => {
        if (!object.material) return;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (
            material.isMeshStandardMaterial ||
            material.isMeshLambertMaterial ||
            material.isMeshPhongMaterial
          ) {
            this.patch(material);
          }
        }
      });
    },
  };
}
