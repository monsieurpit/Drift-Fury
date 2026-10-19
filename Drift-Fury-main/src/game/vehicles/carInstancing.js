// Traffic, parked and police cars drawn with instancing.
//
// Every car of one look (the four police cruisers, parked cars of the same colour) is the same template:
// about a dozen meshes, one per material, plus a shadow proxy. Drawn as separate objects, each car costs a
// dozen draw calls in the main pass and again in the ambient-occlusion pass. Here each part of a template
// is one InstancedMesh holding every car of that look, so a look costs a dozen draw calls however many cars
// use it. Cars outside the view are left out of the instance list each frame (as frustum culling did per
// car), except for their shadow proxies, whose shadows can fall into view. Looks are body shapes: the
// templates are painted white and each car's paint colour is set per instance, so cars of every colour
// share their shape's draw calls.
import { Color, Frustum, InstancedMesh, Matrix4, Object3D, Sphere, Box3 } from "three";
import { twoPassSides } from "../render/twoPassSides.js";

const LIGHT_NAMES = new Set(["blue", "red"]);
const WHITE = new Color(1, 1, 1);
const MAX_DISTANCE = 200; // metres

export function createCarInstancer(scene, { onMesh } = {}) {
  const looks = new Map(); // template -> { parts, handles, sphere, capacity }
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  const matrix = new Matrix4();
  const sphere = new Sphere();

  function makeParts(look) {
    look.dirty = true;
    for (const part of look.parts) {
      if (part.mesh) {
        scene.remove(part.mesh);
        part.mesh.dispose();
      }
      const mesh = new InstancedMesh(part.geometry, part.material, look.capacity);
      mesh.count = 0;
      mesh.visible = false; // until it holds a car
      mesh.frustumCulled = false; // culled per car below
      mesh.castShadow = part.castShadow;
      mesh.receiveShadow = part.receiveShadow;
      mesh.renderOrder = part.renderOrder;
      mesh.layers.mask = part.layers;
      mesh.name = part.name ? `car-${part.name}` : "";
      mesh.userData.carInstances = true;
      // Per-car paint colour (allocated now, so the shader is compiled with it from the start).
      if (part.paint) mesh.setColorAt(0, WHITE);
      part.mesh = mesh;
      scene.add(mesh);
      onMesh?.(mesh, look.template);
    }
  }

  function lookFor(template) {
    let look = looks.get(template);
    if (look) return look;
    template.updateMatrixWorld(true);
    const rootInverse = template.matrixWorld.clone().invert();
    const parts = [];
    template.traverse((object) => {
      if (!object.isMesh) return;
      // (A transparent double-sided part is two parts: its back faces, then its front faces.)
      for (const material of twoPassSides(object.material) || [object.material]) {
        parts.push({
          geometry: object.geometry,
          material,
          local: rootInverse.clone().multiply(object.matrixWorld),
          castShadow: object.castShadow,
          receiveShadow: object.receiveShadow,
          renderOrder: object.renderOrder,
          layers: object.layers.mask,
          name: object.name,
          light: LIGHT_NAMES.has(object.name) ? object.name : null,
          proxy: object.name === "car-shadow-proxy",
          paint: !!object.material?.userData?.carPaint,
          mesh: null,
        });
      }
    });
    const bounds = new Box3().setFromObject(template);
    const local = bounds.applyMatrix4(rootInverse).getBoundingSphere(new Sphere());
    look = { template, parts, handles: new Set(), sphere: local, capacity: 4, seen: [], dirty: true };
    makeParts(look);
    looks.set(template, look);
    return look;
  }

  return {
    /** Prepares the instanced meshes of a look up front (so its shaders compile during loading). */
    prepare(template) {
      lookFor(template);
    },
    /**
     * A car of the look `template` painted `color`: an Object3D to position, rotate and show/hide as
     * usual (it is not added to the scene). userData.blue / userData.red switch a police car's light bar
     * halves.
     */
    add(template, color = null) {
      const look = lookFor(template);
      const handle = new Object3D();
      handle.userData.paint = color ? new Color(color) : WHITE;
      handle.userData.blue = true;
      handle.userData.red = true;
      handle.userData.look = look;
      look.handles.add(handle);
      if (look.handles.size > look.capacity) {
        look.capacity *= 2;
        makeParts(look);
      }
      return handle;
    },
    remove(handle) {
      handle.userData.look?.handles.delete(handle);
    },
    /** Writes this frame's instances; `camera` null keeps every car (for reflection captures). */
    update(camera) {
      if (camera) {
        viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(viewProjection);
      }
      for (const look of looks.values()) {
        // Parked cars rarely move: a look is only rewritten (and its instances re-uploaded) when one of
        // its cars moved, came into or went out of view, or switched its lights.
        let changed = look.dirty || !camera;
        look.dirty = !camera; // (a capture keeps every car: rewrite again on the next frame)
        const seen = look.seen;
        let entries = 0;
        for (const handle of look.handles) {
          if (!handle.visible) continue;
          handle.updateMatrix();
          const elements = handle.matrix.elements;
          const last = (handle.userData.lastMatrix ||= new Float64Array(16).fill(NaN));
          for (let k = 0; k < 16; k++) {
            if (last[k] !== elements[k]) {
              last[k] = elements[k];
              changed = true;
            }
          }
          handle.matrixWorld.copy(handle.matrix);
          sphere.copy(look.sphere).applyMatrix4(handle.matrix);
          // (Not drawn beyond MAX_DISTANCE: a few pixels there.)
          const inView =
            !camera ||
            (frustum.intersectsSphere(sphere) &&
              sphere.center.distanceToSquared(camera.position) < MAX_DISTANCE * MAX_DISTANCE);
          const code = (inView ? 1 : 0) | (handle.userData.blue ? 2 : 0) | (handle.userData.red ? 4 : 0);
          if (seen[entries] !== handle || seen[entries + 1] !== code) {
            seen[entries] = handle;
            seen[entries + 1] = code;
            changed = true;
          }
          entries += 2;
          handle.userData.inView = inView;
        }
        if (seen.length !== entries) {
          seen.length = entries;
          changed = true;
        }
        if (!changed) continue;
        for (const part of look.parts) part.mesh.count = 0;
        for (const handle of look.handles) {
          if (!handle.visible) continue;
          const inView = handle.userData.inView;
          for (const part of look.parts) {
            if (!part.proxy && !inView) continue;
            if (part.light && !handle.userData[part.light]) continue;
            matrix.multiplyMatrices(handle.matrix, part.local);
            if (part.paint) part.mesh.setColorAt(part.mesh.count, handle.userData.paint);
            part.mesh.setMatrixAt(part.mesh.count++, matrix);
          }
        }
        for (const part of look.parts) {
          part.mesh.instanceMatrix.needsUpdate = true;
          if (part.mesh.instanceColor) part.mesh.instanceColor.needsUpdate = true;
          // An empty instanced mesh still costs a full draw call in every pass: skip it.
          part.mesh.visible = part.mesh.count > 0;
        }
      }
    },
  };
}
