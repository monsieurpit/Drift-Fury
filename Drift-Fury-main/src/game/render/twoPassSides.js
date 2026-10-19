import { BackSide, DoubleSide, FrontSide, Mesh } from "three";
/**
 * A transparent double-sided material (glass, badges, plates) is drawn by three.js in two passes, back
 * faces then front faces, flagging the material changed before each: its shader parameters are worked out
 * again twice per draw, every frame. The same two passes can be drawn by two objects, one with a back-face
 * copy of the material and one with a front-face copy, which never change.
 */
const sideCopies = new Map(); // material -> [back, front]

/** The [back, front] copies of `material`, or null when three.js draws it in one pass anyway. */
export function twoPassSides(material) {
  if (!material || Array.isArray(material) || !material.transparent || material.side !== DoubleSide || material.forceSinglePass) {
    return null;
  }
  let copies = sideCopies.get(material);
  if (!copies) {
    copies = [BackSide, FrontSide].map((side) => {
      const copy = material.clone();
      copy.side = side;
      // (Its shadow stays double-sided, as the original's; Material.copy leaves out the shader patches.)
      copy.shadowSide = material.shadowSide ?? DoubleSide;
      copy.onBeforeCompile = material.onBeforeCompile;
      copy.customProgramCacheKey = material.customProgramCacheKey;
      return copy;
    });
    sideCopies.set(material, copies);
  }
  return copies;
}

/**
 * Static meshes under `root` with such a material: drawn with the back-face copy, plus a child with the
 * front-face copy. (The child has the parent's place and a later id, so three.js sorts it right after: back
 * faces, then front faces, as before.)
 */
export function splitTwoPass(root) {
  const found = [];
  // (What is shown, only: things hidden until needed may change their material.)
  root.traverseVisible((object) => {
    if (object.isMesh && !object.isInstancedMesh && !object.isSkinnedMesh && twoPassSides(object.material)) found.push(object);
  });
  for (const mesh of found) {
    const [back, front] = twoPassSides(mesh.material);
    const twin = new Mesh(mesh.geometry, front);
    twin.castShadow = false; // (the parent's shadow is the whole of it)
    twin.receiveShadow = mesh.receiveShadow;
    twin.renderOrder = mesh.renderOrder;
    twin.layers.mask = mesh.layers.mask;
    twin.frustumCulled = mesh.frustumCulled;
    mesh.material = back;
    mesh.add(twin);
  }
  return found.length;
}
