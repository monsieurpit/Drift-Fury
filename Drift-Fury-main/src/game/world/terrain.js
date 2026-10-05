/** X position of the winding mountain road's centre line at a given Z. */
export const mountainRoadX = (z) => -25 + Math.sin((z + 170) / 45) * 58;
/** Ground height at (x, z): flat city, rising toward the mountain north of z = -150 (west of x = 120). */
export const terrainHeight = (x, z) => (z < -150 && x < 120 ? Math.min(42, (-z - 150) * 0.14) : 0);
