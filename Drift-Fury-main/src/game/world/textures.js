import { CanvasTexture, RepeatWrapping, MeshPhysicalMaterial, Vector2 } from "three";
import { createRandom } from "../util/random.js";
import { fbm, valueNoise } from "../util/noise.js";
/**
 * Fractal value noise on a size x size grid: `octaves` layers of smoothly interpolated random lattices,
 * each twice as fine and `persistence` times as strong as the previous one. Returns the summed grid and
 * the maximum possible value (for normalising). The first argument is unused (kept for call-site symmetry).
 */
function fractalNoise(_context, size, octaves, persistence, seed) {
  const random = createRandom(seed);
  const grid = new Float32Array(size * size);
  let amplitude = 1;
  let max = 0;
  for (let octave = 0; octave < octaves; octave++) {
    const cells = 2 ** octave;
    const lattice = new Float32Array((cells + 1) * (cells + 1));
    for (let index = 0; index < lattice.length; index++) {
      lattice[index] = random();
    }
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const u = (column / size) * cells;
        const v = (row / size) * cells;
        const cellX = Math.floor(u);
        const cellY = Math.floor(v);
        const fx = u - cellX;
        const fy = v - cellY;
        const topLeft = lattice[cellY * (cells + 1) + cellX];
        const topRight = lattice[cellY * (cells + 1) + cellX + 1];
        const bottomLeft = lattice[(cellY + 1) * (cells + 1) + cellX];
        const bottomRight = lattice[(cellY + 1) * (cells + 1) + cellX + 1];
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        grid[row * size + column] +=
          (topLeft * (1 - sx) * (1 - sy) +
            topRight * sx * (1 - sy) +
            bottomLeft * (1 - sx) * sy +
            bottomRight * sx * sy) *
          amplitude;
      }
    }
    max += amplitude;
    amplitude *= persistence;
  }
  return {
    grid,
    max,
  };
}
export function normalMapFromHeight(heightMap, strength = 2.4) {
  const sourceCanvas = heightMap.image || heightMap;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const source = sourceCanvas.getContext("2d").getImageData(0, 0, width, height).data;
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const context = normalCanvas.getContext("2d");
  const image = context.createImageData(width, height);
  const sample = (x, y) =>
    source[(Math.min(height - 1, Math.max(0, y)) * width + Math.min(width - 1, Math.max(0, x))) * 4] / 255;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const length = Math.hypot(dx, dy, 1) || 1;
      const index = (y * width + x) * 4;
      image.data[index] = ((dx / length) * 0.5 + 0.5) * 255;
      image.data[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      image.data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const normalMap = new CanvasTexture(normalCanvas);
  normalMap.wrapS = RepeatWrapping;
  normalMap.wrapT = RepeatWrapping;
  normalMap.anisotropy = 8;
  return normalMap;
}
/**
 * City asphalt (one texture repeat = 10 m): fine aggregate with sparkle, broad tonal variation, a few thin
 * sealed cracks and faint oil stains. Built with direct pixel operations (fast) and fully tileable.
 * `variant` picks a different random layout.
 */
export function createAsphaltMaterial(variant = 6) {
  const size = 512;
  const random = createRandom(4242 + variant);
  const albedo = new Float32Array(size * size);
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const index = y * size + x;
      const broad = fbm(u * 3, v * 3, { seed: variant, octaves: 4, period: 3 });
      const mid = fbm(u * 24, v * 24, { seed: variant + 1, octaves: 2, period: 24 });
      const stones =
        valueNoise(x * 0.5, y * 0.5, variant + 2, size * 0.5) * 0.6 +
        valueNoise(x, y, variant + 3, size) * 0.4;
      let shade = 0.25 + broad * 0.06 + mid * 0.03 + (stones - 0.5) * 0.1;
      if (stones > 0.8 && random() < 0.3) shade += 0.06; // pale chips in the aggregate
      albedo[index] = shade;
      height[index] = stones * 0.85 + mid * 0.15;
      rough[index] = 0.82 + (stones - 0.5) * 0.08 - broad * 0.05;
    }
  }
  const at = (x, y) => (((y % size) + size) % size) * size + (((x % size) + size) % size);
  // Thin sealed cracks.
  for (let crack = 0; crack < 3; crack++) {
    let x = random() * size;
    let y = random() * size;
    for (let step = 0; step < 140; step++) {
      x += (random() - 0.5) * 2.2;
      y += 1.2 + random() * 1.2;
      for (const [ox, oy] of [
        [0, 0],
        [1, 0],
      ]) {
        const index = at(Math.round(x + ox), Math.round(y + oy));
        albedo[index] = Math.min(albedo[index], 0.13);
        height[index] -= 0.25;
        rough[index] = 0.6;
      }
    }
  }
  // Faint oil stains (darker, a little glossier).
  for (let stain = 0; stain < 3; stain++) {
    const cx = random() * size;
    const cy = random() * size;
    const radius = 10 + random() * 22;
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const d = Math.hypot(x, y) / radius;
        if (d >= 1) continue;
        const amount = (1 - d * d) * 0.5;
        const index = at(Math.round(cx + x), Math.round(cy + y));
        albedo[index] *= 1 - amount * 0.35;
        rough[index] -= amount * 0.25;
      }
    }
  }
  const makeCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    return canvas;
  };
  const colorCanvas = makeCanvas();
  const heightCanvas = makeCanvas();
  const roughnessCanvas = makeCanvas();
  const colorImage = colorCanvas.getContext("2d").createImageData(size, size);
  const heightImage = heightCanvas.getContext("2d").createImageData(size, size);
  const roughImage = roughnessCanvas.getContext("2d").createImageData(size, size);
  for (let index = 0; index < size * size; index++) {
    const shade = Math.max(0, Math.min(1, albedo[index])) * 255;
    colorImage.data.set([shade, shade, shade * 1.03, 255], index * 4);
    const h = Math.max(0, Math.min(1, height[index])) * 255;
    heightImage.data.set([h, h, h, 255], index * 4);
    const r = Math.max(0, Math.min(1, rough[index])) * 255;
    roughImage.data.set([r, r, r, 255], index * 4);
  }
  colorCanvas.getContext("2d").putImageData(colorImage, 0, 0);
  heightCanvas.getContext("2d").putImageData(heightImage, 0, 0);
  roughnessCanvas.getContext("2d").putImageData(roughImage, 0, 0);
  const toTexture = (canvas, srgb) => {
    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
    if (srgb) texture.colorSpace = "srgb";
    return texture;
  };
  const material = new MeshPhysicalMaterial({
    map: toTexture(colorCanvas, true),
    normalMap: normalMapFromHeight(heightCanvas, 2.4),
    normalScale: new Vector2(1, 1),
    roughnessMap: toTexture(roughnessCanvas, false),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    envMapIntensity: 0.85,
    color: "#ffffff",
  });
  material.userData.tile = 10;
  return material;
}
const tiledTexture = (canvas, repeat) => {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(repeat, repeat);
  return texture;
};

/** Grey concrete slabs: noise with a 4x4 joint grid and fine dark speckles. */
export function concreteTexture(repeat = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const { grid, max } = fractalNoise(context, 256, 4, 0.5, 4242);
  const image = context.createImageData(256, 256);
  for (let index = 0; index < 65536; index++) {
    const shade = 110 + (grid[index] / max) * 30;
    image.data[index * 4] = shade;
    image.data[index * 4 + 1] = shade + 1;
    image.data[index * 4 + 2] = shade + 3;
    image.data[index * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.strokeStyle = "rgba(0,0,0,0.4)";
  context.lineWidth = 2;
  for (let joint = 0; joint <= 256; joint += 64) {
    context.beginPath();
    context.moveTo(joint, 0);
    context.lineTo(joint, 256);
    context.stroke();
    context.beginPath();
    context.moveTo(0, joint);
    context.lineTo(256, joint);
    context.stroke();
  }
  for (let speck = 0; speck < 1200; speck++) {
    context.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  return tiledTexture(canvas, repeat);
}

/** Mottled grass colour with dark specks, tiled 30 times across the ground. */
export function grassTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const { grid, max } = fractalNoise(context, 256, 5, 0.55, 7777);
  const image = context.createImageData(256, 256);
  for (let index = 0; index < 65536; index++) {
    const shade = grid[index] / max;
    image.data[index * 4] = 28 + shade * 26;
    image.data[index * 4 + 1] = 50 + shade * 36;
    image.data[index * 4 + 2] = 36 + shade * 22;
    image.data[index * 4 + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  for (let speck = 0; speck < 1600; speck++) {
    context.fillStyle = `rgba(20,40,24,${Math.random() * 0.4})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  return tiledTexture(canvas, 30);
}
