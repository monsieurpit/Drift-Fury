import {
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  CylinderGeometry,
  TorusGeometry,
  MeshBasicMaterial,
  PointLight,
  BoxGeometry,
} from "three";
import { createRenderer } from "../render/renderer.js";
import { buildCar } from "../vehicles/carModel.js";
export function startCarPreview(container, car) {
  if (navigator.webdriver || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) {
    return () => {};
  }
  const view = createRenderer(container);
  const { scene, renderer, camera, composer } = view;
  camera.position.set(7, 3.2, 8.2);
  camera.lookAt(0, 0.5, 0);
  const carModel = buildCar(car.color, car.shape);
  carModel.rotation.y = -0.25;
  scene.add(carModel);
  const floor = new Mesh(
    new PlaneGeometry(100, 100),
    new MeshStandardMaterial({
      color: "#171b1e",
      roughness: 0.35,
      metalness: 0.45,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  scene.add(floor);
  const turntable = new Mesh(
    new CylinderGeometry(4.7, 4.8, 0.16, 80),
    new MeshStandardMaterial({
      color: "#23292c",
      metalness: 0.6,
      roughness: 0.4,
    }),
  );
  turntable.position.y = -0.03;
  scene.add(turntable);
  const ring = new Mesh(
    new TorusGeometry(4.73, 0.012, 8, 100),
    new MeshBasicMaterial({
      color: "#c6dc77",
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  scene.add(ring);
  for (let side of [-5, 5]) {
    const light = new PointLight(side < 0 ? "#bbd9ff" : "#c6dc77", 80, 25);
    light.position.set(side, 4, -2);
    scene.add(light);
    const lightBar = new Mesh(
      new BoxGeometry(0.035, 4, 0.035),
      new MeshBasicMaterial({
        color: side < 0 ? "#adc7d4" : "#c6dc77",
      }),
    );
    lightBar.position.set(side, 2, -5);
    scene.add(lightBar);
  }
  let frameId;
  const startTime = performance.now();
  function loop() {
    frameId = requestAnimationFrame(loop);
    carModel.rotation.y = -0.25 + Math.sin((performance.now() - startTime) * 0.00012) * 0.18;
    composer.render();
  }
  loop();
  return () => {
    cancelAnimationFrame(frameId);
    view.dispose();
  };
}
