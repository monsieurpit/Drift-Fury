import {
  MeshStandardMaterial,
  BoxGeometry,
  Mesh,
  Group,
  CylinderGeometry,
  CircleGeometry,
  SRGBColorSpace,
} from "three";
import { canvasTexture as rawCanvasTexture } from "../render/meshUtils.js";

/** Colour canvas texture (sRGB). */
const canvasTexture = (width, height, draw) => {
  const texture = rawCanvasTexture(width, height, draw);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};
/** Traffic signals at four-way crossings and stop signs at the other intersections. */
export function buildTrafficControl(world) {
  const { addSolid, poleMetal, roadXs, roadZs, scene, signals } = world;
  const backplateMaterial = new MeshStandardMaterial({
    map: canvasTexture(128, 256, (context) => {
      context.fillStyle = "#e9c21a";
      context.fillRect(0, 0, 128, 256);
      context.fillStyle = "#07090b";
      context.fillRect(10, 10, 108, 236);
    }),
    roughness: 0.6,
    metalness: 0.1,
    emissive: "#3a2f00",
    emissiveIntensity: 0.15,
  });
  const bezelMaterial = new MeshStandardMaterial({
    color: "#080a0d",
    roughness: 0.38,
    metalness: 0.25,
    side: 2,
  });
  const visorGeometry = new CylinderGeometry(0.19, 0.19, 0.26, 20, 1, true, -Math.PI / 2, Math.PI);
  // Grid of round LEDs with a bright core each, on a dark reflector.
  const ledTexture = canvasTexture(128, 128, (context) => {
    context.fillStyle = "#1a1a1a";
    context.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 11; row++) {
      for (let col = 0; col < 11; col++) {
        const cx = 9 + col * 11 + (row % 2) * 5.5;
        const cy = 9 + row * 11;
        if ((cx - 64) ** 2 + (cy - 64) ** 2 > 58 ** 2) continue;
        const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, 5);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.5, "#d0d0d0");
        gradient.addColorStop(1, "#202020");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(cx, cy, 5, 0, Math.PI * 2);
        context.fill();
      }
    }
  });
  const lensMaterials = [];
  function addTrafficSignal(x, z, facing, axis) {
    const pole = new Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = facing;
    const base = new Mesh(new CylinderGeometry(0.24, 0.28, 0.16, 16), poleMetal);
    base.position.y = 0.08;
    pole.add(base);
    const mast = new Mesh(new CylinderGeometry(0.085, 0.11, 4.65, 12), poleMetal);
    mast.position.y = 2.46;
    mast.castShadow = true;
    pole.add(mast);
    const bracket = new Mesh(new BoxGeometry(0.11, 0.1, 0.34), poleMetal);
    bracket.position.set(0, 4.72, 0.13);
    pole.add(bracket);
    const housing = new Mesh(
      new BoxGeometry(0.48, 1.32, 0.34),
      new MeshStandardMaterial({
        color: "#101419",
        roughness: 0.68,
        metalness: 0.22,
      }),
    );
    housing.position.set(0, 5.35, 0.29);
    housing.castShadow = true;
    pole.add(housing);
    // Backplate: black with a yellow retroreflective border, so the head stands out against the night.
    const backplate = new Mesh(new BoxGeometry(0.86, 1.62, 0.025), backplateMaterial);
    backplate.position.set(0, 5.35, 0.115);
    pole.add(backplate);
    const shades = ["#f02e2a", "#e8a528", "#2cae50"];
    // Every signal on an axis shows the same light, so they share their three lens materials: the lenses
    // of a whole axis batch into a few draw calls instead of three per signal head.
    lensMaterials[axis] ||= shades.map(
      (shade) =>
        new MeshStandardMaterial({
          color: shade,
          map: ledTexture,
          emissive: shade,
          emissiveMap: ledTexture,
          emissiveIntensity: 0.025,
          roughness: 0.18,
          metalness: 0.04,
        }),
    );
    const lenses = [];
    for (let light = 0; light < 3; light++) {
      const y = 5.77 - light * 0.42;
      const bezel = new Mesh(new CylinderGeometry(0.17, 0.17, 0.045, 24), bezelMaterial);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(0, y, 0.473);
      pole.add(bezel);
      // LED array lens: the glow comes from a grid of LEDs behind a clear cover.
      const material = lensMaterials[axis][light];
      const lens = new Mesh(new CylinderGeometry(0.135, 0.135, 0.048, 24), material);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, y, 0.505);
      pole.add(lens);
      lenses.push(material);
      // Tunnel visor: an open half tube over the top of the lens.
      const visor = new Mesh(visorGeometry, bezelMaterial);
      visor.rotation.x = Math.PI / 2;
      visor.position.set(0, y, 0.62);
      pole.add(visor);
    }
    scene.add(pole);
    addSolid(x, z, 0.3, 0.3);
    signals.push({
      axis,
      lenses,
    });
  }
  // Stop sign face: red octagon, white border and "ARRÊT" (as in Quebec), on retroreflective sheeting
  // that catches headlights and street lamps a little brighter than plain paint.
  const octagon = (context, size, inset) => {
    context.beginPath();
    for (let k = 0; k < 8; k++) {
      const angle = Math.PI / 8 + (k * Math.PI) / 4;
      const r = (size / 2 - inset) / Math.cos(Math.PI / 8);
      const px = size / 2 + Math.cos(angle) * r;
      const py = size / 2 + Math.sin(angle) * r;
      if (k) context.lineTo(px, py);
      else context.moveTo(px, py);
    }
    context.closePath();
  };
  const stopFaceMaterial = new MeshStandardMaterial({
    map: canvasTexture(512, 512, (context) => {
      context.clearRect(0, 0, 512, 512);
      context.fillStyle = "#f4f2ea";
      octagon(context, 512, 2);
      context.fill();
      context.fillStyle = "#c81e26";
      octagon(context, 512, 26);
      context.fill();
      context.fillStyle = "#f4f2ea";
      context.font = "bold 128px Helvetica, Arial, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("ARRÊT", 256, 268);
    }),
    roughness: 0.45,
    metalness: 0,
    emissive: "#ffffff",
    emissiveIntensity: 0.06,
  });
  stopFaceMaterial.emissiveMap = stopFaceMaterial.map;
  const stopBackMaterial = new MeshStandardMaterial({ color: "#9aa0a6", roughness: 0.5, metalness: 0.7 });
  const stopFaceGeometry = new CircleGeometry(0.45 / Math.cos(Math.PI / 8), 8);
  stopFaceGeometry.rotateZ(Math.PI / 8);
  // Planar UVs over the octagon so the canvas maps onto it exactly.
  {
    const position = stopFaceGeometry.attributes.position;
    const uv = stopFaceGeometry.attributes.uv;
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, position.getX(i) / 0.9 + 0.5, position.getY(i) / 0.9 + 0.5);
    }
  }
  const postGeometry = new BoxGeometry(0.06, 2.4, 0.06);
  const boltGeometry = new CylinderGeometry(0.012, 0.012, 0.02, 6);
  function addStopSign(x, z, dx, dz) {
    const sideX = dz;
    const sideZ = -dx;
    const signX = x + dx * 11 + sideX * 10.2;
    const signZ = z + dz * 11 + sideZ * 10.2;
    const sign = new Group();
    sign.position.set(signX, 0, signZ);
    sign.rotation.y = Math.atan2(dx, dz);
    const post = new Mesh(postGeometry, poleMetal);
    post.position.y = 1.2;
    post.castShadow = true;
    sign.add(post);
    const back = new Mesh(stopFaceGeometry, stopBackMaterial);
    back.position.set(0, 2.22, 0.05);
    back.rotation.y = Math.PI;
    sign.add(back);
    const face = new Mesh(stopFaceGeometry, stopFaceMaterial);
    face.position.set(0, 2.22, 0.056);
    face.castShadow = true;
    sign.add(face);
    for (const by of [2.0, 2.44]) {
      const bolt = new Mesh(boltGeometry, stopBackMaterial);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(0, by, 0.062);
      sign.add(bolt);
    }
    scene.add(sign);
    addSolid(signX, signZ, 0.2, 0.2);
  }
  for (let xIndex = 0; xIndex < roadXs.length; xIndex++) {
    for (let zIndex = 0; zIndex < roadZs.length; zIndex++) {
      const x = roadXs[xIndex];
      const z = roadZs[zIndex];
      const connected = {
        west: xIndex > 0,
        east: xIndex < roadXs.length - 1,
        north: zIndex > 0,
        south: zIndex < roadZs.length - 1,
      };
      const arms = [
        [connected.west, -1, 0, connected.east],
        [connected.east, 1, 0, connected.west],
        [connected.north, 0, -1, connected.south],
        [connected.south, 0, 1, connected.north],
      ].filter(([hasRoad]) => hasRoad);
      if (arms.length === 4) {
        addTrafficSignal(x + 14, z + 14, 0, 0);
        addTrafficSignal(x - 14, z - 14, Math.PI, 0);
        addTrafficSignal(x + 14, z - 14, Math.PI / 2, 1);
        addTrafficSignal(x - 14, z + 14, -Math.PI / 2, 1);
      } else {
        for (const [, dx, dz, oppositeConnected] of arms) {
          if (!oppositeConnected) {
            addStopSign(x, z, dx, dz);
          }
        }
      }
    }
  }
}
