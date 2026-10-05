// Mountain ground material: a MeshStandardMaterial whose colour, roughness and normal are replaced by a blend
// of grass (flat ground), rock (steep ground, projected from three axes so cliffs don't stretch) and snow
// (high and not too steep), all broken up by large-scale variation so the tiling never shows.
import { MeshStandardMaterial, Vector2 } from "three";
import { getTerrainTextures } from "./terrainTextures.js";

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
varying vec3 vTerrainPosition;
varying vec3 vTerrainNormal;

vec3 terrainWeights;
float terrainRockAmount;
float terrainSnowAmount;
float terrainGrassDry;

// Triplanar blend weights from the world normal (sharpened so each face mostly uses one projection).
vec3 triplanarWeights(vec3 n) {
  vec3 w = pow(abs(n), vec3(5.0));
  return w / (w.x + w.y + w.z);
}
vec3 triplanarColor(sampler2D map, vec3 p, vec3 w, float scale) {
  return texture2D(map, p.zy * scale).rgb * w.x + texture2D(map, p.xz * scale).rgb * w.y + texture2D(map, p.xy * scale).rgb * w.z;
}
// "Whiteout" triplanar normal blending (each projection's tangent normal reoriented onto the surface).
vec3 triplanarNormal(sampler2D map, vec3 p, vec3 n, vec3 w, float scale, float strength) {
  vec3 tx = texture2D(map, p.zy * scale).xyz * 2.0 - 1.0;
  vec3 ty = texture2D(map, p.xz * scale).xyz * 2.0 - 1.0;
  vec3 tz = texture2D(map, p.xy * scale).xyz * 2.0 - 1.0;
  tx.xy *= strength; ty.xy *= strength; tz.xy *= strength;
  tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x);
  ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y);
  tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
  return normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
}
// Two samples at unrelated scales, mixed by large-scale noise, hide the repeat of ground textures.
vec4 antiTile(sampler2D map, vec2 p, float scale, float blend) {
  vec4 a = texture2D(map, p * scale);
  vec4 b = texture2D(map, vec2(p.y, -p.x) * scale * 0.37 + 0.31);
  return mix(a, b, blend);
}
`;

const COLOR_CHUNK = /* glsl */ `
{
  vec3 p = vTerrainPosition;
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

  vec3 rock = triplanarColor(terrainRock, p, terrainWeights, 1.0 / 13.0);
  rock *= mix(0.78, 1.12, macro.b) * mix(0.9, 1.06, macroFine.r);
  vec3 grass = antiTile(terrainGrass, p.xz, 1.0 / 7.5, macro.g).rgb;
  grass *= mix(0.72, 1.18, macro.r) * mix(0.88, 1.08, macroFine.g);
  grass = mix(grass, grass * vec3(1.18, 1.05, 0.78), smoothstep(0.55, 0.8, macro.b) * 0.6);
  vec3 snow = antiTile(terrainSnow, p.xz, 1.0 / 6.0, macro.b).rgb;
  vec3 color = mix(grass, rock, terrainRockAmount);
  color = mix(color, snow, terrainSnowAmount);
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
  vec3 rockN = triplanarNormal(terrainRockNormal, p, n, terrainWeights, 1.0 / 13.0, 1.4);
  vec3 groundTex = mix(texture2D(terrainGrassNormal, p.xz / 7.5).xyz, texture2D(terrainSnowNormal, p.xz / 6.0).xyz, terrainSnowAmount) * 2.0 - 1.0;
  groundTex.xy *= 0.9;
  vec3 groundN = normalize(vec3(groundTex.x + n.x, abs(groundTex.z) * n.y, groundTex.y + n.z));
  vec3 worldNormal = normalize(mix(groundN, rockN, terrainRockAmount));
  normal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);
}
`;

/** Creates the mountain ground material. `snowLine` = [altitude, random spread]. */
export function createTerrainMaterial({ snowLine = [135, 70], rockBias = 0 } = {}) {
  const textures = getTerrainTextures();
  const material = new MeshStandardMaterial({ color: "#ffffff", roughness: 1, metalness: 0 });
  const uniforms = {
    terrainRock: { value: textures.rock.map },
    terrainRockNormal: { value: textures.rock.normalMap },
    terrainGrass: { value: textures.grass.map },
    terrainGrassNormal: { value: textures.grass.normalMap },
    terrainSnow: { value: textures.snow.map },
    terrainSnowNormal: { value: textures.snow.normalMap },
    terrainMacro: { value: textures.macro },
    terrainSnowLine: { value: new Vector2(snowLine[0], snowLine[1]) },
    terrainRockBias: { value: rockBias },
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
