import { MeshStandardMaterial, BoxGeometry, Mesh, Matrix4, Vector3, Quaternion } from "three";
import { concreteTexture, createAsphaltMaterial, grassTexture } from "./textures.js";
/** Shared materials, the box/solid helpers and scratch math objects used by every part of the map. */
export function createWorldContext(world) {
  const { scene } = world;
  const solids = [];
  const lampPositions = [];
  const roadMaterial = createAsphaltMaterial(6);
  const highwayMaterial = createAsphaltMaterial(10);
  const sidewalkMaterial = new MeshStandardMaterial({
    map: concreteTexture(),
    roughness: 0.82,
    metalness: 0.05,
    color: "#aab0b6",
  });
  const concreteMaterial = new MeshStandardMaterial({
    map: concreteTexture(2),
    roughness: 0.85,
    color: "#8a9098",
  });
  const grassMaterial = new MeshStandardMaterial({
    map: grassTexture(),
    roughness: 1,
    metalness: 0,
    color: "#5a7a5e",
  });
  // Road paint is lit like the asphalt (a little glossier, with a faint retroreflective glow) instead of
  // unlit, which made every line glow like neon at night.
  const whitePaint = new MeshStandardMaterial({
    color: "#e4e2d6",
    roughness: 0.5,
    metalness: 0,
    emissive: "#e4e2d6",
    emissiveIntensity: 0.12,
  });
  const yellowPaint = new MeshStandardMaterial({
    color: "#d9b43c",
    roughness: 0.5,
    metalness: 0,
    emissive: "#d9b43c",
    emissiveIntensity: 0.12,
  });
  const poleMetal = new MeshStandardMaterial({
    color: "#2a3036",
    metalness: 0.7,
    roughness: 0.5,
  });
  const darkMetal = new MeshStandardMaterial({
    color: "#1a1e22",
    roughness: 0.8,
    metalness: 0.3,
  });
  const lampGlow = new MeshStandardMaterial({
    color: "#1a1e22",
    metalness: 0.6,
    roughness: 0.5,
    emissive: "#fff4d0",
    emissiveIntensity: 1.6,
  });
  for (const [mt, tl] of [
    [sidewalkMaterial, 4],
    [concreteMaterial, 4],
  ]) {
    mt.map.repeat.set(1, 1);
    mt.userData.tile = tl;
  }
  function addBox(width, height, depth, x, y, z, material, solid = false) {
    const geometry = new BoxGeometry(width, height, depth);
    if (material && material.userData && material.userData.tile) {
      const tile = material.userData.tile;
      const uv = geometry.attributes.uv;
      const dims = [
        [depth, height],
        [depth, height],
        [width, depth],
        [width, depth],
        [width, height],
        [width, height],
      ];
      for (let face = 0; face < 6; face++) {
        for (let vi = 0; vi < 4; vi++) {
          const ix = face * 4 + vi;
          uv.setXY(ix, (uv.getX(ix) * dims[face][0]) / tile, (uv.getY(ix) * dims[face][1]) / tile);
        }
      }
      uv.needsUpdate = true;
    }
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    mesh.castShadow = solid;
    scene.add(mesh);
    if (solid) {
      solids.push({
        x,
        z,
        w: width / 2,
        d: depth / 2,
        box: mesh,
      });
    }
    return mesh;
  }
  function addSolid(x, z, halfWidth, halfDepth) {
    solids.push({
      x,
      z,
      w: halfWidth,
      d: halfDepth,
    });
  }
  const tmpMatrix = new Matrix4();
  const tmpPosition = new Vector3();
  const tmpRotation = new Quaternion();
  const tmpScale = new Vector3();
  Object.assign(world, {
    addBox,
    addSolid,
    concreteMaterial,
    darkMetal,
    grassMaterial,
    highwayMaterial,
    lampGlow,
    lampPositions,
    poleMetal,
    roadMaterial,
    sidewalkMaterial,
    solids,
    tmpMatrix,
    tmpPosition,
    tmpRotation,
    tmpScale,
    whitePaint,
    yellowPaint,
  });
}
