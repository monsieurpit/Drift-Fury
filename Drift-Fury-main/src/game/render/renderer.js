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
function createComposer(e, t, n, r, i, a) {
  const o = new EffectComposer(e);
  if (e.capabilities.isWebGL2) {
    ((o.renderTarget1.samples = Math.min(4, e.capabilities.maxSamples)),
      (o.renderTarget2.samples = Math.min(4, e.capabilities.maxSamples)));
  }
  o.setPixelRatio(e.getPixelRatio());
  o.setSize(r, i);
  o.addPass(new RenderPass(t, n));
  o.addPass(new UnrealBloomPass(new Vector2(r, i), a, 0.4, 0.92));
  const s = new ShaderPass(VignetteShader);
  s.uniforms.offset.value = 0.95;
  s.uniforms.darkness.value = 1.08;
  o.addPass(s);
  o.addPass(new OutputPass());
  return o;
}
export function createRenderer(e, t = false) {
  const lowPower = !!(
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
  );
  const n = new Scene();
  n.background = new Color(t ? "#070b14" : "#0d1520");
  n.fog = new Fog(t ? "#223a4d" : "#35506b", t ? 130 : 74, t ? 1050 : 980);
  const r = new WebGLRenderer({
    // every frame goes through the composer, whose render targets are multisampled; the canvas only
    // receives a fullscreen copy, so a multisampled default framebuffer would cost bandwidth for nothing
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  try {
    r.outputColorSpace = "srgb";
  } catch (e) {}
  const i = !!(
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches
  );
  if (lowPower) {
    r.shadowMap.enabled = false;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  } else {
    r.setPixelRatio(Math.min(window.devicePixelRatio, i ? 1.2 : t ? 1.8 : 2.2));
  }
  r.setSize(e.clientWidth, e.clientHeight);
  r.toneMapping = 4;
  r.toneMappingExposure = t ? 0.82 : 1.05;
  r.shadowMap.enabled = !lowPower;
  r.shadowMap.type = 2;
  if (r.physicallyCorrectLights) {
    r.physicallyCorrectLights = true;
  }
  e.appendChild(r.domElement);
  r.domElement.className = t ? "game-canvas" : "game-canvas-preview";
  const a = new PerspectiveCamera(
    45,
    e.clientWidth / e.clientHeight,
    0.1,
    1200,
  );
  n.add(
    new HemisphereLight(
      t ? "#a1bfdc" : "#dfeaf8",
      t ? "#1a2418" : "#101a22",
      t ? 0.78 : 1.15,
    ),
  );
  const o = new AmbientLight(t ? "#3d536d" : "#78879a", t ? 0.38 : 0.58);
  n.add(o);
  const s = new DirectionalLight(t ? "#a9c5e8" : "#f6d7a8", t ? 2.2 : 3.2);
  s.position.set(-42, 88, -30);
  if ((t || !i) && !lowPower) {
    s.castShadow = true;
    const e = i ? 1024 : t ? 2048 : 3072;
    s.shadow.mapSize.set(e, e);
    s.shadow.camera.near = 12;
    s.shadow.camera.far = 340;
    s.shadow.camera.left = -120;
    s.shadow.camera.right = 120;
    s.shadow.camera.top = 120;
    s.shadow.camera.bottom = -120;
    s.shadow.bias = -0.00017;
    s.shadow.normalBias = 0.045;
    s.shadow.radius = 3;
  }
  n.add(s);
  n.add(s.target);
  const c = new DirectionalLight(t ? "#7ca8d7" : "#7ca8d7", t ? 0.35 : 0.55);
  c.position.set(52, 42, 64);
  n.add(c);
  if (t) {
    const e = new DirectionalLight("#90b0d8", 0.5);
    e.position.set(25, 34, -60);
    n.add(e);
  } else {
    const e = new DirectionalLight("#ddeeff", 0.45);
    e.position.set(-90, 28, -35);
    n.add(e);
  }
  const l = document.createElement("canvas");
  l.width = t ? 2048 : 1024;
  l.height = t ? 1024 : 512;
  const u = l.getContext("2d");
  if (t) {
    const sky = u.createLinearGradient(0, 0, 0, l.height);
    sky.addColorStop(0, "#02040b");
    sky.addColorStop(0.2, "#050b18");
    sky.addColorStop(0.39, "#0b1728");
    sky.addColorStop(0.49, "#14243a");
    sky.addColorStop(0.535, "#1d2b3b");
    sky.addColorStop(0.59, "#182433");
    sky.addColorStop(0.76, "#0b111b");
    sky.addColorStop(1, "#05080e");
    u.fillStyle = sky;
    u.fillRect(0, 0, l.width, l.height);
    const moonX = l.width * 0.72;
    const moonY = l.height * 0.2;
    const moonGlow = u.createRadialGradient(moonX, moonY, 4, moonX, moonY, 150);
    moonGlow.addColorStop(0, "rgba(180,205,238,0.2)");
    moonGlow.addColorStop(0.24, "rgba(124,157,205,0.1)");
    moonGlow.addColorStop(1, "rgba(80,115,170,0)");
    u.fillStyle = moonGlow;
    u.fillRect(moonX - 150, moonY - 150, 300, 300);
    const moonDisk = u.createRadialGradient(
      moonX - 7,
      moonY - 8,
      1,
      moonX,
      moonY,
      22,
    );
    moonDisk.addColorStop(0, "rgba(223,232,245,0.9)");
    moonDisk.addColorStop(0.8, "rgba(185,203,229,0.82)");
    moonDisk.addColorStop(1, "rgba(153,178,211,0)");
    u.fillStyle = moonDisk;
    u.fillRect(moonX - 26, moonY - 26, 52, 52);
    let cloudSeed = 481516;
    const random = () => {
      cloudSeed = (cloudSeed * 48271) % 2147483647;
      return (cloudSeed - 1) / 2147483646;
    };
    for (let star = 0; star < 420; star++) {
      const x = random() * l.width;
      const y = random() * l.height * 0.48;
      const radius = random() > 0.96 ? 1.5 + random() : 0.35 + random() * 0.65;
      u.beginPath();
      u.arc(x, y, radius, 0, Math.PI * 2);
      u.fillStyle = `rgba(210,226,255,${0.18 + random() * 0.5})`;
      u.fill();
    }
    for (let band = 0; band < 2; band++) {
      const groups = band === 0 ? 12 : 9;
      for (let group = 0; group < groups; group++) {
        const cx = random() * l.width;
        const cy = band === 0 ? 350 + random() * 180 : 485 + random() * 190;
        const width = 75 + random() * (band === 0 ? 150 : 110);
        const count = 8 + Math.floor(random() * 15);
        for (let puff = 0; puff < count; puff++) {
          const px = cx + (random() - 0.5) * width * 1.8;
          const py = cy + (random() - 0.5) * width * 0.42;
          const radius = 22 + random() * (band === 0 ? 56 : 34);
          const cloud = u.createRadialGradient(
            px,
            py,
            radius * 0.08,
            px,
            py,
            radius,
          );
          cloud.addColorStop(
            0,
            band === 1 ? "rgba(111,137,176,0.16)" : "rgba(156,177,207,0.12)",
          );
          cloud.addColorStop(
            0.42,
            band === 1 ? "rgba(91,119,160,0.09)" : "rgba(117,143,181,0.07)",
          );
          cloud.addColorStop(1, "rgba(70,96,137,0)");
          u.fillStyle = cloud;
          u.fillRect(px - radius, py - radius, radius * 2, radius * 2);
        }
      }
    }
    for (let i = 0; i < 34; i++) {
      const y = 280 + random() * 260;
      const x = random() * l.width;
      const length = 70 + random() * 250;
      u.beginPath();
      u.moveTo(x, y);
      u.bezierCurveTo(
        x + length * 0.3,
        y - 8,
        x + length * 0.7,
        y + 8,
        x + length,
        y - 2,
      );
      u.strokeStyle = `rgba(145,169,203,${0.012 + random() * 0.022})`;
      u.lineWidth = 3 + random() * 9;
      u.stroke();
    }
  } else {
    const d = u.createLinearGradient(0, 0, 0, 512);
    d.addColorStop(0, "#2a2e32");
    d.addColorStop(0.35, "#1a1e22");
    d.addColorStop(0.5, "#15191d");
    d.addColorStop(0.62, "#10131a");
    d.addColorStop(0.72, "#0a0d10");
    d.addColorStop(1, "#05060a");
    u.fillStyle = d;
    u.fillRect(0, 0, 1024, 512);
    let skylineSeed = 7919;
    for (let buildingIndex = 0; buildingIndex < 40; buildingIndex++) {
      skylineSeed = (skylineSeed * 48271) % 2147483647;
      const buildingX = buildingIndex * 26;
      const buildingHeight = 18 + (skylineSeed % 42);
      u.fillStyle = buildingIndex % 3 ? "#0b121a" : "#111a22";
      u.fillRect(buildingX, 264 - buildingHeight, 26, buildingHeight + 28);
      for (let row = 0; row < Math.floor(buildingHeight / 7); row++) {
        for (let column = 0; column < 3; column++) {
          skylineSeed = (skylineSeed * 48271) % 2147483647;
          if (skylineSeed % 5 === 0) {
            u.fillStyle = "rgba(255,190,130,0.38)";
            u.fillRect(
              buildingX + 4 + column * 7,
              267 - buildingHeight + row * 7,
              2,
              3,
            );
          }
        }
      }
    }
    const f = u.createLinearGradient(0, 250, 0, 320);
    f.addColorStop(0, "rgba(255,180,120,0)");
    f.addColorStop(0.5, "rgba(180,140,90,0.15)");
    f.addColorStop(1, "rgba(255,160,100,0)");
    u.fillStyle = f;
    u.fillRect(0, 250, 1024, 70);
    u.fillStyle = "rgba(255,220,180,0.3)";
    u.beginPath();
    u.arc(760, 90, 55, 0, Math.PI * 2);
    u.fill();
    u.fillStyle = "rgba(255,255,255,0.25)";
    u.beginPath();
    u.arc(760, 90, 80, 0, Math.PI * 2);
    u.fill();
  }
  const p = new CanvasTexture(l);
  p.mapping = 303;
  const m = new PMREMGenerator(r);
  n.environment = m.fromEquirectangular(p).texture;
  if (t) {
    n.background = p;
  }
  m.dispose();
  const h = createComposer(
    r,
    n,
    a,
    e.clientWidth,
    e.clientHeight,
    t ? 0.75 : 0.5,
  );
  const g = new ResizeObserver(() => {
    const t = e.clientWidth;
    const n = e.clientHeight;
    if (t && n) {
      (r.setSize(t, n),
        (a.aspect = t / n),
        a.updateProjectionMatrix(),
        h.setSize(t, n));
    }
  });
  g.observe(e);
  return {
    scene: n,
    renderer: r,
    camera: a,
    sun: s,
    touchDevice: i,
    composer: h,
    dispose() {
      g.disconnect();
      n.traverse((e) => {
        e.geometry?.dispose();
        if (e.material) {
          (Array.isArray(e.material) ? e.material : [e.material]).forEach(
            (e) => {
              return e.dispose();
            },
          );
        }
      });
      h.dispose();
      r.dispose();
      r.domElement.remove();
    },
  };
}
