// Night sky dome, computed per pixel so it stays crisp at any resolution: a gradient that meets the fog at
// the horizon, faint airglow, warm light pollution over the city, two layers of stars (colour by
// temperature, gentle scintillation, extinction near the horizon), the Milky Way with dust lanes, the moon
// with its halo, and thin drifting clouds lit by the moon from behind and by the city from below.
import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from "three";

/** Direction toward the moon (and of the moonlight, which the session places along it). */
export const MOON_DIRECTION = new Vector3(0.63, 0.669, -0.394).normalize();

const VERTEX = /* glsl */ `
varying vec3 vDirection;
void main() {
  vDirection = position;
  // Rotation only: the dome is always centred on the camera, and pinned to the far plane.
  vec4 clip = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = clip.xyww;
}
`;

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uMoon;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform vec3 uCityGlow;
varying vec3 vDirection;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0)), u.x), u.y);
}
float fbm2(vec2 p) {
  float sum = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += noise2(p) * amplitude;
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amplitude *= 0.5;
  }
  return sum;
}
float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y);
  float b = mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y);
  return mix(a, b, u.z);
}

// One layer of stars: at most one star per cell of a 3D grid cut by the sphere of radius 'scale'.
vec3 stars(vec3 d, vec3 footprint, float scale, float density, float brightness) {
  vec3 p = d * scale;
  vec3 cell = floor(p);
  float h = hash13(cell);
  if (h > density) return vec3(0.0);
  vec3 star = cell + 0.35 + 0.3 * vec3(hash13(cell + 7.1), hash13(cell + 13.7), hash13(cell + 21.3));
  float pixel = max((footprint.x + footprint.y) * scale, 0.02);
  float dist = length(p - star);
  // Gaussian a little over a pixel wide whatever the resolution, so stars never shimmer or vanish.
  float sigma = max(pixel * 0.55, 0.04);
  // Same total light whatever the footprint: wider (lower-resolution) stars get dimmer peaks.
  float shape = exp(-dist * dist / (2.0 * sigma * sigma)) * min(1.0, 0.0144 / (sigma * sigma));
  float magnitude = pow(hash13(cell + 3.3), 6.0);
  float temperature = hash13(cell + 5.9);
  vec3 tint = temperature < 0.2 ? vec3(1.0, 0.78, 0.6) : temperature < 0.45 ? vec3(1.0, 0.93, 0.85) : temperature < 0.85 ? vec3(0.93, 0.96, 1.0) : vec3(0.75, 0.84, 1.0);
  float twinkle = 0.8 + 0.2 * sin(uTime * (2.0 + h * 40.0) + h * 300.0);
  return tint * shape * (0.15 + magnitude * 2.5) * brightness * twinkle;
}

void main() {
  vec3 d = normalize(vDirection);
  // Pixel footprint, taken before any branch (derivatives are undefined inside non-uniform branches).
  vec3 footprint = fwidth(d);
  float h = d.y;
  float up = max(h, 0.0);

  // Base gradient: fog colour at and below the horizon (distant terrain, and anything past the far plane,
  // fades straight into the sky), deep blue-black overhead.
  vec3 sky = mix(uHorizon, uZenith, pow(smoothstep(-0.02, 0.55, h), 0.5));
  float aboveHorizon = smoothstep(-0.03, 0.01, h);
  // Moonlit sky: scattered moonlight turns the whole sky a deep blue, brighter toward the moon.
  sky += vec3(0.0035, 0.0072, 0.016) * (0.55 + 0.45 * max(dot(d, uMoon), 0.0)) * (0.5 + 0.5 * smoothstep(-0.05, 0.4, h)) * aboveHorizon;
  // Airglow: a faint green-tinted band about 10 degrees up.
  sky += vec3(0.0016, 0.0032, 0.0022) * exp(-pow((h - 0.16) / 0.1, 2.0)) * aboveHorizon;
  // Light pollution: warm sodium glow over the city (toward +z), hugging the horizon.
  vec2 flat2 = normalize(d.xz + 1e-5);
  float toCity = pow(clamp(flat2.y * 0.5 + 0.5, 0.0, 1.0), 2.5);
  float cityGlow = toCity * exp(-up * 9.0);
  sky += uCityGlow * cityGlow * aboveHorizon;

  // Moon: disk with maria and limb darkening, a tight aureole and a wide halo.
  float mu = dot(d, uMoon);
  float moonRadius = 0.0165;
  float moonAngle = acos(clamp(mu, -1.0, 1.0));
  vec3 moonSide = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0)));
  vec3 moonUp = cross(moonSide, uMoon);
  vec2 disk = vec2(dot(d, moonSide), dot(d, moonUp)) / moonRadius;
  float onDisk = 1.0 - smoothstep(0.9, 1.0, moonAngle / moonRadius);
  vec3 moonColor = vec3(0.0);
  if (onDisk > 0.0) {
    float maria = fbm2(disk * 2.2 + 4.0);
    float limb = sqrt(max(0.0, 1.0 - dot(disk, disk)));
    moonColor = vec3(1.0, 0.97, 0.9) * (0.75 + 0.25 * limb) * mix(1.0, 0.68, smoothstep(0.45, 0.7, maria)) * 2.4;
  }
  float aureole = 0.0004 / max(1.0 - mu, 0.0004);
  float halo = exp(-moonAngle * 9.0) * 0.022 + exp(-moonAngle * 2.4) * 0.006;
  vec3 moonLight = vec3(0.62, 0.72, 0.9) * (min(aureole, 0.25) + halo);

  // Stars and Milky Way fade out toward the horizon (thicker air, haze, light pollution).
  float clearSky = smoothstep(0.0, 0.3, h) * (1.0 - 0.75 * cityGlow) * (1.0 - smoothstep(0.85, 0.99, mu));
  if (clearSky > 0.001) {
    vec3 galacticNormal = normalize(vec3(0.35, 0.42, 0.84));
    float galactic = dot(d, galacticNormal);
    float band = exp(-pow(galactic / 0.2, 2.0));
    vec3 milkyWay = vec3(0.0);
    float dust = 0.0;
    if (band > 0.01) {
      float clouds3 = noise3(d * 5.0) * 0.6 + noise3(d * 11.0) * 0.4;
      float lane = exp(-pow(galactic / 0.05, 2.0));
      if (lane > 0.01) dust = smoothstep(0.45, 0.7, noise3(d * 8.0 + 3.0)) * lane;
      milkyWay = vec3(0.009, 0.0095, 0.011) * band * (0.4 + clouds3) * (1.0 - dust * 0.8);
    }
    vec3 starLight = stars(d, footprint, 150.0, 0.035 + band * 0.07, 0.22) + stars(d, footprint, 60.0, 0.03, 0.45);
    sky += (starLight * (1.0 - dust * 0.7) + milkyWay) * clearSky;
  }

  // Clouds: a thin layer projected onto a plane, drifting slowly. Lit silver near the moon, a faint
  // orange underside over the city, otherwise dark shapes that hide the stars.
  if (h > 0.0) {
    vec2 plane = d.xz / (h + 0.08) * 0.45 + vec2(uTime * 0.004, uTime * 0.0015);
    float shape = fbm2(plane) * 0.65 + fbm2(plane * 3.1 + 11.0) * 0.35;
    float coverage = smoothstep(0.5, 0.74, shape) * smoothstep(0.02, 0.22, h);
    float thin = smoothstep(0.5, 0.62, shape) - smoothstep(0.62, 0.8, shape);
    vec3 cloudColor = mix(uHorizon * 0.55, uZenith * 2.2, smoothstep(0.0, 0.5, h));
    cloudColor += vec3(0.55, 0.62, 0.75) * (pow(max(mu, 0.0), 24.0) * 0.5 * (0.4 + thin) + exp(-moonAngle * 3.0) * 0.012);
    cloudColor += uCityGlow * 1.4 * toCity * exp(-up * 4.0);
    sky = mix(sky, cloudColor, coverage * 0.88);
    onDisk *= 1.0 - coverage * 0.85;
  }
  sky += moonLight;
  sky = mix(sky, moonColor, onDisk * step(0.0, h));

  // Dither against banding in the very dark gradient.
  sky += (hash12(gl_FragCoord.xy) - 0.5) * 0.0012;
  gl_FragColor = vec4(max(sky, 0.0), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** Builds the sky dome; returns a per-frame update (time in seconds). */
export function buildSky(world) {
  const { scene } = world;
  const horizon = scene.fog ? scene.fog.color.clone() : new Color("#223a4d");
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMoon: { value: MOON_DIRECTION.clone() },
      uHorizon: { value: horizon },
      uZenith: { value: new Color("#050a18") },
      uCityGlow: { value: new Color(0.05, 0.03, 0.016) },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const dome = new Mesh(new SphereGeometry(100, 48, 24), material);
  dome.name = "sky-dome";
  dome.frustumCulled = false;
  dome.renderOrder = -1000;
  scene.add(dome);
  // The dome covers every pixel, so the equirectangular background (still used for reflections) is not drawn.
  scene.background = null;
  return (time) => {
    material.uniforms.uTime.value = time;
  };
}
