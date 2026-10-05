export const mountainRoadX = (e) => {
  return -25 + Math.sin((e + 170) / 45) * 58;
};
export const terrainHeight = (e, t) => {
  return t < -150 && e < 120 ? Math.min(42, (-t - 150) * 0.14) : 0;
};
