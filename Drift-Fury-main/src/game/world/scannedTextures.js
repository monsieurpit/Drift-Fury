// Photo-scanned PBR texture sets (CC0, from Poly Haven: https://polyhaven.com), served from /textures.
// Each set has a colour map (sRGB), an OpenGL normal map and an ARM map (R: ambient occlusion,
// G: roughness, B: metalness, the channels three.js reads for aoMap / roughnessMap / metalnessMap).
// Textures load in the background; materials can use them straight away and pick them up when ready.
import {
  LinearMipmapLinearFilter,
  LoadingManager,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";

const manager = new LoadingManager();
const loader = new TextureLoader(manager);
let pending = 0;
let resolveReady;
/** Resolves once every requested scanned texture has loaded (or failed). */
export const scannedTexturesReady = new Promise((resolve) => (resolveReady = resolve));
manager.onLoad = () => resolveReady();
manager.onError = (url) => console.warn("Scanned texture failed to load:", url);

const BASE = (import.meta.env?.BASE_URL || "/") + "textures/";
const cache = new Map();

function load(url, srgb, onLoad) {
  pending++;
  const texture = loader.load(url, onLoad);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  return texture;
}

/** Linear-space average colour of a loaded image (what it mip-averages to from far away). */
function averageColor(image, target) {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, size, size);
  const data = context.getImageData(0, 0, size, size).data;
  const toLinear = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const sum = [0, 0, 0];
  for (let i = 0; i < size * size; i++) {
    for (let channel = 0; channel < 3; channel++) sum[channel] += toLinear(data[i * 4 + channel]);
  }
  target.set(sum[0] / (size * size), sum[1] / (size * size), sum[2] / (size * size));
}

/**
 * A scanned set by name: { map, normalMap, armMap, average } (average is a Vector3 filled in when the
 * colour map has loaded, starting from `fallbackAverage`). Textures are shared between callers.
 */
export function scannedSet(name, fallbackAverage = [0.2, 0.2, 0.2]) {
  if (cache.has(name)) return cache.get(name);
  const average = new Vector3(...fallbackAverage);
  const set = {
    map: load(`${BASE}${name}/diff.jpg`, true, (texture) => averageColor(texture.image, average)),
    normalMap: load(`${BASE}${name}/nor.jpg`, false),
    armMap: load(`${BASE}${name}/arm.jpg`, false),
    average,
  };
  cache.set(name, set);
  return set;
}

/** Whether any scanned set was requested (so callers know whether to wait on scannedTexturesReady). */
export const scannedTexturesRequested = () => pending > 0;
