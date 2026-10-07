// One world-position varying shared by the shader patches that need it (road markings, the baked lamp
// light, the clustered lights). Each of them used to add its own copy; phone and tablet GPUs (iPad,
// iPhone) allow few varyings, and the road shader, once its photo-scanned maps arrived, went over the limit
// and failed to compile mid-game.

const DECLARATION = "varying vec3 vGameWorld;";
const VERTEX = /* glsl */ `{
  vec4 gameWorld = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    gameWorld = batchingMatrix * gameWorld;
  #endif
  #ifdef USE_INSTANCING
    gameWorld = instanceMatrix * gameWorld;
  #endif
  vGameWorld = (modelMatrix * gameWorld).xyz;
}
#include <fog_vertex>`;

/**
 * Makes sure `shader` has the world-position varying (once) and lets the fragment shader read it as
 * `alias`. Call from onBeforeCompile, before using `alias` in the fragment shader.
 */
export function useWorldVarying(shader, alias) {
  if (!shader.vertexShader.includes(DECLARATION)) {
    // (Before fog_vertex rather than after project_vertex: some materials replace project_vertex, like the
    // tyre smoke's billboards.)
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\n" + DECLARATION)
      .replace("#include <fog_vertex>", VERTEX);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + DECLARATION);
  }
  if (alias && alias !== "vGameWorld" && !shader.fragmentShader.includes(`#define ${alias} `)) {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>\n#define ${alias} vGameWorld`,
    );
  }
}
