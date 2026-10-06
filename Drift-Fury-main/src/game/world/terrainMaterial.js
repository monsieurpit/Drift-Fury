// Mountain ground material: a MeshStandardMaterial whose colour, roughness and normal are replaced by a blend
// of grass (flat ground), rock (steep ground, projected from three axes so cliffs don't stretch) and snow
// (high and not too steep), all broken up by large-scale variation so the tiling never shows.
import { MeshStandardMaterial, Vector2, Vector3 } from "three";
import { getTerrainTextures } from "./terrainTextures.js";
import { scannedSet } from "./scannedTextures.js";

const SHADER_DECLARATIONS = /* glsl */ `
uniform sampler2D terrainRock;
uniform sampler2D terrainRockNormal;
uniform sampler2D terrainGrass;
uniform sampler2D terrainGrassNormal;
uniform sampler2D terrainSnow;
uniform sampler2D terrainSnowNormal;
uniform sampler2D terrainMacro;
uniform vec2 terrainSnowLine;
uniform float terrainRockBias;
uniform vec3 terrainRockAverage;
uniform vec3 terrainGrassAverage;
uniform vec3 terrainGrassTarget;
uniform vec3 terrainSnowAverage;
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;

vec3 terrainWeights;
float terrainRockAmount;
float terrainSnowAmount;
float terrainGrassDry;
float terrainFar;
float terrainRockMix;
float terrainDetail;
float terrainRockDetail;

// Triplanar blend weights from the world normal (sharpened so each face mostly uses one projection).
vec3 triplanarWeights(vec3 n) {
  vec3 w = pow(abs(n), vec3(5.0));
  return w / (w.x + w.y + w.z);
}
// Layers are only sampled where they contribute (most pixels are pure grass or pure rock), so texture reads
// happen inside branches; mip selection therefore uses position derivatives taken outside them (dx, dy).
vec3 terrainDx;
vec3 terrainDy;
vec4 sampleGrad(sampler2D map, vec2 uv, vec2 dx, vec2 dy) {
  return textureGrad(map, uv, dx, dy);
}
vec3 triplanarColor(sampler2D map, vec3 p, vec3 dx, vec3 dy, vec3 w, float scale) {
  vec3 color = vec3(0.0);
  if (w.x > 0.01) color += sampleGrad(map, p.zy * scale, dx.zy * scale, dy.zy * scale).rgb * w.x;
  if (w.y > 0.01) color += sampleGrad(map, p.xz * scale, dx.xz * scale, dy.xz * scale).rgb * w.y;
  if (w.z > 0.01) color += sampleGrad(map, p.xy * scale, dx.xy * scale, dy.xy * scale).rgb * w.z;
  return color / max(dot(step(vec3(0.01), w), w), 1e-4);
}
// "Whiteout" triplanar normal blending (each projection's tangent normal reoriented onto the surface).
vec3 triplanarNormal(sampler2D map, vec3 p, vec3 dx, vec3 dy, vec3 n, vec3 w, float scale, float strength) {
  vec3 result = vec3(0.0);
  if (w.x > 0.01) {
    vec3 t = sampleGrad(map, p.zy * scale, dx.zy * scale, dy.zy * scale).xyz * 2.0 - 1.0;
    t.xy *= strength;
    result += vec3(abs(t.z) * n.x, t.y + n.y, t.x + n.z) * w.x;
  }
  if (w.y > 0.01) {
    vec3 t = sampleGrad(map, p.xz * scale, dx.xz * scale, dy.xz * scale).xyz * 2.0 - 1.0;
    t.xy *= strength;
    result += vec3(t.x + n.x, abs(t.z) * n.y, t.y + n.z) * w.y;
  }
  if (w.z > 0.01) {
    vec3 t = sampleGrad(map, p.xy * scale, dx.xy * scale, dy.xy * scale).xyz * 2.0 - 1.0;
    t.xy *= strength;
    result += vec3(t.x + n.x, t.y + n.y, abs(t.z) * n.z) * w.z;
  }
  return normalize(result);
}
// Two samples at unrelated scales, mixed by large-scale noise, hide the repeat of ground textures.
vec4 antiTile(sampler2D map, vec2 p, vec2 dx, vec2 dy, float scale, float blend) {
  vec4 a = blend < 0.995 ? sampleGrad(map, p * scale, dx * scale, dy * scale) : vec4(0.0);
  vec2 rotated = vec2(p.y, -p.x) * scale * 0.37 + 0.31;
  vec4 b = blend > 0.005 ? sampleGrad(map, rotated, vec2(dx.y, -dx.x) * scale * 0.37, vec2(dy.y, -dy.x) * scale * 0.37) : vec4(0.0);
  return mix(a, b, blend);
}
`;

const COLOR_CHUNK = /* glsl */ `
{
  vec3 p = vTerrainPosition;
  terrainDx = dFdx(p);
  terrainDy = dFdy(p);
  vec3 n = normalize(vTerrainNormal);
  vec3 macro = texture2D(terrainMacro, p.xz * 0.0021).rgb;
  vec3 macroFine = texture2D(terrainMacro, p.xz * 0.019).rgb;
  float slope = 1.0 - n.y;
  terrainWeights = triplanarWeights(n);
  terrainRockAmount = smoothstep(0.26, 0.46, slope + terrainRockBias + (macro.g - 0.5) * 0.22 + (macroFine.b - 0.5) * 0.1);
  float snowLine = terrainSnowLine.x + (macro.r - 0.5) * terrainSnowLine.y;
  terrainSnowAmount = smoothstep(snowLine, snowLine + 22.0, p.y + (macroFine.g - 0.5) * 18.0)
    * (1.0 - smoothstep(0.5, 0.78, slope));
  terrainGrassDry = macro.r;
  terrainFar = smoothstep(40.0, 220.0, length(vViewPosition));
  // Rock at two unrelated scales: the near detail (13 m) and a rotated large sample (57 m) that takes over
  // with distance and in macro patches, so cliff faces seen from afar don't show a regular weave.
  terrainRockMix = smoothstep(30.0, 90.0, length(vViewPosition));
  // Past ~150 m the detail textures are below a pixel and average out: use their mean colour and the
  // geometric normal instead of sampling them (most of the terrain on screen is that far away).
  terrainDetail = 1.0 - smoothstep(120.0, 170.0, length(vViewPosition));
  // The large-scale rock (57 m strata and fractures) stays readable much further out.
  terrainRockDetail = 1.0 - smoothstep(350.0, 550.0, length(vViewPosition));
  float grassAmount = (1.0 - terrainRockAmount) * (1.0 - terrainSnowAmount);
  float rockAmount = terrainRockAmount * (1.0 - terrainSnowAmount);

  vec3 color = vec3(0.0);
  bool detail = terrainDetail > 0.002;
  if (rockAmount > 0.002) {
    vec3 rock = terrainRockAverage * (1.0 - terrainRockDetail);
    if (terrainRockMix < 0.998) rock += triplanarColor(terrainRock, p, terrainDx, terrainDy, terrainWeights, 1.0 / 6.0) * (1.0 - terrainRockMix) * terrainRockDetail;
    if (terrainRockMix > 0.002 && terrainRockDetail > 0.002) rock += triplanarColor(terrainRock, p.zyx + vec3(31.0, 0.0, 17.0), terrainDx.zyx, terrainDy.zyx, terrainWeights.zyx, 1.0 / 26.0) * terrainRockMix * terrainRockDetail;
    rock *= mix(0.78, 1.12, macro.b) * mix(0.9, 1.06, macroFine.r);
    color += rock * rockAmount;
  }
  if (grassAmount > 0.002) {
    // The grass scan is rescaled so its average matches the alpine meadow's colour (it was shot in bright,
    // dry daylight); the scan provides the detail.
    vec3 grassScale = terrainGrassTarget / max(terrainGrassAverage, vec3(1e-3));
    vec3 grass = terrainGrassTarget * (1.0 - terrainDetail);
    if (detail) grass += antiTile(terrainGrass, p.xz, terrainDx.xz, terrainDy.xz, 1.0 / 3.0, smoothstep(0.38, 0.62, macro.g)).rgb * grassScale * terrainDetail;
    grass *= mix(0.72, 1.18, macro.r) * mix(0.88, 1.08, macroFine.g);
    grass = mix(grass, grass * vec3(1.18, 1.05, 0.78), smoothstep(0.55, 0.8, macro.b) * 0.6);
    color += grass * grassAmount;
  }
  if (terrainSnowAmount > 0.002) {
    vec3 snow = terrainSnowAverage * (1.0 - terrainDetail);
    if (detail) snow += antiTile(terrainSnow, p.xz, terrainDx.xz, terrainDy.xz, 1.0 / 3.0, smoothstep(0.38, 0.62, macro.b)).rgb * terrainDetail;
    color += snow * terrainSnowAmount;
  }
  diffuseColor.rgb *= color;
}
`;

const ROUGHNESS_CHUNK = /* glsl */ `
float roughnessFactor = mix(mix(0.97, 0.86, terrainRockAmount), 0.62, terrainSnowAmount);
`;

const NORMAL_CHUNK = /* glsl */ `
{
  vec3 p = vTerrainPosition;
  vec3 n = normalize(vTerrainNormal);
  float rockAmount = terrainRockAmount;
  // Each layer's detail normal fades to the geometric normal at the distance its texture stops reading.
  vec3 rockN = n;
  if (rockAmount > 0.002 && terrainRockDetail > 0.002) {
    vec3 detailN = vec3(0.0);
    if (terrainRockMix < 0.998) detailN += triplanarNormal(terrainRockNormal, p, terrainDx, terrainDy, n, terrainWeights, 1.0 / 6.0, mix(1.4, 0.5, terrainFar)) * (1.0 - terrainRockMix);
    if (terrainRockMix > 0.002) detailN += triplanarNormal(terrainRockNormal, p.zyx + vec3(31.0, 0.0, 17.0), terrainDx.zyx, terrainDy.zyx, n.zyx, terrainWeights.zyx, 1.0 / 26.0, 1.6).zyx * terrainRockMix;
    rockN = normalize(mix(n, normalize(detailN), terrainRockDetail));
  }
  vec3 groundN = n;
  if (rockAmount < 0.998 && terrainDetail > 0.002) {
    vec2 dx = terrainDx.xz;
    vec2 dy = terrainDy.xz;
    vec3 groundTex = vec3(0.0, 0.0, 1.0);
    if (terrainSnowAmount < 0.998) groundTex = sampleGrad(terrainGrassNormal, p.xz / 3.0, dx / 3.0, dy / 3.0).xyz * 2.0 - 1.0;
    if (terrainSnowAmount > 0.002) groundTex = mix(groundTex, sampleGrad(terrainSnowNormal, p.xz / 3.0, dx / 3.0, dy / 3.0).xyz * 2.0 - 1.0, terrainSnowAmount);
    groundTex.xy *= 0.9;
    groundN = normalize(mix(n, normalize(vec3(groundTex.x + n.x, abs(groundTex.z) * n.y, groundTex.y + n.z)), terrainDetail));
  }
  vec3 worldNormal = normalize(mix(groundN, rockN, rockAmount));
  normal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
}
`;

/** Creates the mountain ground material. `snowLine` = [altitude, random spread]. */
export function createTerrainMaterial({ snowLine = [135, 70], rockBias = 0 } = {}) {
  const textures = getTerrainTextures();
  // Photo-scanned ground (Poly Haven, CC0): cliff rock, leafy meadow grass and snow. The procedural macro
  // variation still breaks up their tiling over large areas.
  const rock = scannedSet("rock_face_03", textures.rock.average);
  const grass = scannedSet("leafy_grass", textures.grass.average);
  const snow = scannedSet("snow_02", textures.snow.average);
  const material = new MeshStandardMaterial({ color: "#ffffff", roughness: 1, metalness: 0 });
  const uniforms = {
    terrainRock: { value: rock.map },
    terrainRockNormal: { value: rock.normalMap },
    terrainGrass: { value: grass.map },
    terrainGrassNormal: { value: grass.normalMap },
    terrainSnow: { value: snow.map },
    terrainSnowNormal: { value: snow.normalMap },
    terrainMacro: { value: textures.macro },
    terrainSnowLine: { value: new Vector2(snowLine[0], snowLine[1]) },
    terrainRockBias: { value: rockBias },
    // Shared vectors, filled in with each scan's real average colour once its image has loaded.
    terrainRockAverage: { value: rock.average },
    terrainGrassAverage: { value: grass.average },
    terrainGrassTarget: { value: new Vector3(...textures.grass.average) },
    terrainSnowAverage: { value: snow.average },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vTerrainPosition;\nvarying vec3 vTerrainNormal;",
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "#ifdef USE_INSTANCING",
          "  vTerrainPosition = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;",
          "  vTerrainNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);",
          "#else",
          "  vTerrainPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          "  vTerrainNormal = normalize(mat3(modelMatrix) * objectNormal);",
          "#endif",
        ].join("\n"),
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + SHADER_DECLARATIONS)
      .replace("#include <map_fragment>", COLOR_CHUNK)
      .replace("#include <roughnessmap_fragment>", ROUGHNESS_CHUNK)
      .replace("#include <normal_fragment_maps>", NORMAL_CHUNK);
  };
  material.customProgramCacheKey = () => "drift-fury-terrain";
  return material;
}
