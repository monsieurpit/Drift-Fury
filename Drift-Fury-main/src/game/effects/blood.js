// Blood: droplets sprayed by an impact, the splats they leave where they land, and the pool spreading
// under a body. Splats and pools are flat decals with an irregular shape (drawn once on a canvas): dark,
// thick and glossy like fresh blood, so the street lamps catch their wet surface.
import {
  CanvasTexture,
  DynamicDrawUsage,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";

const MAX_DROPS = 220;
const MAX_SPLATS = 160;
const MAX_POOLS = 24;

/** An irregular stain: a dense core, lobes and satellite droplets, with a darker clotted centre. */
function stainTexture(seed, satellites) {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const blob = (x, y, radius, alpha) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(92, 4, 6, ${alpha})`);
    gradient.addColorStop(0.7, `rgba(120, 8, 10, ${alpha})`);
    gradient.addColorStop(1, "rgba(120, 8, 10, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };
  const c = size / 2;
  for (let i = 0; i < 26; i++) {
    const angle = random() * Math.PI * 2;
    const distance = random() * size * 0.16;
    blob(c + Math.cos(angle) * distance, c + Math.sin(angle) * distance, size * (0.1 + random() * 0.14), 1);
  }
  for (let i = 0; i < satellites; i++) {
    const angle = random() * Math.PI * 2;
    const distance = size * (0.22 + random() * 0.24);
    blob(c + Math.cos(angle) * distance, c + Math.sin(angle) * distance, size * (0.012 + random() * 0.03), 0.95);
  }
  // Clotting: a darker, thicker middle.
  const core = context.createRadialGradient(c, c, 0, c, c, size * 0.2);
  core.addColorStop(0, "rgba(40, 0, 2, 0.55)");
  core.addColorStop(1, "rgba(40, 0, 2, 0)");
  context.fillStyle = core;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function decalMaterial(map) {
  return new MeshStandardMaterial({
    map,
    color: "#ffffff",
    transparent: true,
    depthWrite: false,
    roughness: 0.12,
    metalness: 0,
    // Drawn over the road and sidewalk without fighting them for depth.
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
}

/**
 * The blood effects. `groundAt(x, z)` gives the height of the surface (road or sidewalk top) there.
 * Returns { spray(position, velocity, amount), pool(x, z), update(dt) }.
 */
export function createBlood(scene, groundAt, { patch } = {}) {
  const dropMaterial = new MeshStandardMaterial({ color: "#5a0306", roughness: 0.2, metalness: 0 });
  patch?.(dropMaterial);
  const drops = new InstancedMesh(new IcosahedronGeometry(0.022, 0), dropMaterial, MAX_DROPS);
  drops.instanceMatrix.setUsage(DynamicDrawUsage);
  drops.count = 0;
  drops.frustumCulled = false;
  drops.visible = false;
  scene.add(drops);

  const splatMaterial = decalMaterial(stainTexture(97, 18));
  const poolMaterial = decalMaterial(stainTexture(4242, 7));
  patch?.(splatMaterial);
  patch?.(poolMaterial);
  const flat = new PlaneGeometry(1, 1);
  flat.rotateX(-Math.PI / 2);
  const splats = new InstancedMesh(flat, splatMaterial, MAX_SPLATS);
  splats.count = 0;
  splats.frustumCulled = false;
  splats.visible = false;
  splats.renderOrder = 2;
  scene.add(splats);
  const pools = new InstancedMesh(flat, poolMaterial, MAX_POOLS);
  pools.count = 0;
  pools.frustumCulled = false;
  pools.visible = false;
  pools.renderOrder = 1;
  scene.add(pools);

  const live = []; // { position, velocity, size }
  let nextSplat = 0;
  let splatCount = 0;
  const poolList = []; // { x, z, y, size, target, angle }
  const dummy = new Object3D();
  const matrix = new Matrix4();

  function addSplat(x, z, size) {
    dummy.position.set(x, groundAt(x, z) + 0.004, z);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
    dummy.scale.set(size * (0.7 + Math.random() * 0.6), 1, size);
    dummy.updateMatrix();
    splats.setMatrixAt(nextSplat, dummy.matrix);
    nextSplat = (nextSplat + 1) % MAX_SPLATS;
    splatCount = Math.min(MAX_SPLATS, splatCount + 1);
    splats.count = splatCount;
    splats.visible = true;
    splats.instanceMatrix.needsUpdate = true;
  }

  return {
    /** Sprays `amount` droplets (about 1 per 0.1 m/s of impact) from `position`, flung along `velocity`. */
    spray(position, velocity, amount) {
      const count = Math.min(amount, MAX_DROPS - live.length);
      for (let i = 0; i < count; i++) {
        const spread = new Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(
          3 + velocity.length() * 0.25,
        );
        live.push({
          position: position.clone().add(new Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.5, (Math.random() - 0.5) * 0.4)),
          velocity: velocity.clone().multiplyScalar(0.4 + Math.random() * 0.5).add(spread),
          size: 0.6 + Math.random() * 1.4,
        });
      }
      // The hit itself marks the ground.
      addSplat(position.x, position.z, 0.5 + Math.random() * 0.4);
    },
    /** A pool spreading under a body at (x, z) over the next seconds. */
    pool(x, z) {
      if (poolList.length >= MAX_POOLS) poolList.shift();
      poolList.push({ x, z, size: 0.15, target: 1.3 + Math.random() * 0.9, angle: Math.random() * Math.PI * 2 });
    },
    /** Moves a pool with the body lying in it (when the body is pushed). */
    movePool(index, x, z) {
      const pool = poolList[index];
      if (pool) {
        pool.x = x;
        pool.z = z;
      }
    },
    update(dt) {
      let write = 0;
      for (let i = 0; i < live.length; i++) {
        const drop = live[i];
        drop.velocity.y -= 9.8 * dt;
        drop.velocity.multiplyScalar(1 - 0.4 * dt);
        drop.position.addScaledVector(drop.velocity, dt);
        const ground = groundAt(drop.position.x, drop.position.z);
        if (drop.position.y <= ground) {
          addSplat(drop.position.x, drop.position.z, 0.06 + drop.size * 0.09);
          continue;
        }
        live[write++] = drop;
        const stretch = 1 + Math.min(2.5, drop.velocity.length() * 0.12);
        dummy.position.copy(drop.position);
        dummy.lookAt(drop.position.x + drop.velocity.x, drop.position.y + drop.velocity.y, drop.position.z + drop.velocity.z);
        dummy.scale.set(drop.size, drop.size, drop.size * stretch);
        dummy.updateMatrix();
        drops.setMatrixAt(write - 1, dummy.matrix);
      }
      live.length = write;
      drops.count = write;
      drops.visible = write > 0;
      drops.instanceMatrix.needsUpdate = true;
      // Pools spread fast at first, then slower, like blood soaking out over the asphalt.
      for (let i = 0; i < poolList.length; i++) {
        const pool = poolList[i];
        pool.size += (pool.target - pool.size) * (1 - Math.exp(-0.35 * dt));
        matrix.makeRotationY(pool.angle);
        matrix.scale(new Vector3(pool.size * 1.25, 1, pool.size));
        matrix.setPosition(pool.x, groundAt(pool.x, pool.z) + 0.003, pool.z);
        pools.setMatrixAt(i, matrix);
      }
      pools.count = poolList.length;
      pools.visible = poolList.length > 0;
      pools.instanceMatrix.needsUpdate = true;
    },
  };
}
