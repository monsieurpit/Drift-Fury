// Graphics quality presets. The choice is stored per browser; "auto" picks a preset from the device and is
// then adjusted by the session's frame-time monitor (it steps the preset down when frames stay slow).

export const QUALITY_LEVELS = ["low", "medium", "high", "ultra"];

export const QUALITY_LABELS = {
  auto: "AUTO",
  low: "BASSE",
  medium: "MOYENNE",
  high: "HAUTE",
  ultra: "ULTRA",
};

/** What each preset turns on. Pixel budgets are in megapixels (see gamePixelRatio). */
export const QUALITY_PRESETS = {
  low: {
    pixelBudget: 1.0,
    shadows: false,
    shadowMapSize: 1024,
    ao: false,
    msaa: 0,
    bloom: true,
    grading: false,
  },
  medium: {
    pixelBudget: 1.6,
    shadows: true,
    shadowMapSize: 1024,
    ao: false,
    msaa: 2,
    bloom: true,
    grading: true,
  },
  high: {
    pixelBudget: 2.4,
    shadows: true,
    shadowMapSize: 2048,
    ao: true,
    msaa: 4,
    bloom: true,
    grading: true,
  },
  ultra: {
    pixelBudget: 3.6,
    shadows: true,
    shadowMapSize: 4096,
    ao: true,
    msaa: 4,
    bloom: true,
    grading: true,
  },
};

const STORAGE_KEY = "drift-fury-quality";

/** The stored choice: "auto" or one of QUALITY_LEVELS. */
export function storedQuality() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "auto" || QUALITY_LEVELS.includes(value)) return value;
  } catch {
    /* storage unavailable (private mode): fall back to auto */
  }
  return "auto";
}

export function storeQuality(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/** A starting preset for "auto" from what the browser tells us about the device. */
export function detectQuality() {
  const touch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  const cores = navigator.hardwareConcurrency || 4;
  if (cores <= 4) return "low";
  if (touch) return "medium";
  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl && gl.getExtension("WEBGL_debug_renderer_info");
    renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  } catch {
    /* ignore */
  }
  // Integrated Intel graphics and software renderers can't afford the extra passes.
  if (/swiftshader|llvmpipe|software/i.test(renderer)) return "medium";
  if (/intel/i.test(renderer) && !/arc/i.test(renderer)) return "medium";
  return "high";
}

/** The preset to start with for a stored choice. */
export function resolveQuality(choice = storedQuality()) {
  return choice === "auto" ? detectQuality() : choice;
}

const NO_AO_KEY = "drift-fury-no-ao";

/** Whether ambient occlusion was found not to work on this device (it rendered a black screen). */
export function aoBlockedOnDevice() {
  try {
    return localStorage.getItem(NO_AO_KEY) === "1";
  } catch {
    return false;
  }
}

export function blockAoOnDevice() {
  try {
    localStorage.setItem(NO_AO_KEY, "1");
  } catch {
    /* ignore */
  }
}
