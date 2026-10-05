import { BufferGeometry, BufferAttribute } from "three";
export function createGeometry(pos, nor, idx) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  if (idx) {
    g.setIndex(idx);
  }
  return g;
}

/* normals for a (rows x cols) point matrix whose columns wrap */
/* normals for a (rows x cols) point matrix whose columns wrap */
export function computeGridNormals(P, nz, nr) {
  const N = new Float32Array(P.length);
  for (let i = 0; i < nz; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(nz - 1, i + 1);
    for (let j = 0; j < nr; j++) {
      const j0 = (j + nr - 1) % nr;
      const j1 = (j + 1) % nr;
      const a = (i * nr + j) * 3;
      const A = (i * nr + j0) * 3;
      const B = (i * nr + j1) * 3;
      const C = (i0 * nr + j) * 3;
      const D = (i1 * nr + j) * 3;
      const ux = P[B] - P[A];
      const uy = P[B + 1] - P[A + 1];
      const uz = P[B + 2] - P[A + 2];
      const vx = P[D] - P[C];
      const vy = P[D + 1] - P[C + 1];
      const vz = P[D + 2] - P[C + 2];
      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz_ = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz_);
      if (l < 1e-12) {
        nx = 0;
        ny = 1;
        nz_ = 0;
      } else {
        nx /= l;
        ny /= l;
        nz_ /= l;
      }
      N[a] = nx;
      N[a + 1] = ny;
      N[a + 2] = nz_;
    }
  }
  return N;
}

/* build one geometry per category from a point-matrix grid */
/* build one geometry per category from a point-matrix grid */
export function buildGridGeometries(P, N, nz, nr, cat) {
  const buckets = {};
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < nr; j++) {
      const c = cat(i, j);
      if (!c) {
        continue;
      }
      const b =
        buckets[c] ||
        (buckets[c] = {
          pos: [],
          nor: [],
          idx: [],
          map: new Map(),
        });
      const j1 = (j + 1) % nr;
      const vid = (ii, jj) => {
        const k = ii * nr + jj;
        let v = b.map.get(k);
        if (v === undefined) {
          v = b.pos.length / 3;
          b.map.set(k, v);
          const a = k * 3;
          b.pos.push(P[a], P[a + 1], P[a + 2]);
          b.nor.push(N[a], N[a + 1], N[a + 2]);
        }
        return v;
      };
      const A = vid(i, j);
      const B = vid(i, j1);
      const C = vid(i + 1, j);
      const D = vid(i + 1, j1);
      b.idx.push(A, B, C, B, D, C);
    }
  }
  const out = {};
  for (const k in buckets) {
    out[k] = createGeometry(buckets[k].pos, buckets[k].nor, buckets[k].idx);
  }
  return out;
}

/* flat polygon cap (convex-ish ring) with a fixed normal */
/* flat polygon cap (convex-ish ring) with a fixed normal */
export function buildCapGeometry(ring, z, nz_) {
  const pos = [];
  const nor = [];
  const idx = [];
  let cx = 0;
  let cy_ = 0;
  ring.forEach((p) => {
    cx += p[0];
    cy_ += p[1];
  });
  cx /= ring.length;
  cy_ /= ring.length;
  pos.push(cx, cy_, z);
  nor.push(0, 0, nz_);
  ring.forEach((p) => {
    pos.push(p[0], p[1], z);
    nor.push(0, 0, nz_);
  });
  for (let j = 0; j < ring.length; j++) {
    const a = 1 + j;
    const b = 1 + ((j + 1) % ring.length);
    if (nz_ > 0) {
      idx.push(0, a, b);
    } else {
      idx.push(0, b, a);
    }
  }
  return createGeometry(pos, nor, idx);
}

/* convex prism from a 2D polygon [r, t] (radial, tangential) rotated by phi around the x axis */
/* convex prism from a 2D polygon [r, t] (radial, tangential) rotated by phi around the x axis */
export function buildPrismGeometry(poly, x0, x1, phi, bevel) {
  const pos = [];
  const nor = [];
  const idx = [];
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const W = (r, t, x) => {
    return [x, r * c - t * s, r * s + t * c];
  };
  const n = poly.length;
  const addTri = (a, b, d, nrm) => {
    const k = pos.length / 3;
    pos.push(...a, ...b, ...d);
    for (let i = 0; i < 3; i++) {
      nor.push(...nrm);
    }
    idx.push(k, k + 1, k + 2);
  };
  let cr = 0;
  let ct = 0;
  poly.forEach((p) => {
    cr += p[0];
    ct += p[1];
  });
  cr /= n;
  ct /= n;
  const nrmX1 = [1, 0, 0];
  const nrmX0 = [-1, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    addTri(W(cr, ct, x1), W(a[0], a[1], x1), W(b[0], b[1], x1), nrmX1);
    addTri(W(cr, ct, x0), W(b[0], b[1], x0), W(a[0], a[1], x0), nrmX0);
    const dr = b[0] - a[0];
    const dt = b[1] - a[1];
    const l = Math.hypot(dr, dt) || 1;
    const nr_ = dt / l;
    const nt = -dr / l;
    const wn = [0, nr_ * c - nt * s, nr_ * s + nt * c];
    const q = pos.length / 3;
    pos.push(...W(a[0], a[1], x0), ...W(b[0], b[1], x0), ...W(b[0], b[1], x1), ...W(a[0], a[1], x1));
    for (let k = 0; k < 4; k++) {
      nor.push(...wn);
    }
    idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
  }
  return createGeometry(pos, nor, idx);
}

/* surface of revolution about the x axis. prof = [[x, r], ...] ordered so the outside faces out */
/* surface of revolution about the x axis. prof = [[x, r], ...] ordered so the outside faces out */
export function buildLatheGeometry(prof, seg) {
  const nz = prof.length;
  const nr = seg;
  const P = new Float32Array(nz * nr * 3);
  for (let i = 0; i < nz; i++) {
    for (let j = 0; j < nr; j++) {
      const th = (j / nr) * Math.PI * 2;
      const a = (i * nr + j) * 3;
      P[a] = prof[i][0];
      P[a + 1] = Math.cos(th) * prof[i][1];
      P[a + 2] = Math.sin(th) * prof[i][1];
    }
  }
  const N = computeGridNormals(P, nz, nr);
  const pos = Array.from(P);
  const nor = Array.from(N);
  const idx = [];
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < nr; j++) {
      const j1 = (j + 1) % nr;
      const A = i * nr + j;
      const B = i * nr + j1;
      const C = (i + 1) * nr + j;
      const D = (i + 1) * nr + j1;
      idx.push(A, B, C, B, D, C);
    }
  }
  return createGeometry(pos, nor, idx);
}
