// Traffic, parked and police cars drawn with instancing.
//
// Every car of one look (the four police cruisers, parked cars of the same colour) is the same template:
// about a dozen meshes, one per material, plus a shadow proxy. Drawn as separate objects, each car costs a
// dozen draw calls in the main pass and again in the ambient-occlusion pass. Here each part of a template
// is one InstancedMesh holding every car of that look, so a look costs a dozen draw calls however many cars
// use it. Cars outside the view are left out of the instance list each frame (as frustum culling did per
// car), except for their shadow proxies, whose shadows can fall into view.
import { Frustum, InstancedMesh, Matrix4, Object3D, Sphere, Box3 } from "three";

const LIGHT_NAMES = new Set(["blue", "red"]);

export function createCarInstancer(scene) {
  const looks = new Map(); // template -> { parts, handles, sphere, capacity }
  const frustum = new Frustum();
  const viewProjection = new Matrix4();
  const matrix = new Matrix4();
  const sphere = new Sphere();

  function makeParts(look) {
    for (const part of look.parts) {
      if (part.mesh) {
        scene.remove(part.mesh);
        part.mesh.dispose();
      }
      const mesh = new InstancedMesh(part.geometry, part.material, look.capacity);
      mesh.count = 0;
      mesh.frustumCulled = false; // culled per car below
      mesh.castShadow = part.castShadow;
      mesh.receiveShadow = part.receiveShadow;
      mesh.renderOrder = part.renderOrder;
      mesh.name = part.name ? `car-${part.name}` : "";
      mesh.userData.carInstances = true;
      part.mesh = mesh;
      scene.add(mesh);
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
      parts.push({
        geometry: object.geometry,
        material: object.material,
        local: rootInverse.clone().multiply(object.matrixWorld),
        castShadow: object.castShadow,
        receiveShadow: object.receiveShadow,
        renderOrder: object.renderOrder,
        name: object.name,
        light: LIGHT_NAMES.has(object.name) ? object.name : null,
        proxy: object.name === "car-shadow-proxy",
        mesh: null,
      });
    });
    const bounds = new Box3().setFromObject(template);
    const local = bounds.applyMatrix4(rootInverse).getBoundingSphere(new Sphere());
    look = { parts, handles: new Set(), sphere: local, capacity: 4 };
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
     * A car of the look `template`: an Object3D to position, rotate and show/hide as usual (it is not
     * added to the scene). userData.blue / userData.red switch a police car's light bar halves.
     */
    add(template) {
      const look = lookFor(template);
      const handle = new Object3D();
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
        for (const part of look.parts) part.mesh.count = 0;
        for (const handle of look.handles) {
          if (!handle.visible) continue;
          handle.updateMatrix();
          handle.matrixWorld.copy(handle.matrix);
          sphere.copy(look.sphere).applyMatrix4(handle.matrix);
          const inView = !camera || frustum.intersectsSphere(sphere);
          for (const part of look.parts) {
            if (!part.proxy && !inView) continue;
            if (part.light && !handle.userData[part.light]) continue;
            matrix.multiplyMatrices(handle.matrix, part.local);
            part.mesh.setMatrixAt(part.mesh.count++, matrix);
          }
        }
        for (const part of look.parts) part.mesh.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
