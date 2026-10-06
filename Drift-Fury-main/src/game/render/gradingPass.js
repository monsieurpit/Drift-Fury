// Cinematic colour grading, applied after tone mapping and sRGB output (so it works in display space like a
// colourist's grade): a gentle S-curve for contrast, cool shadows and warm highlights (the teal/orange split
// that night photography and modern games use), a little extra saturation in the mid-tones, slight
// chromatic aberration toward the frame edges, and fine animated film grain that also hides banding.
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const GradingShader = {
  name: "GradingShader",
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uContrast: { value: 0.18 },
    uSaturation: { value: 1.12 },
    uShadowTint: { value: [0.9, 1.0, 1.12] },
    uHighlightTint: { value: [1.08, 1.0, 0.9] },
    uAberration: { value: 0.0016 },
    uGrain: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uContrast;
    uniform float uSaturation;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    uniform float uAberration;
    uniform float uGrain;
    varying vec2 vUv;

    float hash(vec2 p) {
      vec3 q = fract(vec3(p.xyx) * 0.1031);
      q += dot(q, q.yzx + 33.33);
      return fract((q.x + q.y) * q.z);
    }

    void main() {
      // Lens chromatic aberration: red and blue split slightly, only toward the edges.
      vec2 fromCentre = vUv - 0.5;
      vec2 shift = fromCentre * dot(fromCentre, fromCentre) * uAberration * 8.0;
      vec3 color;
      color.r = texture2D(tDiffuse, vUv + shift).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - shift).b;

      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      // Split toning: cool the shadows, warm the highlights.
      vec3 tint = mix(uShadowTint, uHighlightTint, smoothstep(0.05, 0.6, luma));
      color *= mix(vec3(1.0), tint, 0.5);
      // Contrast S-curve around mid-grey (keeps pure black and white where they are).
      vec3 curve = color * color * (3.0 - 2.0 * color);
      color = mix(color, curve, uContrast);
      // Saturation, strongest in the mid-tones.
      luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float midtones = 1.0 - abs(luma * 2.0 - 1.0);
      color = mix(vec3(luma), color, 1.0 + (uSaturation - 1.0) * (0.4 + 0.6 * midtones));
      // Film grain, stronger in the shadows like real sensor noise.
      float grain = hash(gl_FragCoord.xy + fract(uTime) * 1000.0) - 0.5;
      color += grain * uGrain * (1.0 - luma * 0.7);
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `,
};

export function createGradingPass() {
  const pass = new ShaderPass(GradingShader);
  pass.update = (time) => {
    pass.uniforms.uTime.value = time;
  };
  return pass;
}
