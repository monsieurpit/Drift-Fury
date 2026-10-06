// Conifer foliage: vertex-coloured crowns get needle-cluster detail from a generated texture projected in
// world space from three axes (so any branch orientation works), modulating both colour and normal.
// That turns flat low-poly whorls into something that reads as needles without extra geometry.
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshStandardMaterial,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
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
  // Needle detail only where it can be seen; past ~120 m it averages to the mid-grey of the mask.
  foliageMask = 0.45;
  if (length(vViewPosition) < 120.0) {
    vec3 p = vFoliagePosition / 1.4;
    vec3 w = foliageWeights(normalize(vFoliageNormal));
    foliageMask = texture2D(foliageNeedles, p.zy).r * w.x + texture2D(foliageNeedles, p.xz).r * w.y + texture2D(foliageNeedles, p.xy).r * w.z;
  }
  diffuseColor.rgb *= mix(0.45, 1.55, foliageMask);
}
`;

const NORMAL = /* glsl */ `
if (length(vViewPosition) < 120.0) {
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

/**
 * A spruce branch spray for branch cards: u runs from the trunk (0) to the tip (1), v across the branch with
 * the twig at v = 0.5. Side shoots angle forward off the twig and carry needles; the outline tapers to a
 * point at the tip. Colour is rebuilt from grey levels so transparent texels keep a green colour (canvas
 * drops the colour of alpha-0 pixels, which would darken mipmapped edges).
 */
function branchTexture() {
  const width = 256;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const random = createRandom(5150);
  const mid = height / 2;
  // Half-width of the spray along the branch (narrow at the trunk, widest past the middle, pointed tip).
  const envelope = (t) => Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05) ** 0.8) * (height * 0.46);
  const needles = (x0, y0, angle, length, level) => {
    const count = Math.max(4, Math.floor(length / 1.6));
    for (let n = 0; n < count; n++) {
      const along = n / count;
      const px = x0 + Math.cos(angle) * length * along;
      const py = y0 + Math.sin(angle) * length * along;
      for (const side of [-1, 1]) {
        const needleAngle = angle + side * (0.7 + random() * 0.35);
        const needleLength = (6.5 + random() * 4.5) * (1 - along * 0.3);
        const shade = Math.round(level * (0.75 + random() * 0.4) * (0.8 + along * 0.35));
        context.strokeStyle = `rgb(${Math.min(255, shade)},0,0)`;
        context.lineWidth = 1.1 + random() * 0.6;
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(px + Math.cos(needleAngle) * needleLength, py + Math.sin(needleAngle) * needleLength);
        context.stroke();
      }
    }
  };
  // Main twig.
  context.strokeStyle = "rgb(60,0,0)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, mid);
  context.lineTo(width * 0.97, mid);
  context.stroke();
  needles(0, mid, 0, width * 0.97, 150);
  // Side shoots alternating left and right, angled toward the tip, shorter near both ends.
  for (let i = 0; i < 36; i++) {
    const t = 0.03 + (i / 36) * 0.92 + random() * 0.015;
    const side = i % 2 === 0 ? -1 : 1;
    const length = envelope(t) * (0.9 + random() * 0.25);
    const angle = side * (0.75 + random() * 0.3);
    const x0 = t * width;
    const level = 120 + t * 90;
    context.strokeStyle = "rgb(55,0,0)";
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(x0, mid);
    context.lineTo(x0 + Math.cos(angle) * length, mid + Math.sin(angle) * length);
    context.stroke();
    needles(x0, mid, angle, length, level);
  }
  const pixels = context.getImageData(0, 0, width, height).data;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = (y * width + x) * 4;
      const target = ((height - 1 - y) * width + x) * 4;
      const alpha = pixels[source + 3];
      const level = alpha > 0 ? pixels[source] / 255 : 0.55;
      const t = x / width;
      // Older, darker needles toward the trunk; fresh lighter growth on the outer third.
      const fresh = Math.max(0, t - 0.62) * 2.2 * (level > 0.7 ? 1 : 0.5);
      data[target] = Math.min(255, (34 + fresh * 30) * level * 1.5 + 8);
      data[target + 1] = Math.min(255, (60 + fresh * 38) * level * 1.5 + 12);
      data[target + 2] = Math.min(255, (36 + fresh * 8) * level * 1.5 + 8);
      data[target + 3] = alpha;
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

let branchMap = null;

/**
 * Material for alpha-tested pine branch cards (vertex colours + per-instance tint). Both faces use the
 * geometry's "up and out" normal, and alpha is boosted as the texture minifies so distant crowns stay full
 * instead of dissolving as the needles average away in the mipmaps.
 */
export function createBranchCardMaterial() {
  if (!branchMap) branchMap = branchTexture();
  const material = new MeshStandardMaterial({
    map: branchMap,
    vertexColors: true,
    alphaTest: 0.5,
    side: DoubleSide,
    roughness: 0.9,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          "{",
          "  vec2 texel = vMapUv * vec2(256.0, 128.0);",
          "  float lod = 0.5 * log2(max(dot(dFdx(texel), dFdx(texel)), dot(dFdy(texel), dFdy(texel))));",
          "  diffuseColor.a *= 1.0 + min(max(0.0, lod), 4.0) * 0.25;",
          "}",
        ].join("\n"),
      )
      .replace(
        "#include <normal_fragment_begin>",
        "#include <normal_fragment_begin>\nnormal = normalize(vNormal);\nnonPerturbedNormal = normal;",
      );
  };
  material.customProgramCacheKey = () => "drift-fury-branch-card";
  return material;
}
