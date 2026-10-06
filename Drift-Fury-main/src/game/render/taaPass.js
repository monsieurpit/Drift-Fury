// Temporal antialiasing (TAA).
//
// Every frame the camera is shifted by a different fraction of a pixel (a Halton sequence), so over a few
// frames each pixel samples many points of its area. Each new frame is blended into a history of the
// previous ones, reprojected to where they now are on screen: for the world, from the depth buffer and the
// camera's previous position; for cars and people, from motion vectors drawn by a small extra pass (each of
// them knows its own previous transform). The history is clamped to the colours around the pixel in the
// new frame, so anything that changed (a car pulling away, something uncovered) never leaves a ghost.
// The result is like rendering many times over: thin lines, distant lights and specular sparkles stop
// blinking as the camera moves, and edges are smooth without multisampling.
import {
  Color,
  DepthTexture,
  HalfFloatType,
  InstancedBufferAttribute,
  LinearFilter,
  Matrix4,
  NearestFilter,
  NoBlending,
  ShaderMaterial,
  UniformsUtils,
  UnsignedIntType,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";
import { CopyShader } from "three/addons/shaders/CopyShader.js";

/** Layer of the moving things (cars, people) drawn into the motion-vector pass. */
export const VELOCITY_LAYER = 2;

function halton(index, base) {
  let result = 0;
  let fraction = 1 / base;
  for (let i = index; i > 0; i = Math.floor(i / base)) {
    result += fraction * (i % base);
    fraction /= base;
  }
  return result;
}
const JITTER = Array.from({ length: 8 }, (_, i) => [halton(i + 1, 2) - 0.5, halton(i + 1, 3) - 0.5]);

const velocityMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      prevModelMatrix: { value: new Matrix4() },
      currViewProjection: { value: new Matrix4() },
      prevViewProjection: { value: new Matrix4() },
    },
    vertexShader: /* glsl */ `
      uniform mat4 prevModelMatrix;
      uniform mat4 currViewProjection;
      uniform mat4 prevViewProjection;
      #ifdef USE_INSTANCING
      attribute mat4 prevInstanceMatrix;
      #endif
      varying vec4 vCurrent;
      varying vec4 vPrevious;
      void main() {
        vec4 local = vec4(position, 1.0);
        #ifdef USE_INSTANCING
        vec4 world = modelMatrix * instanceMatrix * local;
        vec4 previousWorld = prevModelMatrix * prevInstanceMatrix * local;
        #else
        vec4 world = modelMatrix * local;
        vec4 previousWorld = prevModelMatrix * local;
        #endif
        vCurrent = currViewProjection * world;
        vPrevious = prevViewProjection * previousWorld;
        // Rasterized with the jittered projection, exactly like the colour pass.
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec4 vCurrent;
      varying vec4 vPrevious;
      void main() {
        vec2 motion = (vCurrent.xy / vCurrent.w - vPrevious.xy / vPrevious.w) * 0.5;
        // Motion in screen UV, and this surface's depth (to check it is what the colour pass saw).
        gl_FragColor = vec4(motion, gl_FragCoord.z, 1.0);
      }
    `,
  });

const RESOLVE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RESOLVE_FRAGMENT = /* glsl */ `
uniform sampler2D tCurrent;
uniform sampler2D tHistory;
uniform sampler2D tDepth;
uniform sampler2D tVelocity;
uniform mat4 invJitteredViewProjection;
uniform mat4 currViewProjection;
uniform mat4 prevViewProjection;
uniform vec2 resolution;
uniform float historyValid;
varying vec2 vUv;

vec3 toYCoCg(vec3 c) {
  return vec3(dot(c, vec3(0.25, 0.5, 0.25)), dot(c, vec3(0.5, 0.0, -0.5)), dot(c, vec3(-0.25, 0.5, -0.25)));
}
vec3 fromYCoCg(vec3 c) {
  return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z);
}
// Blending in a compressed range keeps very bright pixels (lamps, glints) from dominating the average.
vec3 compress(vec3 c) {
  return c / (1.0 + max(max(c.r, c.g), c.b));
}
vec3 expand(vec3 c) {
  return c / max(1e-4, 1.0 - max(max(c.r, c.g), c.b));
}
// History is sampled with a 5-tap Catmull-Rom filter: sharper than bilinear, so it doesn't soften over time.
vec3 sampleHistory(vec2 uv) {
  vec2 position = uv * resolution;
  vec2 centre = floor(position - 0.5) + 0.5;
  vec2 f = position - centre;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 tc0 = (centre - 1.0) / resolution;
  vec2 tc3 = (centre + 2.0) / resolution;
  vec2 tc12 = (centre + w2 / w12) / resolution;
  vec3 result = texture2D(tHistory, vec2(tc12.x, tc0.y)).rgb * (w12.x * w0.y);
  result += texture2D(tHistory, vec2(tc0.x, tc12.y)).rgb * (w0.x * w12.y);
  result += texture2D(tHistory, vec2(tc12.x, tc12.y)).rgb * (w12.x * w12.y);
  result += texture2D(tHistory, vec2(tc3.x, tc12.y)).rgb * (w3.x * w12.y);
  result += texture2D(tHistory, vec2(tc12.x, tc3.y)).rgb * (w12.x * w3.y);
  float weight = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return max(result / weight, vec3(0.0));
}

void main() {
  vec2 texel = 1.0 / resolution;
  float depth = texture2D(tDepth, vUv).r;
  vec4 velocity = texture2D(tVelocity, vUv);
  vec2 previousUv;
  if (velocity.a > 0.5 && abs(velocity.b - depth) < 0.0005) {
    // A moving object: its own motion vector.
    previousUv = vUv - velocity.xy;
  } else {
    // The world: where this point was on screen last frame, from its depth and the camera's motion.
    vec4 world = invJitteredViewProjection * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    world /= world.w;
    vec4 current = currViewProjection * world;
    vec4 previous = prevViewProjection * world;
    previousUv = vUv - (current.xy / current.w - previous.xy / previous.w) * 0.5;
  }

  // The new frame's 3x3 neighbourhood: its mean and spread bound what the history may be.
  vec3 sum = vec3(0.0);
  vec3 sumSquares = vec3(0.0);
  vec3 centre = vec3(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec3 c = toYCoCg(compress(texture2D(tCurrent, vUv + vec2(float(x), float(y)) * texel).rgb));
      if (x == 0 && y == 0) centre = c;
      sum += c;
      sumSquares += c * c;
    }
  }
  vec3 mean = sum / 9.0;
  vec3 spread = sqrt(max(sumSquares / 9.0 - mean * mean, vec3(0.0)));
  vec3 history = toYCoCg(compress(sampleHistory(previousUv)));
  history = clamp(history, mean - 1.25 * spread, mean + 1.25 * spread);

  bool offScreen = any(lessThan(previousUv, vec2(0.0))) || any(greaterThan(previousUv, vec2(1.0)));
  float blend = (historyValid < 0.5 || offScreen) ? 1.0 : 0.1;
  vec3 result = expand(fromYCoCg(mix(history, centre, blend)));
  // Never let a bad value into the history (it would stay there).
  if (any(isnan(result)) || any(isinf(result))) result = expand(fromYCoCg(centre));
  gl_FragColor = vec4(max(result, vec3(0.0)), 1.0);
}
`;

// Contrast-adaptive sharpening of the result (the accumulated history itself stays unsharpened): a jittered
// average is slightly softer than a single sample, and this restores the crispness of fine texture without
// ringing on strong edges.
const SHARPEN_FRAGMENT = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float amount;
varying vec2 vUv;
void main() {
  vec2 texel = 1.0 / resolution;
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb;
  vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
  vec3 e = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb;
  vec3 w = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
  // Work on compressed values so bright lights don't drive the sharpening.
  vec3 cc = c / (1.0 + c);
  vec3 mn = min(cc, min(min(n, s), min(e, w)) / (1.0 + min(min(n, s), min(e, w))));
  vec3 mx = max(cc, max(max(n, s), max(e, w)) / (1.0 + max(max(n, s), max(e, w))));
  // Less sharpening where local contrast is already high (no halos on hard edges).
  vec3 adapt = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));
  vec3 weight = -adapt * amount * 0.2;
  vec3 result = (c + (n + s + e + w) * weight) / (1.0 + 4.0 * weight);
  gl_FragColor = vec4(max(result, vec3(0.0)), 1.0);
}
`;

/**
 * The TAA pass. Put it right after the scene (and ambient occlusion) passes. `depthTexture()` returns the
 * scene pass's depth. Call beginFrame(camera) before rendering (it jitters the projection) and
 * endFrame(camera) after (it restores it and remembers this frame for the next); track(object) every
 * moving object (cars, people) so it gets motion vectors.
 */
export class TAAPass extends Pass {
  constructor(scene, camera, depthTexture) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.depthTexture = depthTexture;
    const options = {
      type: HalfFloatType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
    };
    this.history = [new WebGLRenderTarget(1, 1, options), new WebGLRenderTarget(1, 1, options)];
    this.velocity = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthTexture: new DepthTexture(1, 1, UnsignedIntType),
    });
    this.velocityMaterial = velocityMaterial();
    this.velocityMaterial.onBeforeRender = (renderer, scene, camera, geometry, object) => {
      this.velocityMaterial.uniforms.prevModelMatrix.value.copy(
        object.userData.prevWorld || object.matrixWorld,
      );
      this.velocityMaterial.uniformsNeedUpdate = true;
    };
    this.resolve = new FullScreenQuad(
      new ShaderMaterial({
        uniforms: {
          tCurrent: { value: null },
          tHistory: { value: null },
          tDepth: { value: null },
          tVelocity: { value: null },
          invJitteredViewProjection: { value: new Matrix4() },
          currViewProjection: { value: new Matrix4() },
          prevViewProjection: { value: new Matrix4() },
          resolution: { value: new Vector2(1, 1) },
          historyValid: { value: 0 },
        },
        vertexShader: RESOLVE_VERTEX,
        fragmentShader: RESOLVE_FRAGMENT,
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.copy = new FullScreenQuad(
      new ShaderMaterial({
        uniforms: UniformsUtils.clone(CopyShader.uniforms),
        vertexShader: CopyShader.vertexShader,
        fragmentShader: CopyShader.fragmentShader,
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.sharpen = new FullScreenQuad(
      new ShaderMaterial({
        uniforms: {
          tDiffuse: { value: null },
          resolution: { value: new Vector2(1, 1) },
          amount: { value: 0.6 },
        },
        vertexShader: RESOLVE_VERTEX,
        fragmentShader: SHARPEN_FRAGMENT,
        blending: NoBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.tracked = new Set();
    this.frameIndex = 0;
    this.historyIndex = 0;
    this.historyValid = false;
    this.begun = false;
    this.unjittered = new Matrix4();
    this.currViewProjection = new Matrix4();
    this.prevViewProjection = new Matrix4();
    this.jitteredViewProjection = new Matrix4();
    this.size = new Vector2(1, 1);
    this.savedClearColor = new Color();
  }

  setSize(width, height) {
    this.size.set(width, height);
    for (const target of this.history) target.setSize(width, height);
    this.velocity.setSize(width, height);
    this.historyValid = false;
  }

  /** Forget the history (after a teleport, a quality change, a resize). */
  reset() {
    this.historyValid = false;
  }

  /** Gives `root`'s meshes motion vectors (their previous transforms are kept from frame to frame). */
  track(root) {
    root.traverse((object) => {
      if (!object.isMesh || this.tracked.has(object)) return;
      object.layers.enable(VELOCITY_LAYER);
      object.userData.prevWorld = object.matrixWorld.clone();
      if (object.isInstancedMesh) {
        const previous = new InstancedBufferAttribute(new Float32Array(object.instanceMatrix.array), 16);
        object.geometry.setAttribute("prevInstanceMatrix", previous);
        object.userData.prevInstances = previous;
      }
      this.tracked.add(object);
    });
  }

  untrack(root) {
    root.traverse((object) => this.tracked.delete(object));
  }

  /** Jitters the camera's projection for this frame. */
  beginFrame(camera) {
    if (!this.enabled) return;
    this.unjittered.copy(camera.projectionMatrix);
    this.currViewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const [jx, jy] = JITTER[this.frameIndex % JITTER.length];
    this.frameIndex++;
    camera.projectionMatrix.elements[8] += (2 * jx) / this.size.x;
    camera.projectionMatrix.elements[9] += (2 * jy) / this.size.y;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    this.jitteredViewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.begun = true;
  }

  /** Restores the projection and keeps this frame's transforms for the next frame's motion. */
  endFrame(camera) {
    if (!this.begun) return;
    this.begun = false;
    camera.projectionMatrix.copy(this.unjittered);
    camera.projectionMatrixInverse.copy(this.unjittered).invert();
    this.prevViewProjection.copy(this.currViewProjection);
    for (const object of this.tracked) {
      if (!object.parent) {
        this.tracked.delete(object); // removed from the scene (a replaced car look)
        continue;
      }
      object.userData.prevWorld.copy(object.matrixWorld);
      const previous = object.userData.prevInstances;
      if (previous) {
        if (previous.array.length !== object.instanceMatrix.array.length) {
          object.geometry.setAttribute(
            "prevInstanceMatrix",
            (object.userData.prevInstances = new InstancedBufferAttribute(
              new Float32Array(object.instanceMatrix.array),
              16,
            )),
          );
        } else {
          previous.array.set(object.instanceMatrix.array);
          previous.needsUpdate = true;
        }
      }
    }
  }

  render(renderer, writeBuffer, readBuffer) {
    if (!this.begun) {
      // A render outside the game loop (warm-up, captures): pass the image through.
      this.copy.material.uniforms.tDiffuse.value = readBuffer.texture;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
      this.copy.render(renderer);
      this.historyValid = false;
      return;
    }
    // 1. Motion vectors of the moving things.
    const scene = this.scene;
    const camera = this.camera;
    const uniforms = this.velocityMaterial.uniforms;
    uniforms.currViewProjection.value.copy(this.currViewProjection);
    uniforms.prevViewProjection.value.copy(
      this.historyValid ? this.prevViewProjection : this.currViewProjection,
    );
    const override = scene.overrideMaterial;
    const layers = camera.layers.mask;
    renderer.getClearColor(this.savedClearColor);
    const clearAlpha = renderer.getClearAlpha();
    scene.overrideMaterial = this.velocityMaterial;
    camera.layers.set(VELOCITY_LAYER);
    renderer.setRenderTarget(this.velocity);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    camera.layers.mask = layers;
    scene.overrideMaterial = override;
    renderer.setClearColor(this.savedClearColor, clearAlpha);

    // 2. Blend this frame into the history.
    const resolve = this.resolve.material.uniforms;
    const previous = this.history[this.historyIndex];
    const next = this.history[1 - this.historyIndex];
    resolve.tCurrent.value = readBuffer.texture;
    resolve.tHistory.value = previous.texture;
    resolve.tDepth.value = this.depthTexture();
    resolve.tVelocity.value = this.velocity.texture;
    resolve.invJitteredViewProjection.value.copy(this.jitteredViewProjection).invert();
    resolve.currViewProjection.value.copy(this.currViewProjection);
    resolve.prevViewProjection.value.copy(this.prevViewProjection);
    resolve.resolution.value.copy(this.size);
    resolve.historyValid.value = this.historyValid ? 1 : 0;
    renderer.setRenderTarget(next);
    this.resolve.render(renderer);
    this.historyIndex = 1 - this.historyIndex;
    this.historyValid = true;

    // 3. On to the rest of the chain, sharpened.
    this.sharpen.material.uniforms.tDiffuse.value = next.texture;
    this.sharpen.material.uniforms.resolution.value.copy(this.size);
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.sharpen.render(renderer);
  }

  dispose() {
    for (const target of this.history) target.dispose();
    this.velocity.dispose();
    this.velocityMaterial.dispose();
    this.resolve.dispose();
    this.copy.dispose();
    this.sharpen.dispose();
  }
}
