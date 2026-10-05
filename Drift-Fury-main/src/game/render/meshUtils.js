import { CanvasTexture, ExtrudeGeometry, Mesh } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
/**
 * Merges the direct child meshes of `group` that share a material into one mesh per material
 * (named meshes and those in `keep` are left alone).
 */
export function mergeChildrenByMaterial(group, keep = new Set()) {
  const byMaterial = new Map();
  for (const child of [...group.children]) {
    if (!child.isMesh || child.name || keep.has(child)) continue;
    child.updateMatrix();
    const geometry = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    geometry.applyMatrix4(child.matrix);
    geometry.clearGroups();
    let entry = byMaterial.get(child.material);
    if (!entry) {
      entry = {
        geos: [],
        cast: false,
        receive: false,
      };
      byMaterial.set(child.material, entry);
    }
    entry.geos.push(geometry);
    entry.cast ||= child.castShadow;
    entry.receive ||= child.receiveShadow;
    child.geometry.dispose();
    group.remove(child);
  }
  for (const [material, entry] of byMaterial) {
    const merged = entry.geos.length === 1 ? entry.geos[0] : mergeGeometries(entry.geos);
    if (entry.geos.length > 1) entry.geos.forEach((geometry) => geometry.dispose());
    const mesh = new Mesh(merged, material);
    mesh.castShadow = entry.cast;
    mesh.receiveShadow = entry.receive;
    group.add(mesh);
  }
}
/** Extrudes a 2D shape sideways (along X) into a bevelled, shadow-casting mesh centred on X = 0. */
export function createExtrudedMesh(shape, depth, material, bevel = 0.05) {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    steps: 1,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
/** Draws into a new canvas with `draw(context, width, height)` and wraps it in a texture. */
export function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext("2d"), width, height);
  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}
