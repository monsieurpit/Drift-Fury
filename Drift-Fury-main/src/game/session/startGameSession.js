import { PointLight, Vector3 } from "three";
import { createAudio } from "../audio/createAudio.js";
import { createEffects } from "../effects/effects.js";
import { animatePerson, createPersonModel } from "../people/person.js";
import { createRenderer } from "../render/renderer.js";
import { batchStaticMeshes } from "../render/staticBatching.js";
import { warmUpSession } from "../render/warmUp.js";
import { createGame } from "../simulation/game.js";
import { batchPlayerCar } from "../vehicles/batchPlayerCar.js";
import { buildCar } from "../vehicles/carModel.js";
import { createTrafficCar } from "../vehicles/trafficCars.js";
import { buildWorld } from "../world/buildWorld.js";
import { terrainHeight } from "../world/terrain.js";
export function startGameSession(e, t, n, r, i, a = false) {
  const o = createRenderer(e, true);
  const {
    scene: s,
    renderer: c,
    camera: l,
    sun: u,
    touchDevice: d,
    composer: f,
  } = o;
  const { solids: p, lampPositions: m, signals } = buildWorld(s);
  const staticBatch = batchStaticMeshes(
    s,
    new Set(
      signals.flatMap((signal) => {
        return signal.lenses;
      }),
    ),
    96,
  );
  const h = createGame(t, n, p, a);
  const g = [];
  // ?dfdebug exposes the live session for profiling tools
  const debugSession = /[?&]dfdebug\b/.test(location.search)
    ? (window.__dfDbg = {
        scene: s,
        renderer: c,
        composer: f,
        camera: l,
        sun: u,
        staticBatch,
        get state() {
          return h.state;
        },
      })
    : null;
  let signalClock = 0;
  const signalStates = [-1, -1];
  function updateTrafficLights(dt) {
    signalClock = (signalClock + dt) % 24;
    const phase = signalClock % 24;
    const state0 = phase < 9 ? 0 : phase < 11 ? 1 : 2;
    const state1 =
      phase >= 12 && phase < 21 ? 0 : phase >= 21 && phase < 23 ? 1 : 2;
    for (let axis = 0; axis < signalStates.length; axis++) {
      const state = axis === 0 ? state0 : state1;
      if (signalStates[axis] === state) {
        continue;
      }
      signalStates[axis] = state;
      const activeLens = state === 0 ? 2 : state === 1 ? 1 : 0;
      for (const signal of signals) {
        if (signal.axis === axis) {
          signal.lenses.forEach((material, index) => {
            material.emissiveIntensity = index === activeLens ? 1.35 : 0.025;
          });
        }
      }
    }
  }
  for (let e = 0; e < 6; e++) {
    const e = new PointLight("#ffd9a0", 0.6, 26, 2);
    s.add(e);
    g.push({
      light: e,
    });
  }
  const _ = new Float32Array(m.length || 1);
  const v = [];
  let lastLampX = Infinity;
  let lastLampZ = Infinity;
  function y(e, t) {
    if ((e - lastLampX) ** 2 + (t - lastLampZ) ** 2 < 25) {
      return;
    }
    lastLampX = e;
    lastLampZ = t;
    const n = m;
    const r = n.length;
    for (let i = 0; i < r; i++) {
      const r = n[i].x - e;
      const a = n[i].z - t;
      _[i] = r * r + a * a;
      v[i] = i;
    }
    v.length = r;
    v.sort((e, t) => {
      return _[e] - _[t];
    });
    for (let e = 0; e < 6; e++) {
      const t = g[e];
      const r = v[e];
      if (r == null) {
        t.light.visible = false;
      } else {
        (t.light.position.set(n[r].x, n[r].y, n[r].z),
          (t.light.visible = true));
      }
    }
  }
  y(0, 70);
  let interaction = null;
  let b = batchPlayerCar(buildCar(t.color, t.shape, false, true));
  s.add(b);
  let x = h.state.playerVeh.spec;
  const S = h.state.police.map(() => {
    const e = createTrafficCar("#ffffff", "coupe", true);
    s.add(e);
    return e;
  });
  const C = createPersonModel("#2f3b4c");
  C.visible = false;
  s.add(C);
  const w = h.state.police.map(() => {
    const e = createPersonModel("#1f2f4d");
    e.visible = false;
    s.add(e);
    return e;
  });
  const T = new Map();
  function E(e) {
    s.remove(b);
    b.traverse((e) => {
      e.geometry?.dispose();
      e.material?.dispose();
    });
    b = batchPlayerCar(buildCar(e.color, e.shape, e.kind === "police", true));
    s.add(b);
    x = e.spec;
  }
  function D() {
    const e = h.state;
    const t = new Set();
    for (let n of e.vehicles) {
      t.add(n.id);
      let e = T.get(n.id);
      if (!e) {
        const t =
          n.kind === "police"
            ? createTrafficCar("#ffffff", "coupe", true)
            : createTrafficCar(n.color, n.shape || "coupe");
        s.add(t);
        e = {
          car: t,
        };
        T.set(n.id, e);
      }
      e.car.visible = true;
      e.car.position.set(n.x, terrainHeight(n.x, n.z) + 0.1, n.z);
      e.car.rotation.y = n.heading;
      if (
        interaction?.direction === "exit" &&
        Math.hypot(n.x - interaction.carX, n.z - interaction.carZ) < 0.5
      ) {
        e.car.visible = false;
      }
    }
    for (let [e, n] of T) {
      if (!t.has(e)) {
        (s.remove(n.car),
          n.car.userData.sharedTemplate ||
            n.car.traverse((e) => {
              e.geometry?.dispose();
              e.material?.dispose();
            }),
          T.delete(e));
      }
    }
  }
  const O = r.current.audio || createAudio(n);
  const k = createEffects(s);
  const A = {};
  let j;
  let M = performance.now();
  let N = 0;
  let cameraYaw = 0;
  let footCameraYaw = 0;
  let cameraPitch = 0;
  let cameraZoom = 1;
  let dragPointer = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  const touchPoints = new Map();
  let pinchDistance = 0;
  const canvas = c.domElement;
  function startCameraDrag(e) {
    if (e.pointerType === "touch") {
      e.preventDefault();
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      canvas.setPointerCapture(e.pointerId);
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        pinchDistance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );
        dragPointer = null;
        return;
      }
      dragPointer = e.pointerId;
    } else {
      if (e.button !== 2) {
        return;
      }
      e.preventDefault();
      dragPointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function moveCameraDrag(e) {
    if (e.pointerType === "touch" && touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        const distance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );
        if (pinchDistance > 0 && distance > 0) {
          cameraZoom = Math.max(
            0.45,
            Math.min(2.8, (cameraZoom * pinchDistance) / distance),
          );
        }
        pinchDistance = distance;
        return;
      }
    }
    if (e.pointerId !== dragPointer) {
      return;
    }
    const yawDelta = -(e.clientX - lastPointerX) * 0.005;
    cameraYaw += yawDelta;
    if (h.state.onFoot) {
      footCameraYaw += yawDelta;
    }
    cameraPitch = Math.max(
      -0.45,
      Math.min(0.55, cameraPitch + (e.clientY - lastPointerY) * 0.004),
    );
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function stopCameraDrag(e) {
    if (e.pointerType === "touch") {
      touchPoints.delete(e.pointerId);
      pinchDistance = 0;
      dragPointer = null;
      if (touchPoints.size === 1) {
        const [pointerId, point] = [...touchPoints.entries()][0];
        dragPointer = pointerId;
        lastPointerX = point.x;
        lastPointerY = point.y;
      }
    } else if (e.pointerId === dragPointer) {
      dragPointer = null;
    }
  }
  function preventCameraMenu(e) {
    e.preventDefault();
  }
  function zoomCamera(e) {
    e.preventDefault();
    cameraZoom = Math.max(
      0.45,
      Math.min(2.8, cameraZoom * Math.exp(e.deltaY * 0.001)),
    );
  }
  function addInteractionDoor() {
    interaction.door = b.userData.accessDoor;
    if (interaction.door) {
      interaction.door.rotation.set(0, 0, 0);
    }
  }
  function removeInteractionDoor() {
    if (!interaction?.door) {
      return;
    }
    interaction.door.rotation.set(0, 0, 0);
    interaction.door = null;
  }
  canvas.addEventListener("pointerdown", startCameraDrag);
  canvas.addEventListener("pointermove", moveCameraDrag);
  canvas.addEventListener("pointerup", stopCameraDrag);
  canvas.addEventListener("pointercancel", stopCameraDrag);
  canvas.addEventListener("contextmenu", preventCameraMenu);
  canvas.addEventListener("wheel", zoomCamera, {
    passive: false,
  });
  c.shadowMap.autoUpdate = false;
  c.shadowMap.needsUpdate = true;
  let P = 0;
  const F = c.getPixelRatio();
  let I = 1;
  let L = 0;
  let R = 0;
  let shadowFrameInterval = d ? 2 : 1;
  let slowWindows = 0;
  let fastWindows = 0;
  let fastWindowsNeeded = 4;
  let lastRaise = -Infinity;
  let skipWindow = false;
  O.ready.catch(() => {});
  const z = (e) => {
    O.resume();
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
        e.code,
      )
    ) {
      e.preventDefault();
    }
    A[e.code] = true;
    if (
      e.code === "KeyE" &&
      !e.repeat &&
      !h.state.onFoot &&
      h.state.station >= 0
    ) {
      i.current.onStation();
    }
    if (e.code === "Escape" && !e.repeat) {
      i.current.onPause();
    }
  };
  const ee = (e) => {
    A[e.code] = false;
  };
  const B = () => {
    Object.keys(A).forEach((e) => {
      return (A[e] = false);
    });
  };
  const V = () => {
    return O.resume();
  };
  const te = () => {
    if (!document.hidden) {
      O.resume();
    }
  };
  window.addEventListener("keydown", z);
  window.addEventListener("keyup", ee);
  window.addEventListener("blur", B);
  window.addEventListener("pointerdown", V);
  document.addEventListener("visibilitychange", te);
  l.position.set(0, 9, 85);
  const ne = new Vector3();
  const re = new Vector3();
  const ie = new Vector3();
  function ae(t) {
    j = requestAnimationFrame(ae);
    const n = (t - M) / 1000;
    const a = Math.min(n, 0.04);

    // a frame longer than a second means the tab was hidden, not that the game is slow
    M = t;
    if (n < 1) {
      ((L += n), R++);
    }
    if (L > 1) {
      const t = L / R;
      let n = I;
      shadowFrameInterval = d ? 2 : t > 1 / 32 ? 3 : t > 1 / 48 ? 2 : 1;
      // resizing reallocates every post-processing target, so only react to sustained trends and
      // back off when a resolution increase did not hold
      if (skipWindow) {
        skipWindow = false;
      } else {
        slowWindows = t > 1 / 45 ? slowWindows + 1 : 0;
        fastWindows = t < 1 / 57 ? fastWindows + 1 : 0;
        if (slowWindows >= 2) {
          ((n = Math.max(0.6, I - 0.1)),
            performance.now() - lastRaise < 8000 &&
              (fastWindowsNeeded = Math.min(32, fastWindowsNeeded * 2)));
        } else if (fastWindows >= fastWindowsNeeded) {
          ((n = Math.min(1, I + 0.05)), (lastRaise = performance.now()));
        }
      }
      if (n !== I) {
        ((I = n),
          (slowWindows = 0),
          (fastWindows = 0),
          (skipWindow = true),
          c.setPixelRatio(F * I),
          f.setPixelRatio(F * I),
          f.setSize(e.clientWidth, e.clientHeight));
      }
      L = 0;
      R = 0;
    }
    const o = h.state;
    if (r.current.paused) {
      O.update(o.rpm, 0, true, false, o);
    } else {
      const wasOnFoot = o.onFoot;
      const oldX = o.x;
      const oldZ = o.z;
      h.update(
        a,
        {
          ...A,
          ...r.current.keys,
          ...(interaction
            ? {
                ArrowUp: false,
                ArrowDown: false,
                ArrowLeft: false,
                ArrowRight: false,
                KeyW: false,
                KeyA: false,
                KeyS: false,
                KeyD: false,
                KeyZ: false,
                KeyQ: false,
                KeyF: false,
                Space: false,
              }
            : {}),
        },
        h.state.onFoot ? footCameraYaw : h.state.heading + cameraYaw,
      );
      if (wasOnFoot !== o.onFoot) {
        if (o.onFoot) {
          footCameraYaw = o.heading + cameraYaw;
        } else {
          cameraYaw = footCameraYaw - o.heading;
        }
      }
      if (wasOnFoot !== o.onFoot) {
        interaction = {
          direction: o.onFoot ? "exit" : "enter",
          elapsed: 0,
          duration: 1.3,
          carX: o.onFoot ? oldX : o.x,
          carZ: o.onFoot ? oldZ : o.z,
          heading: o.heading,
          startX: oldX,
          startZ: oldZ,
          endX: o.x,
          endZ: o.z,
          door: null,
        };
      }
      u.position.set(o.x + 40, 85, o.z - 25);
      u.target.position.set(o.x, 0, o.z);
      u.target.updateMatrixWorld();
      P++;
      if (P >= shadowFrameInterval) {
        ((c.shadowMap.needsUpdate = true), (P = 0));
      }
      y(o.x, o.z);
      o._crash &&=
        (k.crash(o._crash.x, o._crash.y, o._crash.z, o._crash.intensity),
        O.crash(o._crash.intensity),
        null);
      if (o.playerVeh.spec !== x) {
        E(o.playerVeh);
      }
      if (interaction && interaction.door?.parent !== b) {
        addInteractionDoor();
      }
      b.visible = !o.onFoot || interaction?.direction === "exit";
      if (!o.onFoot) {
        b.position.set(o.x, (o.y || 0) + 0.12, o.z);
        b.rotation.y = o.heading;
        b.rotation.z = o.drifting ? Math.sin(o.elapsed * 7) * 0.015 : 0;
        b.userData.wheels.forEach((e) => {
          return (e.rotation.x -= o.speed * 0.01 * a);
        });
        const e = o.brake > 0 || (o.speed > 5 && o.throttle === 0);
        b.userData.brakeLights.forEach((t) => {
          return (t.material.emissiveIntensity = e ? 1.5 : 0.15);
        });
      }
      C.visible = !!o.onFoot;
      if (o.onFoot) {
        (C.position.set(o.x, o.y || 0, o.z),
          (C.rotation.y = o.footYaw || 0),
          animatePerson(C, a, o.x, o.z));
      }
      S.forEach((e, n) => {
        const r = o.police[n];
        e.visible = !r.onFoot;
        if (!r.onFoot) {
          (e.position.set(r.x, terrainHeight(r.x, r.z) + 0.1, r.z),
            (e.rotation.y = r.heading));
        }
        const i =
          e.userData.blueLight === undefined
            ? (e.userData.blueLight = e.getObjectByName("blue") || null)
            : e.userData.blueLight;
        const a =
          e.userData.redLight === undefined
            ? (e.userData.redLight = e.getObjectByName("red") || null)
            : e.userData.redLight;
        if (i) {
          i.visible = !r.onFoot && Math.sin(t * 0.018) > 0;
        }
        if (a) {
          a.visible = !r.onFoot && Math.sin(t * 0.018) <= 0;
        }
      });
      w.forEach((e, t) => {
        const n = o.police[t];
        e.visible = !!n.onFoot;
        if (n.onFoot) {
          (e.position.set(n.x, terrainHeight(n.x, n.z), n.z),
            (e.rotation.y = n.heading),
            animatePerson(e, a, n.x, n.z));
        }
      });
      D();
      if (interaction) {
        interaction.elapsed += a;
        const time = Math.min(interaction.elapsed / interaction.duration, 1);
        const ease = (e) => {
          return e * e * (3 - 2 * e);
        };
        const open =
          ease(Math.min(time / 0.2, 1)) *
          (1 - ease(Math.max(0, (time - 0.78) / 0.22)));
        if (interaction.door) {
          interaction.door.rotation.y = -open * 1.12;
        }
        const sideX = interaction.carX - Math.cos(interaction.heading) * 1.45;
        const sideZ = interaction.carZ + Math.sin(interaction.heading) * 1.45;
        if (interaction.direction === "exit") {
          const step = ease(Math.max(0, Math.min((time - 0.16) / 0.56, 1)));
          C.visible = true;
          C.position.set(
            sideX + (interaction.endX - sideX) * step,
            0,
            sideZ + (interaction.endZ - sideZ) * step,
          );
          C.rotation.y = interaction.heading;
          C.scale.setScalar(0.78 + 0.22 * ease(Math.min(time / 0.42, 1)));
          b.position.set(
            interaction.carX,
            terrainHeight(interaction.carX, interaction.carZ) + 0.1,
            interaction.carZ,
          );
          b.rotation.y = interaction.heading;
        } else {
          const approach = ease(Math.min(time / 0.48, 1));
          const enter = ease(Math.max(0, Math.min((time - 0.42) / 0.34, 1)));
          C.visible = time < 0.84;
          C.position.set(
            interaction.startX +
              (sideX - interaction.startX) * approach +
              (interaction.carX - sideX) * enter,
            0.12 * Math.sin(Math.PI * enter),
            interaction.startZ +
              (sideZ - interaction.startZ) * approach +
              (interaction.carZ - sideZ) * enter,
          );
          C.rotation.y = interaction.heading;
          C.scale.setScalar(1 - 0.72 * enter);
        }
        const limbs = C.userData.L;
        if (limbs && time < 0.84) {
          const crouch = Math.sin(Math.PI * Math.min(time / 0.84, 1));
          limbs.body.position.y = 0.08 * crouch;
          limbs.body.rotation.x = -0.18 * crouch;
          limbs.la.rotation.x = -0.8 * crouch;
          limbs.ra.rotation.x = -0.8 * crouch;
          limbs.lh.rotation.x = 0.18 * crouch;
          limbs.rh.rotation.x = -0.18 * crouch;
        }
        if (time >= 1) {
          removeInteractionDoor();
          C.scale.setScalar(1);
          interaction = null;
        }
      }
      const e = Math.min(o.speed / 200, 1);
      updateTrafficLights(a);
      const targetFov = 45 + e * 12;
      if (l.fov !== targetFov) {
        l.fov = targetFov;
        l.updateProjectionMatrix();
      }
      const inStore = o.onFoot && o.store >= 0;
      const n = inStore ? 4.2 : 12 + e * 3;
      const s = inStore ? 2.2 : 7.5 + e * 1.5;
      const cameraHeading = o.onFoot ? footCameraYaw : o.heading + cameraYaw;
      const cameraDistance = Math.hypot(n, s - 1) * cameraZoom;
      const cameraAngle = Math.atan2(s - 1, n) + cameraPitch;
      re.set(
        o.x + Math.sin(cameraHeading) * Math.cos(cameraAngle) * cameraDistance,
        (o.y || 0) + 1 + Math.sin(cameraAngle) * cameraDistance,
        o.z + Math.cos(cameraHeading) * Math.cos(cameraAngle) * cameraDistance,
      );
      l.position.lerp(re, 1 - Math.exp(-a * (o.onFoot ? 12 : 4.5)));
      if (o.shake > 0.01) {
        (ie.set(
          (Math.random() - 0.5) * o.shake * 0.8,
          (Math.random() - 0.5) * o.shake * 0.5,
          (Math.random() - 0.5) * o.shake * 0.8,
        ),
          l.position.add(ie));
      }
      ne.set(o.x, (o.y || 0) + 1, o.z);
      l.lookAt(ne);
      k.update(o, a, l);
      O.update(o.rpm, o.pedal, r.current.muted, o.drifting, o);
      if (wasOnFoot && !o.onFoot) {
        O.startEngine();
      }
      N += a;
      if (N > 0.09) {
        ((N = 0),
          i.current.onHud({
            ...o,
            police: o.police.map((e) => {
              return {
                ...e,
              };
            }),
          }));
      }
      if (o.ended && !r.current.finished) {
        ((r.current.finished = true),
          (r.current.paused = true),
          i.current.onFinish({
            ...o,
            credits: Math.floor(o.score / 12 + o.elapsed * 2),
          }));
      }
    }
    f.render();
  }
  warmUpSession(c, s, l, [t.color]);
  if (debugSession) {
    debugSession.fx = k;
  }
  j = requestAnimationFrame(ae);
  return {
    setCar(e) {
      h.setCar(e);
      s.remove(b);
      b.traverse((e) => {
        e.geometry?.dispose();
        e.material?.dispose();
      });
      b = batchPlayerCar(buildCar(e.color, e.shape, false, true));
      s.add(b);
      x = `player|${e.color}|${e.shape}`;
    },
    dispose() {
      cancelAnimationFrame(j);
      removeInteractionDoor();
      canvas.removeEventListener("pointerdown", startCameraDrag);
      canvas.removeEventListener("pointermove", moveCameraDrag);
      canvas.removeEventListener("pointerup", stopCameraDrag);
      canvas.removeEventListener("pointercancel", stopCameraDrag);
      canvas.removeEventListener("contextmenu", preventCameraMenu);
      canvas.removeEventListener("wheel", zoomCamera);
      window.removeEventListener("keydown", z);
      window.removeEventListener("keyup", ee);
      window.removeEventListener("blur", B);
      window.removeEventListener("pointerdown", V);
      document.removeEventListener("visibilitychange", te);
      O.close();
      o.dispose();
    },
  };
}
