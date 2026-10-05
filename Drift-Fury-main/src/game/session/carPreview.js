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
export function startCarPreview(e, t) {
  if (navigator.webdriver || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)) {
    return () => {};
  }
  const n = createRenderer(e);
  const { scene: r, renderer: i, camera: a, composer: o } = n;
  a.position.set(7, 3.2, 8.2);
  a.lookAt(0, 0.5, 0);
  const s = buildCar(t.color, t.shape);
  s.rotation.y = -0.25;
  r.add(s);
  const c = new Mesh(
    new PlaneGeometry(100, 100),
    new MeshStandardMaterial({
      color: "#171b1e",
      roughness: 0.35,
      metalness: 0.45,
    }),
  );
  c.rotation.x = -Math.PI / 2;
  c.position.y = -0.04;
  r.add(c);
  const l = new Mesh(
    new CylinderGeometry(4.7, 4.8, 0.16, 80),
    new MeshStandardMaterial({
      color: "#23292c",
      metalness: 0.6,
      roughness: 0.4,
    }),
  );
  l.position.y = -0.03;
  r.add(l);
  const u = new Mesh(
    new TorusGeometry(4.73, 0.012, 8, 100),
    new MeshBasicMaterial({
      color: "#c6dc77",
    }),
  );
  u.rotation.x = Math.PI / 2;
  u.position.y = 0.06;
  r.add(u);
  for (let e of [-5, 5]) {
    const t = new PointLight(e < 0 ? "#bbd9ff" : "#c6dc77", 80, 25);
    t.position.set(e, 4, -2);
    r.add(t);
    const n = new Mesh(
      new BoxGeometry(0.035, 4, 0.035),
      new MeshBasicMaterial({
        color: e < 0 ? "#adc7d4" : "#c6dc77",
      }),
    );
    n.position.set(e, 2, -5);
    r.add(n);
  }
  let d;
  const f = performance.now();
  function p() {
    d = requestAnimationFrame(p);
    s.rotation.y = -0.25 + Math.sin((performance.now() - f) * 0.00012) * 0.18;
    o.render();
  }
  p();
  return () => {
    cancelAnimationFrame(d);
    n.dispose();
  };
}
