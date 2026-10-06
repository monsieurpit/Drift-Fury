// Tyre smoke: one instanced mesh of camera-facing puffs (a single draw call for the whole cloud). Each puff
// billows from about half a metre to several metres across, keeps some of the car's speed and then slows,
// rises and swirls, fades in quickly and thins out over a few seconds. Puffs are lit like soft volumes:
// their normals bulge toward the camera, so the moon, street lamps and tail lights shade them from the side.
import {
  CanvasTexture,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { fbm } from "../util/noise.js";

function puffTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size - 0.5;
      const v = (y + 0.5) / size - 0.5;
      const radius = Math.hypot(u, v) * 2;
      // Billowy edge: the radius is pushed in and out by noise, then a soft falloff.
      const billow = fbm(x / 22 + 3.1, y / 22 + 7.4, { seed: 41, octaves: 4 });
      const edge = 1 - Math.min(1, Math.max(0, (radius - 0.35 - (billow - 0.5) * 0.5) / 0.6));
      const density = edge * edge * (0.55 + 0.45 * fbm(x / 12, y / 12, { seed: 42, octaves: 3 }));
      const index = (y * size + x) * 4;
      const shade = 225 + billow * 30;
      image.data[index] = shade;
      image.data[index + 1] = shade;
      image.data[index + 2] = shade;
      image.data[index + 3] = Math.round(Math.min(1, density) * 255);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const VERTEX_DECLARATIONS = /* glsl */ `
attribute float smokeAlpha;
attribute float smokeRotation;
varying float vSmokeAlpha;
`;

// Billboard: the quad is laid out in view space around the puff's centre, at the puff's size and rotation.
const BILLBOARD = /* glsl */ `
vSmokeAlpha = smokeAlpha;
float smokeSize = length(instanceMatrix[0].xyz);
float c = cos(smokeRotation);
float s = sin(smokeRotation);
vec2 corner = mat2(c, s, -s, c) * position.xy * smokeSize;
vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
mvPosition.xy += corner;
gl_Position = projectionMatrix * mvPosition;
`;

/**
 * Creates the tyre smoke system. `patch(material)` (optional) adds extra lighting (the street lamps).
 * Returns { emit(position, velocity, size), update(dt) }.
 */
export function createDriftSmoke(scene, { maxPuffs = 160, patch } = {}) {
  const geometry = new PlaneGeometry(1, 1);
  const alpha = new InstancedBufferAttribute(new Float32Array(maxPuffs), 1);
  const rotation = new InstancedBufferAttribute(new Float32Array(maxPuffs), 1);
  geometry.setAttribute("smokeAlpha", alpha);
  geometry.setAttribute("smokeRotation", rotation);
  const material = new MeshStandardMaterial({
    map: puffTexture(),
    color: new Color("#d9dee3"),
    roughness: 1,
    metalness: 0,
    transparent: true,
    depthWrite: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + VERTEX_DECLARATIONS)
      .replace(
        "#include <defaultnormal_vertex>",
        // A bulging normal in view space: lit like a soft ball of vapour rather than a flat card.
        "#include <defaultnormal_vertex>\ntransformedNormal = normalize(vec3(position.xy * 1.5, 1.0));",
      )
      .replace("#include <project_vertex>", BILLBOARD);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vSmokeAlpha;")
      .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.a *= vSmokeAlpha;");
  };
  material.customProgramCacheKey = () => "drift-fury-smoke";
  if (patch) patch(material);
  const mesh = new InstancedMesh(geometry, material, maxPuffs);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.count = 0;
  mesh.visible = false;
  scene.add(mesh);

  const puffs = Array.from({ length: maxPuffs }, () => ({
    age: 0,
    life: 0,
    position: new Vector3(),
    velocity: new Vector3(),
    size: 1,
    growth: 1,
    spin: 0,
    angle: 0,
    seed: 0,
  }));
  let cursor = 0;
  const matrix = new Matrix4();

  return {
    /** Starts a puff at `position` moving with `velocity` (m/s); `strength` scales size and density. */
    emit(position, velocity, strength = 1) {
      const puff = puffs[cursor];
      cursor = (cursor + 1) % maxPuffs;
      puff.age = 0;
      puff.life = 2.4 + Math.random() * 1.6;
      puff.position.copy(position);
      puff.velocity.copy(velocity);
      puff.size = (0.5 + Math.random() * 0.35) * strength;
      puff.growth = (2.6 + Math.random() * 1.6) * strength;
      puff.angle = Math.random() * Math.PI * 2;
      puff.spin = (Math.random() - 0.5) * 0.8;
      puff.seed = Math.random() * 100;
      puff.strength = Math.min(1, strength);
    },
    update(dt) {
      let live = 0;
      for (const puff of puffs) {
        if (puff.age >= puff.life) continue;
        puff.age += dt;
        if (puff.age >= puff.life) continue;
        const t = puff.age / puff.life;
        // Drag slows the puff to the air's speed; warm vapour rises; a little turbulence swirls it.
        const drag = Math.exp(-1.8 * dt);
        puff.velocity.x = puff.velocity.x * drag + Math.sin(puff.seed + puff.age * 1.7) * 0.35 * dt;
        puff.velocity.z = puff.velocity.z * drag + Math.cos(puff.seed * 1.3 + puff.age * 1.3) * 0.35 * dt;
        puff.velocity.y = puff.velocity.y * drag + 0.35 * dt;
        puff.position.addScaledVector(puff.velocity, dt);
        const size = puff.size + puff.growth * Math.pow(t, 0.55);
        matrix.makeScale(size, size, size).setPosition(puff.position);
        mesh.setMatrixAt(live, matrix);
        // Quick fade in, long thinning out as it spreads.
        const fade = Math.min(1, puff.age / 0.18) * Math.pow(1 - t, 1.6);
        alpha.array[live] = fade * 0.55 * puff.strength;
        rotation.array[live] = puff.angle + puff.spin * puff.age;
        live++;
      }
      mesh.count = live;
      mesh.visible = live > 0; // no draw call while there is no smoke
      mesh.instanceMatrix.needsUpdate = true;
      alpha.needsUpdate = true;
      rotation.needsUpdate = true;
    },
  };
}
