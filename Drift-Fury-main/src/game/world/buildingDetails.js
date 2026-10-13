// Real 3D detail on the city's buildings, lined up with the windows and shop bays painted on their facade
// textures: fabric awnings over the shop windows, iron fire escapes zig-zagging up the brick walk-ups, and
// balconies under the windows of the plastered apartment blocks. Plain meshes in shared materials: the
// static batching merges them with the rest of the city into a few draw calls per area.
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial } from "three";

const unitBox = new BoxGeometry(1, 1, 1);
const awningMaterials = new Map();

function awningMaterial(signColour) {
  if (!awningMaterials.has(signColour)) {
    // Canvas awnings in the shop's colour, a little deeper and duller than its sign.
    const colour = new Color(signColour).multiplyScalar(0.62);
    awningMaterials.set(signColour, new MeshStandardMaterial({ color: colour, roughness: 0.88, metalness: 0 }));
  }
  return awningMaterials.get(signColour);
}

const ironMaterial = new MeshStandardMaterial({ color: "#1d1f22", roughness: 0.62, metalness: 0.55 });
const slabMaterial = new MeshStandardMaterial({ color: "#8d8a83", roughness: 0.82, metalness: 0 });
const railMaterial = new MeshStandardMaterial({ color: "#2a2d31", roughness: 0.45, metalness: 0.7 });

/** A small deterministic hash in [0, 1): the same building always gets the same details. */
function hash(a, b = 0, c = 0) {
  const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * A face of a building: a group placed on the wall at `(x, z)`, turned so its +Z points out of the wall
 * (normal `nx, nz`) and its +X runs along it. Boxes are added in that frame.
 */
function faceFrame(scene, x, z, nx, nz) {
  const group = new Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.atan2(nx, nz);
  scene.add(group);
  const box = (width, height, depth, px, py, pz, material, tilt = 0) => {
    const mesh = new Mesh(unitBox, material);
    mesh.scale.set(width, height, depth);
    mesh.position.set(px, py, pz);
    mesh.rotation.x = tilt;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  return box;
}

/**
 * Adds the details of one building. `b`: { kind, bxC, bzC, sW, cD, side, podium, upperHeight, rows, sign }
 * (the building's centre, width along x and depth along z of its upper floors, which side of its block it
 * stands on, the shop podium's height, the height of the floors above and their number of facade rows,
 * and its shops' sign colour).
 */
export function addBuildingDetails(scene, b) {
  const seed = b.bxC * 0.37 + b.bzC * 0.11;
  // The three street-facing sides (not the one facing the next lot), as in the shop lighting.
  const podiumFaces = [
    [b.side, 0, b.cD + 1],
    [0, 1, b.sW + 1],
    [0, -1, b.sW + 1],
  ];

  /* --- awnings over the shop windows: one per 4 m bay of the shop-front texture --- */
  for (const [nx, nz, length] of podiumFaces) {
    const halfX = (b.sW + 1) / 2;
    const halfZ = (b.cD + 1) / 2;
    const box = faceFrame(scene, b.bxC + nx * halfX, b.bzC + nz * halfZ, nx, nz);
    const bays = Math.max(1, Math.round(length / 8)) * 2;
    const bayWidth = length / bays;
    const material = awningMaterial(b.sign);
    for (let bay = 0; bay < bays; bay++) {
      if (hash(seed, nx * 3 + nz, bay) < 0.18) continue; // a few bare windows
      const along = -length / 2 + (bay + 0.5) * bayWidth;
      const width = bayWidth - 0.5;
      // The canvas, sloping down and out from above the window, and its hanging valance.
      box(width, 0.04, 1.2, along, 3.02, 0.55, material, 0.42);
      box(width, 0.26, 0.03, along, 2.68, 1.09, material);
    }
  }

  const rows = b.rows;
  const rowHeight = b.upperHeight / rows;

  /* --- fire escapes on the brick walk-ups --- */
  if (b.kind === "brick" && rows >= 2) {
    // On one of the street-facing long sides, a third of the way along.
    const nz = hash(seed, 7) < 0.5 ? 1 : -1;
    const box = faceFrame(scene, b.bxC, b.bzC + nz * (b.cD / 2), 0, nz);
    const centre = (hash(seed, 9) - 0.5) * b.sW * 0.4;
    const width = 2.8;
    const depth = 1.0;
    for (let row = 1; row < rows; row++) {
      const y = b.podium + row * rowHeight + 0.05;
      // Landing, its railing (top rail, front and end posts) and the stair up to the next one.
      box(width, 0.06, depth, centre, y, depth / 2 + 0.05, ironMaterial);
      box(width, 0.04, 0.04, centre, y + 1.0, depth + 0.03, ironMaterial);
      box(width, 0.03, 0.03, centre, y + 0.5, depth + 0.03, ironMaterial);
      for (const end of [-1, 1]) {
        box(0.04, 1.0, 0.04, centre + (end * width) / 2, y + 0.5, depth + 0.03, ironMaterial);
        box(0.04, 0.04, depth, centre + (end * width) / 2, y + 1.0, depth / 2 + 0.05, ironMaterial);
      }
      if (row < rows - 1) {
        // A steep stair from one end of this landing to the other end of the next.
        const run = width - 0.7;
        const angle = Math.atan2(rowHeight, run);
        const length = Math.hypot(rowHeight, run);
        const direction = row % 2 ? 1 : -1;
        const stair = box(length, 0.05, 0.55, centre, y + rowHeight / 2, depth * 0.55, ironMaterial);
        stair.rotation.z = direction * angle;
      }
    }
    // The drop ladder down to the podium roof.
    box(0.45, 1.6, 0.04, centre + width / 2 - 0.4, b.podium + rowHeight - 0.8, depth + 0.02, ironMaterial);
  }

  /* --- balconies on the plastered apartment blocks, under some of the windows --- */
  if (b.kind === "classic" && rows >= 2) {
    for (const nz of [1, -1]) {
      const box = faceFrame(scene, b.bxC, b.bzC + nz * (b.cD / 2), 0, nz);
      const windows = Math.max(1, Math.round(b.sW / 12)) * 4;
      const windowWidth = b.sW / windows;
      for (let row = 1; row < rows; row++) {
        // (Whole columns of balconies, like real apartment stacks, with a few missing.)
        for (let column = 0; column < windows; column++) {
          if (hash(seed, column, nz) > 0.45 || hash(seed, column, row * 13 + nz) < 0.12) continue;
          const along = -b.sW / 2 + (column + 0.5) * windowWidth;
          const y = b.podium + row * rowHeight + rowHeight * 0.22;
          const width = windowWidth * 0.86;
          const depth = 0.85;
          box(width, 0.14, depth, along, y, depth / 2, slabMaterial);
          box(width, 0.04, 0.04, along, y + 1.0, depth - 0.02, railMaterial);
          box(width, 0.03, 0.03, along, y + 0.45, depth - 0.02, railMaterial);
          for (const end of [-1, 1]) {
            box(0.04, 0.95, 0.04, along + (end * width) / 2, y + 0.55, depth - 0.02, railMaterial);
            box(0.04, 0.04, depth, along + (end * width) / 2, y + 1.0, depth / 2, railMaterial);
          }
        }
      }
    }
  }
}
