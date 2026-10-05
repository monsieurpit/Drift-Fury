import { MeshStandardMaterial, Mesh, BufferGeometry, Float32BufferAttribute } from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { createRandom } from "../util/random.js";
/** City road grid layout, asphalt, puddles, lane markings, crosswalks and sidewalks. */
export function buildRoads(world) {
  const { addBox, roadMaterial, scene, sidewalkMaterial, whitePaint, yellowPaint } = world;
  const roadXs = [-120, -60, 0, 60, 120];
  const roadZs = [-80, -30, 20, 70];
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
  for (const roadZ of roadZs) {
    addBox(
      roadXs[roadXs.length - 1] - roadXs[0] + 18,
      0.12,
      18,
      (roadXs[0] + roadXs[roadXs.length - 1]) / 2,
      0.01,
      roadZ,
      roadMaterial,
    );
  }
  const roadY = 0.085;
  for (const x of roadXs) {
    for (let segment = 0; segment < roadZs.length - 1; segment++) {
      const start = roadZs[segment] + 17;
      const end = roadZs[segment + 1] - 17;
      for (let z = start; z + 5 <= end; z += 9) {
        addBox(0.15, 0.018, 5, x, roadY, z + 2.5, yellowPaint);
      }
    }
    for (let zIndex = 0; zIndex < roadZs.length; zIndex++) {
      for (const approach of [-1, 1]) {
        if (zIndex + approach < 0 || zIndex + approach >= roadZs.length) {
          continue;
        }
        const z = roadZs[zIndex];
        const crossZ = z + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          addBox(0.75, 0.025, 2.6, x + stripe * 2.1, roadY + 0.008, crossZ, whitePaint);
        }
        addBox(9, 0.025, 0.2, x, roadY + 0.01, z + approach * 15.5, whitePaint);
      }
    }
  }
  for (const z of roadZs) {
    for (let segment = 0; segment < roadXs.length - 1; segment++) {
      const start = roadXs[segment] + 17;
      const end = roadXs[segment + 1] - 17;
      for (let x = start; x + 5 <= end; x += 9) {
        addBox(5, 0.018, 0.15, x + 2.5, roadY, z, yellowPaint);
      }
    }
    for (let xIndex = 0; xIndex < roadXs.length; xIndex++) {
      for (const approach of [-1, 1]) {
        if (xIndex + approach < 0 || xIndex + approach >= roadXs.length) {
          continue;
        }
        const x = roadXs[xIndex];
        const crossX = x + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          addBox(0.75, 0.025, 2.6, crossX, roadY + 0.008, z + stripe * 2.1, whitePaint);
        }
        addBox(0.2, 0.025, 9, x + approach * 15.5, roadY + 0.01, z, whitePaint);
      }
    }
  }
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
      let start = roadXs[0] - 11;
      for (const crossing of roadXs) {
        const end = crossing - 9;
        if (end > start) {
          addBox(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, sidewalkMaterial);
        }
        start = crossing + 9;
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
