// Asphalt for the mountain road. The texture spans the full road width (u: 0 = left edge, 1 = right edge)
// and 40 m along it (v), so it can carry real lane wear: polished, darker tyre tracks in each lane, cleaner
// aggregate between them, sealed cracks and the odd repair patch, plus matching roughness and normal maps.
import {
  CanvasTexture,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  NoColorSpace,
  Vector2,
} from "three";
import { fbm, valueNoise } from "../util/noise.js";
import { createRandom } from "../util/random.js";

export const ROAD_TEXTURE_LENGTH = 40; // metres of road per texture repeat along its length

const WIDTH = 256;
const HEIGHT = 1024;

function canvasTexture(canvas, srgb) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return texture;
}

let cached = null;

/** Creates (once) the mountain road material. `roadWidth` is the asphalt width in metres. */
export function createRoadSurfaceMaterial(roadWidth) {
  if (cached) return cached;
  const random = createRandom(1717);
  const albedo = new Float32Array(WIDTH * HEIGHT);
  const height = new Float32Array(WIDTH * HEIGHT);
  const rough = new Float32Array(WIDTH * HEIGHT);
  const metresPerTexelX = roadWidth / WIDTH;
  const metresPerTexelY = ROAD_TEXTURE_LENGTH / HEIGHT;
  // Lateral positions (metres from the left edge) of the four wheel tracks: two per 3.5 m lane.
  const lane = roadWidth / 4;
  const tracks = [lane * 0.55, lane * 1.45, roadWidth / 2 + lane * 0.55, roadWidth / 2 + lane * 1.45];
  for (let y = 0; y < HEIGHT; y++) {
    const along = y * metresPerTexelY;
    for (let x = 0; x < WIDTH; x++) {
      const across = x * metresPerTexelX;
      const index = y * WIDTH + x;
      // Aggregate: fine stones. All noise here is periodic over the texture length so 40 m repeats are seamless.
      const stones =
        valueNoise(x * 0.75, y * 0.75, 3, 768) * 0.5 + valueNoise(x * 0.375 + 7, y * 0.375, 4, 384) * 0.5;
      const broad = fbm(across / 5, along / 5, { seed: 9, octaves: 4, period: 8 });
      let wear = 0;
      for (const track of tracks) {
        const d = (across - track) / 0.42;
        wear = Math.max(wear, Math.exp(-d * d));
      }
      wear *= 0.75 + 0.25 * fbm(across / 2.5, along / 2.5, { seed: 12, octaves: 3, period: 16 });
      let shade = 0.2 + broad * 0.08 + (stones - 0.5) * 0.05;
      shade -= wear * 0.045; // rubber and oil darken the tracks
      // Bright chips of quartz in the aggregate, mostly between the tracks where tyres don't scrub.
      if (stones > 0.78 && random() < 0.35 * (1 - wear)) shade += 0.07;
      albedo[index] = shade;
      height[index] = stones * 0.35 + broad * 0.15 - wear * 0.2;
      rough[index] = 0.86 - wear * 0.2 + (stones - 0.5) * 0.06;
    }
  }
  // Sealed cracks: thin dark meandering lines of tar.
  const drawLine = (points, width, darkness) => {
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let s = 0; s <= steps; s++) {
        const px = x0 + ((x1 - x0) * s) / steps;
        const py = y0 + ((y1 - y0) * s) / steps;
        for (let oy = -width; oy <= width; oy++) {
          for (let ox = -width; ox <= width; ox++) {
            const xx = Math.round(px + ox);
            const yy = ((Math.round(py + oy) % HEIGHT) + HEIGHT) % HEIGHT;
            if (xx < 0 || xx >= WIDTH) continue;
            const index = yy * WIDTH + xx;
            albedo[index] = Math.min(albedo[index], 0.11 + (1 - darkness) * 0.06);
            rough[index] = 0.55;
            height[index] -= 0.15;
          }
        }
      }
    }
  };
  for (let c = 0; c < 5; c++) {
    let x = random() * WIDTH;
    let y = random() * HEIGHT;
    const points = [[x, y]];
    const longitudinal = random() < 0.6;
    for (let k = 0; k < 30; k++) {
      x += longitudinal ? (random() - 0.5) * 3 : 2 + random() * 3;
      y += longitudinal ? 4 + random() * 5 : (random() - 0.5) * 4;
      points.push([x, y]);
    }
    drawLine(points, longitudinal ? 1 : 0, 0.8);
  }
  // A couple of old repair patches (slightly darker, smoother rectangles with soft edges).
  for (let p = 0; p < 2; p++) {
    const px = random() * (WIDTH - 90);
    const py = random() * HEIGHT;
    const pw = 50 + random() * 80;
    const ph = 60 + random() * 140;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const xx = Math.floor(px + x);
        const yy = Math.floor(py + y) % HEIGHT;
        const edge = Math.min(x, y, pw - x, ph - y);
        const index = yy * WIDTH + xx;
        const amount = edge < 2 ? 1 : 0.6;
        albedo[index] = albedo[index] * (1 - 0.12 * amount) - (edge < 2 ? 0.025 : 0);
        rough[index] -= 0.06 * amount;
      }
    }
  }

  const colorCanvas = document.createElement("canvas");
  const normalCanvas = document.createElement("canvas");
  const roughCanvas = document.createElement("canvas");
  for (const canvas of [colorCanvas, normalCanvas, roughCanvas]) {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }
  const colorImage = colorCanvas.getContext("2d").createImageData(WIDTH, HEIGHT);
  const normalImage = normalCanvas.getContext("2d").createImageData(WIDTH, HEIGHT);
  const roughImage = roughCanvas.getContext("2d").createImageData(WIDTH, HEIGHT);
  const h = (x, y) =>
    height[(((y % HEIGHT) + HEIGHT) % HEIGHT) * WIDTH + Math.min(WIDTH - 1, Math.max(0, x))];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const index = y * WIDTH + x;
      const shade = Math.max(0, Math.min(1, albedo[index])) * 255;
      colorImage.data[index * 4] = shade * 1.0;
      colorImage.data[index * 4 + 1] = shade * 1.0;
      colorImage.data[index * 4 + 2] = shade * 1.04;
      colorImage.data[index * 4 + 3] = 255;
      const dx = (h(x + 1, y) - h(x - 1, y)) * 2.2;
      const dy = (h(x, y + 1) - h(x, y - 1)) * 2.2;
      const length = Math.hypot(dx, dy, 1);
      normalImage.data[index * 4] = ((-dx / length) * 0.5 + 0.5) * 255;
      normalImage.data[index * 4 + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      normalImage.data[index * 4 + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      normalImage.data[index * 4 + 3] = 255;
      const r = Math.max(0, Math.min(1, rough[index])) * 255;
      roughImage.data[index * 4] = r;
      roughImage.data[index * 4 + 1] = r;
      roughImage.data[index * 4 + 2] = r;
      roughImage.data[index * 4 + 3] = 255;
    }
  }
  colorCanvas.getContext("2d").putImageData(colorImage, 0, 0);
  normalCanvas.getContext("2d").putImageData(normalImage, 0, 0);
  roughCanvas.getContext("2d").putImageData(roughImage, 0, 0);
  cached = new MeshStandardMaterial({
    map: canvasTexture(colorCanvas, true),
    normalMap: canvasTexture(normalCanvas, false),
    normalScale: new Vector2(0.28, 0.28),
    roughnessMap: canvasTexture(roughCanvas, false),
    roughness: 1,
    metalness: 0,
  });
  return cached;
}
