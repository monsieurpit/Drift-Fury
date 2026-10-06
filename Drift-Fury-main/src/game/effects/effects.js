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
  Vector3,
} from "three";
import { fbm } from "../util/noise.js";
import { createDriftSmoke } from "./driftSmoke.js";
/**
 * Rubber left on the road by a sliding tyre: dark in the middle with soft edges, streaked along its
 * length by the tread grooves, patchier where the tyre skipped. u runs across the mark, v along it.
 */
function skidTexture() {
  const width = 64;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    const patch = 0.7 + 0.3 * fbm(0.5, y / 40, { seed: 77, octaves: 3, period: 0, periodY: 0 });
    for (let x = 0; x < width; x++) {
      const across = (x + 0.5) / width;
      const edge = Math.min(across, 1 - across);
      let density = Math.min(1, edge / 0.16) ** 1.5;
      // Tread grooves leave lighter lines along the mark.
      for (const groove of [0.3, 0.5, 0.7])
        density *= 1 - 0.45 * Math.exp(-(((across - groove) / 0.025) ** 2));
      density *= patch * (0.85 + 0.15 * fbm(x / 6, y / 6, { seed: 78, octaves: 2 }));
      const index = (y * width + x) * 4;
      image.data[index] = image.data[index + 1] = image.data[index + 2] = 20;
      image.data[index + 3] = Math.round(Math.min(1, density) * 235);
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.wrapT = RepeatWrapping;
  texture.colorSpace = "srgb";
  texture.anisotropy = 8;
  return texture;
}

export function createEffects(scene, { patch } = {}) {
  const smoke = createDriftSmoke(scene, { patch });
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
  // Skid marks are lit like the road (moon, headlights, street lamps), with the slight sheen of rubber.
  const skidMap = skidTexture();
  const skidBase = new MeshStandardMaterial({
    color: "#ffffff",
    map: skidMap,
    roughness: 0.55,
    metalness: 0,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  if (patch) patch(skidBase);
  const SKID_LIFETIME = 120; // seconds a mark stays after the drift ends
  const SKID_FADE = 15; // ... the last of which it spends fading out
  const skidTrails = Array.from(
    {
      length: 32,
    },
    () => {
      // Each trail has its own copy (sharing the compiled program) so it can fade on its own.
      const skidMaterial = skidBase.clone();
      skidMaterial.onBeforeCompile = skidBase.onBeforeCompile;
      skidMaterial.customProgramCacheKey = skidBase.customProgramCacheKey;
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
        material: skidMaterial,
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
  const smokeOrigin = new Vector3();
  const smokeVelocity = new Vector3();
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
      smoke.update(dt);
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
          trail.material.opacity = Math.min(1, trail.remaining / SKID_FADE);
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
        activeTrail.material.opacity = 1;
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
          const v1 = v0 + length / 2.5; // the mark texture covers 2.5 m of road
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
              appendSkidSegment(wheel, wheel.last.x, wheel.last.z, x, z, y, 0.26);
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
            // Smoke leaves the tyre with part of the car's motion, then the air takes over.
            smokeOrigin.set(x, y + 0.25 + Math.random() * 0.15, z);
            smokeVelocity.set(
              Math.sin(state.heading) * (0.25 + state.speed * 0.035) + (Math.random() - 0.5) * 0.8,
              0.3 + Math.random() * 0.4,
              Math.cos(state.heading) * (0.25 + state.speed * 0.035) + (Math.random() - 0.5) * 0.8,
            );
            smoke.emit(smokeOrigin, smokeVelocity, 0.8 + Math.min(state.speed / 120, 1) * 0.6);
          }
        }
      }
      if (!state.drifting && wasDrifting) {
        activeTrail.remaining = SKID_LIFETIME;
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
