import { InstancedMesh, Matrix4 } from "three";
import { batchStaticMeshes } from "../render/staticBatching.js";

const wheelMatrix = new Matrix4();

/*
 * The player car keeps its moving parts (wheels, door, lamps) separate; everything else is batched.
 * The two wheels of an axle are the same model, so each axle's wheel parts are drawn as instances (one
 * draw call per part for both wheels instead of one per part per wheel), placed from the wheels' own
 * transforms every frame by userData.updateWheels().
 */
export function batchPlayerCar(car) {
  const data = car.userData;
  const skip = new Set([
    ...data.wheels,
    ...data.brakeLights,
    ...data.headlights,
    ...(data.headlightBeams || []),
  ]);
  if (data.accessDoor) {
    skip.add(data.accessDoor);
  }
  batchStaticMeshes(car, new Set(), Infinity, skip);
  data.wheels.forEach((wheel) => batchStaticMeshes(wheel, new Set(), Infinity));
  if (data.accessDoor) {
    batchStaticMeshes(data.accessDoor, new Set(), Infinity);
  }

  car.updateMatrixWorld(true);
  const parts = [];
  for (const axle of [data.wheels.slice(0, 2), data.wheels.slice(2, 4)]) {
    if (axle.length < 2) continue;
    const [first] = axle;
    const firstInverse = first.matrixWorld.clone().invert();
    first.traverse((object) => {
      if (!object.isMesh) return;
      const instances = new InstancedMesh(object.geometry, object.material, axle.length);
      instances.castShadow = object.castShadow;
      instances.receiveShadow = object.receiveShadow;
      instances.frustumCulled = false; // always next to the car the camera follows
      car.add(instances);
      parts.push({ instances, local: firstInverse.clone().multiply(object.matrixWorld), wheels: axle });
    });
    for (const wheel of axle) {
      wheel.traverse((object) => {
        if (object.isMesh) object.visible = false;
      });
    }
  }
  data.updateWheels = () => {
    for (const wheel of data.wheels) wheel.updateMatrix();
    for (const { instances, local, wheels } of parts) {
      wheels.forEach((wheel, index) => {
        wheelMatrix.multiplyMatrices(wheel.matrix, local);
        instances.setMatrixAt(index, wheelMatrix);
      });
      instances.instanceMatrix.needsUpdate = true;
    }
  };
  data.updateWheels();
  return car;
}
