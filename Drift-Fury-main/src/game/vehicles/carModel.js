import {
  Group,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Mesh,
  PlaneGeometry,
  MeshBasicMaterial,
  BoxGeometry,
  CylinderGeometry,
  TorusGeometry,
  SphereGeometry,
  SpotLight,
  Object3D,
  CanvasTexture,
  Shape,
} from "three";
import { createExtrudedMesh, mergeChildrenByMaterial } from "../render/meshUtils.js";
import { buildCapGeometry, buildGridGeometries, computeGridNormals, createGeometry } from "./carGeometry.js";
import { getCarShadowTexture } from "./carShadow.js";
import { buildCarSpec } from "./carSpecs.js";
import {
  bodyRing,
  cabinRing,
  pointAt,
  ribbonAcross,
  ribbonAlong,
  rightHalf,
  surfacePoint,
} from "./carSurface.js";
import { buildWheel } from "./wheel.js";
/*
 * Drift Fury car builder: smooth lofted bodywork, tinted glass greenhouse, pillars, wheel arches,
 * lathe-turned tyres and alloy wheels, shaped lights and per-model details.
 *
 * buildCar(color, shape, police, isPlayer, highDetail) returns a Group facing -Z. Player cars
 * (isPlayer) get an interior, an opening driver door and headlight spotlights.
 */
export function buildCar(
  color = "#a9b7bf",
  shape = "coupe",
  police = false,
  isPlayer = false,
  highDetail = false,
) {
  const car = new Group();
  const spec = buildCarSpec(shape);
  const carLength = spec.L;
  const halfLength = carLength / 2;
  const detail = !!(isPlayer || highDetail);
  const segW = detail ? 44 : 26;
  const kind = spec.name;
  const bodyColor = police ? "#eef0f2" : color;
  const hwMax = Math.max(spec.hw(spec.axF), spec.hw(spec.axR), spec.hw(carLength / 2));
  const doorA = spec.axF + spec.arch + 0.1;
  const doorC = spec.axR - spec.arch - 0.08;

  /* ---- materials ---- */
  const paint = new MeshPhysicalMaterial({
    color: bodyColor,
    metalness: 0.55,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2,
    sheen: 0.25,
    sheenRoughness: 0.3,
    sheenColor: "#fff6e8",
  });
  const glass = new MeshPhysicalMaterial({
    color: "#04080c",
    metalness: 0.05,
    roughness: 0.03,
    transparent: true,
    opacity: 0.84,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.4,
    ior: 1.45,
  });
  const trim = new MeshStandardMaterial({
    color: "#0a0c0e",
    metalness: 0.3,
    roughness: 0.5,
  });
  const matte = new MeshStandardMaterial({
    color: "#060708",
    roughness: 0.85,
    metalness: 0.1,
  });
  const linerMat = new MeshStandardMaterial({
    color: "#050607",
    roughness: 0.9,
    metalness: 0,
    side: 2,
  });
  const chrome = new MeshStandardMaterial({
    color: "#d6dade",
    metalness: 1,
    roughness: 0.08,
    envMapIntensity: 1.6,
  });
  const wheelMaterials = {
    rubber: new MeshStandardMaterial({
      color: "#0b0b0c",
      roughness: 0.88,
      metalness: 0.02,
    }),
    rim: new MeshStandardMaterial({
      color: "#c9ced2",
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 1.6,
      side: 2,
    }),
    dark: new MeshStandardMaterial({
      color: "#0d0f11",
      metalness: 0.6,
      roughness: 0.5,
      side: 2,
    }),
    chrome,
    rotor: new MeshStandardMaterial({
      color: "#7a7f84",
      metalness: 0.9,
      roughness: 0.35,
      side: 2,
    }),
    caliper: new MeshStandardMaterial({
      color: kind === "muscle" || kind === "coupe" ? "#c4271a" : "#d8b400",
      metalness: 0.4,
      roughness: 0.4,
    }),
  };
  const lampMat = new MeshStandardMaterial({
    color: "#fffdf4",
    emissive: "#fff6cf",
    emissiveIntensity: 1.7,
    roughness: 0.12,
  });
  const lensMat = new MeshPhysicalMaterial({
    color: "#cfe0ff",
    transparent: true,
    opacity: 0.4,
    roughness: 0.05,
    clearcoat: 1,
    envMapIntensity: 1.4,
  });
  const amber = new MeshStandardMaterial({
    color: "#2a1600",
    emissive: "#ff9a1a",
    emissiveIntensity: 1.3,
    roughness: 0.4,
  });
  const addMesh = (geo, mat, cast = true, recv = true) => {
    const m = new Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = recv;
    car.add(m);
    return m;
  };

  /* soft contact shadow */
  const contactShadow = new Mesh(
    new PlaneGeometry(hwMax * 2 + 0.75, carLength + 1),
    new MeshBasicMaterial({
      map: getCarShadowTexture(spec),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = -0.01;
  contactShadow.renderOrder = 1;
  car.add(contactShadow);

  /* ---- lower body loft ---- */
  const bz = [0, 0.012, 0.03, 0.055, 0.09, 0.13, 0.18, 0.24, 0.31];
  const rowsB = new Set(bz);
  bz.forEach((z) => rowsB.add(Math.round((carLength - z) * 10000) / 10000));
  for (let z = 0.4; z < carLength - 0.3; z += 0.09) {
    rowsB.add(Math.round(z * 10000) / 10000);
  }
  for (const za of [spec.axF, spec.axR]) {
    const ar = spec.arch;
    for (let d = -ar - 0.05; d <= ar + 0.05; d += 0.03) {
      rowsB.add(Math.round((za + d) * 10000) / 10000);
    }
    rowsB.add(Math.round((za - ar - 0.004) * 10000) / 10000);
    rowsB.add(Math.round((za - ar) * 10000) / 10000);
    rowsB.add(Math.round((za + ar) * 10000) / 10000);
    rowsB.add(Math.round((za + ar + 0.004) * 10000) / 10000);
  }
  const rb = [...rowsB].filter((z) => z >= 0 && z <= carLength).sort((p, q) => p - q);
  const ring0 = bodyRing(spec, rb[0]);
  const nr = ring0.length;
  const nzB = rb.length;
  const PB = new Float32Array(nzB * nr * 3);
  const ringsB = rb.map((z) => bodyRing(spec, z));
  ringsB.forEach((ring, ii) =>
    ring.forEach((p, j) => {
      const a = (ii * nr + j) * 3;
      PB[a] = p[0];
      PB[a + 1] = p[1];
      PB[a + 2] = rb[ii] - halfLength;
    }),
  );
  const NB = computeGridNormals(PB, nzB, nr);
  const fold14 = (s) => (s <= 7 ? s : 14 - s);
  const sfB = ring0.map((p) => fold14(p[2]));
  const inArch = (z) =>
    Math.abs(z - spec.axF) < spec.arch + 0.03 || Math.abs(z - spec.axR) < spec.arch + 0.03;
  const bodyGeos = buildGridGeometries(PB, NB, nzB, nr, (ii, j) => {
    const zf = (rb[ii] + rb[ii + 1]) / 2;
    const j1 = (j + 1) % nr;
    const sf = (sfB[j] + sfB[j1]) / 2;
    if (detail && zf > doorA && zf < doorC && sf >= 2.35 && sf <= 4.9 && ring0[j][0] + ring0[j1][0] < -0.05) {
      return null;
    }
    if (sf < 1.5) {
      return "trim";
    }
    if (sf < (inArch(zf) ? 2 : 2.28)) {
      return "trim";
    }
    return "paint";
  });
  if (bodyGeos.paint) {
    addMesh(bodyGeos.paint, paint);
  }
  if (bodyGeos.trim) {
    addMesh(bodyGeos.trim, trim);
  }
  addMesh(
    buildCapGeometry(
      ringsB[0].map((p) => [p[0], p[1]]),
      rb[0] - halfLength,
      -1,
    ),
    trim,
  );
  addMesh(
    buildCapGeometry(
      ringsB[nzB - 1].map((p) => [p[0], p[1]]),
      rb[nzB - 1] - halfLength,
      1,
    ),
    paint,
  );

  /* ---- greenhouse loft ---- */
  const cb = spec.cab;
  const cz = new Set([cb.ws, cb.rf, cb.rr, cb.rg]);
  if (cb.bp) {
    cz.add(cb.bp - 0.05);
    cz.add(cb.bp - 0.02);
    cz.add(cb.bp + 0.02);
    cz.add(cb.bp + 0.05);
  }
  [0.015, 0.04, 0.08, 0.13].forEach((d) => {
    cz.add(cb.ws + d);
    cz.add(cb.rg - d);
  });
  for (let z = cb.ws; z < cb.rg; z += 0.07) {
    cz.add(Math.round(z * 10000) / 10000);
  }
  const rc = [...cz].filter((z) => z >= cb.ws - 0.000001 && z <= cb.rg + 0.000001).sort((p, q) => p - q);
  const ringC0 = cabinRing(spec, rc[0]);
  const ncr = ringC0.length;
  const nzC = rc.length;
  const PC = new Float32Array(nzC * ncr * 3);
  rc.forEach((z, ii) =>
    cabinRing(spec, z).forEach((p, j) => {
      const a = (ii * ncr + j) * 3;
      PC[a] = p[0];
      PC[a + 1] = p[1];
      PC[a + 2] = z - halfLength;
    }),
  );
  const NC = computeGridNormals(PC, nzC, ncr);
  const fold12 = (s) => (s <= 6 ? s : 12 - s);
  const sfC = ringC0.map((p) => fold12(p[2]));
  const cabGeos = buildGridGeometries(PC, NC, nzC, ncr, (ii, j) => {
    const zf = (rc[ii] + rc[ii + 1]) / 2;
    const j1 = (j + 1) % ncr;
    const sf = (sfC[j] + sfC[j1]) / 2;
    if (detail && zf > doorA && zf < doorC && sf >= 2 && sf <= 4.5 && ringC0[j][0] + ringC0[j1][0] < -0.05) {
      return null;
    }
    if (sf < 1.3) {
      return null;
    }
    // belt molding
    if (sf < 2) {
      return "trim";
    }
    // B pillar
    if (cb.bp && Math.abs(zf - cb.bp) < 0.05 && sf < 4.45) {
      return "trim";
    }
    // sail panel / C pillar
    if (zf >= cb.cp && sf < 4.55) {
      return "paint";
    }
    // A pillar
    if (zf <= cb.rf + 0.02 && sf >= 3.45 && sf < 4.45) {
      return "paint";
    }
    // roof panel
    if (zf > cb.rf - 0.01 && zf < cb.rr && sf >= 4.45) {
      return "paint";
    }
    // rear glass vs rear quarter bands
    if (zf >= cb.rr && sf >= 4.45 && sf < cb.rgs) {
      return "paint";
    }
    return "glass";
  });
  if (cabGeos.glass) {
    addMesh(cabGeos.glass, glass, false, false);
  }
  if (cabGeos.paint) {
    addMesh(cabGeos.paint, paint);
  }
  if (cabGeos.trim) {
    addMesh(cabGeos.trim, trim);
  }
  if (detail) {
    const cabin = new Group();
    car.add(cabin);
    const upholstery = new MeshStandardMaterial({
      color: "#171a1e",
      roughness: 0.82,
      metalness: 0.02,
    });
    const softLeather = new MeshStandardMaterial({
      color: "#25292d",
      roughness: 0.76,
      metalness: 0.025,
    });
    const carpet = new MeshStandardMaterial({
      color: "#090b0d",
      roughness: 0.98,
      metalness: 0,
    });
    const cabinMetal = new MeshStandardMaterial({
      color: "#555d64",
      roughness: 0.35,
      metalness: 0.78,
    });
    const cabinChrome = new MeshStandardMaterial({
      color: "#aeb5b9",
      roughness: 0.22,
      metalness: 0.92,
    });
    const display = new MeshStandardMaterial({
      color: "#08151b",
      emissive: "#26758a",
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.18,
    });
    const cabinBox = (material, size, pos, rot = null, parent = cabin) => {
      const mesh = new Mesh(new BoxGeometry(...size), material);
      mesh.position.set(...pos);
      if (rot) {
        mesh.rotation.set(...rot);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const cabinCylinder = (material, radius, length, pos, rot = null, parent = cabin) => {
      const mesh = new Mesh(new CylinderGeometry(radius, radius, length, 20), material);
      mesh.position.set(...pos);
      if (rot) {
        mesh.rotation.set(...rot);
      }
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };
    cabinBox(carpet, [1.46, 0.035, 2.2], [0, 0.205, 0.2]);
    cabinBox(upholstery, [1.48, 0.16, 0.25], [0, 0.72, cb.ws - halfLength + 0.08]);
    cabinBox(softLeather, [1.45, 0.075, 0.14], [0, 0.81, cb.ws - halfLength + 0.13]);
    cabinBox(upholstery, [0.13, 0.19, 1.05], [-0.725, 0.55, 0.25]);
    cabinBox(upholstery, [0.13, 0.19, 1.05], [0.725, 0.55, 0.25]);
    for (const side of [-1, 1]) {
      const seat = new Group();
      seat.position.set(side * 0.4, 0, 0.35);
      cabin.add(seat);
      cabinBox(upholstery, [0.5, 0.13, 0.53], [0, 0.32, 0], null, seat);
      cabinBox(softLeather, [0.4, 0.09, 0.4], [0, 0.39, -0.025], null, seat);
      cabinBox(upholstery, [0.48, 0.47, 0.13], [0, 0.61, 0.205], [-0.08, 0, 0], seat);
      cabinBox(softLeather, [0.34, 0.32, 0.025], [0, 0.62, 0.132], [-0.08, 0, 0], seat);
      for (const sx of [-1, 1]) {
        cabinBox(softLeather, [0.07, 0.42, 0.17], [sx * 0.205, 0.61, 0.19], [-0.08, 0, 0], seat);
        cabinBox(upholstery, [0.075, 0.17, 0.38], [sx * 0.215, 0.39, 0], null, seat);
      }
      cabinBox(upholstery, [0.24, 0.15, 0.12], [0, 0.91, 0.24], null, seat);
      for (const sx of [-1, 1]) {
        cabinCylinder(cabinMetal, 0.012, 0.13, [sx * 0.075, 0.84, 0.24], null, seat);
      }
    }
    const dashZ = cb.ws - halfLength + 0.02;
    cabinBox(upholstery, [1.53, 0.19, 0.25], [0, 0.69, dashZ + 0.2], [-0.12, 0, 0]);
    cabinBox(softLeather, [1.46, 0.035, 0.19], [0, 0.8, dashZ + 0.2], [-0.12, 0, 0]);
    cabinBox(cabinMetal, [0.39, 0.105, 0.018], [0.35, 0.73, dashZ + 0.065], [-0.1, 0, 0]);
    cabinBox(display, [0.34, 0.075, 0.014], [0.35, 0.74, dashZ + 0.052], [-0.1, 0, 0]);
    cabinBox(cabinChrome, [0.49, 0.018, 0.018], [0.35, 0.665, dashZ + 0.05]);
    for (const side of [-1, 1]) {
      const dial = new Mesh(new TorusGeometry(0.064, 0.009, 8, 24), cabinMetal);
      dial.position.set(-0.4 + side * 0.085, 0.735, dashZ + 0.045);
      dial.rotation.y = Math.PI;
      cabin.add(dial);
      const face = new Mesh(new TorusGeometry(0.052, 0.006, 8, 24), display);
      face.position.set(-0.4 + side * 0.085, 0.735, dashZ + 0.035);
      face.rotation.y = Math.PI;
      cabin.add(face);
    }
    const steering = new Group();
    steering.position.set(-0.4, 0.665, dashZ + 0.48);
    steering.rotation.y = Math.PI;
    cabin.add(steering);
    steering.add(new Mesh(new TorusGeometry(0.17, 0.021, 10, 36), upholstery));
    cabinCylinder(cabinChrome, 0.038, 0.045, [0, 0, 0], [Math.PI / 2, 0, 0], steering);
    for (let spoke = 0; spoke < 3; spoke++) {
      const bar = cabinBox(cabinChrome, [0.016, 0.135, 0.014], [0, 0, 0], null, steering);
      bar.rotation.z = (spoke * Math.PI * 2) / 3;
    }
    cabinBox(upholstery, [0.09, 0.09, 0.24], [-0.4, 0.56, dashZ + 0.56], [-0.27, 0, 0]);
    cabinBox(upholstery, [0.3, 0.105, 0.98], [0.05, 0.34, 0.26], [-0.06, 0, 0]);
    cabinBox(softLeather, [0.28, 0.035, 0.68], [0.05, 0.405, 0.22], [-0.06, 0, 0]);
    const gearLever = new Group();
    gearLever.position.set(0.13, 0.4, 0.12);
    cabin.add(gearLever);
    cabinCylinder(cabinChrome, 0.014, 0.16, [0, 0.075, 0], [-0.32, 0, 0], gearLever);
    const gearKnob = new Mesh(new SphereGeometry(0.043, 14, 10), upholstery);
    gearKnob.position.set(0, 0.15, -0.025);
    gearLever.add(gearKnob);
    const handbrake = new Group();
    handbrake.position.set(-0.1, 0.4, 0.25);
    cabin.add(handbrake);
    cabinCylinder(cabinMetal, 0.013, 0.2, [0, 0.1, 0], [-0.3, 0, 0], handbrake);
    cabinBox(upholstery, [0.065, 0.04, 0.095], [0, 0.2, -0.045], null, handbrake);
    for (const [px, width] of [
      [-0.59, 0.085],
      [-0.43, 0.105],
      [-0.27, 0.09],
    ]) {
      const pedal = new Group();
      pedal.position.set(px, 0.245, dashZ + 0.53);
      cabin.add(pedal);
      cabinBox(cabinMetal, [width, 0.13, 0.025], [0, 0, -0.025], [-0.2, 0, 0], pedal);
      for (let line = -1; line <= 1; line++) {
        cabinBox(upholstery, [width * 0.68, 0.009, 0.008], [0, line * 0.033, -0.041], null, pedal);
      }
    }
  }
  let accessDoor = null;
  if (detail) {
    const hingeSf = 3.35;
    const hingeP = pointAt(rightHalf(bodyRing(spec, doorA)), hingeSf);
    let hx = hingeP[4];
    let hy = -hingeP[3];
    const hn = Math.hypot(hx, hy) || 1;
    hx /= hn;
    hy /= hn;
    accessDoor = new Group();
    accessDoor.position.set(-(hingeP[0] + hx * 0.008), hingeP[1] + hy * 0.008, doorA - halfLength);
    car.add(accessDoor);
    const buildDoorSurface = (zStart, zEnd, sfStart, sfEnd, cabinSurface, material, offset) => {
      const nz = 18;
      const ns = 12;
      const positions = [];
      const normals = [];
      const indices = [];
      for (let zi = 0; zi <= nz; zi++) {
        const zf = zStart + ((zEnd - zStart) * zi) / nz;
        const ring = cabinSurface ? cabinRing(spec, zf) : bodyRing(spec, zf);
        const half = rightHalf(ring);
        for (let si = 0; si <= ns; si++) {
          const sf = sfStart + ((sfEnd - sfStart) * si) / ns;
          const p = pointAt(half, sf);
          let nx = p[4];
          let ny = -p[3];
          const length = Math.hypot(nx, ny) || 1;
          nx /= length;
          ny /= length;
          positions.push(
            -(p[0] + nx * offset) - accessDoor.position.x,
            p[1] + ny * offset - accessDoor.position.y,
            zf - halfLength - accessDoor.position.z,
          );
          normals.push(-nx, ny, 0);
        }
      }
      for (let zi = 0; zi < nz; zi++) {
        for (let si = 0; si < ns; si++) {
          const a = zi * (ns + 1) + si;
          const b = a + ns + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const geometry = createGeometry(positions, normals, indices);
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      accessDoor.add(mesh);
    };
    buildDoorSurface(doorA + 0.015, doorC - 0.015, 2.38, 4.62, false, paint, 0.014);
    buildDoorSurface(
      doorA + 0.045,
      doorC - 0.045,
      2.35,
      4.42,
      true,
      new MeshPhysicalMaterial({
        color: "#17232b",
        metalness: 0.18,
        roughness: 0.12,
        transparent: true,
        opacity: 0.62,
        side: 2,
        depthWrite: false,
      }),
      0.023,
    );
    const handlePoint = pointAt(rightHalf(bodyRing(spec, doorC - 0.3)), 4.15);
    let handleNx = handlePoint[4];
    let handleNy = -handlePoint[3];
    const handleLength = Math.hypot(handleNx, handleNy) || 1;
    handleNx /= handleLength;
    handleNy /= handleLength;
    const doorHandle = new Mesh(new BoxGeometry(0.17, 0.025, 0.035), chrome);
    doorHandle.position.set(
      -(handlePoint[0] + handleNx * 0.035) - accessDoor.position.x,
      handlePoint[1] + handleNy * 0.035 - accessDoor.position.y,
      doorC - 0.3 - halfLength - accessDoor.position.z,
    );
    accessDoor.add(doorHandle);
  }

  /* ---- wheels and arches ---- */
  const wheels = [];
  for (const [za, tw, sx] of [
    [spec.axF, spec.twF, -1],
    [spec.axF, spec.twF, 1],
    [spec.axR, spec.twR, -1],
    [spec.axR, spec.twR, 1],
  ]) {
    const x = sx * (spec.hw(za) - tw / 2 - 0.035);
    const w = buildWheel(wheelMaterials, {
      R: spec.R,
      tw,
      seg: segW,
      spokes: 5,
      calAng: 0,
    });
    w.position.set(x, spec.R, za - halfLength);
    if (sx < 0) {
      w.rotation.y = Math.PI;
    }
    car.add(w);
    wheels.push(w);
    const outer = spec.hw(za) * 0.925 - 0.01;
    const wid = 0.5;
    const liner = new Mesh(
      new CylinderGeometry(spec.arch - 0.012, spec.arch - 0.012, wid, 30, 1, true, -0.6, Math.PI + 1.2),
      linerMat,
    );
    liner.rotation.z = Math.PI / 2;
    liner.position.set(sx * (outer - wid / 2), spec.R, za - halfLength);
    car.add(liner);
  }

  /* ================= details ================= */
  const brake = [];
  const heads = [];
  const beamList = [];
  const carbon = new MeshStandardMaterial({
    color: "#0b0d10",
    metalness: 0.55,
    roughness: 0.38,
  });
  const lineMat = new MeshStandardMaterial({
    color: "#06080a",
    roughness: 0.6,
    metalness: 0.2,
  });
  const place = (geo, mat, S, off = 0, cast = false) => {
    const m = new Mesh(geo, mat);
    car.add(m);
    m.position.set(S.x + S.nx * off, S.y + S.ny * off, S.z - halfLength + S.nz * off);
    m.lookAt(m.position.x + S.nx, m.position.y + S.ny, m.position.z + S.nz);
    m.castShadow = cast;
    m.receiveShadow = true;
    return m;
  };
  const unitSph = new SphereGeometry(1, 18, 12);
  const front = -halfLength;
  const rear = halfLength;
  const cbz = spec.cab;
  const lamp = Object.assign(
    {
      hz: 0.2,
      hs: 4.55,
      hw: 0.21,
      hh: 0.07,
      tz: carLength - 0.13,
      ts: 4.5,
      tw: 0.26,
      th: 0.065,
    },
    spec.lamp || {},
  );

  /* shut lines and hood cuts */
  for (const sd of [-1, 1]) {
    if (!(detail && sd < 0)) {
      for (const zl of [doorA, doorC]) {
        addMesh(ribbonAcross(spec, zl, 2.35, 4.9, 0.012, 0.0025, sd, halfLength), lineMat, false, false);
      }
    }
    addMesh(ribbonAlong(spec, 5.6, 0.05, 0.45, cbz.ws - 0.03, 0.002, sd, halfLength), lineMat, false, false);
    // door handle
    if (!(detail && sd < 0)) {
      const hS = surfacePoint(spec, doorC - 0.3, 4.15, sd);
      place(new BoxGeometry(0.17, 0.02, 0.03), chrome, hS, -0.004);
    }

    // mirrors
    const zM = cbz.ws + 0.28;
    const wbM = spec.hw(zM) - cbz.inset - 0.02;
    const yM = spec.cabBase(zM) + 0.12;
    const mirror = new Mesh(unitSph, paint);
    car.add(mirror);
    mirror.scale.set(0.055, 0.048, 0.1);
    mirror.position.set(sd * (wbM + 0.13), yM + 0.045, zM - halfLength - 0.02);
    mirror.castShadow = true;
    const stalk = new Mesh(new BoxGeometry(0.12, 0.018, 0.04), trim);
    car.add(stalk);
    stalk.position.set(sd * (wbM + 0.07), yM, zM - halfLength);
  }
  addMesh(ribbonAcross(spec, 0.55, 5, 7, 0.01, 0.002, 1, halfLength), lineMat, false, false);
  addMesh(ribbonAcross(spec, 0.55, 5, 7, 0.01, 0.002, -1, halfLength), lineMat, false, false);

  /* headlights */
  for (const sd of [-1, 1]) {
    const S = surfacePoint(spec, lamp.hz, lamp.hs, sd);
    const lens = place(unitSph, lensMat, S, 0.004);
    lens.scale.set(lamp.hw, lamp.hh, 0.04);
    const core = place(unitSph, lampMat, S, -0.004);
    core.scale.set(lamp.hw * 0.8, lamp.hh * 0.55, 0.03);
    heads.push(core);
    const drl = place(
      new BoxGeometry(lamp.hw * 1.5, 0.012, 0.012),
      new MeshBasicMaterial({
        color: "#e8f4ff",
      }),
      S,
      0.018,
    );
    drl.translateY(-lamp.hh * 0.7);
    // front indicator
    const ind = surfacePoint(spec, lamp.hz + 0.06, lamp.hs - 1.7, sd);
    const lens2 = place(unitSph, amber, ind, 0.002);
    lens2.scale.set(0.07, 0.022, 0.02);
  }
  /* tail lights */
  for (const sd of [-1, 1]) {
    const S = surfacePoint(spec, lamp.tz, lamp.ts, sd);
    const m = new MeshStandardMaterial({
      color: "#a30f0f",
      emissive: "#ff2020",
      emissiveIntensity: 0.15,
      roughness: 0.3,
    });
    const tl = place(unitSph, m, S, -0.004);
    tl.scale.set(lamp.tw, lamp.th, 0.03);
    brake.push(tl);
  }
  {
    const bar = new MeshStandardMaterial({
      color: "#1a0404",
      emissive: "#ff3030",
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const yB = (spec.yBot(carLength) + spec.yTop(carLength)) / 2 + 0.1;
    const strip = new Mesh(new BoxGeometry(hwMax * 1, 0.02, 0.012), bar);
    car.add(strip);
    strip.position.set(0, yB, halfLength + 0.006);
    const rev = new Mesh(
      new BoxGeometry(0.14, 0.03, 0.012),
      new MeshStandardMaterial({
        color: "#dfe6ea",
        emissive: "#ffffff",
        emissiveIntensity: 0.35,
        roughness: 0.3,
      }),
    );
    car.add(rev);
  }

  /* focused player headlight spotlights */
  if (isPlayer) {
    const hz = lamp.hz;
    for (const sd of [-1, 1]) {
      const S = surfacePoint(spec, hz, lamp.hs, sd);
      const sl = new SpotLight("#fff0d8", 10, 56, 0.27, 0.72, 2);
      sl.position.set(S.x, S.y, S.z - halfLength - 0.05);
      const tg = new Object3D();
      tg.position.set(sd * 0.28, -1.35, -halfLength - 32);
      car.add(tg);
      sl.target = tg;
      car.add(sl);
      beamList.push(sl);
    }
  }

  /* police package: roof light bar, dark door panels, push bar */
  if (police) {
    const zc = (cbz.rf + cbz.rr) / 2;
    const yr = spec.roofY(zc) + 0.03;
    const barBase = new Mesh(new BoxGeometry(0.62, 0.07, 0.3), trim);
    barBase.position.set(0, yr + 0.035, zc - halfLength);
    car.add(barBase);
    for (const ex of [-0.17, 0.17]) {
      const lm = new MeshBasicMaterial({
        color: ex < 0 ? "#3a8eff" : "#ff3434",
      });
      const lb = new Mesh(new BoxGeometry(0.3, 0.1, 0.26), lm);
      lb.position.set(ex, yr + 0.115, zc - halfLength);
      lb.name = ex < 0 ? "blue" : "red";
      car.add(lb);
    }
    const glow = new Mesh(
      new BoxGeometry(0.12, 0.05, 0.12),
      new MeshBasicMaterial({
        color: "#fff8a0",
      }),
    );
    glow.position.set(0, yr + 0.1, zc - halfLength);
    car.add(glow);
    for (const sd of [-1, 1]) {
      addMesh(
        ribbonAlong(spec, 3.3, 1, doorA + 0.02, doorC - 0.02, 0.004, sd, halfLength),
        trim,
        false,
        false,
      );
    }
    const pb = new Mesh(new BoxGeometry(hwMax * 1.15, 0.07, 0.05), chrome);
    pb.position.set(0, spec.yBot(0) + 0.1, front - 0.05);
    car.add(pb);
  }

  /* grille bars + plates */
  {
    const y0 = spec.yBot(0) + 0.05;
    const y1 = spec.yTop(0) - 0.05;
    const wG = spec.hw(0) * 1.15;
    for (let k = 0; k < 4; k++) {
      const gb = new Mesh(new BoxGeometry(wG, 0.012, 0.012), chrome);
      car.add(gb);
      gb.position.set(0, y0 + ((y1 - y0) * (k + 0.5)) / 4, front - 0.004);
    }
    const plateTex =
      buildCar._plateTex ||
      (buildCar._plateTex = (() => {
        const cv = document.createElement("canvas");
        cv.width = 256;
        cv.height = 64;
        const q = cv.getContext("2d");
        q.fillStyle = "#f1efe4";
        q.fillRect(0, 0, 256, 64);
        q.fillStyle = "#1b3a8a";
        q.fillRect(0, 0, 22, 64);
        q.fillStyle = "#ffffff";
        q.font = "bold 11px monospace";
        q.textAlign = "center";
        q.fillText("DF", 11, 54);
        q.fillStyle = "#16181c";
        q.font = "bold 40px monospace";
        q.fillText("FURY 77", 140, 47);
        q.strokeStyle = "#16181c";
        q.lineWidth = 3;
        q.strokeRect(1.5, 1.5, 253, 61);
        const tx = new CanvasTexture(cv);
        tx.anisotropy = 8;
        return tx;
      })());
    const plateMat =
      buildCar._plateMat ||
      (buildCar._plateMat = new MeshStandardMaterial({
        map: plateTex,
        roughness: 0.4,
        metalness: 0.1,
      }));
    const fp = new Mesh(new PlaneGeometry(0.5, 0.125), plateMat);
    fp.rotation.y = Math.PI;
    fp.position.set(0, (spec.yBot(0) + spec.yTop(0)) / 2 - 0.03, front - 0.012);
    car.add(fp);
    const rp = new Mesh(new PlaneGeometry(0.5, 0.125), plateMat);
    rp.position.set(0, (spec.yBot(carLength) + spec.yTop(carLength)) / 2 - 0.02, rear + 0.012);
    car.add(rp);
  }

  /* exhaust */
  {
    const xs = kind === "gtr" || kind === "hyper" ? [-0.62, -0.46, 0.46, 0.62] : [-0.5, 0.5];
    for (const x of xs) {
      const tip = new Mesh(new CylinderGeometry(0.05, 0.05, 0.2, 20, 1, true), chrome);
      tip.material.side = 2;
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, spec.yBot(carLength) + 0.07, rear + 0.015);
      car.add(tip);
      const inner = new Mesh(new CylinderGeometry(0.042, 0.042, 0.02, 16), matte);
      inner.rotation.x = Math.PI / 2;
      inner.position.set(x, spec.yBot(carLength) + 0.07, rear - 0.06);
      car.add(inner);
    }
  }

  /* aero: spoilers and wings */
  {
    const mkShape = (pts) => {
      const sh_ = new Shape();
      sh_.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) {
        sh_.lineTo(pts[k][0], pts[k][1]);
      }
      if (sh_.closePath) {
        sh_.closePath();
      } else {
        0;
      }
      return sh_;
    };
    const wingPack = (chord, hgt, span, zc, thick) => {
      const yD = spec.yTop(zc) - 0.02;
      const yW = yD + hgt;
      const zc_ = zc - halfLength;
      const blade = mkShape([
        [zc_ - chord / 2, yW + thick * 0.3],
        [zc_ - chord * 0.3, yW + thick],
        [zc_ + chord / 2, yW + thick * 0.25],
        [zc_ + chord / 2, yW],
        [zc_ - chord * 0.2, yW - thick * 0.3],
        [zc_ - chord / 2, yW + thick * 0.1],
      ]);
      car.add(createExtrudedMesh(blade, span, carbon, 0.006));
      for (const sx of [-1, 1]) {
        const stand = mkShape([
          [zc_ - 0.05, yD],
          [zc_ + 0.06, yD],
          [zc_ + 0.03, yW - 0.005],
          [zc_ - 0.05, yW - 0.005],
        ]);
        const m = createExtrudedMesh(stand, 0.035, carbon, 0.004);
        m.position.x = sx * span * 0.27;
        car.add(m);
        const plate = mkShape([
          [zc_ - chord / 2 - 0.02, yW - 0.08],
          [zc_ + chord / 2 + 0.03, yW - 0.04],
          [zc_ + chord / 2 + 0.03, yW + 0.1],
          [zc_ - chord / 2 - 0.02, yW + 0.06],
        ]);
        const pm = createExtrudedMesh(plate, 0.016, carbon, 0.004);
        pm.position.x = sx * (span / 2 + 0.008);
        car.add(pm);
      }
    };
    const lip = (z1, z2, h, span) => {
      const y0 = spec.yTop(z1) - 0.02;
      const a = z1 - halfLength;
      const b = z2 - halfLength;
      const shp = mkShape([
        [a, y0],
        [b - 0.03, y0 + h],
        [b, y0 + h],
        [b, y0 + h * 0.55],
        [b - 0.1, y0],
      ]);
      car.add(createExtrudedMesh(shp, span, paint, 0.008));
    };
    if (kind === "gtr") {
      wingPack(0.34, 0.3, hwMax * 1.82, carLength - 0.42, 0.04);
    } else if (kind === "hyper") {
      wingPack(0.42, 0.42, hwMax * 1.8, carLength - 0.5, 0.05);
    } else if (kind === "super") {
      lip(carLength - 0.75, carLength - 0.1, 0.1, hwMax * 1.5);
    } else if (kind === "porsche") {
      lip(carLength - 0.75, carLength - 0.12, 0.13, hwMax * 1.4);
    } else if (kind === "muscle") {
      lip(carLength - 0.55, carLength - 0.08, 0.07, hwMax * 1.6);
    } else {
      lip(carLength - 0.55, carLength - 0.08, 0.07, hwMax * 1.55);
    }
  }
  wheels.forEach((w) => mergeChildrenByMaterial(w));
  mergeChildrenByMaterial(car, new Set([...brake, ...heads]));
  car.userData = {
    wheels,
    brakeLights: brake,
    headlights: heads,
    headlightBeams: beamList,
    accessDoor,
  };
  return car;
}
