// Procedural, seamlessly tiling ground textures for the mountain: colour maps (sRGB) and normal maps
// derived from a matching height field. Generated once per page load and cached.
import { CanvasTexture, RepeatWrapping, LinearMipmapLinearFilter, SRGBColorSpace, NoColorSpace } from "three";
import { fbm, valueNoise } from "../util/noise.js";

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);
const mix = (a, b, t) => a + (b - a) * t;

function makeTexture(canvas, srgb) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return texture;
}

/** Runs `shade(u, v)` -> { color: [r, g, b] (0..1), height } for every texel; returns colour + normal maps. */
function bake(size, shade, normalStrength) {
  const color = document.createElement("canvas");
  color.width = color.height = size;
  const colorContext = color.getContext("2d");
  const colorImage = colorContext.createImageData(size, size);
  const heights = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const { color: rgb, height } = shade(x / size, y / size);
      const index = y * size + x;
      heights[index] = height;
      colorImage.data[index * 4] = clamp01(rgb[0]) * 255;
      colorImage.data[index * 4 + 1] = clamp01(rgb[1]) * 255;
      colorImage.data[index * 4 + 2] = clamp01(rgb[2]) * 255;
      colorImage.data[index * 4 + 3] = 255;
    }
  }
  colorContext.putImageData(colorImage, 0, 0);

  const normal = document.createElement("canvas");
  normal.width = normal.height = size;
  const normalContext = normal.getContext("2d");
  const normalImage = normalContext.createImageData(size, size);
  const at = (x, y) => heights[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * normalStrength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * normalStrength;
      const length = Math.hypot(dx, dy, 1);
      const index = (y * size + x) * 4;
      normalImage.data[index] = ((-dx / length) * 0.5 + 0.5) * 255;
      normalImage.data[index + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      normalImage.data[index + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      normalImage.data[index + 3] = 255;
    }
  }
  normalContext.putImageData(normalImage, 0, 0);
  return { map: makeTexture(color, true), normalMap: makeTexture(normal, false) };
}

// Tileable fractal noise: the period scales with frequency so every octave wraps on the texture edge.
const tile = (u, v, frequency, options = {}) =>
  fbm(u * frequency, v * frequency, { ...options, period: frequency });
// Anisotropic tileable noise: different whole-number frequencies along u and v (stretched features).
const tileAniso = (u, v, frequencyU, frequencyV, options = {}) =>
  fbm(u * frequencyU, v * frequencyV, { ...options, period: frequencyU, periodY: frequencyV });

/**
 * Weathered mountain rock seen on cliffs: sedimentary banding along v (which is world-up on cliff faces in
 * the triplanar projection), vertical water staining, long fractures roughly along the bedding and pale
 * lichen on the faces. No cellular crack network, which reads as a cobbled wall.
 */
function rock() {
  return bake(
    512,
    (u, v) => {
      const warp = tile(u, v, 3, { seed: 20, octaves: 3 });
      const bands = tileAniso(u + warp * 0.08, v, 3, 12, { seed: 21, octaves: 3 });
      const layers = 0.5 + 0.5 * Math.sin((v + warp * 0.12) * Math.PI * 2 * 14);
      const blotch = tile(u, v, 5, { seed: 22, octaves: 5 });
      const grain = tile(u, v, 64, { seed: 23, octaves: 2 });
      const streaks = tileAniso(u, v, 16, 2, { seed: 24, octaves: 3 }); // stretched along v: vertical stains
      const fracture = Math.pow(
        1 - Math.abs(tileAniso(u + warp * 0.1, v, 5, 10, { seed: 25, octaves: 3 }) * 2 - 1),
        18,
      );
      const lichen = Math.max(0, tile(u, v, 9, { seed: 26, octaves: 3 }) - 0.6) * 3 * (1 - fracture);
      let shade =
        0.33 + blotch * 0.2 + bands * 0.08 + layers * 0.035 + grain * 0.07 - streaks * 0.12 - fracture * 0.2;
      const warm = tile(u, v, 2, { seed: 27, octaves: 2 });
      const r = shade * (0.98 + warm * 0.12);
      const g = shade * (0.97 + warm * 0.05);
      const b = shade * (1.0 - warm * 0.08);
      return {
        color: [r + (0.6 - r) * lichen * 0.45, g + (0.62 - g) * lichen * 0.5, b + (0.5 - b) * lichen * 0.45],
        height: blotch * 0.45 + bands * 0.25 + layers * 0.12 + grain * 0.25 - fracture * 0.9 - streaks * 0.1,
      };
    },
    4.5,
  );
}

/** Alpine meadow and forest floor: dark grass clumps, dry patches, bare earth and pine litter. */
function grass() {
  return bake(
    512,
    (u, v) => {
      const patches = tile(u, v, 3, { seed: 31, octaves: 4 });
      const clumps = tile(u, v, 24, { seed: 32, octaves: 3 });
      const blades = valueNoise(u * 512, v * 512, 33, 512);
      const blades2 = valueNoise(u * 256 + 0.5, v * 256, 34, 256);
      const dry = Math.max(0, patches - 0.55) * 2.4;
      const earth = Math.max(0, 0.32 - patches) * 2.6 * (1 - clumps * 0.6);
      let r = mix(0.12, 0.22, clumps) + blades * 0.05;
      let g = mix(0.17, 0.27, clumps) + blades * 0.06;
      let b = mix(0.08, 0.12, clumps) + blades * 0.02;
      r = mix(r, 0.36 + blades2 * 0.06, dry * 0.7);
      g = mix(g, 0.33 + blades2 * 0.05, dry * 0.7);
      b = mix(b, 0.17, dry * 0.7);
      r = mix(r, 0.24 + blades2 * 0.05, earth);
      g = mix(g, 0.19 + blades2 * 0.04, earth);
      b = mix(b, 0.13, earth);
      return { color: [r, g, b], height: clumps * 0.5 + blades * 0.35 + blades2 * 0.15 - earth * 0.3 };
    },
    2.2,
  );
}

/** Wind-packed snow: soft drifts, faint blue shadows and a little sparkle in the normals. */
function snow() {
  return bake(
    256,
    (u, v) => {
      const drifts = tile(u, v, 3, { seed: 41, octaves: 4 });
      const grain = valueNoise(u * 256, v * 256, 42, 256);
      const shade = 0.82 + drifts * 0.14 + grain * 0.03;
      return { color: [shade * 0.93, shade * 0.96, shade], height: drifts * 0.8 + grain * 0.2 };
    },
    1.6,
  );
}

/** Gravel and packed dirt for the road shoulders and the summit lot. */
function gravel() {
  return bake(
    256,
    (u, v) => {
      const base = tile(u, v, 4, { seed: 51, octaves: 4 });
      const stones = valueNoise(u * 96, v * 96, 52, 96);
      const pebble = Math.pow(Math.max(0, stones - 0.58) * 2.4, 0.7);
      const fine = valueNoise(u * 256, v * 256, 53, 256);
      const shade = 0.26 + base * 0.12 + pebble * 0.18 + fine * 0.05;
      return { color: [shade * 1.05, shade, shade * 0.9], height: pebble * 0.9 + fine * 0.2 + base * 0.2 };
    },
    3.5,
  );
}

/** Low-frequency variation (R: broad, G: medium, B: fine) used to break up tiling over large areas. */
function macro() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const index = (y * size + x) * 4;
      image.data[index] = tile(u, v, 4, { seed: 61, octaves: 5 }) * 255;
      image.data[index + 1] = tile(u, v, 16, { seed: 62, octaves: 4 }) * 255;
      image.data[index + 2] = tile(u, v, 64, { seed: 63, octaves: 3 }) * 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return makeTexture(canvas, false);
}

let cache = null;
/** All mountain ground textures (built on first use). */
export function getTerrainTextures() {
  if (!cache) cache = { rock: rock(), grass: grass(), snow: snow(), gravel: gravel(), macro: macro() };
  return cache;
}
