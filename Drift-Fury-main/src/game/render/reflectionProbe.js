import { CubeCamera, HalfFloatType, PMREMGenerator, WebGLCubeRenderTarget } from "three";

/**
 * A reflection probe for the city: the lit streets (windows, shop fronts, street lamps, signs) rendered once
 * into a cube map from street level, so car paint, glass and chrome reflect the city around them instead of
 * the dark sky. Rendered at 512 per face like the sky environment, so swapping the two never changes a
 * shader (no recompiles). `hidden` objects (the player's car) are left out of the capture.
 */
export function captureCityEnvironment(renderer, scene, position, hidden = []) {
  const target = new WebGLCubeRenderTarget(512, { type: HalfFloatType });
  const camera = new CubeCamera(0.5, 1200, target);
  camera.position.copy(position);
  const visibility = hidden.map((object) => object.visible);
  hidden.forEach((object) => (object.visible = false));
  const previousEnvironment = scene.environment;
  scene.environment = null;
  renderer.shadowMap.needsUpdate = true;
  camera.update(renderer, scene);
  scene.environment = previousEnvironment;
  hidden.forEach((object, index) => (object.visible = visibility[index]));
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromCubemap(target.texture).texture;
  pmrem.dispose();
  target.dispose();
  return environment;
}
