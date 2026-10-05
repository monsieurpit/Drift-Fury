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
export function createEffects(e) {
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
  const t = Array.from(
    {
      length: 48,
    },
    () => {
      const t = new Mesh(
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
      t.visible = false;
      e.add(t);
      return {
        mesh: t,
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0,
      };
    },
  );
  const n = Array.from(
    {
      length: 20,
    },
    () => {
      const t = new Mesh(
        new SphereGeometry(0.8, 6, 5),
        new MeshBasicMaterial({
          color: "#3a3d42",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      t.visible = false;
      e.add(t);
      return {
        mesh: t,
        life: 0,
        vy: 0,
      };
    },
  );
  const r = Array.from(
    {
      length: 16,
    },
    () => {
      const t = new Mesh(
        new BoxGeometry(0.15, 0.15, 0.15),
        new MeshStandardMaterial({
          color: "#444",
          roughness: 0.8,
        }),
      );
      t.visible = false;
      e.add(t);
      return {
        mesh: t,
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
  const i = Array.from(
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
          e.add(mesh);
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
  const a = Array.from(
    {
      length: 10,
    },
    () => {
      const t = new Mesh(
        new SphereGeometry(0.3, 6, 5),
        new MeshBasicMaterial({
          color: "#2b2e32",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      );
      t.visible = false;
      e.add(t);
      return {
        mesh: t,
        life: 0,
      };
    },
  );
  let o = 0;
  let s = 0;
  let trailCursor = 0;
  let activeTrail = null;
  let wasDrifting = false;
  let l = 0;
  let u = 0;
  let d = 0;
  let f = 0;
  return {
    update(e, l, camera) {
      o += l;
      t.forEach((particle) => {
        const mesh = particle.mesh;
        mesh.visible = particle.life > 0;
        if (particle.life > 0) {
          particle.life -= l;
          mesh.position.x += particle.vx * l;
          mesh.position.y += particle.vy * l;
          mesh.position.z += particle.vz * l;
          mesh.scale.addScalar(l * 0.72);
          if (camera) {
            mesh.lookAt(camera.position);
          }
          mesh.material.opacity = Math.max(0, particle.life / particle.maxLife) * 0.46;
        }
      });
      n.forEach((e) => {
        e.mesh.visible = e.life > 0;
        if (e.life > 0) {
          e.life -= l;
          e.mesh.position.y += l * 0.7;
          e.mesh.scale.addScalar(l * 0.8);
          e.mesh.material.opacity = Math.max(0, e.life) * 0.22;
        }
      });
      r.forEach((e) => {
        if (e.life > 0) {
          e.life -= l;
          e.mesh.position.x += e.vx * l;
          e.mesh.position.y += e.vy * l;
          e.mesh.position.z += e.vz * l;
          e.vy -= l * 9;
          e.mesh.rotation.x += l * 8;
          e.mesh.rotation.z += l * 6;
          if (e.mesh.position.y < 0.1) {
            e.mesh.position.y = 0.1;
            e.vy *= -0.3;
            e.vx *= 0.5;
            e.vz *= 0.5;
          }
          e.mesh.visible = e.life > 0;
        }
      });
      if (e.noPolice && e.health < 55) {
        f += l;
        const t = 1 - Math.max(0, e.health) / 100;
        if (f > 0.14 - t * 0.1) {
          f = 0;
          const n = a[d++ % a.length];
          n.life = 1 + t * 0.8;
          n.mesh.position.set(
            e.x - Math.sin(e.heading) * 1.6,
            (e.y || 0) + 0.5,
            e.z - Math.cos(e.heading) * 1.6,
          );
          n.mesh.scale.setScalar(0.5);
        }
      }
      a.forEach((e) => {
        e.mesh.visible = e.life > 0;
        if (e.life > 0) {
          e.life -= l;
          e.mesh.position.y += l * 0.9;
          e.mesh.scale.addScalar(l * 0.7);
          e.mesh.material.opacity = Math.max(0, e.life) * 0.3;
        }
      });
      i.forEach((trail) => {
        if (trail !== activeTrail && trail.remaining > 0) {
          trail.remaining = Math.max(0, trail.remaining - l);
          if (trail.remaining === 0) {
            trail.wheels.forEach((wheel) => {
              wheel.mesh.visible = false;
              wheel.geometry.setDrawRange(0, 0);
              wheel.last = null;
            });
          }
        }
      });
      if (e.drifting && !wasDrifting) {
        activeTrail = i[trailCursor++ % i.length];
        activeTrail.remaining = 0;
        activeTrail.wheels.forEach((wheel) => {
          wheel.segments = 0;
          wheel.distance = 0;
          wheel.last = null;
          wheel.geometry.setDrawRange(0, 0);
          wheel.mesh.visible = false;
        });
      }
      if (e.drifting) {
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
            const x = e.x + Math.sin(e.heading) * 1.45 + Math.cos(e.heading) * side * 0.85;
            const z = e.z + Math.cos(e.heading) * 1.45 - Math.sin(e.heading) * side * 0.85;
            const y = (e.y || 0) + 0.09;
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
        if (o > 0.045) {
          o = 0;
          for (let n of [-1, 1]) {
            const r = Math.sin(e.heading) * 1.45 + Math.cos(e.heading) * n * 0.85;
            const a = Math.cos(e.heading) * 1.45 - Math.sin(e.heading) * n * 0.85;
            const x = e.x + r;
            const z = e.z + a;
            const y = e.y || 0;
            const particle = t[s++ % t.length];
            particle.maxLife = 0.9 + Math.random() * 0.55;
            particle.life = particle.maxLife;
            particle.mesh.position.set(x, y + 0.16 + Math.random() * 0.12, z);
            particle.mesh.scale.set(0.65 + Math.random() * 0.4, 0.5 + Math.random() * 0.3, 1);
            particle.vx = Math.sin(e.heading) * (0.25 + e.speed * 0.035) + (Math.random() - 0.5) * 0.45;
            particle.vy = 0.38 + Math.random() * 0.48;
            particle.vz = Math.cos(e.heading) * (0.25 + e.speed * 0.035) + (Math.random() - 0.5) * 0.45;
            particle.mesh.material.opacity = 0.25 + Math.random() * 0.12;
          }
        }
      }
      if (!e.drifting && wasDrifting) {
        activeTrail.remaining = 20;
        activeTrail = null;
      }
      wasDrifting = e.drifting;
    },
    crash(e, t, i, a = 1) {
      for (let r = 0; r < 8; r++) {
        const r = n[l++ % n.length];
        r.life = 1.5 + Math.random() * 0.5;
        r.vy = 0.8 + Math.random() * 0.6;
        r.mesh.position.set(e + (Math.random() - 0.5) * 2, t + 0.5, i + (Math.random() - 0.5) * 2);
        r.mesh.scale.setScalar(1 + Math.random());
      }
      for (let n = 0; n < 6; n++) {
        const n = r[u++ % r.length];
        n.life = 1.5;
        n.mesh.position.set(e, t + 0.5, i);
        n.vx = (Math.random() - 0.5) * 12 * a;
        n.vy = 3 + Math.random() * 5;
        n.vz = (Math.random() - 0.5) * 12 * a;
        n.mesh.visible = true;
      }
    },
  };
}
