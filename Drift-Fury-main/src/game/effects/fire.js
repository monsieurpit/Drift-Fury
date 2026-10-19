// Fire: burning cars (flames licking up, thick smoke, flickering orange light), explosions (a fireball,
// a flash, a column of smoke) and the firefighters' water. Particles live in two instanced meshes of
// camera-facing quads (one glowing for the flames, one shaded for the smoke) and one for the water:
// three draw calls however much is burning, none when nothing is.
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";

const MAX_FLAMES = 180;
const MAX_SMOKE = 120;
const MAX_WATER = 160;
const FIRE_COLOUR = new Color("#ff7a26");

function puffTexture(inner, outer) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.45, outer);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A shaded (not glowing) particle material whose per-particle colour carries brightness in red and
 * opacity in green, so smoke and water fade out instead of darkening.
 */
function fadingMaterial(map, key) {
  const material = new MeshBasicMaterial({ map, transparent: true, depthWrite: false });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <color_fragment>",
      `#ifdef USE_INSTANCING_COLOR
        diffuseColor.rgb *= vColor.r;
        diffuseColor.a *= vColor.g;
      #endif`,
    );
  };
  material.customProgramCacheKey = () => key;
  return material;
}

/** An instanced quad pool with per-particle colour (for fading). */
function particlePool(scene, count, material) {
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.instanceColor = new InstancedBufferAttribute(new Float32Array(count * 3).fill(1), 3);
  mesh.instanceColor.setUsage(DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = 3;
  scene.add(mesh);
  return { mesh, live: [] };
}

export function createFire(scene) {
  const flames = particlePool(
    scene,
    MAX_FLAMES,
    new MeshBasicMaterial({
      map: puffTexture("rgba(255,240,190,1)", "rgba(255,120,30,0.65)"),
      color: new Color(1, 1, 1).multiplyScalar(2.4),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const smoke = particlePool(
    scene,
    MAX_SMOKE,
    fadingMaterial(puffTexture("rgba(255,255,255,0.85)", "rgba(255,255,255,0.45)"), "drift-fury-smoke"),
  );
  const water = particlePool(
    scene,
    MAX_WATER,
    fadingMaterial(puffTexture("rgba(255,255,255,0.9)", "rgba(255,255,255,0.4)"), "drift-fury-water"),
  );
  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const position = new Vector3();
  const scale = new Vector3();
  const colour = new Color();
  const lights = []; // this frame's fire lights (for the clustered lighting)
  let flashes = []; // explosion flashes: { x, y, z, life }
  let flicker = 0;

  const emit = (pool, max, particle) => {
    if (pool.live.length < max) pool.live.push(particle);
  };

  return {
    /** Each frame: flames and smoke from every burning thing ({ x, y, z, size 0..1.5 }). */
    burn(sources, dt) {
      lights.length = 0;
      flicker += dt;
      for (const source of sources) {
        const size = source.size;
        // Flames: a few a frame, rising and shrinking.
        const flameCount = Math.round(1 + size * 3 * Math.min(1, dt * 60));
        for (let k = 0; k < flameCount; k++) {
          emit(flames, MAX_FLAMES, {
            x: source.x + (Math.random() - 0.5) * 1.6 * size,
            y: source.y + 0.6 + Math.random() * 0.4,
            z: source.z + (Math.random() - 0.5) * 1.6 * size,
            vy: 1.4 + Math.random() * 1.6,
            size: (0.7 + Math.random() * 0.8) * (0.6 + size * 0.6),
            life: 0.45 + Math.random() * 0.35,
            age: 0,
          });
        }
        if (Math.random() < 0.35 * Math.min(1, dt * 60) * (0.5 + size)) {
          emit(smoke, MAX_SMOKE, {
            x: source.x + (Math.random() - 0.5) * size,
            y: source.y + 1.6,
            z: source.z + (Math.random() - 0.5) * size,
            vy: 1.1 + Math.random() * 0.8,
            size: 1.4 + size,
            life: 3 + Math.random() * 2,
            age: 0,
          });
        }
        // The fire lights its surroundings, flickering.
        if (lights.length < 3) {
          const wave = 0.75 + 0.25 * Math.sin(flicker * 23 + source.x) * Math.sin(flicker * 17 + source.z);
          lights.push({ x: source.x, y: source.y + 1.6, z: source.z, intensity: 40 * size * wave, range: 14, colour: FIRE_COLOUR });
        }
      }
    },
    /** An explosion at (x, y, z): a fireball, a flash and a burst of smoke. */
    explode(x, y, z) {
      for (let k = 0; k < 40; k++) {
        const angle = Math.random() * Math.PI * 2;
        const out = Math.random() * 4.5;
        emit(flames, MAX_FLAMES, {
          x,
          y: y + 0.8,
          z,
          vx: Math.cos(angle) * out,
          vz: Math.sin(angle) * out,
          vy: 1.5 + Math.random() * 5,
          size: 2 + Math.random() * 2.2,
          life: 0.5 + Math.random() * 0.5,
          age: 0,
        });
      }
      for (let k = 0; k < 14; k++) {
        emit(smoke, MAX_SMOKE, {
          x: x + (Math.random() - 0.5) * 3,
          y: y + 1.5 + Math.random() * 2,
          z: z + (Math.random() - 0.5) * 3,
          vy: 1.5 + Math.random() * 2,
          size: 2.5 + Math.random() * 2,
          life: 4 + Math.random() * 3,
          age: 0,
        });
      }
      flashes.push({ x, y: y + 2, z, life: 0.35 });
    },
    /** Water from a hose: from (x, y, z) toward (tx, ty, tz). */
    spray(x, y, z, tx, ty, tz, dt) {
      const count = Math.round(4 * Math.min(1, dt * 60));
      for (let k = 0; k < count; k++) {
        const dx = tx - x;
        const dz = tz - z;
        const d = Math.hypot(dx, dz) || 1;
        const speed = 11 + Math.random() * 2;
        const time = d / speed;
        emit(water, MAX_WATER, {
          x,
          y,
          z,
          vx: (dx / d) * speed + (Math.random() - 0.5) * 0.8,
          vz: (dz / d) * speed + (Math.random() - 0.5) * 0.8,
          // (Thrown up just enough to arc down onto the target.)
          vy: (ty - y) / time + 4.9 * time + (Math.random() - 0.5) * 0.6,
          gravity: true,
          size: 0.25 + Math.random() * 0.2,
          life: time + 0.25,
          age: 0,
        });
      }
    },
    /** Moves and draws the particles; `camera` to face them to it. */
    update(dt, camera) {
      quaternion.copy(camera.quaternion);
      const step = (pool, fade) => {
        let write = 0;
        for (let i = 0; i < pool.live.length; i++) {
          const p = pool.live[i];
          p.age += dt;
          if (p.age >= p.life) continue;
          if (p.gravity) p.vy -= 9.8 * dt;
          p.x += (p.vx || 0) * dt;
          p.y += p.vy * dt;
          p.z += (p.vz || 0) * dt;
          if (p.vx) p.vx *= 1 - 2.5 * dt * (p.gravity ? 0 : 1);
          if (p.vz) p.vz *= 1 - 2.5 * dt * (p.gravity ? 0 : 1);
          pool.live[write] = p;
          const t = p.age / p.life;
          const size = fade(p, t, colour);
          position.set(p.x, p.y, p.z);
          scale.set(size, size, size);
          matrix.compose(position, quaternion, scale);
          pool.mesh.setMatrixAt(write, matrix);
          pool.mesh.setColorAt(write, colour);
          write++;
        }
        pool.live.length = write;
        pool.mesh.count = write;
        pool.mesh.visible = write > 0;
        if (write > 0) {
          pool.mesh.instanceMatrix.needsUpdate = true;
          pool.mesh.instanceColor.needsUpdate = true;
        }
      };
      // Flames: white-hot, then orange, fading as they rise and shrink.
      step(flames, (p, t, c) => {
        const fade = (1 - t) * (1 - t);
        c.setRGB(fade, fade * (0.75 - 0.35 * t), fade * (0.45 - 0.35 * t));
        return p.size * (1 - 0.55 * t);
      });
      // Smoke: dark grey, grows and thins out (red: brightness, green: opacity; see fadingMaterial).
      step(smoke, (p, t, c) => {
        c.setRGB(0.16, Math.min(1, t * 5) * (1 - t) * 0.9, 0);
        return p.size * (0.6 + 1.6 * t);
      });
      // Water: bright spray, fading at the end of its arc.
      step(water, (p, t, c) => {
        c.setRGB(0.85, 0.75 * (1 - t * t), 0);
        return p.size * (1 + t);
      });
      flashes = flashes.filter((flash) => (flash.life -= dt) > 0);
    },
    /** The lights of the fires and explosions this frame, for the clustered lighting. */
    lights() {
      const all = lights.slice();
      for (const flash of flashes) {
        all.push({ x: flash.x, y: flash.y, z: flash.z, intensity: 900 * flash.life, range: 30, colour: FIRE_COLOUR });
      }
      return all;
    },
  };
}
