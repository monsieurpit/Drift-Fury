import { MeshStandardMaterial, BoxGeometry, Mesh, Group, CylinderGeometry, CanvasTexture } from "three";
import { terrainHeight } from "./terrain.js";
/** Barrier modules closing the far end of the highway. */
export function buildRoadClosure(world) {
  const { addSolid, scene } = world;
  const closureFaceCanvas = document.createElement("canvas");
  closureFaceCanvas.width = 512;
  closureFaceCanvas.height = 128;
  const closureFaceContext = closureFaceCanvas.getContext("2d");
  closureFaceContext.fillStyle = "#e96b1b";
  closureFaceContext.fillRect(0, 0, 512, 128);
  closureFaceContext.save();
  closureFaceContext.beginPath();
  closureFaceContext.rect(0, 0, 512, 128);
  closureFaceContext.clip();
  closureFaceContext.translate(-128, 0);
  closureFaceContext.rotate(-Math.PI / 4);
  for (let stripe = -256; stripe < 768; stripe += 112) {
    closureFaceContext.fillStyle = "#eee9dc";
    closureFaceContext.fillRect(stripe, -256, 46, 768);
    closureFaceContext.fillStyle = "rgba(45, 45, 45, .35)";
    closureFaceContext.fillRect(stripe + 46, -256, 8, 768);
  }
  closureFaceContext.restore();
  const closureFaceTexture = new CanvasTexture(closureFaceCanvas);
  closureFaceTexture.colorSpace = "srgb";
  const closureFaceMaterial = new MeshStandardMaterial({
    map: closureFaceTexture,
    roughness: 0.58,
    metalness: 0.02,
  });
  const closureOrange = new MeshStandardMaterial({
    color: "#eb701f",
    roughness: 0.72,
    metalness: 0.02,
  });
  const closureDark = new MeshStandardMaterial({
    color: "#373b3e",
    roughness: 0.84,
    metalness: 0.12,
  });
  const closureLamp = new MeshStandardMaterial({
    color: "#ffad32",
    emissive: "#ff8518",
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  function addRoadClosure(x, z, width, depth, yaw = 0) {
    const barrier = new Group();
    barrier.position.set(x, terrainHeight(x, z), z);
    barrier.rotation.y = yaw;
    const moduleLength = 4.2;
    const moduleCount = Math.ceil(width / moduleLength);
    const actualWidth = moduleCount * moduleLength;
    const firstX = -actualWidth / 2 + moduleLength / 2;
    for (let index = 0; index < moduleCount; index++) {
      const localX = firstX + index * moduleLength;
      const base = new Mesh(new BoxGeometry(moduleLength - 0.08, 0.32, depth), closureDark);
      base.position.set(localX, 0.16, 0);
      barrier.add(base);
      const lowerBody = new Mesh(new BoxGeometry(moduleLength - 0.14, 0.34, depth - 0.06), closureOrange);
      lowerBody.position.set(localX, 0.49, 0);
      barrier.add(lowerBody);
      const upperBody = new Mesh(new BoxGeometry(moduleLength - 0.38, 0.42, depth - 0.32), closureOrange);
      upperBody.position.set(localX, 0.87, 0);
      barrier.add(upperBody);
      for (const faceSide of [-1, 1]) {
        const face = new Mesh(new BoxGeometry(moduleLength - 0.62, 0.3, 0.025), closureFaceMaterial);
        face.position.set(localX, 0.88, faceSide * (depth / 2 - 0.15));
        barrier.add(face);
      }
      const join = new Mesh(new BoxGeometry(0.12, 0.16, depth - 0.12), closureDark);
      join.position.set(localX + moduleLength / 2 - 0.02, 0.32, 0);
      barrier.add(join);
      if (index === 0 || index === moduleCount - 1) {
        const lamp = new Mesh(new CylinderGeometry(0.13, 0.13, 0.12, 12), closureLamp);
        lamp.position.set(localX, 1.14, 0);
        barrier.add(lamp);
      }
    }
    scene.add(barrier);
    const cosine = Math.abs(Math.cos(yaw));
    const sine = Math.abs(Math.sin(yaw));
    addSolid(
      x,
      z,
      (cosine * actualWidth) / 2 + (sine * depth) / 2,
      (sine * actualWidth) / 2 + (cosine * depth) / 2,
    );
  }
  addRoadClosure(175, -695, 28, 1.4, Math.PI / 2);
}
