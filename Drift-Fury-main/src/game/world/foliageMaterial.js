// Conifer foliage: vertex-coloured crowns get needle-cluster detail from a generated texture projected in
// world space from three axes (so any branch orientation works), modulating both colour and normal.
// That turns flat low-poly whorls into something that reads as needles without extra geometry.
import { CanvasTexture, MeshStandardMaterial, NoColorSpace, RepeatWrapping } from "three";
import { createRandom } from "../util/random.js";
import { normalMapFromHeight } from "./textures.js";

function needleTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const random = createRandom(2024);
  context.fillStyle = "#3a3a3a";
  context.fillRect(0, 0, size, size);
  // Clusters of short needles radiating from twig points, drawn three times offset so the tile wraps.
  for (let cluster = 0; cluster < 260; cluster++) {
    const cx = random() * size;
    const cy = random() * size;
    const brightness = 70 + random() * 150;
    const count = 10 + Math.floor(random() * 14);
    for (let n = 0; n < count; n++) {
      const angle = random() * Math.PI * 2;
      const length = 4 + random() * 9;
      const shade = Math.floor(brightness * (0.7 + random() * 0.5));
      context.strokeStyle = `rgb(${shade},${shade},${shade})`;
      context.lineWidth = 0.8 + random() * 0.9;
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          context.beginPath();
          context.moveTo(cx + ox, cy + oy);
          context.lineTo(cx + ox + Math.cos(angle) * length, cy + oy + Math.sin(angle) * length);
          context.stroke();
        }
      }
    }
  }
  const map = new CanvasTexture(canvas);
  map.wrapS = map.wrapT = RepeatWrapping;
  map.colorSpace = NoColorSpace; // used as a brightness mask, not a colour
  map.anisotropy = 4;
  const normalMap = normalMapFromHeight(canvas, 3.2);
  normalMap.colorSpace = NoColorSpace;
  return { map, normalMap };
}

const DECLARATIONS = /* glsl */ `
uniform sampler2D foliageNeedles;
uniform sampler2D foliageNeedleNormal;
varying vec3 vFoliagePosition;
varying vec3 vFoliageNormal;
float foliageMask;
vec3 foliageWeights(vec3 n) { vec3 w = pow(abs(n), vec3(4.0)); return w / (w.x + w.y + w.z); }
`;

const COLOR = /* glsl */ `
#include <color_fragment>
{
  vec3 p = vFoliagePosition / 1.4;
  vec3 w = foliageWeights(normalize(vFoliageNormal));
  foliageMask = texture2D(foliageNeedles, p.zy).r * w.x + texture2D(foliageNeedles, p.xz).r * w.y + texture2D(foliageNeedles, p.xy).r * w.z;
  diffuseColor.rgb *= mix(0.45, 1.55, foliageMask);
}
`;

const NORMAL = /* glsl */ `
{
  vec3 n = normalize(vFoliageNormal);
  vec3 p = vFoliagePosition / 1.4;
  vec3 w = foliageWeights(n);
  vec3 tx = texture2D(foliageNeedleNormal, p.zy).xyz * 2.0 - 1.0;
  vec3 ty = texture2D(foliageNeedleNormal, p.xz).xyz * 2.0 - 1.0;
  vec3 tz = texture2D(foliageNeedleNormal, p.xy).xyz * 2.0 - 1.0;
  tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x);
  ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y);
  tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
  vec3 worldNormal = normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
  normal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
}
`;

let shared = null;

/** Material for pine crowns (vertex colours + per-instance tint + needle detail). */
export function createFoliageMaterial() {
  if (!shared) shared = needleTexture();
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.foliageNeedles = { value: shared.map };
    shader.uniforms.foliageNeedleNormal = { value: shared.normalMap };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vFoliagePosition;\nvarying vec3 vFoliageNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "#ifdef USE_INSTANCING",
          "  vFoliagePosition = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;",
          "  vFoliageNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);",
          "#else",
          "  vFoliagePosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          "  vFoliageNormal = normalize(mat3(modelMatrix) * objectNormal);",
          "#endif",
        ].join("\n"),
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + DECLARATIONS)
      .replace("#include <color_fragment>", COLOR)
      .replace("#include <normal_fragment_maps>", NORMAL);
  };
  material.customProgramCacheKey = () => "drift-fury-foliage";
  return material;
}
