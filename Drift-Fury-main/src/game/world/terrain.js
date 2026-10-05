export const mountainRoadX = (e) => -25 + Math.sin((e + 170) / 45) * 58;
export const terrainHeight = (e, t) => (t < -150 && e < 120 ? Math.min(42, (-t - 150) * 0.14) : 0);
