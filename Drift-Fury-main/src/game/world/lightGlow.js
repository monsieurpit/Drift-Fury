// Light in the humid night air: a soft halo around each light source (camera-facing, additive) and, for the
// street lamps, a faint cone of light falling to the ground. Each kind is one instanced mesh, so all the
// lamps in the city cost two draw calls. Halos and cones fade with distance so far streets stay clean.
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  ConeGeometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";

function haloTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.14)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.03)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Camera-facing additive halos at `positions` ([{x, y, z}]) of `size` metres. */
export function addHalos(
  scene,
  positions,
  { color = "#ffd7a0", size = 2.4, intensity = 0.55, fadeDistance = 160 } = {},
) {
  const material = new MeshBasicMaterial({
    map: haloTexture(),
    color: new Color(color).multiplyScalar(intensity),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vHaloFade;")
      .replace(
        "#include <project_vertex>",
        `vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
float haloSize = length(instanceMatrix[0].xyz);
mvPosition.xy += position.xy * haloSize;
// Pulled slightly toward the camera so the halo isn't cut by the lamp's own housing.
mvPosition.xyz += normalize(-mvPosition.xyz) * 0.4;
float haloDistance = length(mvPosition.xyz);
// Fades far away, and also right next to the camera (driving under a lamp must not flash the screen).
vHaloFade = (1.0 - smoothstep(${(fadeDistance * 0.6).toFixed(1)}, ${fadeDistance.toFixed(1)}, haloDistance)) * smoothstep(3.0, 9.0, haloDistance);
gl_Position = projectionMatrix * mvPosition;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vHaloFade;")
      .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb *= vHaloFade;");
  };
  material.customProgramCacheKey = () => "drift-fury-halo";
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, positions.length);
  const matrix = new Matrix4();
  positions.forEach((p, index) => {
    matrix.makeScale(size, size, size).setPosition(p.x, p.y, p.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  mesh.name = "light-halos";
  scene.add(mesh);
  return mesh;
}

/**
 * Faint cones of lit air under downward lamps at `positions` (the lamp heads), `height` metres tall and
 * `radius` wide at the ground: brightest just under the lamp and along the cone's edge seen side-on.
 */
export function addLightCones(
  scene,
  positions,
  { color = "#ffd7a0", height = 6.6, radius = 3.4, intensity = 0.05 } = {},
) {
  const geometry = new ConeGeometry(radius, height, 24, 1, true);
  geometry.translate(0, -height / 2, 0); // apex at the lamp
  const material = new MeshBasicMaterial({
    color: new Color(color).multiplyScalar(intensity),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: 2,
    fog: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vConeDown;\nvarying vec3 vConeNormal;\nvarying vec3 vConeView;",
      )
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
vConeDown = clamp(-position.y / ${height.toFixed(2)}, 0.0, 1.0);
vConeNormal = normalize(normalMatrix * normal);
vConeView = normalize(-mvPosition.xyz);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying float vConeDown;\nvarying vec3 vConeNormal;\nvarying vec3 vConeView;",
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
// Lit air is densest along the axis and fades to nothing at the cone's silhouette (no hard edge); it
// thins out away from the lamp and right at the lamp head, and with distance from the camera.
float facing = abs(dot(normalize(vConeNormal), vConeView));
// (And none of it right in front of the camera: passing through a cone would wash out the whole screen.)
float coneDepth = 1.0 / max(gl_FragCoord.w, 1e-4);
diffuseColor.rgb *= pow(facing, 2.0) * pow(1.0 - vConeDown, 1.4) * smoothstep(0.0, 0.08, vConeDown) * (1.0 - smoothstep(60.0, 120.0, coneDepth)) * smoothstep(4.0, 12.0, coneDepth);`,
      );
  };
  material.customProgramCacheKey = () => "drift-fury-light-cone";
  const mesh = new InstancedMesh(geometry, material, positions.length);
  const matrix = new Matrix4();
  positions.forEach((p, index) => {
    matrix.makeTranslation(p.x, p.y, p.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.renderOrder = 6;
  mesh.name = "light-cones";
  mesh.frustumCulled = false; // instances span the whole city
  mesh.computeBoundingSphere();
  scene.add(mesh);
  return mesh;
}
