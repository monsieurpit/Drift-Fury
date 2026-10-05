import {
  Group,
  MeshStandardMaterial,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  SphereGeometry,
  PlaneGeometry,
} from "three";
import { canvasTexture } from "../render/meshUtils.js";
/* ---------- people: articulated humanoids (face -Z at rotation 0, like the cars) ---------- */
export function createPerson(clothingColor) {
  const isOfficer = clothingColor === "#1f2f4d";
  const person = new Group();
  const limbs = {};
  const material = (c, r = 0.8, m = 0) =>
    new MeshStandardMaterial({
      color: c,
      roughness: r,
      metalness: m,
    });
  const skin = material(isOfficer ? "#c99a78" : "#d9b48f", 0.62);
  const shirt = material(clothingColor, 0.88);
  const vest = material("#131b2a", 0.9);
  const pants = material(isOfficer ? "#0f1724" : "#262d3a", 0.92);
  const shoe = material(isOfficer ? "#0a0a0b" : "#ececec", isOfficer ? 0.35 : 0.7);
  const dark = material("#0c0d10", 0.5, 0.2);
  const add = (geometry, meshMaterial, x, y, z, parent = person, castShadow = true) => {
    const mesh = new Mesh(geometry, meshMaterial);
    mesh.position.set(x, y, z);
    mesh.castShadow = castShadow;
    parent.add(mesh);
    return mesh;
  };
  const body = new Group();
  person.add(body);
  limbs.body = body;
  add(new BoxGeometry(0.36, 0.2, 0.22), pants, 0, 0.95, 0, body);
  add(new CylinderGeometry(0.2, 0.17, 0.56, 14), isOfficer ? vest : shirt, 0, 1.28, 0, body).scale.z = 0.66;
  for (const s of [-1, 1]) {
    add(new SphereGeometry(0.085, 10, 8), shirt, s * 0.235, 1.49, 0, body);
  }
  add(new CylinderGeometry(0.05, 0.055, 0.1, 8), skin, 0, 1.58, 0, body);
  const head = new Group();
  head.position.set(0, 1.69, 0);
  body.add(head);
  limbs.head = head;
  add(new SphereGeometry(0.115, 18, 14), skin, 0, 0, 0, head).scale.set(0.92, 1.08, 1);
  add(new BoxGeometry(0.024, 0.04, 0.03), skin, 0, -0.008, -0.116, head, false);
  for (const s of [-1, 1]) {
    add(new SphereGeometry(0.013, 6, 5), dark, s * 0.04, 0.022, -0.106, head, false);
    add(new BoxGeometry(0.045, 0.008, 0.01), dark, s * 0.04, 0.05, -0.108, head, false);
  }
  if (isOfficer) {
    add(new BoxGeometry(0.2, 0.036, 0.03), dark, 0, 0.024, -0.108, head, false);
    add(new CylinderGeometry(0.118, 0.124, 0.075, 18), material("#0d1524", 0.7), 0, 0.108, -0.005, head);
    add(new CylinderGeometry(0.1, 0.12, 0.02, 18), material("#0d1524", 0.7), 0, 0.152, -0.005, head);
    add(new BoxGeometry(0.2, 0.012, 0.1), dark, 0, 0.09, -0.13, head);
    add(new BoxGeometry(0.03, 0.035, 0.01), material("#e0b84a", 0.3, 0.9), 0, 0.115, -0.128, head, false);
    add(new BoxGeometry(0.34, 0.06, 0.24), dark, 0, 1.02, 0, body);
    add(new BoxGeometry(0.065, 0.2, 0.11), dark, 0.21, 0.93, 0, body);
    add(new BoxGeometry(0.07, 0.045, 0.1), material("#222", 0.4, 0.6), -0.13, 1.03, -0.1, body);
    add(new BoxGeometry(0.05, 0.09, 0.04), dark, -0.14, 1.44, -0.13, body);
    add(new BoxGeometry(0.012, 0.1, 0.012), dark, -0.15, 1.53, -0.13, body, false);
    add(new BoxGeometry(0.03, 0.04, 0.01), material("#e0b84a", 0.3, 0.9), 0.1, 1.38, -0.137, body, false);
    const tx = canvasTexture(128, 48, (context, width, height) => {
      context.fillStyle = "#0a0f1a";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#f2d24a";
      context.font = "bold 30px sans-serif";
      context.textAlign = "center";
      context.fillText("POLICE", 64, 35);
    });
    for (const f of [1, -1]) {
      const p = new Mesh(
        new PlaneGeometry(0.3, 0.11),
        new MeshStandardMaterial({
          map: tx,
          roughness: 0.6,
        }),
      );
      p.position.set(0, 1.33, f * 0.146);
      p.rotation.y = f > 0 ? 0 : Math.PI;
      body.add(p);
    }
  } else {
    add(new SphereGeometry(0.13, 12, 10), shirt, 0, 1.57, 0.07, body).scale.set(1, 0.8, 0.8);
    add(new SphereGeometry(0.121, 14, 10), material("#1c1410", 0.9), 0, 0.028, 0.02, head).scale.set(
      0.97,
      0.9,
      1,
    );
    add(new BoxGeometry(0.2, 0.012, 0.1), material("#15171c", 0.6), 0, 0.07, -0.13, head);
  }
  const arm = (side) => {
    const sh = new Group();
    sh.position.set(side * 0.25, 1.48, 0);
    body.add(sh);
    add(new CylinderGeometry(0.055, 0.046, 0.3, 10), shirt, 0, -0.15, 0, sh);
    const el = new Group();
    el.position.y = -0.3;
    sh.add(el);
    add(new CylinderGeometry(0.046, 0.037, 0.28, 10), shirt, 0, -0.14, 0, el);
    add(new SphereGeometry(0.043, 8, 6), skin, 0, -0.3, 0, el);
    return [sh, el];
  };
  [limbs.la, limbs.le] = arm(-1);
  [limbs.ra, limbs.re] = arm(1);
  const leg = (side) => {
    const hp = new Group();
    hp.position.set(side * 0.1, 0.93, 0);
    person.add(hp);
    add(new CylinderGeometry(0.085, 0.064, 0.46, 10), pants, 0, -0.23, 0, hp);
    const kn = new Group();
    kn.position.y = -0.46;
    hp.add(kn);
    add(new CylinderGeometry(0.062, 0.05, 0.44, 10), pants, 0, -0.22, 0, kn);
    add(new BoxGeometry(0.1, 0.07, 0.27), shoe, 0, -0.45, -0.05, kn);
    return [hp, kn];
  };
  [limbs.lh, limbs.lk] = leg(-1);
  [limbs.rh, limbs.rk] = leg(1);
  person.userData.L = limbs;
  return person;
}
export function animatePerson(person, dt, x, z) {
  const data = person.userData;
  const limbs = data.L;
  if (!limbs || dt <= 0) {
    return;
  }
  if (data.lx === undefined) {
    data.lx = x;
    data.lz = z;
    data.ph = 0;
    data.sp = 0;
  }
  const measuredSpeed = Math.min(Math.hypot(x - data.lx, z - data.lz) / dt, 10);
  data.lx = x;
  data.lz = z;
  data.sp += (measuredSpeed - data.sp) * (1 - Math.exp(-10 * dt));
  const run = Math.min(data.sp / 4.6, 1.9);
  const swing = Math.min(run, 1.6) * 0.62;
  data.ph += dt * data.sp * 1.9;
  const stride = Math.sin(data.ph);
  const kneePhase = Math.sin(data.ph + 1.9);
  limbs.lh.rotation.x = stride * swing;
  limbs.rh.rotation.x = -stride * swing;
  limbs.lk.rotation.x = -Math.max(0, kneePhase) * swing * 1.5;
  limbs.rk.rotation.x = -Math.max(0, -kneePhase) * swing * 1.5;
  limbs.la.rotation.x = -stride * swing * 0.9;
  limbs.ra.rotation.x = stride * swing * 0.9;
  const bend = 0.12 + Math.min(run, 1) * 0.5;
  limbs.le.rotation.x = bend;
  limbs.re.rotation.x = bend;
  limbs.body.position.y = Math.abs(stride) * 0.035 * Math.min(run, 1.4);
  limbs.body.rotation.x = -Math.min(run, 1.6) * 0.08;
  limbs.head.rotation.x = Math.min(run, 1.6) * 0.06;
}
