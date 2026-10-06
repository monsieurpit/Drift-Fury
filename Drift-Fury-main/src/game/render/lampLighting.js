// Street lamp lighting for the city's ground surfaces, computed in their shaders. Real light objects are
// expensive in WebGL (every one adds work to every lit material), so the game only ever had a handful near
// the player, and they were too dim to matter. Instead, the nearest LAMP_COUNT lamps are passed to the
// road, sidewalk and lot materials as a uniform array and each pixel is lit by all of them through the same
// physically based light model as every other light: warm pools of light along every street, glints and
// long streaky highlights in the wet asphalt, falling off with distance like real luminaires.
import { Color, Frustum, Matrix4, Sphere, Vector3, Vector4 } from "three";

export const LAMP_COUNT = 20;
const LAMP_RANGE = 28; // metres: beyond this a lamp adds nothing

const DECLARATIONS = /* glsl */ `
uniform vec4 streetLamps[${LAMP_COUNT}]; // view-space position (updated every frame), intensity
uniform vec3 streetLampColor;
uniform int streetLampCount; // lamps in use: the first streetLampCount entries
`;

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
  };
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  const reach = new Sphere(new Vector3(), LAMP_RANGE);
  const nearest = []; // candidate lamps around the player (several times what the shader takes)
  const ranked = []; // this frame's candidates with their distance from the camera
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
        uniforms.streetLamps.value[count++].set(
          point.x,
          point.y,
          point.z,
          intensity * fade * fade * (3 - 2 * fade),
        );
      }
      for (let slot = count; slot < LAMP_COUNT; slot++) uniforms.streetLamps.value[slot].set(0, 0, 0, 0);
      uniforms.streetLampCount.value = count;
    },
    clear() {
      uniforms.streetLampCount.value = 0;
    },
  };
}
