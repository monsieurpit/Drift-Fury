import { CAR_SPECS } from "../vehicles/carSpecs.js";
export function orientedBox(x, z, heading, halfWidth, halfLength) {
  return {
    x,
    z,
    hw: halfWidth,
    hl: halfLength,
    cos: Math.cos(heading),
    sin: Math.sin(heading),
  };
}
export function collideOrientedBoxes(first, second) {
  const dx = second.x - first.x;
  const dz = second.z - first.z;
  let minOverlap = Infinity;
  let normalX = 0;
  let normalZ = 0;
  let maxGap = -Infinity;
  for (let c = 0; c < 4; c++) {
    const box = c < 2 ? first : second;
    const axisX = c % 2 ? box.sin : box.cos;
    const axisZ = c % 2 ? box.cos : -box.sin;
    const distance = dx * axisX + dz * axisZ;
    const overlap =
      first.hw * Math.abs(axisX * first.cos - axisZ * first.sin) +
      first.hl * Math.abs(axisX * first.sin + axisZ * first.cos) +
      (second.hw * Math.abs(axisX * second.cos - axisZ * second.sin) +
        second.hl * Math.abs(axisX * second.sin + axisZ * second.cos)) -
      Math.abs(distance);
    if (overlap < minOverlap) {
      minOverlap = overlap;
      const direction = distance < 0 ? -1 : 1;
      normalX = axisX * direction;
      normalZ = axisZ * direction;
    }
    if (-overlap > maxGap) {
      maxGap = -overlap;
    }
  }
  return minOverlap > 0
    ? {
        overlap: true,
        depth: minOverlap,
        nx: normalX,
        nz: normalZ,
        gap: -minOverlap,
      }
    : {
        overlap: false,
        depth: 0,
        nx: 0,
        nz: 0,
        gap: maxGap,
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
// Uniform grid over the static solids so collision checks only look at nearby boxes.
export function buildSolidGrid(solids) {
  const cells = new Map();
  for (const solid of solids) {
    const minX = Math.floor((solid.x - solid.w) / GRID_CELL_SIZE);
    const maxX = Math.floor((solid.x + solid.w) / GRID_CELL_SIZE);
    const minZ = Math.floor((solid.z - solid.d) / GRID_CELL_SIZE);
    const maxZ = Math.floor((solid.z + solid.d) / GRID_CELL_SIZE);
    for (let cellX = minX; cellX <= maxX; cellX++) {
      for (let cellZ = minZ; cellZ <= maxZ; cellZ++) {
        const key = cellX + "," + cellZ;
        let bucket = cells.get(key);
        if (!bucket) {
          bucket = [];
          cells.set(key, bucket);
        }
        bucket.push(solid);
      }
    }
  }
  // Each query stamps the solids it returns so a solid spanning several cells is listed once.
  let queryId = 0;
  return {
    near(x, z, radius, out) {
      queryId++;
      if (out) {
        out.length = 0;
      } else {
        out = [];
      }
      const minX = Math.floor((x - radius) / GRID_CELL_SIZE);
      const maxX = Math.floor((x + radius) / GRID_CELL_SIZE);
      const minZ = Math.floor((z - radius) / GRID_CELL_SIZE);
      const maxZ = Math.floor((z + radius) / GRID_CELL_SIZE);
      for (let cellX = minX; cellX <= maxX; cellX++) {
        for (let cellZ = minZ; cellZ <= maxZ; cellZ++) {
          const bucket = cells.get(cellX + "," + cellZ);
          if (bucket) {
            for (const solid of bucket) {
              if (solid._bp !== queryId) {
                solid._bp = queryId;
                out.push(solid);
              }
            }
          }
        }
      }
      return out;
    },
  };
}
