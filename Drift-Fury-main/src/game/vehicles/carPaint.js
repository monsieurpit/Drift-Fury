// Automotive paint in two layers, computed in the car's own coordinates so the pattern is fixed to the body:
//  - metallic flakes in the base coat: ~1 mm aluminium flakes, each tilted at random, so the base layer's
//    highlights break into fine sparkle under street lamps and headlights (faded out where a flake is
//    smaller than a pixel, so it never shimmers);
//  - "orange peel" in the clear coat: the faint, smooth ripple of sprayed lacquer, which keeps reflections
//    of the city from looking like a perfect chrome mirror.

const VERTEX_DECLARATIONS = /* glsl */ `
varying vec3 vPaintPosition;
`;

const FRAGMENT_DECLARATIONS = /* glsl */ `
varying vec3 vPaintPosition;
vec3 paintHash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float paintNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(paintHash33(i).x, paintHash33(i + vec3(1, 0, 0)).x, u.x), mix(paintHash33(i + vec3(0, 1, 0)).x, paintHash33(i + vec3(1, 1, 0)).x, u.x), u.y);
  float b = mix(mix(paintHash33(i + vec3(0, 0, 1)).x, paintHash33(i + vec3(1, 0, 1)).x, u.x), mix(paintHash33(i + vec3(0, 1, 1)).x, paintHash33(i + vec3(1, 1, 1)).x, u.x), u.y);
  return mix(a, b, u.z);
}
`;

const FLAKES = /* glsl */ `
#include <normal_fragment_maps>
{
  const float flakesPerMetre = 900.0;
  vec3 flakeSpace = vPaintPosition * flakesPerMetre;
  // How many flakes fall in one pixel: fade the sparkle out before they alias.
  float perPixel = length(fwidth(flakeSpace));
  float visible = 1.0 - smoothstep(0.6, 1.6, perPixel);
  vec3 cell = floor(flakeSpace);
  vec3 random = paintHash33(cell);
  float present = step(0.5, paintHash33(cell + 17.0).x);
  vec3 tilt = (random * 2.0 - 1.0) * 0.32;
  normal = normalize(normal + tilt * present * visible);
}
`;

const PEEL = /* glsl */ `
#include <clearcoat_normal_fragment_maps>
#ifdef USE_CLEARCOAT
{
  vec3 q = vPaintPosition * 140.0; // ripples ~7 mm across
  vec3 ripple = vec3(paintNoise(q), paintNoise(q + 31.7), paintNoise(q + 63.1)) - 0.5;
  clearcoatNormal = normalize(clearcoatNormal + ripple * 0.022);
}
#endif
`;

/** Adds metallic flakes and clear-coat orange peel to a car paint MeshPhysicalMaterial. */
export function applyCarPaint(material) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + VERTEX_DECLARATIONS)
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPaintPosition = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + FRAGMENT_DECLARATIONS)
      .replace("#include <normal_fragment_maps>", FLAKES)
      .replace("#include <clearcoat_normal_fragment_maps>", PEEL);
  };
  material.customProgramCacheKey = () => "drift-fury-car-paint";
  return material;
}
