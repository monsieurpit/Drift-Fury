// Asphalt for the mountain road: the same detailed asphalt as the city streets (aggregate, cracks, oil,
// patches, clearcoat), with a lane-wear overlay on top. The overlay spans the full road width (u: 0 = left
// edge, 1 = right edge) and 40 m along it (v): darker, polished tyre tracks in each lane, sealed cracks and
// the odd repair patch. R = albedo multiplier, G = roughness multiplier.
import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  Vector2,
} from "three";
import { fbm } from "../util/noise.js";
import { createRandom } from "../util/random.js";

export const ROAD_TEXTURE_LENGTH = 40; // metres of road per texture repeat along its length

const WIDTH = 256;
const HEIGHT = 1024;

let cached = null;

/**
 * Creates (once) the mountain road material from the city asphalt `base` (whose map tiles every
 * `base.userData.tile` metres). `roadWidth` is the asphalt width in metres. The road ribbon's uv must be
 * (metres across from the left edge, metres along) / tile.
 */
export function createRoadSurfaceMaterial(base, roadWidth) {
  if (cached) return cached;
  const random = createRandom(1717);
  const multiply = new Float32Array(WIDTH * HEIGHT).fill(1);
  const rough = new Float32Array(WIDTH * HEIGHT).fill(1);
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
      let wear = 0;
      for (const track of tracks) {
        const d = (across - track) / 0.42;
        wear = Math.max(wear, Math.exp(-d * d));
      }
      // Periodic over the texture length so 40 m repeats are seamless.
      wear *= 0.75 + 0.25 * fbm(across / 2.5, along / 2.5, { seed: 12, octaves: 3, period: 16 });
      const broad = fbm(across / 5, along / 5, { seed: 9, octaves: 4, period: 8 });
      multiply[index] = (1 - wear * 0.2) * (0.94 + broad * 0.12);
      rough[index] = 1 - wear * 0.22;
    }
  }
  // Sealed cracks: thin dark meandering lines of tar.
  const drawLine = (points, width) => {
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let step = 0; step <= steps; step++) {
        const px = x0 + ((x1 - x0) * step) / steps;
        const py = y0 + ((y1 - y0) * step) / steps;
        for (let oy = -width; oy <= width; oy++) {
          for (let ox = -width; ox <= width; ox++) {
            const xx = Math.round(px + ox);
            const yy = ((Math.round(py + oy) % HEIGHT) + HEIGHT) % HEIGHT;
            if (xx < 0 || xx >= WIDTH) continue;
            multiply[yy * WIDTH + xx] = 0.55;
            rough[yy * WIDTH + xx] = 0.7;
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
    drawLine(points, longitudinal ? 1 : 0);
  }
  // A couple of old repair patches (slightly darker, smoother rectangles with darker seams).
  for (let p = 0; p < 2; p++) {
    const px = random() * (WIDTH - 90);
    const py = random() * HEIGHT;
    const pw = 50 + random() * 80;
    const ph = 60 + random() * 140;
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const index = (Math.floor(py + y) % HEIGHT) * WIDTH + Math.floor(px + x);
        const seam = Math.min(x, y, pw - x, ph - y) < 2;
        multiply[index] *= seam ? 0.8 : 0.9;
        rough[index] *= 0.93;
      }
    }
  }
  const data = new Uint8Array(WIDTH * HEIGHT * 4);
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    data[i * 4] = Math.min(255, multiply[i] * 200);
    data[i * 4 + 1] = Math.min(255, rough[i] * 200);
    data[i * 4 + 3] = 255;
  }
  const wearMap = new DataTexture(data, WIDTH, HEIGHT, RGBAFormat);
  wearMap.wrapS = wearMap.wrapT = RepeatWrapping;
  wearMap.magFilter = LinearFilter;
  wearMap.minFilter = LinearMipmapLinearFilter;
  wearMap.generateMipmaps = true;
  wearMap.anisotropy = 8;
  wearMap.colorSpace = NoColorSpace;
  wearMap.needsUpdate = true;

  const tile = base.userData.tile || 10;
  cached = base.clone();
  cached.onBeforeCompile = (shader) => {
    shader.uniforms.roadWear = { value: wearMap };
    // vMapUv carries the colour map's repeat; divide it out to get back to tile units.
    const repeat = base.map ? base.map.repeat : new Vector2(1, 1);
    shader.uniforms.roadWearScale = {
      value: new Vector2(tile / roadWidth / repeat.x, tile / ROAD_TEXTURE_LENGTH / repeat.y),
    };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform sampler2D roadWear;\nuniform vec2 roadWearScale;\nvec4 roadWearSample;",
      )
      .replace(
        "#include <map_fragment>",
        "#include <map_fragment>\nroadWearSample = texture2D(roadWear, vMapUv * roadWearScale) * (255.0 / 200.0);\ndiffuseColor.rgb *= roadWearSample.r;",
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor *= roadWearSample.g;",
      );
  };
  cached.customProgramCacheKey = () => "drift-fury-mountain-asphalt";
  return cached;
}
