// Hidden packages (both modes): fifteen glowing packages tucked along the city's sidewalks, always in the
// same places. Driving or walking through one picks it up for cash; finding them all pays a big bonus.
// Pure simulation; the session draws them (and remembers which were found, between sessions).
import { createRandom } from "../util/random.js";

export const PACKAGE_COUNT = 15;
const PICKUP_RADIUS = 2.6;
const REWARD = 150;
const ALL_FOUND_BONUS = 2000;

/** `roadXs`, `roadZs`: the street grid (roads 18 m wide; the sidewalks just beyond 9 m from the centre). */
export function createPackages({ roadXs, roadZs }) {
  const random = createRandom(0x9ac4a3e);
  const spots = [];
  // One per block side at most, mid-block, on the sidewalk (10.3 m from the road's centre line).
  // (On the city's outermost roads, only the inner sidewalk.)
  const inward = (list, index, side) => (index === 0 ? 1 : index === list.length - 1 ? -1 : side);
  for (let attempt = 0; spots.length < PACKAGE_COUNT && attempt < 5000; attempt++) {
    let side = random() < 0.5 ? 1 : -1;
    let spot;
    if (random() < 0.5) {
      const i = Math.floor(random() * roadXs.length);
      const x = roadXs[i];
      side = inward(roadXs, i, side);
      const k = Math.floor(random() * (roadZs.length - 1));
      spot = { x: x + side * 10.3, z: roadZs[k] + 14 + random() * (roadZs[k + 1] - roadZs[k] - 28) };
    } else {
      const i = Math.floor(random() * roadZs.length);
      const z = roadZs[i];
      side = inward(roadZs, i, side);
      const k = Math.floor(random() * (roadXs.length - 1));
      spot = { x: roadXs[k] + 16 + random() * (roadXs[k + 1] - roadXs[k] - 32), z: z + side * 10.3 };
    }
    if (spots.every((other) => Math.hypot(other.x - spot.x, other.z - spot.z) > 30)) spots.push(spot);
  }
  const found = new Set();

  return {
    /** The packages: { x, z } (index = id). */
    spots,
    /** Ids already picked up. */
    found,
    /** Marks ids found earlier (from a saved game): no reward. */
    restore(ids) {
      for (const id of ids) if (id >= 0 && id < PACKAGE_COUNT) found.add(id);
    },
    /** Picks up a package the player is touching; pays and tells the HUD. */
    update(state, pay) {
      if (state.wasted > 0 || state.busted > 0) return;
      for (let id = 0; id < spots.length; id++) {
        if (found.has(id)) continue;
        const spot = spots[id];
        if (Math.abs(spot.x - state.x) > PICKUP_RADIUS || Math.abs(spot.z - state.z) > PICKUP_RADIUS) continue;
        if (Math.hypot(spot.x - state.x, spot.z - state.z) > PICKUP_RADIUS) continue;
        found.add(id);
        pay(REWARD, "package");
        state.notices.push({ key: "hud.package", amount: `${found.size}/${PACKAGE_COUNT}` });
        state.packageFound = id;
        if (found.size === PACKAGE_COUNT) {
          pay(ALL_FOUND_BONUS, "package");
          state.notices.push({ key: "hud.allPackages", amount: ALL_FOUND_BONUS });
        }
      }
    },
  };
}
