import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";
/** Star points high above the map. */
export function buildStars(world) {
  const { scene } = world;
  const starGeometry = new BufferGeometry();
  const starPositions = [];
  for (let e = 0; e < 500; e++) {
    starPositions.push((Math.random() - 0.5) * 1000, 220 + Math.random() * 250, (Math.random() - 0.5) * 1000);
  }
  starGeometry.setAttribute("position", new Float32BufferAttribute(starPositions, 3));
  scene.add(
    new Points(
      starGeometry,
      new PointsMaterial({
        color: "#ffffff",
        size: 1.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      }),
    ),
  );
}
