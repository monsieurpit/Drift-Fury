import { Group, Mesh, CylinderGeometry, CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { buildLatheGeometry, buildLatheGeometryUV, buildPrismGeometry } from "./carGeometry.js";
import { normalMapFromHeight } from "../world/textures.js";
import { createRandom } from "../util/random.js";
import { smoothProfile } from "./carMath.js";
/* ---------------------------------------------------------------- wheel */
export function buildWheel(mats, o) {
  const g = new Group();
  const R = o.R;
  const tw = o.tw;
  const hw_ = tw / 2;
  const rimR = R * 0.66;
  // tyre
  const tp = smoothProfile(
    [
      [-hw_ * 0.86, rimR - 0.004],
      [-hw_ * 0.98, rimR + 0.035],
      [-hw_ * 1, R * 0.84],
      [-hw_ * 0.93, R * 0.955],
      [-hw_ * 0.78, R * 0.993],
      [-hw_ * 0.5, R],
      [-hw_ * 0.17, R * 0.995],
      [-hw_ * 0.1, R * 0.985],
      [hw_ * 0.1, R * 0.985],
      [hw_ * 0.17, R * 0.995],
      [hw_ * 0.5, R],
      [hw_ * 0.78, R * 0.993],
      [hw_ * 0.93, R * 0.955],
      [hw_ * 1, R * 0.84],
      [hw_ * 0.98, rimR + 0.035],
      [hw_ * 0.86, rimR - 0.004],
    ],
    1,
  );
  // Texture rows: inner sidewall 0-0.3, tread 0.3-0.7, outer sidewall 0.7-1 (the tread is where the
  // profile is near full radius).
  const crown = tp.map(([, r], i) => (r >= R * 0.95 ? i : -1)).filter((i) => i >= 0);
  const first = crown[0];
  const last = crown[crown.length - 1];
  const tyre = new Mesh(
    buildLatheGeometryUV(tp, o.seg, (v, i) => {
      if (i <= first) return (i / Math.max(first, 1)) * 0.3;
      if (i >= last) return 0.7 + ((i - last) / Math.max(tp.length - 1 - last, 1)) * 0.3;
      return 0.3 + ((i - first) / Math.max(last - first, 1)) * 0.4;
    }),
    mats.rubber,
  );
  tyre.castShadow = true;
  g.add(tyre);
  // rim barrel + lip
  const xo = hw_ * 0.9;
  // outside lip surface + face (dish)
  const face = smoothProfile(
    [
      [xo * 0.98, rimR + 0.002],
      [xo * 0.93, rimR - 0.012],
      [xo * 0.78, rimR - 0.035],
      [xo * 0.5, rimR * 0.72],
      [xo * 0.42, rimR * 0.5],
      [xo * 0.5, rimR * 0.26],
      [xo * 0.62, rimR * 0.13],
      [xo * 0.66, 0],
    ],
    1,
  );
  const rim = new Mesh(buildLatheGeometry(face, o.seg), mats.rim);
  g.add(rim);
  // inner barrel (dark, seen through the spokes)
  const barrel = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.93, rimR - 0.012],
        [xo * 0.1, rimR - 0.052],
        [-xo * 0.85, rimR - 0.05],
        [-xo * 0.95, rimR - 0.01],
      ],
      o.seg,
    ),
    mats.dark,
  );
  g.add(barrel);
  // spokes (double spokes)
  const n = o.spokes;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2;
    for (const side of [-1, 1]) {
      const ph = a0 + side * 0.105 * (6 / n);
      const poly = [
        [rimR * 0.17, -0.021],
        [rimR * 0.17, 0.021],
        [rimR * 0.93, 0.014 * 1],
        [rimR * 0.93, -0.014],
      ];
      g.add(new Mesh(buildPrismGeometry(poly, xo * 0.56, xo * 0.78, ph), mats.rim));
    }
  }
  // centre cap and lugs
  const cap = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.6, 0],
        [xo * 0.74, rimR * 0.06],
        [xo * 0.76, rimR * 0.15],
        [xo * 0.68, rimR * 0.2],
        [xo * 0.6, rimR * 0.2],
      ],
      20,
    ),
    mats.chrome,
  );
  g.add(cap);
  for (let k = 0; k < 5; k++) {
    const th = (k / 5) * Math.PI * 2;
    const lug = new Mesh(new CylinderGeometry(0.011, 0.011, 0.02, 6), mats.dark);
    lug.rotation.z = Math.PI / 2;
    lug.position.set(xo * 0.66, Math.sin(th) * rimR * 0.27, Math.cos(th) * rimR * 0.27);
    g.add(lug);
  }
  // brake disc + caliper behind the spokes
  const disc = new Mesh(
    buildLatheGeometry(
      [
        [xo * 0.12, rimR * 0.84],
        [xo * 0.16, rimR * 0.86],
        [xo * 0.16, rimR * 0.5],
        [xo * 0.12, rimR * 0.5],
      ],
      o.seg,
    ),
    mats.rotor,
  );
  g.add(disc);
  const cal = [
    [rimR * 0.5, -0.075],
    [rimR * 0.84, -0.07],
    [rimR * 0.84, 0.07],
    [rimR * 0.5, 0.075],
  ];
  g.add(new Mesh(buildPrismGeometry(cal, xo * 0.08, xo * 0.4, o.calAng), mats.caliper));
  return g;
}

let tyreMaps = null;
/**
 * Tyre surface: tread blocks with four circumferential grooves and angled sipes on the crown; sidewalls
 * with bead and rim-protector ribs and a band of raised lettering-like blocks. Returns { map, normalMap }.
 */
export function tyreTextures() {
  if (tyreMaps) return tyreMaps;
  const W = 1024;
  const H = 256;
  const color = document.createElement("canvas");
  const height = document.createElement("canvas");
  color.width = height.width = W;
  color.height = height.height = H;
  const c = color.getContext("2d");
  const h = height.getContext("2d");
  const random = createRandom(9090);
  c.fillStyle = "#161616";
  c.fillRect(0, 0, W, H);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, W, H);
  // Tread band (rows 0.3-0.7 of the height).
  const t0 = H * 0.3;
  const t1 = H * 0.7;
  c.fillStyle = "#1b1b1b";
  c.fillRect(0, t0, W, t1 - t0);
  h.fillStyle = "#c8c8c8";
  h.fillRect(0, t0, W, t1 - t0);
  // Circumferential grooves.
  for (const g of [0.36, 0.45, 0.55, 0.64]) {
    h.fillStyle = "#101010";
    h.fillRect(0, H * g - 3, W, 6);
    c.fillStyle = "#0a0a0a";
    c.fillRect(0, H * g - 3, W, 6);
  }
  // Lateral grooves on the shoulders and sipes on the centre ribs, angled.
  const blocks = 72;
  for (let b = 0; b < blocks; b++) {
    const x = (b / blocks) * W;
    for (const [a, z, w] of [
      [t0, H * 0.36, 4],
      [H * 0.64, t1, 4],
    ]) {
      h.strokeStyle = "#101010";
      h.lineWidth = w;
      h.beginPath();
      h.moveTo(x, a);
      h.lineTo(x + 6, z);
      h.stroke();
    }
    for (const [a, z] of [
      [H * 0.36, H * 0.45],
      [H * 0.45, H * 0.55],
      [H * 0.55, H * 0.64],
    ]) {
      h.strokeStyle = "#5a5a5a";
      h.lineWidth = 1.5;
      h.beginPath();
      h.moveTo(x + 7, a + 2);
      h.lineTo(x + 12, z - 2);
      h.stroke();
    }
  }
  // Sidewalls: ribs near the bead and the rim protector, and lettering blocks in the middle.
  for (const [start, dir] of [
    [0, 1],
    [H, -1],
  ]) {
    for (const [offset, shade] of [
      [6, "#9a9a9a"],
      [12, "#707070"],
      [64, "#a8a8a8"],
    ]) {
      h.fillStyle = shade;
      h.fillRect(0, start + dir * offset - 1, W, 2);
    }
    // "Lettering": groups of raised glyph-sized blocks, twice around the tyre.
    const mid = start + dir * 34;
    for (let rep = 0; rep < 2; rep++) {
      let x = rep * (W / 2) + 60;
      for (let word = 0; word < 4; word++) {
        const letters = 3 + Math.floor(random() * 6);
        for (let l = 0; l < letters; l++) {
          const w = 5 + random() * 5;
          h.fillStyle = "#b4b4b4";
          h.fillRect(x, mid - 7, w, 14);
          c.fillStyle = "#222222";
          c.fillRect(x, mid - 7, w, 14);
          x += w + 3;
        }
        x += 22;
      }
    }
  }
  // Fine rubber grain.
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = `rgba(${random() > 0.5 ? "255,255,255" : "0,0,0"},0.03)`;
    c.fillRect(random() * W, random() * H, 1, 1);
  }
  const map = new CanvasTexture(color);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = RepeatWrapping;
  map.anisotropy = 8;
  const normalMap = normalMapFromHeight(height, 3);
  normalMap.wrapS = RepeatWrapping;
  tyreMaps = { map, normalMap };
  return tyreMaps;
}
