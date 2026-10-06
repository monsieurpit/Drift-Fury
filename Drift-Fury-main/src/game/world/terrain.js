// Shape of the land: the flat city, the Kuro mountain north of it and the winding road that climbs it.
// terrainHeight() is the single source of truth for ground height. The terrain mesh, the road ribbon,
// trees, rocks and every car and person on the mountain all sample it, so they always agree.
import { fbm, ridged, smoothstep } from "../util/noise.js";

/** The original winding curve of the mountain road (x as a function of z). */
export const mountainRoadX = (z) => -25 + Math.sin((z + 170) / 45) * 58;

/** Half the asphalt width of the mountain road (two 3.5 m lanes). */
export const ROAD_HALF_WIDTH = 7;
/** Where the road leaves the city grid (the end of the x = 0 avenue) and where it ends at the summit. */
export const ROAD_START_Z = -100;
export const ROAD_END_Z = -640;
/** Centre of the summit lookout plaza and its radius. */
export const SUMMIT = { x: 0, z: -660, radius: 21 };

/** Road centre line: straight out of the city, easing into the winding mountain curve (no kink). */
export const roadCenterX = (z) => mountainRoadX(z) * smoothstep(-112, -190, z);
SUMMIT.x = roadCenterX(ROAD_END_Z);

// Road elevation: integrate a grade profile along the climb (eases in at the city, a gentle roll on the
// way up, flattens at the summit). Tabulated once per metre and interpolated.
const ELEVATION_STEP = 1;
const elevationTable = (() => {
  const length = Math.ceil(-ROAD_END_Z + 60);
  const table = new Float32Array(length + 2);
  let height = 0;
  for (let index = 1; index < table.length; index++) {
    const t = index * ELEVATION_STEP; // metres north of z = 0
    const climb = t - -ROAD_START_Z; // metres along the climb
    const grade =
      0.13 * smoothstep(15, 75, climb) * (1 - smoothstep(-ROAD_END_Z - 140, -ROAD_END_Z - 95, climb)) +
      0.035 * Math.sin(climb / 41) * smoothstep(60, 120, climb) * (1 - smoothstep(380, 440, climb));
    height += Math.max(0, grade) * ELEVATION_STEP;
    table[index] = height;
  }
  return table;
})();

/** Height of the road surface at a given z (0 in the city). */
export function roadElevation(z) {
  const t = Math.max(0, -z) / ELEVATION_STEP;
  const index = Math.min(elevationTable.length - 2, Math.floor(t));
  const fraction = Math.min(1, t - index);
  return elevationTable[index] + (elevationTable[index + 1] - elevationTable[index]) * fraction;
}

/**
 * Approximate distance from (x, z) to the road surface's centre: perpendicular distance to the centre line
 * (the curve is gentle enough for this), or to the summit plaza, where anything inside counts as on the road.
 */
export function distanceToRoad(x, z) {
  const plaza = Math.max(0, Math.hypot(x - SUMMIT.x, z - SUMMIT.z) - SUMMIT.radius);
  if (z > ROAD_START_Z + 6) return Infinity;
  if (z < ROAD_END_Z) return plaza;
  const slope = roadCenterX(z - 0.5) - roadCenterX(z + 0.5);
  return Math.min(plaza, Math.abs(x - roadCenterX(z)) / Math.sqrt(1 + slope * slope));
}

// Natural ground (before the road is cut into it).
function naturalHeight(x, z) {
  const north = -z - 95; // metres past the city's northern edge
  if (north <= 0) return 0;
  const intoMountains = smoothstep(0, 110, north);
  // Overall rise follows the road's climb so the road sits in the landscape, not on stilts.
  // Past the summit the land drops into a wide valley (so the lookout overlooks something) before the
  // high range rises beyond it.
  const pastSummit = Math.max(0, -z + ROAD_END_Z - 40);
  const trend =
    roadElevation(Math.max(z, ROAD_END_Z - 40)) -
    Math.min(pastSummit, 220) * 0.32 +
    Math.max(0, pastSummit - 260) * 0.45;
  // Relief grows away from the road, deeper into the backdrop and toward the far west.
  const away = Math.max(0, distanceToRoad(x, z) - 14);
  const amplitude =
    Math.min(240, 5 + Math.min(away, 110) * 0.6 + Math.max(0, -z - 930) * 0.6 + Math.max(0, -x - 230) * 0.6) *
    intoMountains;
  const relief =
    ridged(x / 240 + 13.1, z / 240 - 7.7, { seed: 7, octaves: 6 }) * 0.8 +
    fbm(x / 70, z / 70, { seed: 3, octaves: 4 }) * 0.3 -
    0.5;
  // Toward the A9 highway (x = 175) the base climb flattens out just before the road, while the mountain relief
  // tapers over a much wider band, so tall peaks become foothills instead of ending in a wall.
  const base = trend * intoMountains;
  const baseTaper = smoothstep(150, 150 - Math.max(55, base * 1.5), x);
  let height = base * baseTaper + amplitude * relief * smoothstep(165, -70, x) ** 1.2;
  // The summit lookout crowns a dome: the ground falls away on every side so the view opens up.
  const fromSummit = Math.hypot(x - SUMMIT.x, z - SUMMIT.z);
  if (fromSummit < 260) {
    const dome = roadElevation(SUMMIT.z) - 1.5 - Math.max(0, fromSummit - SUMMIT.radius - 6) * 0.42;
    height = height + (Math.min(height, dome) - height) * (1 - smoothstep(150, 260, fromSummit));
  }
  // Never dip below the flat base ground slab (it reaches z = -800), or it would show through.
  if (z > -815 && x > -460 && x < 460) height = Math.max(height, 0.6 * intoMountains);
  // The A9 highway runs along the east edge (x = 175): the range tapers down over a wide margin so big
  // peaks become foothills instead of ending in a wall.
  height *= smoothstep(160, 120, x);
  // Distant hills east of the highway. They rise gradually north of the city edge like the rest of the
  // range; at full height right at the edge of the terrain they ended in a cliff with nothing beneath.
  if (x > 215)
    height +=
      smoothstep(215, 330, x) *
      smoothstep(0, 260, north) *
      (25 + 90 * ridged(x / 180, z / 180, { seed: 11, octaves: 4 }));
  return height;
}

/** Ground height at (x, z). */
export function terrainHeight(x, z) {
  if (z > ROAD_START_Z + 6 && x < 215) return 0;
  const natural = naturalHeight(x, z);
  if (x > 150) return natural;
  // Cut and fill: flat at road level across the asphalt and shoulders, blending into the slope beyond.
  const distance = distanceToRoad(x, z);
  if (distance === Infinity) return natural;
  const road = roadElevation(Math.max(z, SUMMIT.z));
  const blend = smoothstep(ROAD_HALF_WIDTH + 2.5, ROAD_HALF_WIDTH + 30, distance);
  return road + (natural - road) * blend;
}
