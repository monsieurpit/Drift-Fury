// Street lamp lighting for the city's ground surfaces, computed in their shaders. Real light objects are
// expensive in WebGL (every one adds work to every lit material), so the game only ever had a handful near
// the player, and they were too dim to matter. Instead, the nearest LAMP_COUNT lamps are passed to the
// road, sidewalk and lot materials as a uniform array and each pixel is lit by all of them through the same
// physically based light model as every other light: warm pools of light along every street, glints and
// long streaky highlights in the wet asphalt, falling off with distance like real luminaires.
import { Color, Vector4 } from "three";

export const LAMP_COUNT = 24;

const DECLARATIONS = /* glsl */ `
uniform vec4 streetLamps[${LAMP_COUNT}];
uniform vec3 streetLampColor;
`;

const LIGHTING = /* glsl */ `
#if defined( RE_Direct )
{
  vec3 lampDown = normalize((viewMatrix * vec4(0.0, -1.0, 0.0, 0.0)).xyz);
  for (int i = 0; i < ${LAMP_COUNT}; i++) {
    vec4 lamp = streetLamps[i];
    if (lamp.w <= 0.0) continue;
    vec3 toLamp = (viewMatrix * vec4(lamp.xyz, 1.0)).xyz - geometryPosition;
    float distanceSquared = dot(toLamp, toLamp);
    float range = 28.0;
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
  };
  const order = positions.map((_, index) => index);
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
      order.sort((a, b) => distances[a] - distances[b]);
      uniforms.streetLamps.value.forEach((lamp, slot) => {
        const index = order[slot];
        if (index === undefined) lamp.set(0, 0, 0, 0);
        else lamp.set(positions[index].x, positions[index].y, positions[index].z, intensity);
      });
    },
  };
}
