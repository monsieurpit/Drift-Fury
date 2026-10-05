/** The base ground plane under the whole map (the mountain terrain is built in mountain.js). */
export function buildGround(world) {
  const { addBox, grassMaterial } = world;
  addBox(900, 0.5, 1200, 0, -0.3, -200, grassMaterial);
}
