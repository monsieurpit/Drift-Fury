// Sparks: metal grinding on concrete or another car throws hot specks that streak, fall and bounce. One
// instanced mesh of thin streaks, stretched along their motion, glowing (the bloom picks them up).
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from "three";

const MAX_SPARKS = 220;

/** `groundAt(x, z)`: the surface height there. Returns { emit(x, y, z, awayX, awayZ, speed, count), update(dt) }. */
export function createSparks(scene, groundAt) {
  const geometry = new BoxGeometry(0.014, 0.014, 1);
  geometry.translate(0, 0, 0.5); // (+Z is turned to point back along the motion: the streak trails its head)
  const material = new MeshBasicMaterial({
    color: new Color(1.0, 0.62, 0.22).multiplyScalar(6),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new InstancedMesh(geometry, material, MAX_SPARKS);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.instanceColor = null;
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.visible = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);
  const live = [];
  const dummy = new Object3D();

  return {
    /**
     * Throws `count` sparks from (x, y, z), mostly away from the surface (awayX, awayZ: unit, horizontal)
     * and along the car's motion (speed, m/s, vx/vz of the car).
     */
    emit(x, y, z, awayX, awayZ, vx, vz, count) {
      const n = Math.min(count, MAX_SPARKS - live.length);
      for (let i = 0; i < n; i++) {
        const spread = 2 + Math.random() * 5;
        live.push({
          x,
          y,
          z,
          vx: vx * (0.35 + Math.random() * 0.5) + awayX * spread + (Math.random() - 0.5) * 3,
          vy: 0.8 + Math.random() * 3.2,
          vz: vz * (0.35 + Math.random() * 0.5) + awayZ * spread + (Math.random() - 0.5) * 3,
          life: 0.25 + Math.random() * 0.45,
          bounced: false,
        });
      }
    },
    /** Whether any spark is flying (for the flicker of light they throw). */
    get active() {
      return live.length > 0;
    },
    update(dt) {
      let write = 0;
      for (let i = 0; i < live.length; i++) {
        const spark = live[i];
        spark.life -= dt;
        if (spark.life <= 0) continue;
        spark.vy -= 9.8 * dt;
        spark.vx *= 1 - 0.6 * dt;
        spark.vz *= 1 - 0.6 * dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.z += spark.vz * dt;
        const ground = groundAt(spark.x, spark.z) + 0.02;
        if (spark.y < ground) {
          if (spark.bounced) continue;
          spark.y = ground;
          spark.vy *= -0.35;
          spark.vx *= 0.6;
          spark.vz *= 0.6;
          spark.bounced = true;
        }
        live[write++] = spark;
        const speed = Math.hypot(spark.vx, spark.vy, spark.vz);
        dummy.position.set(spark.x, spark.y, spark.z);
        dummy.lookAt(spark.x - spark.vx, spark.y - spark.vy, spark.z - spark.vz);
        const length = Math.min(0.5, 0.02 + speed * 0.022) * Math.min(1, spark.life * 4);
        dummy.scale.set(1, 1, length);
        dummy.updateMatrix();
        mesh.setMatrixAt(write - 1, dummy.matrix);
      }
      live.length = write;
      mesh.count = write;
      mesh.visible = write > 0;
      if (write > 0) mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
