import { CanvasTexture, RepeatWrapping, MeshPhysicalMaterial, Vector2 } from "three";
import { createRandom } from "../util/random.js";
import { scannedSet } from "./scannedTextures.js";
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
 * Road asphalt from a photo-scanned set (Poly Haven "asphalt_02": aggregate, cracks and patches captured from
 * a real road), with a light clearcoat. Box UVs are in units of `userData.tile` metres; the scan covers
 * about 3 m, so it repeats ~3.3 times per tile. (The previous procedural asphalt is kept below as
 * createProceduralAsphaltMaterial.)
 */
export function createAsphaltMaterial() {
  const set = scannedSet("asphalt_02", [0.06, 0.06, 0.06]);
  const tile = 10;
  const metresPerScan = 3;
  for (const texture of [set.map, set.normalMap, set.armMap])
    texture.repeat.set(tile / metresPerScan, tile / metresPerScan);
  const material = new MeshPhysicalMaterial({
    map: set.map,
    normalMap: set.normalMap,
    normalScale: new Vector2(0.9, 0.9),
    roughnessMap: set.armMap,
    aoMap: set.armMap,
    aoMapIntensity: 0.8,
    roughness: 1,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.85,
    // The scan was shot in daylight on a pale, sun-bleached road; tint it to fresh dark asphalt.
    color: "#6b6f75",
  });
  material.userData.tile = tile;
  return material;
}

export function createProceduralAsphaltMaterial(variant = 6) {
  const size = 512;
  const makeCanvas = () => {
    const cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    return cv;
  };
  const random = createRandom(4242 + variant);
  const albedoCanvas = makeCanvas();
  const heightCanvas = makeCanvas();
  const roughnessCanvas = makeCanvas();
  const albedo = albedoCanvas.getContext("2d");
  const heightMap = heightCanvas.getContext("2d");
  const roughnessMap = roughnessCanvas.getContext("2d");
  const wrap = (fn) => {
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        for (const c of [albedo, heightMap, roughnessMap]) {
          c.save();
          c.translate(ox, oy);
        }
        fn();
        for (const c of [albedo, heightMap, roughnessMap]) {
          c.restore();
        }
      }
    }
  };
  albedo.fillStyle = "#45494e";
  albedo.fillRect(0, 0, size, size);
  heightMap.fillStyle = "#808080";
  heightMap.fillRect(0, 0, size, size);
  roughnessMap.fillStyle = "#c4c4c4";
  roughnessMap.fillRect(0, 0, size, size);
  // broad tonal variation
  for (let q = 0; q < 95; q++) {
    const x = random() * size;
    const y = random() * size;
    const rad = 24 + random() * 82;
    const dark = random() > 0.5;
    wrap(() => {
      const gr = albedo.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, dark ? "rgba(12,14,17,0.09)" : "rgba(185,192,198,0.055)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      albedo.fillStyle = gr;
      albedo.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  // aggregate: fine stones, they carry the bump and the sparkle
  for (let q = 0; q < 56000; q++) {
    const x = random() * size;
    const y = random() * size;
    const sz = 0.6 + random() * 1;
    const t = random();
    albedo.fillStyle =
      t > 0.68
        ? `rgba(151,158,164,${0.1 + random() * 0.2})`
        : t > 0.28
          ? `rgba(18,21,24,${0.14 + random() * 0.24})`
          : `rgba(91,94,97,${0.1 + random() * 0.19})`;
    albedo.fillRect(x, y, sz, sz);
    heightMap.fillStyle =
      t > 0.68 ? `rgba(255,255,255,${0.16 + random() * 0.22})` : `rgba(0,0,0,${0.12 + random() * 0.22})`;
    heightMap.fillRect(x, y, sz, sz);
  }
  // old repair patches
  for (let q = 0; q < 2; q++) {
    const x = random() * size * 0.8;
    const y = random() * size * 0.8;
    const pw = 60 + random() * 120;
    const ph = 40 + random() * 90;
    wrap(() => {
      albedo.fillStyle = "rgba(14,15,18,0.13)";
      albedo.fillRect(x, y, pw, ph);
      albedo.strokeStyle = "rgba(5,5,6,0.22)";
      albedo.lineWidth = 1.2;
      albedo.strokeRect(x, y, pw, ph);
      heightMap.strokeStyle = "rgba(0,0,0,0.45)";
      heightMap.lineWidth = 1.5;
      heightMap.strokeRect(x, y, pw, ph);
      roughnessMap.fillStyle = "rgba(170,170,170,0.35)";
      roughnessMap.fillRect(x, y, pw, ph);
    });
  }
  // thin cracks
  for (let q = 0; q < 7; q++) {
    let x = random() * size;
    let y = random() * size;
    const pts = [[x, y]];
    for (let k = 0; k < 24; k++) {
      x += (random() - 0.5) * 18;
      y += (random() - 0.35) * 18;
      pts.push([x, y]);
    }
    wrap(() => {
      for (const [c, col, lw] of [
        [albedo, "rgba(4,4,5,0.75)", 1.1],
        [heightMap, "rgba(0,0,0,0.9)", 2.4],
      ]) {
        c.strokeStyle = col;
        c.lineWidth = lw;
        c.beginPath();
        pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py)));
        c.stroke();
      }
    });
  }
  // oil drips: darker and glossier
  for (let q = 0; q < 8; q++) {
    const x = random() * size;
    const y = random() * size;
    const rad = 12 + random() * 30;
    wrap(() => {
      let gr = albedo.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(6,6,8,0.55)");
      gr.addColorStop(1, "rgba(6,6,8,0)");
      albedo.fillStyle = gr;
      albedo.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      gr = roughnessMap.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(70,70,70,0.9)");
      gr.addColorStop(1, "rgba(70,70,70,0)");
      roughnessMap.fillStyle = gr;
      roughnessMap.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  const toTexture = (cv, srgb) => {
    const t = new CanvasTexture(cv);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) {
      t.colorSpace = "srgb";
    }
    return t;
  };
  const material = new MeshPhysicalMaterial({
    map: toTexture(albedoCanvas, true),
    normalMap: normalMapFromHeight(heightCanvas, 2.8),
    normalScale: new Vector2(1.15, 1.15),
    roughnessMap: toTexture(roughnessCanvas, false),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
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
