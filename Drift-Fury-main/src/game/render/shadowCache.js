// Moonlight shadows with the static world cached.
//
// The shadow map covers a 180 m box around the player and used to be re-rendered every frame: every
// building, pole, tree and boulder in the box drawn again into it, although none of them ever moves. Here
// the box is snapped to a grid, the static world is rendered into it only when the box moves to a new
// grid cell (a few times a second at full speed, never when parked), and that result is kept in a second
// target. Each frame the cached static shadows are copied back (one framebuffer blit of colour and depth)
// and only the things that move (the player's car, police and traffic cars, people) are drawn on top,
// depth-tested against the static ones. The shadow map ends up exactly what a full render would give.
import { WebGLRenderTarget, NearestFilter } from "three";

/**
 * `staticRoots`: the scene's children that never move (the world, built before the session adds cars and
 * people); everything else in the scene is treated as moving. Returns { update(centerX, centerY, centerZ),
 * invalidate() }; `update` aims the light at the snapped centre and refreshes its shadow map.
 */
export function createShadowCache(renderer, scene, camera, sun, staticRoots, direction, { grid = 10 } = {}) {
  const gl = renderer.getContext();
  const shadowMap = renderer.shadowMap;
  const isWebGL2 = renderer.capabilities.isWebGL2;
  let staticTarget = null;
  let cachedMap = null;
  let cachedKey = "";

  function blit(from, to) {
    const state = renderer.state;
    renderer.initRenderTarget?.(from);
    renderer.initRenderTarget?.(to);
    const source = renderer.properties.get(from).__webglFramebuffer;
    const destination = renderer.properties.get(to).__webglFramebuffer;
    state.bindFramebuffer(gl.READ_FRAMEBUFFER, source);
    state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destination);
    gl.blitFramebuffer(
      0,
      0,
      from.width,
      from.height,
      0,
      0,
      to.width,
      to.height,
      gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );
    state.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    state.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  // The cache runs inside three.js's own shadow pass (it needs the renderer's per-frame state), so the
  // renderer's shadow map render is wrapped: when an update is due for the game scene, it renders the
  // static world (when needed) and the moving things itself; any other call goes through unchanged.
  const renderOriginal = shadowMap.render;
  let due = false;
  shadowMap.render = function (lights, target, viewCamera) {
    if (!due || target !== scene || !isWebGL2 || !sun.castShadow || !this.enabled) {
      renderOriginal.call(this, lights, target, viewCamera);
      return;
    }
    due = false;
    const target0 = renderer.getRenderTarget();
    const face0 = renderer.getActiveCubeFace();
    const level0 = renderer.getActiveMipmapLevel();
    const renderInto = (root) => {
      shadowMap.needsUpdate = true;
      renderOriginal.call(this, lights, root, viewCamera);
    };
    const map = sun.shadow.map;
    const moving = [];
    for (const child of scene.children) if (!staticRoots.has(child) && child.visible) moving.push(child);
    if (!map || map !== cachedMap || cachedKey !== key) {
      // New cell (or a new shadow map after a quality change): render the static world once.
      for (const object of moving) object.visible = false;
      renderInto(scene);
      for (const object of moving) object.visible = true;
      const fresh = sun.shadow.map;
      if (!staticTarget || staticTarget.width !== fresh.width || staticTarget.height !== fresh.height) {
        staticTarget?.dispose();
        staticTarget = new WebGLRenderTarget(fresh.width, fresh.height, {
          minFilter: NearestFilter,
          magFilter: NearestFilter,
        });
      }
      blit(fresh, staticTarget);
      cachedMap = fresh;
      cachedKey = key;
    } else {
      blit(staticTarget, map);
    }
    // Then the moving things on top, without clearing what is there.
    const clear = renderer.clear;
    renderer.clear = () => {};
    try {
      for (const object of moving) renderInto(object);
    } finally {
      renderer.clear = clear;
    }
    shadowMap.needsUpdate = false;
    // The blits bypassed the renderer: bind the target it was rendering to again.
    renderer.setRenderTarget(target0, face0, level0);
  };
  let key = "";

  return {
    invalidate() {
      cachedKey = "";
    },
    /** Aims the light at (x, y, z), snapped to the grid, and has the next render refresh the shadows. */
    update(x, y, z) {
      // Aim the light at the centre of the grid cell, so the box (and the cache) only changes cell to cell.
      const cx = Math.round(x / grid) * grid;
      const cy = Math.round(y / 4) * 4;
      const cz = Math.round(z / grid) * grid;
      sun.position.set(cx + direction.x * 127, cy + direction.y * 127, cz + direction.z * 127);
      sun.target.position.set(cx, cy, cz);
      sun.updateMatrixWorld();
      sun.target.updateMatrixWorld();
      key = `${cx}|${cy}|${cz}`;
      due = true;
      shadowMap.needsUpdate = true;
    },
    dispose() {
      shadowMap.render = renderOriginal;
      staticTarget?.dispose();
    },
  };
}
