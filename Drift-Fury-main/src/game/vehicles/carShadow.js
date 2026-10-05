import { CanvasTexture } from "three";
const shadowTextures = new Map();
export function getCarShadowTexture(spec) {
  if (!shadowTextures.has(spec.name)) {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const carWidth = Math.max(...spec.wid.map(([, halfWidth]) => halfWidth)) * 2;
    const planeWidth = carWidth + 0.75;
    const planeLength = spec.L + 1;
    context.translate(width / 2, height / 2);
    context.scale(width / planeWidth, -height / planeLength);
    const drawBodyShadow = () => {
      context.beginPath();
      for (let sample = 0; sample <= 64; sample++) {
        const station = (spec.L * sample) / 64;
        const x = spec.hw(station);
        const z = station - spec.L / 2;
        if (sample === 0) {
          context.moveTo(x, z);
        } else {
          context.lineTo(x, z);
        }
      }
      for (let sample = 64; sample >= 0; sample--) {
        const station = (spec.L * sample) / 64;
        context.lineTo(-spec.hw(station), station - spec.L / 2);
      }
      context.closePath();
    };
    context.save();
    context.shadowColor = "rgba(0,0,0,.42)";
    context.shadowBlur = 22;
    context.fillStyle = "rgba(0,0,0,.13)";
    drawBodyShadow();
    context.fill();
    context.restore();
    context.save();
    context.shadowColor = "rgba(0,0,0,.22)";
    context.shadowBlur = 9;
    context.fillStyle = "rgba(0,0,0,.055)";
    drawBodyShadow();
    context.fill();
    context.restore();
    for (const [station, track, tireWidth] of [
      [spec.axF, spec.twF, 0.34],
      [spec.axR, spec.twR, 0.36],
    ]) {
      const wheelX = spec.hw(station) - track / 2 - 0.035;
      for (const side of [-1, 1]) {
        const x = side * wheelX;
        const z = station - spec.L / 2;
        const radius = context.createRadialGradient(x, z, 0.015, x, z, 0.48);
        radius.addColorStop(0, "rgba(0,0,0,.34)");
        radius.addColorStop(0.42, "rgba(0,0,0,.22)");
        radius.addColorStop(1, "rgba(0,0,0,0)");
        context.beginPath();
        context.ellipse(x, z, tireWidth / 2, 0.48, 0, 0, Math.PI * 2);
        context.fillStyle = radius;
        context.fill();
      }
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    shadowTextures.set(spec.name, texture);
  }
  return shadowTextures.get(spec.name);
}
