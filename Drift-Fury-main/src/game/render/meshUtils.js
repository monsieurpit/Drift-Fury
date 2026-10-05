import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Mesh, ExtrudeGeometry, CanvasTexture } from "three";
export function mergeChildrenByMaterial(e, t = new Set()) {
  const n = new Map();
  for (let r of [...e.children]) {
    if (!r.isMesh || r.name || t.has(r)) {
      continue;
    }
    r.updateMatrix();
    const i = r.geometry.index ? r.geometry.toNonIndexed() : r.geometry.clone();
    i.applyMatrix4(r.matrix);
    i.clearGroups();
    let a = n.get(r.material);
    if (!a) {
      n.set(
        r.material,
        (a = {
          geos: [],
          cast: false,
          receive: false,
        }),
      );
    }
    a.geos.push(i);
    a.cast ||= r.castShadow;
    a.receive ||= r.receiveShadow;
    r.geometry.dispose();
    e.remove(r);
  }
  for (let [t, r] of n) {
    const n = r.geos.length === 1 ? r.geos[0] : mergeGeometries(r.geos);
    if (r.geos.length > 1) {
      r.geos.forEach((e) => {
        return e.dispose();
      });
    }
    const i = new Mesh(n, t);
    i.castShadow = r.cast;
    i.receiveShadow = r.receive;
    e.add(i);
  }
}
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
export function createExtrudedMesh(e, t, n, r = 0.05) {
  const i = new ExtrudeGeometry(e, {
    depth: t,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: 5,
    steps: 1,
    curveSegments: 32,
  });
  i.translate(0, 0, -t / 2);
  i.rotateY(-Math.PI / 2);
  i.computeVertexNormals();
  const a = new Mesh(i, n);
  a.castShadow = true;
  a.receiveShadow = true;
  return a;
}
export function canvasTexture(w, h, fn) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  fn(c.getContext("2d"), w, h);
  const t = new CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}
/* ---------- people: articulated humanoids (face -Z at rotation 0, like the cars) ---------- */
