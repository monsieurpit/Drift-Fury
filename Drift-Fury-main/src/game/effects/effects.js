import {
  CanvasTexture,
  RepeatWrapping,
  PlaneGeometry,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
export function createEffects(scene) {
  const treadCanvas = document.createElement("canvas");
  treadCanvas.width = 64;
  treadCanvas.height = 128;
  const treadContext = treadCanvas.getContext("2d");
  treadContext.fillStyle = "rgba(17,19,21,0.42)";
  treadContext.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 4; row++) {
    const y = row * 32;
    treadContext.clearRect(8, y + 3, 3, 11);
    treadContext.clearRect(18, y + 3, 3, 11);
    treadContext.clearRect(43, y + 18, 3, 11);
    treadContext.clearRect(53, y + 18, 3, 11);
    treadContext.fillStyle = "rgba(4,5,6,0.24)";
    treadContext.fillRect(27, y + 14, 10, 2);
  }
  const treadTexture = new CanvasTexture(treadCanvas);
  treadTexture.wrapS = RepeatWrapping;
  treadTexture.wrapT = RepeatWrapping;
  treadTexture.colorSpace = "srgb";
  const smokeCanvas = document.createElement("canvas");
  smokeCanvas.width = 128;
  smokeCanvas.height = 128;
  const smokeContext = smokeCanvas.getContext("2d");
  const smokeGradient = smokeContext.createRadialGradient(64, 64, 7, 64, 64, 62);
  smokeGradient.addColorStop(0, "rgba(235,239,242,0.24)");
  smokeGradient.addColorStop(0.34, "rgba(220,226,231,0.17)");
  smokeGradient.addColorStop(0.72, "rgba(202,210,217,0.07)");
  smokeGradient.addColorStop(1, "rgba(190,200,208,0)");
  smokeContext.fillStyle = smokeGradient;
  smokeContext.fillRect(0, 0, 128, 128);
  const smokeTexture = new CanvasTexture(smokeCanvas);
  smokeTexture.colorSpace = "srgb";
  const smokeGeometry = new PlaneGeometry(1, 1);
  const smokePuffs = Array.from(
    {
      length: 48,
    },
    () => {
      const mesh = new Mesh(
        smokeGeometry,
        new MeshBasicMaterial({
          map: smokeTexture,
          color: "#c6cbd0",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: 2,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      return {
        mesh,
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0,
      };
    },
  );
  const crashSmoke = Array.from(
    {
      length: 20,
    },
    () => {
      const mesh = new Mesh(
        new SphereGeometry(0.8, 6, 5),
        new MeshBasicMaterial({
          color: "#3a3d42",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      return {
        mesh,
        life: 0,
        vy: 0,
      };
    },
  );
  const debris = Array.from(
    {
      length: 16,
    },
    () => {
      const mesh = new Mesh(
        new BoxGeometry(0.15, 0.15, 0.15),
        new MeshStandardMaterial({
          color: "#444",
          roughness: 0.8,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      return {
        mesh,
        life: 0,
        vx: 0,
        vy: 0,
        vz: 0,
      };
    },
  );
  const skidMaterial = new MeshBasicMaterial({
    color: "#0d0f11",
    map: treadTexture,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    side: 2,
  });
  const skidTrails = Array.from(
    {
      length: 32,
    },
    () => {
      const wheels = Array.from(
        {
          length: 2,
        },
        () => {
          const geometry = new BufferGeometry();
          const capacity = 32;
          const positions = new Float32Array(capacity * 12);
          const normals = new Float32Array(capacity * 12);
          const uvs = new Float32Array(capacity * 8);
          const indices = [];
          for (let k = 0; k < capacity; k++) {
            const base = k * 4;
            indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
          }
          geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
          geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
          geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
          geometry.setIndex(indices);
          geometry.setDrawRange(0, 0);
          const mesh = new Mesh(geometry, skidMaterial);
          mesh.visible = false;
          mesh.frustumCulled = false;
          scene.add(mesh);
          return {
            geometry,
            mesh,
            positions,
            normals,
            uvs,
            capacity,
            segments: 0,
            distance: 0,
            last: null,
          };
        },
      );
      return {
        wheels,
        remaining: 0,
      };
    },
  );
  const damageSmoke = Array.from(
    {
      length: 10,
    },
    () => {
      const mesh = new Mesh(
        new SphereGeometry(0.3, 6, 5),
        new MeshBasicMaterial({
          color: "#2b2e32",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      mesh.visible = false;
      scene.add(mesh);
      return {
        mesh,
        life: 0,
      };
    },
  );
  let smokeTimer = 0;
  let smokeCursor = 0;
  let trailCursor = 0;
  let activeTrail = null;
  let wasDrifting = false;
  let crashSmokeCursor = 0;
  let debrisCursor = 0;
  let damageSmokeCursor = 0;
  let damageSmokeTimer = 0;
  return {
    update(state, dt, camera) {
      smokeTimer += dt;
      smokePuffs.forEach((particle) => {
        const mesh = particle.mesh;
        mesh.visible = particle.life > 0;
        if (particle.life > 0) {
          particle.life -= dt;
          mesh.position.x += particle.vx * dt;
          mesh.position.y += particle.vy * dt;
          mesh.position.z += particle.vz * dt;
          mesh.scale.addScalar(dt * 0.72);
          if (camera) {
            mesh.lookAt(camera.position);
          }
          mesh.material.opacity = Math.max(0, particle.life / particle.maxLife) * 0.46;
        }
      });
      crashSmoke.forEach((puff) => {
        puff.mesh.visible = puff.life > 0;
        if (puff.life > 0) {
          puff.life -= dt;
          puff.mesh.position.y += dt * 0.7;
          puff.mesh.scale.addScalar(dt * 0.8);
          puff.mesh.material.opacity = Math.max(0, puff.life) * 0.22;
        }
      });
      debris.forEach((piece) => {
        if (piece.life > 0) {
          piece.life -= dt;
          piece.mesh.position.x += piece.vx * dt;
          piece.mesh.position.y += piece.vy * dt;
          piece.mesh.position.z += piece.vz * dt;
          piece.vy -= dt * 9;
          piece.mesh.rotation.x += dt * 8;
          piece.mesh.rotation.z += dt * 6;
          if (piece.mesh.position.y < 0.1) {
            piece.mesh.position.y = 0.1;
            piece.vy *= -0.3;
            piece.vx *= 0.5;
            piece.vz *= 0.5;
          }
          piece.mesh.visible = piece.life > 0;
        }
      });
      if (state.noPolice && state.health < 55) {
        damageSmokeTimer += dt;
        const damage = 1 - Math.max(0, state.health) / 100;
        if (damageSmokeTimer > 0.14 - damage * 0.1) {
          damageSmokeTimer = 0;
          const puff = damageSmoke[damageSmokeCursor++ % damageSmoke.length];
          puff.life = 1 + damage * 0.8;
          puff.mesh.position.set(
            state.x - Math.sin(state.heading) * 1.6,
            (state.y || 0) + 0.5,
            state.z - Math.cos(state.heading) * 1.6,
          );
          puff.mesh.scale.setScalar(0.5);
        }
      }
      damageSmoke.forEach((puff) => {
        puff.mesh.visible = puff.life > 0;
        if (puff.life > 0) {
          puff.life -= dt;
          puff.mesh.position.y += dt * 0.9;
          puff.mesh.scale.addScalar(dt * 0.7);
          puff.mesh.material.opacity = Math.max(0, puff.life) * 0.3;
        }
      });
      skidTrails.forEach((trail) => {
        if (trail !== activeTrail && trail.remaining > 0) {
          trail.remaining = Math.max(0, trail.remaining - dt);
          if (trail.remaining === 0) {
            trail.wheels.forEach((wheel) => {
              wheel.mesh.visible = false;
              wheel.geometry.setDrawRange(0, 0);
              wheel.last = null;
            });
          }
        }
      });
      if (state.drifting && !wasDrifting) {
        activeTrail = skidTrails[trailCursor++ % skidTrails.length];
        activeTrail.remaining = 0;
        activeTrail.wheels.forEach((wheel) => {
          wheel.segments = 0;
          wheel.distance = 0;
          wheel.last = null;
          wheel.geometry.setDrawRange(0, 0);
          wheel.mesh.visible = false;
        });
      }
      if (state.drifting) {
        const appendSkidSegment = (wheel, x1, z1, x2, z2, y, width) => {
          const dx = x2 - x1;
          const dz = z2 - z1;
          const length = Math.hypot(dx, dz);
          if (length < 0.012) {
            return;
          }
          const nx = ((-dz / length) * width) / 2;
          const nz = ((dx / length) * width) / 2;
          if (wheel.segments === wheel.capacity) {
            wheel.capacity *= 2;
            const positions = new Float32Array(wheel.capacity * 12);
            const normals = new Float32Array(wheel.capacity * 12);
            const uvs = new Float32Array(wheel.capacity * 8);
            positions.set(wheel.positions);
            normals.set(wheel.normals);
            uvs.set(wheel.uvs);
            wheel.positions = positions;
            wheel.normals = normals;
            wheel.uvs = uvs;
            wheel.geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
            wheel.geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
            wheel.geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
            const indices = [];
            for (let k = 0; k < wheel.capacity; k++) {
              const base = k * 4;
              indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
            }
            wheel.geometry.setIndex(indices);
          }
          const offset = wheel.segments * 12;
          wheel.positions.set(
            [x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz, x2 - nx, y, z2 - nz],
            offset,
          );
          wheel.normals.fill(0, offset, offset + 12);
          for (let k = 0; k < 4; k++) {
            wheel.normals[offset + k * 3 + 1] = 1;
          }
          const uvOffset = wheel.segments * 8;
          const v0 = wheel.distance;
          const v1 = v0 + length * 1.6;
          wheel.uvs.set([0, v0, 1, v0, 0, v1, 1, v1], uvOffset);
          wheel.distance = v1;
          wheel.segments++;
          wheel.geometry.attributes.position.needsUpdate = true;
          wheel.geometry.attributes.normal.needsUpdate = true;
          wheel.geometry.attributes.uv.needsUpdate = true;
          wheel.geometry.setDrawRange(0, wheel.segments * 6);
          wheel.mesh.visible = true;
        };
        if (activeTrail) {
          for (let sideIndex = 0; sideIndex < 2; sideIndex++) {
            const side = sideIndex === 0 ? -1 : 1;
            const x = state.x + Math.sin(state.heading) * 1.45 + Math.cos(state.heading) * side * 0.85;
            const z = state.z + Math.cos(state.heading) * 1.45 - Math.sin(state.heading) * side * 0.85;
            const y = (state.y || 0) + 0.09;
            const wheel = activeTrail.wheels[sideIndex];
            if (wheel.last) {
              appendSkidSegment(wheel, wheel.last.x, wheel.last.z, x, z, y, 0.16);
            }
            wheel.last = {
              x,
              z,
            };
          }
        }
        if (smokeTimer > 0.045) {
          smokeTimer = 0;
          for (let side of [-1, 1]) {
            const offsetX = Math.sin(state.heading) * 1.45 + Math.cos(state.heading) * side * 0.85;
            const offsetZ = Math.cos(state.heading) * 1.45 - Math.sin(state.heading) * side * 0.85;
            const x = state.x + offsetX;
            const z = state.z + offsetZ;
            const y = state.y || 0;
            const particle = smokePuffs[smokeCursor++ % smokePuffs.length];
            particle.maxLife = 0.9 + Math.random() * 0.55;
            particle.life = particle.maxLife;
            particle.mesh.position.set(x, y + 0.16 + Math.random() * 0.12, z);
            particle.mesh.scale.set(0.65 + Math.random() * 0.4, 0.5 + Math.random() * 0.3, 1);
            particle.vx =
              Math.sin(state.heading) * (0.25 + state.speed * 0.035) + (Math.random() - 0.5) * 0.45;
            particle.vy = 0.38 + Math.random() * 0.48;
            particle.vz =
              Math.cos(state.heading) * (0.25 + state.speed * 0.035) + (Math.random() - 0.5) * 0.45;
            particle.mesh.material.opacity = 0.25 + Math.random() * 0.12;
          }
        }
      }
      if (!state.drifting && wasDrifting) {
        activeTrail.remaining = 20;
        activeTrail = null;
      }
      wasDrifting = state.drifting;
    },
    crash(x, y, z, strength = 1) {
      for (let index = 0; index < 8; index++) {
        const puff = crashSmoke[crashSmokeCursor++ % crashSmoke.length];
        puff.life = 1.5 + Math.random() * 0.5;
        puff.vy = 0.8 + Math.random() * 0.6;
        puff.mesh.position.set(x + (Math.random() - 0.5) * 2, y + 0.5, z + (Math.random() - 0.5) * 2);
        puff.mesh.scale.setScalar(1 + Math.random());
      }
      for (let index = 0; index < 6; index++) {
        const piece = debris[debrisCursor++ % debris.length];
        piece.life = 1.5;
        piece.mesh.position.set(x, y + 0.5, z);
        piece.vx = (Math.random() - 0.5) * 12 * strength;
        piece.vy = 3 + Math.random() * 5;
        piece.vz = (Math.random() - 0.5) * 12 * strength;
        piece.mesh.visible = true;
      }
    },
  };
}
