// Rain-wet asphalt: a wetness mask (standing puddles from large-scale noise, wetter gutters along the curbs,
// a damp sheen everywhere) darkens the surface and lays a mirror-like water film over it (clearcoat), and
// the environment reflection is box-projected onto the city's bounds so lit windows, lamps and shop fronts
// reflect in the road at about the right place instead of sliding along with the camera.
import { ShaderChunk, Vector3 } from "three";

const ShaderChunkEnvmap = ShaderChunk.envmap_physical_pars_fragment;

const DECLARATIONS = /* glsl */ `
uniform sampler2D wetNoise;
uniform vec3 wetProbe;
uniform vec3 wetBoxMin;
uniform vec3 wetBoxMax;
uniform vec4 wetGrid; // road spacing x, road spacing z, z offset, road half width
uniform float wetAmount;
varying vec3 vWetPosition;
float wetness;
float wetPuddle;
`;

const MASK = /* glsl */ `
#include <map_fragment>
{
  vec2 p = vWetPosition.xz;
  float broad = texture2D(wetNoise, p / 46.0).g;
  float fine = texture2D(wetNoise, p / 9.0).b;
  wetPuddle = smoothstep(0.6, 0.67, broad + (fine - 0.5) * 0.22) * wetAmount;
  // Gutters: the last metre and a half before each curb holds water.
  float dx = abs(p.x - wetGrid.x * floor(p.x / wetGrid.x + 0.5));
  float dz = abs(p.y - wetGrid.z - wetGrid.y * floor((p.y - wetGrid.z) / wetGrid.y + 0.5));
  float edge = wetGrid.w;
  float gutter = max(smoothstep(edge - 1.6, edge - 0.6, dx) * step(dx, edge + 0.1), smoothstep(edge - 1.6, edge - 0.6, dz) * step(dz, edge + 0.1));
  float streaks = smoothstep(0.35, 0.75, fine);
  wetness = max(max(wetPuddle, gutter * (0.55 + 0.45 * streaks) * wetAmount), 0.38 * wetAmount);
  // Wet asphalt darkens (water fills the pores); standing water darkens it most.
  diffuseColor.rgb *= mix(1.0, 0.58, wetness);
}
`;

const ROUGHNESS = /* glsl */ `
#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.32, wetness);
`;

const NORMAL = /* glsl */ `
#include <normal_fragment_maps>
// Water fills the texture of the road: puddles are flat.
normal = normalize(mix(normal, nonPerturbedNormal, wetPuddle));
`;

const FILM = /* glsl */ `
#include <lights_physical_fragment>
// The water film: a clear coat that is glassy in puddles and a soft sheen where the road is only damp.
material.clearcoat = max(material.clearcoat, wetness);
material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.0525 + geometryRoughness, max(wetPuddle, wetness * 0.6));
// Specular antialiasing: where one pixel covers many bumps of the asphalt's normal map (any distance past a
// few metres), its reflection is widened by how much the normal varies across the pixel, so the shiny wet
// road shows a stable sheen instead of single sparkling pixels that blink from frame to frame (and that the
// bloom turns into flashing blobs).
{
  vec3 normalDx = dFdx(normal);
  vec3 normalDy = dFdy(normal);
  float kernel = min(2.0 * 0.25 * (dot(normalDx, normalDx) + dot(normalDy, normalDy)), 0.3);
  float alpha = material.roughness * material.roughness;
  material.roughness = sqrt(sqrt(alpha * alpha + kernel));
  float coatAlpha = material.clearcoatRoughness * material.clearcoatRoughness;
  material.clearcoatRoughness = sqrt(sqrt(coatAlpha * coatAlpha + kernel * 0.5));
}
`;

const BOX_PROJECTION = /* glsl */ `
reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
if (all(greaterThan(cameraPosition, wetBoxMin)) && all(lessThan(cameraPosition, wetBoxMax))) {
  vec3 toMax = (wetBoxMax - vWetPosition) / reflectVec;
  vec3 toMin = (wetBoxMin - vWetPosition) / reflectVec;
  vec3 far = max(toMax, toMin);
  float distance = min(min(far.x, far.y), far.z);
  reflectVec = normalize(vWetPosition + reflectVec * distance - wetProbe);
}
`;

/**
 * Makes `material` (a MeshPhysicalMaterial) rain-wet. `probe` is the city reflection probe's position,
 * `box` its [min, max] bounds; `grid` describes the street grid for the gutters.
 */
export function makeWet(material, { noise, probe, box, grid, amount = 1 }) {
  const uniforms = {
    wetNoise: { value: noise },
    wetProbe: { value: probe.clone() },
    wetBoxMin: { value: box[0].clone() },
    wetBoxMax: { value: box[1].clone() },
    wetGrid: { value: grid },
    wetAmount: { value: amount },
  };
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWetPosition;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWetPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + DECLARATIONS)
      .replace("#include <map_fragment>", MASK)
      .replace("#include <roughnessmap_fragment>", ROUGHNESS)
      .replace("#include <normal_fragment_maps>", NORMAL)
      .replace("#include <lights_physical_fragment>", FILM)
      .replace("#include <envmap_physical_pars_fragment>", () =>
        ShaderChunkEnvmap.replace(
          "reflectVec = inverseTransformDirection( reflectVec, viewMatrix );",
          BOX_PROJECTION,
        ),
      );
  };
  const key = material.customProgramCacheKey?.() ?? "";
  material.customProgramCacheKey = () => key + "|wet";
  return material;
}

export const CITY_REFLECTION_PROBE = new Vector3(0, 2.4, -5);
export const CITY_REFLECTION_BOX = [new Vector3(-165, -2, -112), new Vector3(160, 90, 110)];
