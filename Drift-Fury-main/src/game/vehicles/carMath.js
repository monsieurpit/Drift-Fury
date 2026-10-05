export /* ======================================================================
   DRIFT FURY - realistic car builder (replaces the old LEGO-style Vw)
   Smooth lofted bodywork, tinted glass greenhouse, pillars, wheel arches,
   lathe-turned tyres and alloy wheels, shaped lights, per-model details.
   ====================================================================== */
function pchip(pts) {
  const n = pts.length;
  const xs = pts.map((p) => {
    return p[0];
  });
  const ys = pts.map((p) => {
    return p[1];
  });
  const h = [];
  const d = [];
  const m = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x) => {
    if (x <= xs[0]) {
      return ys[0];
    }
    if (x >= xs[n - 1]) {
      return ys[n - 1];
    }
    let i = 0;
    while (x > xs[i + 1]) {
      i++;
    }
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}
export const clamp = (x, a, b) => {
  return Math.min(b, Math.max(a, x));
};
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/* Chaikin corner cutting on a closed polygon of [x, y, s] with s wrapping at sMax */
export function chaikin(P, iters, sMax) {
  let pts = P;
  for (let it = 0; it < iters; it++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const sb = i === pts.length - 1 ? b[2] + sMax : b[2];
      out.push([
        a[0] * 0.75 + b[0] * 0.25,
        a[1] * 0.75 + b[1] * 0.25,
        a[2] * 0.75 + sb * 0.25,
      ]);
      out.push([
        a[0] * 0.25 + b[0] * 0.75,
        a[1] * 0.25 + b[1] * 0.75,
        a[2] * 0.25 + sb * 0.75,
      ]);
    }
    pts = out;
  }
  return pts.map((p) => {
    return [p[0], p[1], p[2] % sMax];
  });
}
export function smoothProfile(ctrl, iters) {
  /* open Chaikin keeping the end points */
  let pts = ctrl;
  for (let it = 0; it < iters; it++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

/* ---------------------------------------------------------------- specs */
