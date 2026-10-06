import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  Vector2,
  Scene,
  Color,
  Fog,
  WebGLRenderer,
  PerspectiveCamera,
  HemisphereLight,
  AmbientLight,
  DirectionalLight,
  CanvasTexture,
  PMREMGenerator,
} from "three";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
function createComposer(renderer, scene, camera, width, height, bloomStrength) {
  const composer = new EffectComposer(renderer);
  if (renderer.capabilities.isWebGL2) {
    composer.renderTarget1.samples = Math.min(4, renderer.capabilities.maxSamples);
    composer.renderTarget2.samples = Math.min(4, renderer.capabilities.maxSamples);
  }
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new Vector2(width, height), bloomStrength, 0.4, 0.92));
  const vignette = new ShaderPass(VignetteShader);
  vignette.uniforms.offset.value = 0.95;
  vignette.uniforms.darkness.value = 1.08;
  composer.addPass(vignette);
  composer.addPass(new OutputPass());
  return composer;
}
/**
 * Device pixel ratio to render the game at: as sharp as the screen allows, but within a pixel budget so a
 * large high-DPI window (a Retina iMac or a Mac on a 4K/5K display) does not render 10+ million pixels, every
 * one of them through the multisampled post-processing chain.
 */
export function gamePixelRatio(width, height, touchDevice = false) {
  const budget = touchDevice ? 1.6e6 : 2.4e6;
  const cap = touchDevice ? 1.2 : 1.8;
  const fit = Math.sqrt(budget / Math.max(1, width * height));
  return Math.max(0.75, Math.min(window.devicePixelRatio || 1, cap, fit));
}
export function createRenderer(container, inGame = false) {
  const lowPower = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const scene = new Scene();
  scene.background = new Color(inGame ? "#070b14" : "#0d1520");
  scene.fog = new Fog(inGame ? "#223a4d" : "#35506b", inGame ? 130 : 74, inGame ? 1050 : 980);
  const renderer = new WebGLRenderer({
    // every frame goes through the composer, whose render targets are multisampled; the canvas only
    // receives a fullscreen copy, so a multisampled default framebuffer would cost bandwidth for nothing
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  try {
    renderer.outputColorSpace = "srgb";
  } catch (e) {}
  const touchDevice = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  if (lowPower) {
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  } else {
    renderer.setPixelRatio(
      inGame
        ? gamePixelRatio(container.clientWidth, container.clientHeight, touchDevice)
        : Math.min(window.devicePixelRatio, touchDevice ? 1.2 : 2.2),
    );
  }
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = 4;
  renderer.toneMappingExposure = inGame ? 0.82 : 1.05;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = 2;
  if (renderer.physicallyCorrectLights) {
    renderer.physicallyCorrectLights = true;
  }
  container.appendChild(renderer.domElement);
  renderer.domElement.className = inGame ? "game-canvas" : "game-canvas-preview";
  const camera = new PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1200);
  scene.add(
    new HemisphereLight(inGame ? "#a1bfdc" : "#dfeaf8", inGame ? "#1a2418" : "#101a22", inGame ? 0.78 : 1.15),
  );
  const ambient = new AmbientLight(inGame ? "#3d536d" : "#78879a", inGame ? 0.38 : 0.58);
  scene.add(ambient);
  const sun = new DirectionalLight(inGame ? "#a9c5e8" : "#f6d7a8", inGame ? 2.2 : 3.2);
  sun.position.set(-42, 88, -30);
  if ((inGame || !touchDevice) && !lowPower) {
    sun.castShadow = true;
    const shadowSize = touchDevice ? 1024 : inGame ? 2048 : 3072;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.near = 12;
    sun.shadow.camera.far = 340;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.bias = -0.00017;
    sun.shadow.normalBias = 0.045;
    sun.shadow.radius = 3;
  }
  scene.add(sun);
  scene.add(sun.target);
  const fillLight = new DirectionalLight(inGame ? "#7ca8d7" : "#7ca8d7", inGame ? 0.35 : 0.55);
  fillLight.position.set(52, 42, 64);
  scene.add(fillLight);
  if (inGame) {
    const rimLight = new DirectionalLight("#90b0d8", 0.5);
    rimLight.position.set(25, 34, -60);
    scene.add(rimLight);
  } else {
    const rimLight = new DirectionalLight("#ddeeff", 0.45);
    rimLight.position.set(-90, 28, -35);
    scene.add(rimLight);
  }
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = inGame ? 2048 : 1024;
  skyCanvas.height = inGame ? 1024 : 512;
  const skyContext = skyCanvas.getContext("2d");
  if (inGame) {
    const sky = skyContext.createLinearGradient(0, 0, 0, skyCanvas.height);
    sky.addColorStop(0, "#02040b");
    sky.addColorStop(0.2, "#050b18");
    sky.addColorStop(0.39, "#0b1728");
    sky.addColorStop(0.49, "#14243a");
    sky.addColorStop(0.535, "#1d2b3b");
    sky.addColorStop(0.59, "#182433");
    sky.addColorStop(0.76, "#0b111b");
    sky.addColorStop(1, "#05080e");
    skyContext.fillStyle = sky;
    skyContext.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
    const moonX = skyCanvas.width * 0.72;
    const moonY = skyCanvas.height * 0.2;
    const moonGlow = skyContext.createRadialGradient(moonX, moonY, 4, moonX, moonY, 150);
    moonGlow.addColorStop(0, "rgba(180,205,238,0.2)");
    moonGlow.addColorStop(0.24, "rgba(124,157,205,0.1)");
    moonGlow.addColorStop(1, "rgba(80,115,170,0)");
    skyContext.fillStyle = moonGlow;
    skyContext.fillRect(moonX - 150, moonY - 150, 300, 300);
    const moonDisk = skyContext.createRadialGradient(moonX - 7, moonY - 8, 1, moonX, moonY, 22);
    moonDisk.addColorStop(0, "rgba(223,232,245,0.9)");
    moonDisk.addColorStop(0.8, "rgba(185,203,229,0.82)");
    moonDisk.addColorStop(1, "rgba(153,178,211,0)");
    skyContext.fillStyle = moonDisk;
    skyContext.fillRect(moonX - 26, moonY - 26, 52, 52);
    let cloudSeed = 481516;
    const random = () => {
      cloudSeed = (cloudSeed * 48271) % 2147483647;
      return (cloudSeed - 1) / 2147483646;
    };
    for (let star = 0; star < 420; star++) {
      const x = random() * skyCanvas.width;
      const y = random() * skyCanvas.height * 0.48;
      const radius = random() > 0.96 ? 1.5 + random() : 0.35 + random() * 0.65;
      skyContext.beginPath();
      skyContext.arc(x, y, radius, 0, Math.PI * 2);
      skyContext.fillStyle = `rgba(210,226,255,${0.18 + random() * 0.5})`;
      skyContext.fill();
    }
    for (let band = 0; band < 2; band++) {
      const groups = band === 0 ? 12 : 9;
      for (let group = 0; group < groups; group++) {
        const cx = random() * skyCanvas.width;
        const cy = band === 0 ? 350 + random() * 180 : 485 + random() * 190;
        const width = 75 + random() * (band === 0 ? 150 : 110);
        const count = 8 + Math.floor(random() * 15);
        for (let puff = 0; puff < count; puff++) {
          const px = cx + (random() - 0.5) * width * 1.8;
          const py = cy + (random() - 0.5) * width * 0.42;
          const radius = 22 + random() * (band === 0 ? 56 : 34);
          const cloud = skyContext.createRadialGradient(px, py, radius * 0.08, px, py, radius);
          cloud.addColorStop(0, band === 1 ? "rgba(111,137,176,0.16)" : "rgba(156,177,207,0.12)");
          cloud.addColorStop(0.42, band === 1 ? "rgba(91,119,160,0.09)" : "rgba(117,143,181,0.07)");
          cloud.addColorStop(1, "rgba(70,96,137,0)");
          skyContext.fillStyle = cloud;
          skyContext.fillRect(px - radius, py - radius, radius * 2, radius * 2);
        }
      }
    }
    for (let i = 0; i < 34; i++) {
      const y = 280 + random() * 260;
      const x = random() * skyCanvas.width;
      const length = 70 + random() * 250;
      skyContext.beginPath();
      skyContext.moveTo(x, y);
      skyContext.bezierCurveTo(x + length * 0.3, y - 8, x + length * 0.7, y + 8, x + length, y - 2);
      skyContext.strokeStyle = `rgba(145,169,203,${0.012 + random() * 0.022})`;
      skyContext.lineWidth = 3 + random() * 9;
      skyContext.stroke();
    }
  } else {
    const gradient = skyContext.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#2a2e32");
    gradient.addColorStop(0.35, "#1a1e22");
    gradient.addColorStop(0.5, "#15191d");
    gradient.addColorStop(0.62, "#10131a");
    gradient.addColorStop(0.72, "#0a0d10");
    gradient.addColorStop(1, "#05060a");
    skyContext.fillStyle = gradient;
    skyContext.fillRect(0, 0, 1024, 512);
    let skylineSeed = 7919;
    for (let buildingIndex = 0; buildingIndex < 40; buildingIndex++) {
      skylineSeed = (skylineSeed * 48271) % 2147483647;
      const buildingX = buildingIndex * 26;
      const buildingHeight = 18 + (skylineSeed % 42);
      skyContext.fillStyle = buildingIndex % 3 ? "#0b121a" : "#111a22";
      skyContext.fillRect(buildingX, 264 - buildingHeight, 26, buildingHeight + 28);
      for (let row = 0; row < Math.floor(buildingHeight / 7); row++) {
        for (let column = 0; column < 3; column++) {
          skylineSeed = (skylineSeed * 48271) % 2147483647;
          if (skylineSeed % 5 === 0) {
            skyContext.fillStyle = "rgba(255,190,130,0.38)";
            skyContext.fillRect(buildingX + 4 + column * 7, 267 - buildingHeight + row * 7, 2, 3);
          }
        }
      }
    }
    const horizonGlow = skyContext.createLinearGradient(0, 250, 0, 320);
    horizonGlow.addColorStop(0, "rgba(255,180,120,0)");
    horizonGlow.addColorStop(0.5, "rgba(180,140,90,0.15)");
    horizonGlow.addColorStop(1, "rgba(255,160,100,0)");
    skyContext.fillStyle = horizonGlow;
    skyContext.fillRect(0, 250, 1024, 70);
    skyContext.fillStyle = "rgba(255,220,180,0.3)";
    skyContext.beginPath();
    skyContext.arc(760, 90, 55, 0, Math.PI * 2);
    skyContext.fill();
    skyContext.fillStyle = "rgba(255,255,255,0.25)";
    skyContext.beginPath();
    skyContext.arc(760, 90, 80, 0, Math.PI * 2);
    skyContext.fill();
  }
  const skyTexture = new CanvasTexture(skyCanvas);
  skyTexture.mapping = 303;
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(skyTexture).texture;
  if (inGame) {
    scene.background = skyTexture;
  }
  pmrem.dispose();
  const composer = createComposer(
    renderer,
    scene,
    camera,
    container.clientWidth,
    container.clientHeight,
    inGame ? 0.75 : 0.5,
  );
  const resizeObserver = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width && height) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      composer.setSize(width, height);
    }
  });
  resizeObserver.observe(container);
  return {
    scene,
    renderer,
    camera,
    sun,
    touchDevice,
    composer,
    dispose() {
      resizeObserver.disconnect();
      scene.traverse((e) => {
        e.geometry?.dispose();
        if (e.material) {
          (Array.isArray(e.material) ? e.material : [e.material]).forEach((e) => e.dispose());
        }
      });
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
