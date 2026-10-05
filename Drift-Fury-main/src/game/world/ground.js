import { Mesh, PlaneGeometry } from "three";
import { terrainHeight } from "./terrain.js";
/** The base ground plane and the displaced mountain terrain mesh. */
export function buildGround(world) {
  const { addBox, grassMaterial, scene } = world;
  addBox(900, 0.5, 1200, 0, -0.3, -200, grassMaterial);
  const mountainGeometry = new PlaneGeometry(360, 460, 48, 64);
  mountainGeometry.rotateX(-Math.PI / 2);
  const mountainPositions = mountainGeometry.attributes.position;
  for (let e = 0; e < mountainPositions.count; e++) {
    const t = mountainPositions.getX(e) - 30;
    const n = mountainPositions.getZ(e) - 370;
    const r = terrainHeight(t, n);
    const i = Math.sin(t * 0.08) * Math.cos(n * 0.06) * 1.6 + Math.sin(t * 0.2 + n * 0.15) * 0.7;
    mountainPositions.setXYZ(e, t, r + i, n);
  }
  mountainGeometry.computeVertexNormals();
  const mountainGround = new Mesh(mountainGeometry, grassMaterial);
  mountainGround.receiveShadow = true;
  scene.add(mountainGround);
}
