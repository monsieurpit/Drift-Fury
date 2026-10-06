// Street lamp lighting for the city's ground surfaces, computed in their shaders. Real light objects are
// expensive in WebGL (every one adds work to every lit material), so the game only ever had a handful near
// the player, and they were too dim to matter. Instead, the nearest LAMP_COUNT lamps are passed to the
// road, sidewalk and lot materials as a uniform array and each pixel is lit by all of them through the same
// physically based light model as every other light: warm pools of light along every street, glints and
// long streaky highlights in the wet asphalt, falling off with distance like real luminaires.
import {
  Color,
  DataTexture,
  DataUtils,
  Frustum,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  RedFormat,
  Sphere,
  Vector2,
  Vector3,
  Vector4,
} from "three";

export const LAMP_COUNT = 16;
// The ground (road, sidewalks, paint) takes its lamp light from a map baked once, and only adds the wet
// glints of this many nearest lamps live.
const GLINT_COUNT = 8;
const BAKE_TEXEL = 0.25; // metres per texel of the baked ground lamp map
const BAKE_HEIGHT = 0.1; // height of the surface the map is baked for (road and sidewalk tops)
const LAMP_RANGE = 28; // metres: beyond this a lamp adds nothing

const DECLARATIONS = /* glsl */ `
uniform vec4 streetLamps[${LAMP_COUNT}]; // view-space position (updated every frame), intensity
uniform vec3 streetLampColor;
uniform int streetLampCount; // lamps in use: the first streetLampCount entries
`;

// The ground: lamp light from the baked map (every lamp, no selection, nothing that can pop) plus the
// specular glints of the nearest lamps in the wet asphalt, faded in and out with distance.
const GROUND_VERTEX_DECLARATIONS = /* glsl */ `
varying vec3 vLampWorld;
`;
const GROUND_VERTEX = /* glsl */ `
#include <project_vertex>
vLampWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;
const GROUND_DECLARATIONS = /* glsl */ `
uniform vec4 streetLamps[${LAMP_COUNT}];
uniform float streetLampGlint[${LAMP_COUNT}];
uniform vec3 streetLampColor;
uniform int streetLampCount;
uniform sampler2D streetLampMap;
uniform vec4 streetLampMapRect; // x0, z0, width, depth (metres)
varying vec3 vLampWorld;
`;
const GROUND_LIGHTING = /* glsl */ `
#if defined( RE_Direct )
{
  vec2 lampUv = (vLampWorld.xz - streetLampMapRect.xy) / streetLampMapRect.zw;
  if (all(greaterThan(lampUv, vec2(0.0))) && all(lessThan(lampUv, vec2(1.0)))) {
    float lampIrradiance = texture2D(streetLampMap, lampUv).r;
    reflectedLight.directDiffuse += lampIrradiance * streetLampColor * BRDF_Lambert(material.diffuseColor);
  }
  vec3 lampDown = normalize((viewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz);
  for (int i = 0; i < ${GLINT_COUNT}; i++) {
    if (i >= streetLampCount) break;
    vec4 lamp = streetLamps[i];
    float glint = streetLampGlint[i];
    if (lamp.w <= 0.0 || glint <= 0.0) continue;
    vec3 toLamp = lamp.xyz - geometryPosition;
    float distanceSquared = dot(toLamp, toLamp);
    float range = ${LAMP_RANGE.toFixed(1)};
    if (distanceSquared > range * range) continue;
    IncidentLight lampLight;
    lampLight.direction = toLamp * inversesqrt(distanceSquared);
    float spot = smoothstep(0.12, 0.7, dot(-lampLight.direction, lampDown));
    float window = 1.0 - distanceSquared * distanceSquared / (range * range * range * range);
    lampLight.color = streetLampColor * (lamp.w * glint * spot * window * window / max(distanceSquared, 1.0));
    lampLight.visible = true;
    ReflectedLight glints = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    RE_Direct( lampLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, glints );
    reflectedLight.directSpecular += glints.directSpecular;
  }
}
#endif
#include <lights_fragment_end>
`;

/**
 * The lamps' light on a flat surface at BAKE_HEIGHT, the same light model as the shader (downward spot,
 * windowed inverse-square falloff, Lambert's cosine), summed over every lamp: a map of the irradiance.
 */
function bakeGroundLight(positions, intensity) {
  let x0 = Infinity;
  let z0 = Infinity;
  let x1 = -Infinity;
  let z1 = -Infinity;
  for (const p of positions) {
    x0 = Math.min(x0, p.x - LAMP_RANGE);
    z0 = Math.min(z0, p.z - LAMP_RANGE);
    x1 = Math.max(x1, p.x + LAMP_RANGE);
    z1 = Math.max(z1, p.z + LAMP_RANGE);
  }
  if (!positions.length) {
    x0 = z0 = 0;
    x1 = z1 = 1;
  }
  const width = Math.max(1, Math.ceil((x1 - x0) / BAKE_TEXEL));
  const depth = Math.max(1, Math.ceil((z1 - z0) / BAKE_TEXEL));
  const values = new Float32Array(width * depth);
  const range2 = LAMP_RANGE * LAMP_RANGE;
  const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (const p of positions) {
    const height = p.y - BAKE_HEIGHT;
    const i0 = Math.max(0, Math.floor((p.x - LAMP_RANGE - x0) / BAKE_TEXEL));
    const i1 = Math.min(width - 1, Math.ceil((p.x + LAMP_RANGE - x0) / BAKE_TEXEL));
    const j0 = Math.max(0, Math.floor((p.z - LAMP_RANGE - z0) / BAKE_TEXEL));
    const j1 = Math.min(depth - 1, Math.ceil((p.z + LAMP_RANGE - z0) / BAKE_TEXEL));
    for (let j = j0; j <= j1; j++) {
      const dz = z0 + (j + 0.5) * BAKE_TEXEL - p.z;
      for (let i = i0; i <= i1; i++) {
        const dx = x0 + (i + 0.5) * BAKE_TEXEL - p.x;
        const d2 = dx * dx + dz * dz + height * height;
        if (d2 > range2) continue;
        const cosine = height / Math.sqrt(d2); // both the spot's angle and the surface's (it faces up)
        const spot = smoothstep(0.12, 0.7, cosine);
        const window = 1 - (d2 * d2) / (range2 * range2);
        values[j * width + i] += (intensity * spot * window * window * cosine) / Math.max(d2, 1);
      }
    }
  }
  const half = new Uint16Array(values.length);
  for (let k = 0; k < values.length; k++) half[k] = DataUtils.toHalfFloat(values[k]);
  const texture = new DataTexture(half, width, depth, RedFormat, HalfFloatType);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return { texture, rect: new Vector4(x0, z0, width * BAKE_TEXEL, depth * BAKE_TEXEL) };
}

const LIGHTING = /* glsl */ `
#if defined( RE_Direct )
{
  vec3 lampDown = normalize((viewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz);
  for (int i = 0; i < ${LAMP_COUNT}; i++) {
    if (i >= streetLampCount) break;
    vec4 lamp = streetLamps[i];
    if (lamp.w <= 0.0) continue;
    vec3 toLamp = lamp.xyz - geometryPosition;
    float distanceSquared = dot(toLamp, toLamp);
    float range = ${LAMP_RANGE.toFixed(1)};
    if (distanceSquared > range * range) continue;
    IncidentLight lampLight;
    lampLight.direction = toLamp * inversesqrt(distanceSquared);
    // Downward luminaire: full strength below, cut off toward the horizontal.
    float spot = smoothstep(0.12, 0.7, dot(-lampLight.direction, lampDown));
    float window = 1.0 - distanceSquared * distanceSquared / (range * range * range * range);
    lampLight.color = streetLampColor * (lamp.w * spot * window * window / max(distanceSquared, 1.0));
    lampLight.visible = true;
    RE_Direct( lampLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
  }
}
#endif
#include <lights_fragment_end>
`;

/**
 * Lamp lighting for the lamps at `positions` ([{x, y, z}]). `patch(material)` adds it to a standard or
 * physical material; `update(x, z)` picks the lamps nearest to that point (call it as the player moves).
 */
export function createLampLighting(positions, { intensity = 450, color = "#ffcf94" } = {}) {
  const uniforms = {
    streetLamps: { value: Array.from({ length: LAMP_COUNT }, () => new Vector4(0, 0, 0, 0)) },
    streetLampColor: { value: new Color(color) },
    streetLampCount: { value: 0 },
    streetLampGlint: { value: new Array(LAMP_COUNT).fill(0) },
  };
  const baked = bakeGroundLight(positions, intensity);
  uniforms.streetLampMap = { value: baked.texture };
  uniforms.streetLampMapRect = { value: baked.rect };
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  const reach = new Sphere(new Vector3(), LAMP_RANGE);
  const nearest = []; // candidate lamps around the player (several times what the shader takes)
  const ranked = []; // this frame's candidates with their distance from the camera
  const visibleDistances = new Float32Array(LAMP_COUNT + 1);
  const point = new Vector3();
  const distances = new Float32Array(positions.length);
  let lastX = Infinity;
  let lastZ = Infinity;
  return {
    patch(material) {
      const previous = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        previous?.call(material, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\n" + DECLARATIONS)
          .replace("#include <lights_fragment_end>", LIGHTING);
      };
      const key = material.customProgramCacheKey?.() ?? "";
      material.customProgramCacheKey = () => key + "|lamps";
      material.needsUpdate = true;
      return material;
    },
    /** Adds the baked lamp light and the live wet glints to a ground material (road, sidewalk, paint). */
    patchGround(material) {
      const previous = material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => {
        previous?.call(material, shader, renderer);
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\n" + GROUND_VERTEX_DECLARATIONS)
          .replace("#include <project_vertex>", GROUND_VERTEX);
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\n" + GROUND_DECLARATIONS)
          .replace("#include <lights_fragment_end>", GROUND_LIGHTING);
      };
      const key = material.customProgramCacheKey?.() ?? "";
      material.customProgramCacheKey = () => key + "|ground-lamps";
      material.needsUpdate = true;
      return material;
    },
    update(x, z) {
      if ((x - lastX) ** 2 + (z - lastZ) ** 2 < 16) return;
      lastX = x;
      lastZ = z;
      for (let i = 0; i < positions.length; i++) {
        distances[i] = (positions[i].x - x) ** 2 + (positions[i].z - z) ** 2;
      }
      const order = positions.map((_, index) => index).sort((a, b) => distances[a] - distances[b]);
      nearest.length = 0;
      nearest.push(...order.slice(0, LAMP_COUNT * 3));
    },
    /**
     * Picks this frame's lamps and moves them into view space (call once per frame, before rendering).
     * The LAMP_COUNT lamps nearest the camera light the scene, whichever way it looks, so turning the view
     * never changes the lighting; the farthest of them fade out toward the first lamp left out, so lamps
     * joining or leaving the set as the camera moves never pop. Of those, only the ones whose light can
     * reach something on screen go to the shader (the others could not change a pixel), so each pixel
     * loops over just those.
     */
    updateView(camera) {
      viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(viewProjection);
      const eye = camera.position;
      ranked.length = 0;
      for (const index of nearest) {
        const p = positions[index];
        reach.center.set(p.x, p.y, p.z);
        ranked.push({ index, distance: reach.center.distanceTo(eye) });
      }
      ranked.sort((a, b) => a.distance - b.distance);
      const chosen = Math.min(LAMP_COUNT, ranked.length);
      // Distance of the first lamp left out: the fade reaches zero there. (With nothing left out there is
      // nothing to fade toward; Infinity / Infinity would be NaN, and one NaN light blacks out the frame.)
      const cutoff = ranked.length > LAMP_COUNT ? ranked[LAMP_COUNT].distance : Infinity;
      const fadeLength = Math.max(12, cutoff * 0.3);
      let count = 0;
      for (let rank = 0; rank < chosen; rank++) {
        const { index, distance } = ranked[rank];
        const p = positions[index];
        reach.center.set(p.x, p.y, p.z);
        if (!frustum.intersectsSphere(reach)) continue;
        const fade = cutoff === Infinity ? 1 : Math.min(1, Math.max(0, (cutoff - distance) / fadeLength));
        point.set(p.x, p.y, p.z).applyMatrix4(camera.matrixWorldInverse);
        visibleDistances[count] = distance;
        uniforms.streetLamps.value[count++].set(
          point.x,
          point.y,
          point.z,
          intensity * fade * fade * (3 - 2 * fade),
        );
      }
      for (let slot = count; slot < LAMP_COUNT; slot++) uniforms.streetLamps.value[slot].set(0, 0, 0, 0);
      uniforms.streetLampCount.value = count;
      // Wet glints on the ground: the GLINT_COUNT nearest of those, faded toward the next one in line.
      const glints = uniforms.streetLampGlint.value;
      const glintCutoff = count > GLINT_COUNT ? visibleDistances[GLINT_COUNT] : Infinity;
      const glintFade = Math.max(8, glintCutoff * 0.35);
      for (let slot = 0; slot < LAMP_COUNT; slot++) {
        if (slot >= count || slot >= GLINT_COUNT) {
          glints[slot] = 0;
          continue;
        }
        const t =
          glintCutoff === Infinity
            ? 1
            : Math.min(1, Math.max(0, (glintCutoff - visibleDistances[slot]) / glintFade));
        glints[slot] = t * t * (3 - 2 * t);
      }
    },
    clear() {
      uniforms.streetLampCount.value = 0;
    },
  };
}
