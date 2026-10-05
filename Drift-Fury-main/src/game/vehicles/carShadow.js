import { CanvasTexture } from "three";
const shadowTextures = new Map();

/* Chaikin corner cutting on a closed polygon of [x, y, s] with s wrapping at sMax */
export function getCarShadowTexture(sp) {
  if (!shadowTextures.has(sp.name)) {
    const width = 512;
    const height = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    const carWidth = Math.max(...sp.wid.map(([, halfWidth]) => halfWidth)) * 2;
    const planeWidth = carWidth + 0.75;
    const planeLength = sp.L + 1;
    context.translate(width / 2, height / 2);
    context.scale(width / planeWidth, -height / planeLength);
    const drawBodyShadow = () => {
      context.beginPath();
      for (let sample = 0; sample <= 64; sample++) {
        const station = (sp.L * sample) / 64;
        const x = sp.hw(station);
        const z = station - sp.L / 2;
        if (sample === 0) {
          context.moveTo(x, z);
        } else {
          context.lineTo(x, z);
        }
      }
      for (let sample = 64; sample >= 0; sample--) {
        const station = (sp.L * sample) / 64;
        context.lineTo(-sp.hw(station), station - sp.L / 2);
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
      [sp.axF, sp.twF, 0.34],
      [sp.axR, sp.twR, 0.36],
    ]) {
      const wheelX = sp.hw(station) - track / 2 - 0.035;
      for (const side of [-1, 1]) {
        const x = side * wheelX;
        const z = station - sp.L / 2;
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
    shadowTextures.set(sp.name, texture);
  }
  return shadowTextures.get(sp.name);
}

/* body cross-section ring at zf: [x, y, s] with s in 0..14 */
