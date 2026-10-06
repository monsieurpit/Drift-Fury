// New Jersey concrete barrier units for the highway: the standard safety-shape profile (vertical toe, the
// shallow 55-degree slope that lifts a tyre, the steep upper face, a narrow top), cast-concrete texture
// with form marks, rain streaks and road grime along the base, and chamfered ends so the joints between
// precast units read.
import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { fbm, valueNoise } from "../util/noise.js";
import { createRandom } from "../util/random.js";

export const BARRIER_UNIT_LENGTH = 3.45;

// Half profile (x from the centre line, y up), from the road surface to the top, in metres.
const HALF_PROFILE = [
  [0.3, 0],
  [0.3, 0.075],
  [0.18, 0.33],
  [0.08, 0.79],
  [0.065, 0.81],
];

/** One barrier unit centred on the origin, length along z. uv = (metres along / unit, perimeter fraction). */
export function barrierGeometry(length = BARRIER_UNIT_LENGTH) {
  // Full cross-section: left side bottom to top, across the top, right side top to bottom.
  const profile = [
    ...HALF_PROFILE.map(([x, y]) => [-x, y]),
    ...[...HALF_PROFILE].reverse().map(([x, y]) => [x, y]),
  ];
  const perimeter = [0];
  for (let i = 1; i < profile.length; i++) {
    perimeter.push(
      perimeter[i - 1] + Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]),
    );
  }
  const total = perimeter[perimeter.length - 1];
  const positions = [];
  const uvs = [];
  const chamfer = 0.03; // ends pulled in slightly so each joint shows as a dark seam
  const half = length / 2;
  for (let i = 0; i < profile.length - 1; i++) {
    const [x0, y0] = profile[i];
    const [x1, y1] = profile[i + 1];
    const v0 = perimeter[i] / total;
    const v1 = perimeter[i + 1] / total;
    const a = [x0, y0, -half + chamfer];
    const b = [x1, y1, -half + chamfer];
    const c = [x1, y1, half - chamfer];
    const d = [x0, y0, half - chamfer];
    positions.push(...a, ...c, ...b, ...a, ...d, ...c);
    uvs.push(0, v0, 1, v1, 0, v1, 0, v0, 1, v0, 1, v1);
  }
  // End caps: fan from the centre of the section, slightly inset (the chamfer).
  for (const [z, flip] of [
    [-half, true],
    [half, false],
  ]) {
    const centre = [0, 0.4, z];
    for (let i = 0; i < profile.length - 1; i++) {
      const p0 = [profile[i][0] * 0.94, profile[i][1], z];
      const p1 = [profile[i + 1][0] * 0.94, profile[i + 1][1], z];
      if (flip) positions.push(...centre, ...p0, ...p1);
      else positions.push(...centre, ...p1, ...p0);
      uvs.push(0.5, 0.5, 0.5, perimeter[i] / total, 0.5, perimeter[i + 1] / total);
    }
    // The bevel between the cap and the faces.
    for (let i = 0; i < profile.length - 1; i++) {
      const inner0 = [profile[i][0] * 0.94, profile[i][1], z];
      const inner1 = [profile[i + 1][0] * 0.94, profile[i + 1][1], z];
      const zFace = flip ? z + chamfer : z - chamfer;
      const outer0 = [profile[i][0], profile[i][1], zFace];
      const outer1 = [profile[i + 1][0], profile[i + 1][1], zFace];
      const v0 = perimeter[i] / total;
      const v1 = perimeter[i + 1] / total;
      if (flip) {
        positions.push(...inner0, ...outer0, ...outer1, ...inner0, ...outer1, ...inner1);
        uvs.push(0, v0, 0.01, v0, 0.01, v1, 0, v0, 0.01, v1, 0, v1);
      } else {
        positions.push(...inner0, ...outer1, ...outer0, ...inner0, ...inner1, ...outer1);
        uvs.push(0, v0, 0.01, v1, 0.01, v0, 0, v0, 0, v1, 0.01, v1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

let material = null;

/** Cast concrete for the barriers: u along the unit, v around the profile (both bases at v = 0 and 1). */
export function barrierMaterial() {
  if (material) return material;
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  const random = createRandom(6060);
  for (let y = 0; y < height; y++) {
    const v = y / height;
    // Distance from the nearest base (v = 0 or 1 are the two feet of the barrier).
    const fromBase = Math.min(v, 1 - v) * 2;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const grain = valueNoise(x * 0.9, y * 0.9, 61, width * 0.9, height * 0.9);
      const mottling = fbm(u * 4, v * 2, { seed: 62, octaves: 4, period: 4, periodY: 2 });
      // Rain streaks running down from the top (v = 0.5) toward each base.
      const streak = fbm(u * 24, v * 1.5, { seed: 63, octaves: 3, period: 24, periodY: 1.5 });
      let shade = 0.66 + (mottling - 0.5) * 0.12 + (grain - 0.5) * 0.06 - Math.max(0, streak - 0.55) * 0.18;
      // Road grime and tyre scuffs along the base.
      shade *= 0.62 + 0.38 * Math.min(1, fromBase / 0.35);
      if (fromBase < 0.3 && random() < 0.02) shade *= 0.7;
      const index = (y * width + x) * 4;
      image.data[index] = shade * 236;
      image.data[index + 1] = shade * 232;
      image.data[index + 2] = shade * 222;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  // Horizontal form-tie line partway up each face.
  context.fillStyle = "rgba(0,0,0,0.12)";
  context.fillRect(0, height * 0.22, width, 1);
  context.fillRect(0, height * 0.78, width, 1);
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  material = new MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });
  return material;
}
