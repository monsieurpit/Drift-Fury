import {
  CanvasTexture,
  RepeatWrapping,
  MeshPhysicalMaterial,
  Vector2,
} from "three";
import { createRandom } from "../util/random.js";
function fractalNoise(e, t, n, r, i) {
  const a = createRandom(i);
  const o = new Float32Array(t * t);
  let s = 1;
  let c = 0;
  for (let e = 0; e < n; e++) {
    const n = 2 ** e;
    t / n;
    const i = new Float32Array((n + 1) * (n + 1));
    for (let e = 0; e < i.length; e++) {
      i[e] = a();
    }
    for (let e = 0; e < t; e++) {
      for (let r = 0; r < t; r++) {
        const a = (r / t) * n;
        const c = (e / t) * n;
        const l = Math.floor(a);
        const u = Math.floor(c);
        const d = a - l;
        const f = c - u;
        const p = i[u * (n + 1) + l];
        const m = i[u * (n + 1) + l + 1];
        const h = i[(u + 1) * (n + 1) + l];
        const g = i[(u + 1) * (n + 1) + l + 1];
        const _ = d * d * (3 - 2 * d);
        const v = f * f * (3 - 2 * f);
        o[e * t + r] +=
          (p * (1 - _) * (1 - v) +
            m * _ * (1 - v) +
            h * (1 - _) * v +
            g * _ * v) *
          s;
      }
    }
    c += s;
    s *= r;
  }
  return {
    grid: o,
    max: c,
  };
}
export function normalMapFromHeight(e, t = 2.4) {
  const sourceCanvas = e.image || e;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const source = sourceCanvas
    .getContext("2d")
    .getImageData(0, 0, width, height).data;
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = width;
  normalCanvas.height = height;
  const context = normalCanvas.getContext("2d");
  const image = context.createImageData(width, height);
  const sample = (x, y) => {
    return (
      source[
        (Math.min(height - 1, Math.max(0, y)) * width +
          Math.min(width - 1, Math.max(0, x))) *
          4
      ] / 255
    );
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * t;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * t;
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
export function createAsphaltMaterial(e = 6) {
  const S = 512;
  const mk = () => {
    const cv = document.createElement("canvas");
    cv.width = S;
    cv.height = S;
    return cv;
  };
  const rnd = createRandom(4242 + e);
  const A = mk();
  const H = mk();
  const R = mk();
  const a = A.getContext("2d");
  const h = H.getContext("2d");
  const r = R.getContext("2d");
  const wrap = (fn) => {
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        for (const c of [a, h, r]) {
          c.save();
          c.translate(ox, oy);
        }
        fn();
        for (const c of [a, h, r]) {
          c.restore();
        }
      }
    }
  };
  a.fillStyle = "#45494e";
  a.fillRect(0, 0, S, S);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, S, S);
  r.fillStyle = "#c4c4c4";
  r.fillRect(0, 0, S, S);
  // broad tonal variation
  for (let q = 0; q < 95; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const rad = 24 + rnd() * 82;
    const dark = rnd() > 0.5;
    wrap(() => {
      const gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(
        0,
        dark ? "rgba(12,14,17,0.09)" : "rgba(185,192,198,0.055)",
      );
      gr.addColorStop(1, "rgba(0,0,0,0)");
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  // aggregate: fine stones, they carry the bump and the sparkle
  for (let q = 0; q < 56000; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const sz = 0.6 + rnd() * 1;
    const t = rnd();
    a.fillStyle =
      t > 0.68
        ? `rgba(151,158,164,${0.1 + rnd() * 0.2})`
        : t > 0.28
          ? `rgba(18,21,24,${0.14 + rnd() * 0.24})`
          : `rgba(91,94,97,${0.1 + rnd() * 0.19})`;
    a.fillRect(x, y, sz, sz);
    h.fillStyle =
      t > 0.68
        ? `rgba(255,255,255,${0.16 + rnd() * 0.22})`
        : `rgba(0,0,0,${0.12 + rnd() * 0.22})`;
    h.fillRect(x, y, sz, sz);
  }
  // old repair patches
  for (let q = 0; q < 2; q++) {
    const x = rnd() * S * 0.8;
    const y = rnd() * S * 0.8;
    const pw = 60 + rnd() * 120;
    const ph = 40 + rnd() * 90;
    wrap(() => {
      a.fillStyle = "rgba(14,15,18,0.13)";
      a.fillRect(x, y, pw, ph);
      a.strokeStyle = "rgba(5,5,6,0.22)";
      a.lineWidth = 1.2;
      a.strokeRect(x, y, pw, ph);
      h.strokeStyle = "rgba(0,0,0,0.45)";
      h.lineWidth = 1.5;
      h.strokeRect(x, y, pw, ph);
      r.fillStyle = "rgba(170,170,170,0.35)";
      r.fillRect(x, y, pw, ph);
    });
  }
  // thin cracks
  for (let q = 0; q < 7; q++) {
    let x = rnd() * S;
    let y = rnd() * S;
    const pts = [[x, y]];
    for (let k = 0; k < 24; k++) {
      x += (rnd() - 0.5) * 18;
      y += (rnd() - 0.35) * 18;
      pts.push([x, y]);
    }
    wrap(() => {
      for (const [c, col, lw] of [
        [a, "rgba(4,4,5,0.75)", 1.1],
        [h, "rgba(0,0,0,0.9)", 2.4],
      ]) {
        c.strokeStyle = col;
        c.lineWidth = lw;
        c.beginPath();
        pts.forEach(([px, py], k) => {
          return k ? c.lineTo(px, py) : c.moveTo(px, py);
        });
        c.stroke();
      }
    });
  }
  // oil drips: darker and glossier
  for (let q = 0; q < 8; q++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const rad = 12 + rnd() * 30;
    wrap(() => {
      let gr = a.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(6,6,8,0.55)");
      gr.addColorStop(1, "rgba(6,6,8,0)");
      a.fillStyle = gr;
      a.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      gr = r.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(70,70,70,0.9)");
      gr.addColorStop(1, "rgba(70,70,70,0)");
      r.fillStyle = gr;
      r.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
  }
  const tex = (cv, srgb) => {
    const t = new CanvasTexture(cv);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) {
      t.colorSpace = "srgb";
    }
    return t;
  };
  const mat = new MeshPhysicalMaterial({
    map: tex(A, true),
    normalMap: normalMapFromHeight(H, 2.8),
    normalScale: new Vector2(1.15, 1.15),
    roughnessMap: tex(R, false),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.85,
    color: "#ffffff",
  });
  mat.userData.tile = 10;
  return mat;
}
export function concreteTexture(e = 4) {
  const t = document.createElement("canvas");
  t.width = 256;
  t.height = 256;
  const n = t.getContext("2d");
  const { grid: r, max: i } = fractalNoise(n, 256, 4, 0.5, 4242);
  const a = n.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    const t = 110 + (r[e] / i) * 30;
    a.data[e * 4] = t;
    a.data[e * 4 + 1] = t + 1;
    a.data[e * 4 + 2] = t + 3;
    a.data[e * 4 + 3] = 255;
  }
  n.putImageData(a, 0, 0);
  n.strokeStyle = "rgba(0,0,0,0.4)";
  n.lineWidth = 2;
  for (let e = 0; e <= 256; e += 64) {
    n.beginPath();
    n.moveTo(e, 0);
    n.lineTo(e, 256);
    n.stroke();
    n.beginPath();
    n.moveTo(0, e);
    n.lineTo(256, e);
    n.stroke();
  }
  for (let e = 0; e < 1200; e++) {
    n.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
    n.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  const o = new CanvasTexture(t);
  o.wrapS = RepeatWrapping;
  o.wrapT = RepeatWrapping;
  o.anisotropy = 8;
  o.repeat.set(e, e);
  return o;
}
export function grassTexture() {
  const e = document.createElement("canvas");
  e.width = 256;
  e.height = 256;
  const t = e.getContext("2d");
  const { grid: n, max: r } = fractalNoise(t, 256, 5, 0.55, 7777);
  const i = t.createImageData(256, 256);
  for (let e = 0; e < 65536; e++) {
    const t = n[e] / r;
    i.data[e * 4] = 28 + t * 26;
    i.data[e * 4 + 1] = 50 + t * 36;
    i.data[e * 4 + 2] = 36 + t * 22;
    i.data[e * 4 + 3] = 255;
  }
  t.putImageData(i, 0, 0);
  for (let e = 0; e < 1600; e++) {
    t.fillStyle = `rgba(20,40,24,${Math.random() * 0.4})`;
    t.fillRect(Math.random() * 256, Math.random() * 256, 1.6, 1.6);
  }
  const a = new CanvasTexture(e);
  a.wrapS = RepeatWrapping;
  a.wrapT = RepeatWrapping;
  a.anisotropy = 8;
  a.repeat.set(30, 30);
  return a;
}
