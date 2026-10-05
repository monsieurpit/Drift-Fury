// Deterministic 2D value noise and fractal variants. Pure functions (no state), so the same inputs give the
// same terrain on every machine. `period` makes a noise tile seamlessly (used for textures).

const hash = (x, y, seed) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const wrap = (value, period) => (period ? ((value % period) + period) % period : value);

/** Smooth value noise in [0, 1). */
export function valueNoise(x, y, seed = 0, period = 0, periodY = period) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const ax = wrap(x0, period);
  const ay = wrap(y0, periodY);
  const bx = wrap(x0 + 1, period);
  const by = wrap(y0 + 1, periodY);
  const top = hash(ax, ay, seed) + (hash(bx, ay, seed) - hash(ax, ay, seed)) * fx;
  const bottom = hash(ax, by, seed) + (hash(bx, by, seed) - hash(ax, by, seed)) * fx;
  return top + (bottom - top) * fy;
}

/** Fractal Brownian motion: sum of octaves, normalised to [0, 1). */
export function fbm(
  x,
  y,
  { octaves = 5, lacunarity = 2, gain = 0.5, seed = 0, period = 0, periodY = period } = {},
) {
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let total = 0;
  for (let octave = 0; octave < octaves; octave++) {
    sum +=
      valueNoise(
        x * frequency,
        y * frequency,
        seed + octave * 101,
        period ? period * frequency : 0,
        periodY ? periodY * frequency : 0,
      ) * amplitude;
    total += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum / total;
}

/**
 * Ridged multifractal: sharp crests where the noise crosses 0.5, like mountain ridges and arêtes.
 * Each octave is weighted by the previous one so detail gathers on the ridges. Returns roughly [0, 1].
 */
export function ridged(x, y, { octaves = 5, lacunarity = 2.05, gain = 0.5, seed = 0 } = {}) {
  let amplitude = 0.5;
  let frequency = 1;
  let weight = 1;
  let sum = 0;
  for (let octave = 0; octave < octaves; octave++) {
    let signal = 1 - Math.abs(valueNoise(x * frequency, y * frequency, seed + octave * 131) * 2 - 1);
    signal *= signal * weight;
    weight = Math.min(1, Math.max(0, signal * 2));
    sum += signal * amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum * 1.6;
}

export const smoothstep = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};
