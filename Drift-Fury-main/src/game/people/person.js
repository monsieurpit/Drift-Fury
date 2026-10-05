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
function createPerson(col) {
  const cop = col === "#1f2f4d";
  const g = new Group();
  const L = {};
  const mt = (c, r = 0.8, m = 0) => {
    return new MeshStandardMaterial({
      color: c,
      roughness: r,
      metalness: m,
    });
  };
  const skin = mt(cop ? "#c99a78" : "#d9b48f", 0.62);
  const shirt = mt(col, 0.88);
  const vest = mt("#131b2a", 0.9);
  const pants = mt(cop ? "#0f1724" : "#262d3a", 0.92);
  const shoe = mt(cop ? "#0a0a0b" : "#ececec", cop ? 0.35 : 0.7);
  const dark = mt("#0c0d10", 0.5, 0.2);
  const add = (geo, m, x, y, z, p = g, sh = true) => {
    const q = new Mesh(geo, m);
    q.position.set(x, y, z);
    q.castShadow = sh;
    p.add(q);
    return q;
  };
  const body = new Group();
  g.add(body);
  L.body = body;
  add(new BoxGeometry(0.36, 0.2, 0.22), pants, 0, 0.95, 0, body);
  add(
    new CylinderGeometry(0.2, 0.17, 0.56, 14),
    cop ? vest : shirt,
    0,
    1.28,
    0,
    body,
  ).scale.z = 0.66;
  for (const s of [-1, 1]) {
    add(new SphereGeometry(0.085, 10, 8), shirt, s * 0.235, 1.49, 0, body);
  }
  add(new CylinderGeometry(0.05, 0.055, 0.1, 8), skin, 0, 1.58, 0, body);
  const head = new Group();
  head.position.set(0, 1.69, 0);
  body.add(head);
  L.head = head;
  add(new SphereGeometry(0.115, 18, 14), skin, 0, 0, 0, head).scale.set(
    0.92,
    1.08,
    1,
  );
  add(new BoxGeometry(0.024, 0.04, 0.03), skin, 0, -0.008, -0.116, head, false);
  for (const s of [-1, 1]) {
    add(
      new SphereGeometry(0.013, 6, 5),
      dark,
      s * 0.04,
      0.022,
      -0.106,
      head,
      false,
    );
    add(
      new BoxGeometry(0.045, 0.008, 0.01),
      dark,
      s * 0.04,
      0.05,
      -0.108,
      head,
      false,
    );
  }
  if (cop) {
    add(new BoxGeometry(0.2, 0.036, 0.03), dark, 0, 0.024, -0.108, head, false);
    add(
      new CylinderGeometry(0.118, 0.124, 0.075, 18),
      mt("#0d1524", 0.7),
      0,
      0.108,
      -0.005,
      head,
    );
    add(
      new CylinderGeometry(0.1, 0.12, 0.02, 18),
      mt("#0d1524", 0.7),
      0,
      0.152,
      -0.005,
      head,
    );
    add(new BoxGeometry(0.2, 0.012, 0.1), dark, 0, 0.09, -0.13, head);
    add(
      new BoxGeometry(0.03, 0.035, 0.01),
      mt("#e0b84a", 0.3, 0.9),
      0,
      0.115,
      -0.128,
      head,
      false,
    );
    add(new BoxGeometry(0.34, 0.06, 0.24), dark, 0, 1.02, 0, body);
    add(new BoxGeometry(0.065, 0.2, 0.11), dark, 0.21, 0.93, 0, body);
    add(
      new BoxGeometry(0.07, 0.045, 0.1),
      mt("#222", 0.4, 0.6),
      -0.13,
      1.03,
      -0.1,
      body,
    );
    add(new BoxGeometry(0.05, 0.09, 0.04), dark, -0.14, 1.44, -0.13, body);
    add(
      new BoxGeometry(0.012, 0.1, 0.012),
      dark,
      -0.15,
      1.53,
      -0.13,
      body,
      false,
    );
    add(
      new BoxGeometry(0.03, 0.04, 0.01),
      mt("#e0b84a", 0.3, 0.9),
      0.1,
      1.38,
      -0.137,
      body,
      false,
    );
    const tx = canvasTexture(128, 48, (x, w, h) => {
      x.fillStyle = "#0a0f1a";
      x.fillRect(0, 0, w, h);
      x.fillStyle = "#f2d24a";
      x.font = "bold 30px sans-serif";
      x.textAlign = "center";
      x.fillText("POLICE", 64, 35);
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
    add(new SphereGeometry(0.13, 12, 10), shirt, 0, 1.57, 0.07, body).scale.set(
      1,
      0.8,
      0.8,
    );
    add(
      new SphereGeometry(0.121, 14, 10),
      mt("#1c1410", 0.9),
      0,
      0.028,
      0.02,
      head,
    ).scale.set(0.97, 0.9, 1);
    add(
      new BoxGeometry(0.2, 0.012, 0.1),
      mt("#15171c", 0.6),
      0,
      0.07,
      -0.13,
      head,
    );
  }
  const arm = (s) => {
    const sh = new Group();
    sh.position.set(s * 0.25, 1.48, 0);
    body.add(sh);
    add(new CylinderGeometry(0.055, 0.046, 0.3, 10), shirt, 0, -0.15, 0, sh);
    const el = new Group();
    el.position.y = -0.3;
    sh.add(el);
    add(new CylinderGeometry(0.046, 0.037, 0.28, 10), shirt, 0, -0.14, 0, el);
    add(new SphereGeometry(0.043, 8, 6), skin, 0, -0.3, 0, el);
    return [sh, el];
  };
  [L.la, L.le] = arm(-1);
  [L.ra, L.re] = arm(1);
  const leg = (s) => {
    const hp = new Group();
    hp.position.set(s * 0.1, 0.93, 0);
    g.add(hp);
    add(new CylinderGeometry(0.085, 0.064, 0.46, 10), pants, 0, -0.23, 0, hp);
    const kn = new Group();
    kn.position.y = -0.46;
    hp.add(kn);
    add(new CylinderGeometry(0.062, 0.05, 0.44, 10), pants, 0, -0.22, 0, kn);
    add(new BoxGeometry(0.1, 0.07, 0.27), shoe, 0, -0.45, -0.05, kn);
    return [hp, kn];
  };
  [L.lh, L.lk] = leg(-1);
  [L.rh, L.rk] = leg(1);
  g.userData.L = L;
  return g;
}
export function animatePerson(g, dt, x, z) {
  const u = g.userData;
  const L = u.L;
  if (!L || dt <= 0) {
    return;
  }
  if (u.lx === undefined) {
    u.lx = x;
    u.lz = z;
    u.ph = 0;
    u.sp = 0;
  }
  const v = Math.min(Math.hypot(x - u.lx, z - u.lz) / dt, 10);
  u.lx = x;
  u.lz = z;
  u.sp += (v - u.sp) * (1 - Math.exp(-10 * dt));
  const run = Math.min(u.sp / 4.6, 1.9);
  const a = Math.min(run, 1.6) * 0.62;
  u.ph += dt * u.sp * 1.9;
  const s = Math.sin(u.ph);
  const c = Math.sin(u.ph + 1.9);
  L.lh.rotation.x = s * a;
  L.rh.rotation.x = -s * a;
  L.lk.rotation.x = -Math.max(0, c) * a * 1.5;
  L.rk.rotation.x = -Math.max(0, -c) * a * 1.5;
  L.la.rotation.x = -s * a * 0.9;
  L.ra.rotation.x = s * a * 0.9;
  const bend = 0.12 + Math.min(run, 1) * 0.5;
  L.le.rotation.x = bend;
  L.re.rotation.x = bend;
  L.body.position.y = Math.abs(s) * 0.035 * Math.min(run, 1.4);
  L.body.rotation.x = -Math.min(run, 1.6) * 0.08;
  L.head.rotation.x = Math.min(run, 1.6) * 0.06;
}
export function createPersonModel(e) {
  return createPerson(e);
}
