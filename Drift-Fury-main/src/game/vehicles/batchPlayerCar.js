import { batchStaticMeshes } from "../render/staticBatching.js";
/* the player car keeps its moving parts (wheels, door, lamps) separate; everything else is batched */
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
  data.wheels.forEach((wheel) => {
    return batchStaticMeshes(wheel, new Set(), Infinity);
  });
  if (data.accessDoor) {
    batchStaticMeshes(data.accessDoor, new Set(), Infinity);
  }
  return car;
}
/* ---- static batching: merge never-moving meshes that share an identical material into one draw per area ---- */
