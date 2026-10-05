import { CAR_SPECS } from "../vehicles/carSpecs.js";
export function orientedBox(e, t, n, r, i) {
  return {
    x: e,
    z: t,
    hw: r,
    hl: i,
    cos: Math.cos(n),
    sin: Math.sin(n),
  };
}
export function collideOrientedBoxes(e, t) {
  const n = t.x - e.x;
  const r = t.z - e.z;
  let i = Infinity;
  let a = 0;
  let o = 0;
  let s = -Infinity;
  for (let c = 0; c < 4; c++) {
    const l = c < 2 ? e : t;
    const u = c % 2 ? l.sin : l.cos;
    const d = c % 2 ? l.cos : -l.sin;
    const f = n * u + r * d;
    const p =
      e.hw * Math.abs(u * e.cos - d * e.sin) +
      e.hl * Math.abs(u * e.sin + d * e.cos) +
      (t.hw * Math.abs(u * t.cos - d * t.sin) + t.hl * Math.abs(u * t.sin + d * t.cos)) -
      Math.abs(f);
    if (p < i) {
      i = p;
      const e = f < 0 ? -1 : 1;
      a = u * e;
      o = d * e;
    }
    if (-p > s) {
      s = -p;
    }
  }
  return i > 0
    ? {
        overlap: true,
        depth: i,
        nx: a,
        nz: o,
        gap: -i,
      }
    : {
        overlap: false,
        depth: 0,
        nx: 0,
        nz: 0,
        gap: s,
      };
}
const collisionProfiles = new Map();
export function getCollisionProfile(shape) {
  if (!collisionProfiles.has(shape)) {
    const spec = CAR_SPECS[shape] || CAR_SPECS.coupe;
    collisionProfiles.set(shape, {
      shape,
      length: spec.L,
      widths: spec.wid,
    });
  }
  return collisionProfiles.get(shape);
}
export function createCarFootprint(x, z, heading, profile) {
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  const vertices = [];
  const addSide = (side, reverse) => {
    const stations = reverse ? [...profile.widths].reverse() : profile.widths;
    for (const [station, halfWidth] of stations) {
      const localX = side * halfWidth;
      const localZ = station - profile.length / 2;
      vertices.push([x + localX * cos + localZ * sin, z - localX * sin + localZ * cos]);
    }
  };
  addSide(1, false);
  addSide(-1, true);
  return {
    x,
    z,
    vertices,
  };
}
export function collideFootprintWithBox(car, box) {
  let minOverlap = Infinity;
  let nx = 0;
  let nz = 0;
  const axes = [
    [1, 0],
    [0, 1],
  ];
  for (let index = 0; index < car.vertices.length; index++) {
    const current = car.vertices[index];
    const next = car.vertices[(index + 1) % car.vertices.length];
    const edgeX = next[0] - current[0];
    const edgeZ = next[1] - current[1];
    const edgeLength = Math.hypot(edgeX, edgeZ);
    if (edgeLength > 1e-8) {
      axes.push([-edgeZ / edgeLength, edgeX / edgeLength]);
    }
  }
  for (const [axisX, axisZ] of axes) {
    let carMin = Infinity;
    let carMax = -Infinity;
    for (const [x, z] of car.vertices) {
      const projection = x * axisX + z * axisZ;
      carMin = Math.min(carMin, projection);
      carMax = Math.max(carMax, projection);
    }
    const boxCenter = box.x * axisX + box.z * axisZ;
    const boxRadius = box.w * Math.abs(axisX) + box.d * Math.abs(axisZ);
    const overlap = Math.min(carMax, boxCenter + boxRadius) - Math.max(carMin, boxCenter - boxRadius);
    if (overlap <= 0) {
      return null;
    }
    if (overlap < minOverlap) {
      const direction = boxCenter - (car.x * axisX + car.z * axisZ) < 0 ? -1 : 1;
      minOverlap = overlap;
      nx = axisX * direction;
      nz = axisZ * direction;
    }
  }
  return {
    depth: minOverlap,
    nx,
    nz,
  };
}
const GRID_CELL_SIZE = 24;
export function buildSolidGrid(e) {
  const t = new Map();
  for (let n of e) {
    const e = Math.floor((n.x - n.w) / GRID_CELL_SIZE);
    const r = Math.floor((n.x + n.w) / GRID_CELL_SIZE);
    const i = Math.floor((n.z - n.d) / GRID_CELL_SIZE);
    const a = Math.floor((n.z + n.d) / GRID_CELL_SIZE);
    for (let o = e; o <= r; o++) {
      for (let e = i; e <= a; e++) {
        const r = o + "," + e;
        let i = t.get(r);
        if (!i) {
          ((i = []), t.set(r, i));
        }
        i.push(n);
      }
    }
  }
  let n = 0;
  return {
    near(e, r, i, a) {
      n++;
      if (a) {
        a.length = 0;
      } else {
        a = [];
      }
      const o = Math.floor((e - i) / GRID_CELL_SIZE);
      const s = Math.floor((e + i) / GRID_CELL_SIZE);
      const c = Math.floor((r - i) / GRID_CELL_SIZE);
      const l = Math.floor((r + i) / GRID_CELL_SIZE);
      for (let e = o; e <= s; e++) {
        for (let r = c; r <= l; r++) {
          const i = t.get(e + "," + r);
          if (i) {
            for (let e of i) {
              if (e._bp !== n) {
                ((e._bp = n), a.push(e));
              }
            }
          }
        }
      }
      return a;
    },
  };
}
