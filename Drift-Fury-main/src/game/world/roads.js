import { MeshStandardMaterial, Mesh, BufferGeometry, Float32BufferAttribute } from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { ROAD_XS, ROAD_ZS } from "../data/roadGrid.js";
import { createRandom } from "../util/random.js";
/** City road grid layout, asphalt, puddles, lane markings, crosswalks and sidewalks. */
export function buildRoads(world) {
  const { addBox, roadMaterial, scene, sidewalkMaterial, whitePaint, yellowPaint } = world;
  const roadXs = ROAD_XS;
  const roadZs = ROAD_ZS;
  const stationRoadAccesses = FUEL_STATIONS.map((station) => {
    const roadX = roadXs.reduce(
      (nearest, x) => (Math.abs(x - station.x) < Math.abs(nearest - station.x) ? x : nearest),
      roadXs[0],
    );
    return {
      station,
      roadX,
      side: Math.sign(station.x - roadX),
    };
  });
  const streetlightZs = roadZs.slice(0, -1).map((z, index) => (z + roadZs[index + 1]) / 2);
  const streetlightXs = roadXs.slice(0, -1).map((x, index) => (x + roadXs[index + 1]) / 2);
  const addWhiteLine = (x, z, width, depth, y = 0.04) => addBox(width, 0.02, depth, x, y, z, whitePaint);
  const addYellowLine = (x, z, width, depth, y = 0.04) => addBox(width, 0.02, depth, x, y, z, yellowPaint);
  const signals = [];
  const puddleRandom = createRandom(731941);
  const puddleMat = new MeshStandardMaterial({
    color: "#65717b",
    roughness: 0.2,
    metalness: 0.12,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: 2,
  });
  const addRoadPuddle = (x, z, rx, rz, angle) => {
    const positions = [0, 0, 0];
    const indices = [];
    const sides = 20;
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2;
      const edge = 0.78 + puddleRandom() * 0.34;
      positions.push(Math.cos(a) * rx * edge, 0, Math.sin(a) * rz * edge);
    }
    for (let k = 0; k < sides; k++) {
      indices.push(0, ((k + 1) % sides) + 1, k + 1);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const puddle = new Mesh(geometry, puddleMat);
    puddle.position.set(x, 0.073, z);
    puddle.rotation.y = angle;
    puddle.renderOrder = 1;
    scene.add(puddle);
  };
  for (const x of roadXs) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        x + (puddleRandom() - 0.5) * 9,
        roadZs[0] - 7 + puddleRandom() * (roadZs[roadZs.length - 1] - roadZs[0] + 14),
        0.55 + puddleRandom() * 1.35,
        0.8 + puddleRandom() * 2.2,
        (puddleRandom() - 0.5) * 0.65,
      );
    }
  }
  for (const z of roadZs) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        roadXs[0] - 7 + puddleRandom() * (roadXs[roadXs.length - 1] - roadXs[0] + 14),
        z + (puddleRandom() - 0.5) * 9,
        0.8 + puddleRandom() * 2.2,
        0.55 + puddleRandom() * 1.35,
        (puddleRandom() - 0.5) * 0.65,
      );
    }
  }
  for (const roadX of roadXs) {
    addBox(
      18,
      0.12,
      roadZs[roadZs.length - 1] - roadZs[0] + 18,
      roadX,
      0.01,
      (roadZs[0] + roadZs[roadZs.length - 1]) / 2,
      roadMaterial,
    );
  }
  // The cross streets only fill the gaps between the avenues: two road surfaces overlapping at exactly
  // the same height in every intersection would fight over which one is drawn (flickering asphalt as the
  // camera moves).
  for (const roadZ of roadZs) {
    for (let index = 0; index + 1 < roadXs.length; index++) {
      const from = roadXs[index] + 9;
      const to = roadXs[index + 1] - 9;
      addBox(to - from, 0.12, 18, (from + to) / 2, 0.01, roadZ, roadMaterial);
    }
  }
  // Centre dashes, zebra crossings and stop lines are painted by the road material itself
  // (roadMarkings.js): drawn as thin strips of geometry they blinked and broke up in the distance.
  for (const x of roadXs) {
    for (const side of [-1, 1]) {
      const accessCuts = stationRoadAccesses
        .filter((access) => access.roadX === x && access.side === side)
        .map((access) => [access.station.z - 4.75, access.station.z + 4.75])
        .sort((first, second) => first[0] - second[0]);
      const addSidewalkSegment = (start, end) => {
        if (end > start) {
          addBox(2.4, 0.22, end - start, x + side * 10.2, 0.11, (start + end) / 2, sidewalkMaterial);
        }
      };
      let start = roadZs[0] - 11;
      for (const crossing of roadZs) {
        const end = crossing - 9;
        let segmentStart = start;
        for (const [cutStart, cutEnd] of accessCuts) {
          const clippedStart = Math.max(segmentStart, cutStart);
          const clippedEnd = Math.min(end, cutEnd);
          if (clippedEnd > clippedStart) {
            addSidewalkSegment(segmentStart, clippedStart);
            segmentStart = clippedEnd;
          }
        }
        addSidewalkSegment(segmentStart, end);
        start = crossing + 9;
      }
      const end = roadZs[roadZs.length - 1] + 11;
      let segmentStart = start;
      for (const [cutStart, cutEnd] of accessCuts) {
        const clippedStart = Math.max(segmentStart, cutStart);
        const clippedEnd = Math.min(end, cutEnd);
        if (clippedEnd > clippedStart) {
          addSidewalkSegment(segmentStart, clippedStart);
          segmentStart = clippedEnd;
        }
      }
      addSidewalkSegment(segmentStart, end);
    }
  }
  for (const z of roadZs) {
    for (const side of [-1, 1]) {
      // These stop where the avenues' sidewalks begin, so the corner squares are not covered twice (two
      // tops at the same height flicker).
      let start = roadXs[0] - 11;
      for (const crossing of roadXs) {
        const end = crossing - 11.4;
        if (end > start) {
          addBox(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, sidewalkMaterial);
        }
        start = crossing + 11.4;
      }
      const end = roadXs[roadXs.length - 1] + 11;
      if (end > start) {
        addBox(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, sidewalkMaterial);
      }
    }
  }
  Object.assign(world, {
    addYellowLine,
    roadXs,
    roadZs,
    signals,
    stationRoadAccesses,
    streetlightXs,
    streetlightZs,
  });
}
