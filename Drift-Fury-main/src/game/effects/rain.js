// Falling rain: thin streaks in a box that follows the camera, all moved by the vertex shader (one draw call,
// no per-frame work on the CPU beyond two uniforms). Each streak falls at its own speed, slanted by the wind,
// and wraps around the box, so the rain never runs out wherever the player goes.
//
// It is drawn by a pass of its own after the temporal antialiasing (which would average thin, fast streaks
// away to nothing), hidden behind what is nearer by comparing with the scene pass's depth.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, LineSegments, Scene, ShaderMaterial, Vector2, Vector3 } from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

const COUNT = 6000;
const SIZE = 30; // metres across the box around the camera
const HEIGHT = 16;

const VERTEX = /* glsl */ `
attribute vec4 seed; // x, y, z in the box (0..1), speed factor
attribute float tip; // 0 the top of the streak, 1 its bottom
uniform float uTime;
uniform vec3 uCenter;
uniform vec2 uWind;
varying float vTip;
varying float vNear;
void main() {
  float speed = 8.5 + seed.w * 3.5;
  float y = mod(seed.y * ${HEIGHT.toFixed(1)} - uTime * speed, ${HEIGHT.toFixed(1)});
  vec3 p = vec3(seed.x * ${SIZE.toFixed(1)}, y, seed.z * ${SIZE.toFixed(1)});
  p.xz += uWind * (${HEIGHT.toFixed(1)} - y) * 0.06;
  // Wrapped around the camera.
  p.x = uCenter.x + mod(p.x - uCenter.x, ${SIZE.toFixed(1)}) - ${(SIZE / 2).toFixed(1)};
  p.z = uCenter.z + mod(p.z - uCenter.z, ${SIZE.toFixed(1)}) - ${(SIZE / 2).toFixed(1)};
  p.y += uCenter.y - ${(HEIGHT * 0.45).toFixed(1)};
  // The streak: its length along the fall (motion blur of a drop over a frame or so).
  vec3 fall = normalize(vec3(uWind.x * 0.06, -1.0, uWind.y * 0.06));
  p -= fall * tip * (0.8 + seed.w * 0.5);
  vTip = tip;
  vec4 view = viewMatrix * vec4(p, 1.0);
  // Drops right in front of the lens are a blur, not streaks across the whole screen: faded out.
  vNear = smoothstep(2.0, 5.0, -view.z);
  gl_Position = projectionMatrix * view;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform sampler2D tDepth;
uniform float uUseDepth;
uniform vec2 uResolution;
varying float vTip;
varying float vNear;
void main() {
  // Behind a wall, a car, a person: not seen.
  if (uUseDepth > 0.5 && gl_FragCoord.z > texture2D(tDepth, gl_FragCoord.xy / uResolution).x) discard;
  gl_FragColor = vec4(uColor, uOpacity * (1.0 - vTip * 0.7) * vNear);
}
`;

/**
 * `composer` (render/renderer.js): the pass is put in after its temporal antialiasing; `camera` the game's.
 */
export function createRain(composer, camera) {
  const scene = new Scene();
  const positions = new Float32Array(COUNT * 2 * 3); // (unused by the shader; three.js needs them)
  const seeds = new Float32Array(COUNT * 2 * 4);
  const tips = new Float32Array(COUNT * 2);
  for (let i = 0; i < COUNT; i++) {
    const seed = [Math.random(), Math.random(), Math.random(), Math.random()];
    for (let end = 0; end < 2; end++) {
      seeds.set(seed, (i * 2 + end) * 4);
      tips[i * 2 + end] = end;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new BufferAttribute(seeds, 4));
  geometry.setAttribute("tip", new BufferAttribute(tips, 1));
  const material = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new Vector3() },
      uWind: { value: new Float32Array([1.2, 0.5]) },
      uColor: { value: new Color("#b8c6d4") },
      uOpacity: { value: 0.45 },
      tDepth: { value: null },
      uUseDepth: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const rain = new LineSegments(geometry, material);
  rain.name = "rain";
  rain.frustumCulled = false;
  rain.visible = false;
  rain.renderOrder = 5;
  scene.add(rain);
  class RainPass extends Pass {
    constructor() {
      super();
      this.needsSwap = false;
    }
    render(renderer, writeBuffer, readBuffer) {
      if (!rain.visible) return;
      const depth = composer.scenePass?.target;
      const useDepth = !!depth?.depthTexture && (composer.scenePass.keepDepth || depth.samples > 0);
      material.uniforms.tDepth.value = useDepth ? depth.depthTexture : null;
      material.uniforms.uUseDepth.value = useDepth ? 1 : 0;
      material.uniforms.uResolution.value.set(readBuffer.width, readBuffer.height);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
      renderer.render(scene, camera);
      renderer.autoClear = autoClear;
    }
  }
  const pass = new RainPass();
  const after = composer.passes.indexOf(composer.taa ?? composer.ao ?? composer.scenePass);
  composer.insertPass(pass, after + 1);
  return {
    /** Rain on or off; `day` makes it a little less bright (it is lit by the sky, not the lamps). */
    set(on, day = false) {
      rain.visible = !!on;
      material.uniforms.uOpacity.value = day ? 0.32 : 0.45;
      material.uniforms.uColor.value.set(day ? "#d6dee6" : "#b8c6d4");
    },
    get on() {
      return rain.visible;
    },
    update(time, camera) {
      if (!rain.visible) return;
      material.uniforms.uTime.value = time;
      material.uniforms.uCenter.value.copy(camera.position);
    },
  };
}
