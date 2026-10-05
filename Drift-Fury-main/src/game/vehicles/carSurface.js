import { createGeometry } from "./carGeometry.js";
import { chaikin, clamp, smoothstep } from "./carMath.js";
/*
 * Car body surface helpers. Coordinates follow the body loft used by carModel.js:
 *   zf  distance along the car from the front bumper (0 .. spec.L)
 *   sf  position around a cross-section ring: 0 at the bottom centre, 7 at the roof centre (right half),
 *       14 back at the bottom on the left (rings are mirrored, so most helpers work on the right half)
 */
/* body cross-section ring at zf: [x, y, s] with s in 0..14 */
export function bodyRing(spec, zf) {
  const hw = spec.hw(zf);
  const yt = spec.yTop(zf);
  const yb = spec.yBot(zf);
  const ye = spec.yEdge(zf);
  const hump = spec.hump(zf);
  const endFade = smoothstep(0, 0.35, Math.min(zf, spec.L - zf));
  const cr = spec.crown * (0.4 + 0.6 * endFade);
  const yS = ye + (yt + hump * 0.8 - ye) * 0.5;
  const yU = yt + hump * 0.85 - cr - Math.min(0.1, (yt - ye) * 0.22);
  const R = [
    [0, yb],
    [hw * 0.74, yb],
    [hw * 0.93, ye],
    [hw, yS],
    [hw * 0.985, yU],
    [hw * 0.9, yt + hump * 0.6 - cr * 0.55 - 0.02],
    [hw * 0.5, yt + hump * 0.25 - cr * 0.1],
    [0, yt],
  ];
  const poly = [];
  R.forEach((p, i) => poly.push([p[0], p[1], i]));
  for (let i = 6; i >= 1; i--) {
    poly.push([-R[i][0], R[i][1], 14 - i]);
  }
  return chaikin(poly, 2, 14);
}
/* greenhouse cross-section at zf */

export function cabinRing(spec, zf) {
  const c = spec.cab;
  const yb = spec.cabBase(zf);
  const H = Math.max(0.006, spec.roofY(zf) - yb);
  const Hr = c.roof - spec.cabBase((c.rf + c.rr) / 2);
  const t = clamp(H / Hr, 0, 1);
  const wb = spec.hw(zf) - c.inset - 0.02;
  const TU = c.tum * Math.pow(t, 0.8);
  const cr = 0.028 * t + 0.004;
  const R = [
    [0, yb],
    [wb, yb],
    [wb - TU * 0.16, yb + H * 0.3],
    [wb - TU * 0.72, yb + H * 0.84],
    [wb - TU, yb + H - cr * 0.5],
    [(wb - TU) * 0.55, yb + H - cr * 0.12],
    [0, yb + H],
  ];
  const poly = [];
  R.forEach((p, i) => poly.push([p[0], p[1], i]));
  for (let i = 5; i >= 1; i--) {
    poly.push([-R[i][0], R[i][1], 12 - i]);
  }
  return chaikin(poly, 2, 12);
}
/* ---- surface helpers (points on the body skin) ---- */
export function rightHalf(ring) {
  const out = [];
  for (let j = 0; j < ring.length; j++) {
    if (ring[j][2] <= 7.0001 && ring[j][2] >= 0) {
      out.push(ring[j]);
    }
  }
  return out;
}
export function pointAt(half, sf) {
  for (let k = 0; k < half.length - 1; k++) {
    const a = half[k];
    const b = half[k + 1];
    if (sf >= a[2] && sf <= b[2]) {
      const t = (sf - a[2]) / (b[2] - a[2] || 1);
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        b[0] - a[0],
        b[1] - a[1],
      ];
    }
  }
  const a = half[half.length - 2];
  const b = half[half.length - 1];
  return [b[0], b[1], b[2], b[0] - a[0], b[1] - a[1]];
}
/* position + outward normal on the body skin; side = +1 (right) / -1 (left) */

export function surfacePoint(spec, zf, sf, side) {
  const h0 = rightHalf(bodyRing(spec, zf));
  const p = pointAt(h0, sf);
  const h1 = rightHalf(bodyRing(spec, zf - 0.03));
  const h2 = rightHalf(bodyRing(spec, zf + 0.03));
  const q1 = pointAt(h1, sf);
  const q2 = pointAt(h2, sf);
  const dx = p[3];
  const dy = p[4];
  const a = (q2[0] - q1[0]) / 0.06;
  const b = (q2[1] - q1[1]) / 0.06;
  let nx = dy;
  let ny = -dx;
  let nz = dx * b - dy * a;
  const l = Math.hypot(nx, ny, nz) || 1;
  nx /= l;
  ny /= l;
  nz /= l;
  return {
    x: side * p[0],
    y: p[1],
    z: zf,
    nx: side * nx,
    ny,
    nz,
  };
}
/* thin ribbon laid on the body (door cuts, hood cuts, stripes) */

export function ribbonAcross(spec, zf, sa, sb, w, off, side, halfLength) {
  const A = bodyRing(spec, zf - w / 2);
  const B = bodyRing(spec, zf + w / 2);
  const hA = rightHalf(A);
  const hB = rightHalf(B);
  const pos = [];
  const nor = [];
  const idx = [];
  const steps = 14;
  const prev = null;
  for (let k = 0; k <= steps; k++) {
    const sf = sa + ((sb - sa) * k) / steps;
    const a = pointAt(hA, sf);
    const b = pointAt(hB, sf);
    let nx = a[4];
    let ny = -a[3];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const base = pos.length / 3;
    pos.push(
      side * (a[0] + nx * off),
      a[1] + ny * off,
      zf - w / 2 - halfLength,
      side * (b[0] + nx * off),
      b[1] + ny * off,
      zf + w / 2 - halfLength,
    );
    nor.push(side * nx, ny, 0, side * nx, ny, 0);
    if (k > 0) {
      if (side > 0) {
        idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
      } else {
        idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
      }
    }
  }
  return createGeometry(pos, nor, idx);
}
export function ribbonAlong(spec, sf0, sw, za, zb, off, side, halfLength) {
  const pos = [];
  const nor = [];
  const idx = [];
  const n = Math.max(2, Math.round((zb - za) / 0.06));
  for (let k = 0; k <= n; k++) {
    const zf = za + ((zb - za) * k) / n;
    const h = rightHalf(bodyRing(spec, zf));
    const a = pointAt(h, sf0 - sw / 2);
    const b = pointAt(h, sf0 + sw / 2);
    let nxA = a[4];
    let nyA = -a[3];
    const la = Math.hypot(nxA, nyA) || 1;
    nxA /= la;
    nyA /= la;
    let nxB = b[4];
    let nyB = -b[3];
    const lb = Math.hypot(nxB, nyB) || 1;
    nxB /= lb;
    nyB /= lb;
    const base = pos.length / 3;
    pos.push(
      side * (a[0] + nxA * off),
      a[1] + nyA * off,
      zf - halfLength,
      side * (b[0] + nxB * off),
      b[1] + nyB * off,
      zf - halfLength,
    );
    nor.push(side * nxA, nyA, 0, side * nxB, nyB, 0);
    if (k > 0) {
      if (side > 0) {
        idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
      } else {
        idx.push(base - 2, base, base - 1, base - 1, base, base + 1);
      }
    }
  }
  return createGeometry(pos, nor, idx);
}
