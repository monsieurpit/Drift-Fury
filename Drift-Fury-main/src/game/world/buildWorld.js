import {
  MeshStandardMaterial,
  MeshBasicMaterial,
  BoxGeometry,
  Mesh,
  Matrix4,
  Vector3,
  Quaternion,
  PlaneGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  CylinderGeometry,
  CanvasTexture,
  RepeatWrapping,
  MeshPhysicalMaterial,
  Vector2,
  ConeGeometry,
  SphereGeometry,
  InstancedMesh,
  PointLight,
  Points,
  PointsMaterial,
} from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { createRandom } from "../util/random.js";
import { mountainRoadX, terrainHeight } from "./terrain.js";
import { concreteTexture, createAsphaltMaterial, grassTexture, normalMapFromHeight } from "./textures.js";
export function buildWorld(e) {
  const t = [];
  const n = [];
  const r = createAsphaltMaterial(6);
  const i = createAsphaltMaterial(10);
  const a = new MeshStandardMaterial({
    map: concreteTexture(),
    roughness: 0.82,
    metalness: 0.05,
    color: "#aab0b6",
  });
  const o = new MeshStandardMaterial({
    map: concreteTexture(2),
    roughness: 0.85,
    color: "#8a9098",
  });
  const s = new MeshStandardMaterial({
    map: grassTexture(),
    roughness: 1,
    metalness: 0,
    color: "#5a7a5e",
  });
  const c = new MeshBasicMaterial({
    color: "#e8e6d8",
  });
  const l = new MeshBasicMaterial({
    color: "#e8c84a",
  });
  const d = new MeshStandardMaterial({
    color: "#2a3036",
    metalness: 0.7,
    roughness: 0.5,
  });
  const f = new MeshStandardMaterial({
    color: "#1a1e22",
    roughness: 0.8,
    metalness: 0.3,
  });
  const p = new MeshStandardMaterial({
    color: "#1a1e22",
    metalness: 0.6,
    roughness: 0.5,
    emissive: "#fff4d0",
    emissiveIntensity: 1.6,
  });
  for (const [mt, tl] of [
    [a, 4],
    [o, 4],
  ]) {
    mt.map.repeat.set(1, 1);
    mt.userData.tile = tl;
  }
  function m(n, r, i, a, o, s, c, l = false) {
    const bg0 = new BoxGeometry(n, r, i);
    if (c && c.userData && c.userData.tile) {
      const tl = c.userData.tile;
      const uvA = bg0.attributes.uv;
      const dims = [
        [i, r],
        [i, r],
        [n, i],
        [n, i],
        [n, r],
        [n, r],
      ];
      for (let face = 0; face < 6; face++) {
        for (let vi = 0; vi < 4; vi++) {
          const ix = face * 4 + vi;
          uvA.setXY(ix, (uvA.getX(ix) * dims[face][0]) / tl, (uvA.getY(ix) * dims[face][1]) / tl);
        }
      }
      uvA.needsUpdate = true;
    }
    const u = new Mesh(bg0, c);
    u.position.set(a, o, s);
    u.receiveShadow = true;
    u.castShadow = l;
    e.add(u);
    if (l) {
      t.push({
        x: a,
        z: s,
        w: n / 2,
        d: i / 2,
        box: u,
      });
    }
    return u;
  }
  function h(e, n, r, i) {
    t.push({
      x: e,
      z: n,
      w: r,
      d: i,
    });
  }
  const g = new Matrix4();
  const _ = new Vector3();
  const v = new Quaternion();
  const y = new Vector3();
  m(900, 0.5, 1200, 0, -0.3, -200, s);
  const b = new PlaneGeometry(360, 460, 48, 64);
  b.rotateX(-Math.PI / 2);
  const x = b.attributes.position;
  for (let e = 0; e < x.count; e++) {
    const t = x.getX(e) - 30;
    const n = x.getZ(e) - 370;
    const r = terrainHeight(t, n);
    const i = Math.sin(t * 0.08) * Math.cos(n * 0.06) * 1.6 + Math.sin(t * 0.2 + n * 0.15) * 0.7;
    x.setXYZ(e, t, r + i, n);
  }
  b.computeVertexNormals();
  const S = new Mesh(b, s);
  S.receiveShadow = true;
  e.add(S);
  const C = [-120, -60, 0, 60, 120];
  const w = [-80, -30, 20, 70];
  const stationRoadAccesses = FUEL_STATIONS.map((station) => {
    const roadX = C.reduce((nearest, x) => {
      return Math.abs(x - station.x) < Math.abs(nearest - station.x) ? x : nearest;
    }, C[0]);
    return {
      station,
      roadX,
      side: Math.sign(station.x - roadX),
    };
  });
  const streetlightZs = w.slice(0, -1).map((z, index) => {
    return (z + w[index + 1]) / 2;
  });
  const streetlightXs = C.slice(0, -1).map((x, index) => {
    return (x + C[index + 1]) / 2;
  });
  const T = (e, t, n, r, i = 0.04) => {
    return m(n, 0.02, r, e, i, t, c);
  };
  const E = (e, t, n, r, i = 0.04) => {
    return m(n, 0.02, r, e, i, t, l);
  };
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
    e.add(puddle);
  };
  for (const x of C) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        x + (puddleRandom() - 0.5) * 9,
        w[0] - 7 + puddleRandom() * (w[w.length - 1] - w[0] + 14),
        0.55 + puddleRandom() * 1.35,
        0.8 + puddleRandom() * 2.2,
        (puddleRandom() - 0.5) * 0.65,
      );
    }
  }
  for (const z of w) {
    const count = puddleRandom() > 0.55 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      addRoadPuddle(
        C[0] - 7 + puddleRandom() * (C[C.length - 1] - C[0] + 14),
        z + (puddleRandom() - 0.5) * 9,
        0.8 + puddleRandom() * 2.2,
        0.55 + puddleRandom() * 1.35,
        (puddleRandom() - 0.5) * 0.65,
      );
    }
  }
  for (let e of C) {
    m(18, 0.12, w[w.length - 1] - w[0] + 18, e, 0.01, (w[0] + w[w.length - 1]) / 2, r);
  }
  for (let e of w) {
    m(C[C.length - 1] - C[0] + 18, 0.12, 18, (C[0] + C[C.length - 1]) / 2, 0.01, e, r);
  }
  const roadY = 0.085;
  for (const x of C) {
    for (let segment = 0; segment < w.length - 1; segment++) {
      const start = w[segment] + 17;
      const end = w[segment + 1] - 17;
      for (let z = start; z + 5 <= end; z += 9) {
        m(0.15, 0.018, 5, x, roadY, z + 2.5, l);
      }
    }
    for (let zIndex = 0; zIndex < w.length; zIndex++) {
      for (const approach of [-1, 1]) {
        if (zIndex + approach < 0 || zIndex + approach >= w.length) {
          continue;
        }
        const z = w[zIndex];
        const crossZ = z + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          m(0.75, 0.025, 2.6, x + stripe * 2.1, roadY + 0.008, crossZ, c);
        }
        m(9, 0.025, 0.2, x, roadY + 0.01, z + approach * 15.5, c);
      }
    }
  }
  for (const z of w) {
    for (let segment = 0; segment < C.length - 1; segment++) {
      const start = C[segment] + 17;
      const end = C[segment + 1] - 17;
      for (let x = start; x + 5 <= end; x += 9) {
        m(5, 0.018, 0.15, x + 2.5, roadY, z, l);
      }
    }
    for (let xIndex = 0; xIndex < C.length; xIndex++) {
      for (const approach of [-1, 1]) {
        if (xIndex + approach < 0 || xIndex + approach >= C.length) {
          continue;
        }
        const x = C[xIndex];
        const crossX = x + approach * 11.5;
        for (let stripe = -3; stripe <= 3; stripe++) {
          m(0.75, 0.025, 2.6, crossX, roadY + 0.008, z + stripe * 2.1, c);
        }
        m(0.2, 0.025, 9, x + approach * 15.5, roadY + 0.01, z, c);
      }
    }
  }
  for (const x of C) {
    for (const side of [-1, 1]) {
      const accessCuts = stationRoadAccesses
        .filter((access) => {
          return access.roadX === x && access.side === side;
        })
        .map((access) => {
          return [access.station.z - 4.75, access.station.z + 4.75];
        })
        .sort((first, second) => {
          return first[0] - second[0];
        });
      const addSidewalkSegment = (start, end) => {
        if (end > start) {
          m(2.4, 0.22, end - start, x + side * 10.2, 0.11, (start + end) / 2, a);
        }
      };
      let start = w[0] - 11;
      for (const crossing of w) {
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
      const end = w[w.length - 1] + 11;
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
  for (const z of w) {
    for (const side of [-1, 1]) {
      let start = C[0] - 11;
      for (const crossing of C) {
        const end = crossing - 9;
        if (end > start) {
          m(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, a);
        }
        start = crossing + 9;
      }
      const end = C[C.length - 1] + 11;
      if (end > start) {
        m(end - start, 0.22, 2.4, (start + end) / 2, 0.11, z + side * 10.2, a);
      }
    }
  }
  function O(x, z, facing, axis) {
    const pole = new Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = facing;
    const base = new Mesh(new CylinderGeometry(0.24, 0.28, 0.16, 16), d);
    base.position.y = 0.08;
    pole.add(base);
    const mast = new Mesh(new CylinderGeometry(0.085, 0.11, 4.65, 12), d);
    mast.position.y = 2.46;
    mast.castShadow = true;
    pole.add(mast);
    const bracket = new Mesh(new BoxGeometry(0.11, 0.1, 0.34), d);
    bracket.position.set(0, 4.72, 0.13);
    pole.add(bracket);
    const housing = new Mesh(
      new BoxGeometry(0.48, 1.32, 0.34),
      new MeshStandardMaterial({
        color: "#101419",
        roughness: 0.68,
        metalness: 0.22,
      }),
    );
    housing.position.set(0, 5.35, 0.29);
    housing.castShadow = true;
    pole.add(housing);
    const shades = ["#f02e2a", "#e8a528", "#2cae50"];
    const lenses = [];
    for (let light = 0; light < 3; light++) {
      const y = 5.77 - light * 0.42;
      const bezel = new Mesh(
        new CylinderGeometry(0.17, 0.17, 0.045, 20),
        new MeshStandardMaterial({
          color: "#080a0d",
          roughness: 0.38,
          metalness: 0.25,
        }),
      );
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(0, y, 0.473);
      pole.add(bezel);
      const material = new MeshStandardMaterial({
        color: shades[light],
        emissive: shades[light],
        emissiveIntensity: 0.025,
        roughness: 0.22,
        metalness: 0.04,
      });
      const lens = new Mesh(new CylinderGeometry(0.125, 0.125, 0.048, 20), material);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, y, 0.51);
      pole.add(lens);
      lenses.push(material);
      const hood = new Mesh(new BoxGeometry(0.31, 0.055, 0.14), d);
      hood.position.set(0, y + 0.17, 0.46);
      pole.add(hood);
    }
    e.add(pole);
    h(x, z, 0.3, 0.3);
    signals.push({
      axis,
      lenses,
    });
  }
  const stopLabelCanvas = document.createElement("canvas");
  stopLabelCanvas.width = 512;
  stopLabelCanvas.height = 256;
  const stopLabelContext = stopLabelCanvas.getContext("2d");
  stopLabelContext.clearRect(0, 0, 512, 256);
  stopLabelContext.fillStyle = "#fff";
  stopLabelContext.font = "bold 120px Arial";
  stopLabelContext.textAlign = "center";
  stopLabelContext.textBaseline = "middle";
  stopLabelContext.fillText("STOP", 256, 132);
  const stopLabelTexture = new CanvasTexture(stopLabelCanvas);
  stopLabelTexture.colorSpace = "srgb";
  const stopLabelMaterial = new MeshStandardMaterial({
    map: stopLabelTexture,
    transparent: true,
    roughness: 0.75,
  });
  function addStopSign(x, z, dx, dz) {
    const sideX = dz;
    const sideZ = -dx;
    const signX = x + dx * 11 + sideX * 10.2;
    const signZ = z + dz * 11 + sideZ * 10.2;
    const sign = new Group();
    sign.position.set(signX, 0, signZ);
    sign.rotation.y = Math.atan2(dx, dz);
    const post = new Mesh(new CylinderGeometry(0.075, 0.085, 2.35, 10), d);
    post.position.y = 1.175;
    sign.add(post);
    const borderMaterial = new MeshStandardMaterial({
      color: "#f2f0e8",
      roughness: 0.72,
    });
    const border = new Mesh(new CylinderGeometry(0.49, 0.49, 0.075, 8), borderMaterial);
    border.rotation.x = Math.PI / 2;
    border.position.set(0, 2.22, 0.08);
    sign.add(border);
    const face = new Mesh(new CylinderGeometry(0.44, 0.44, 0.012, 8), [
      borderMaterial,
      new MeshStandardMaterial({
        color: "#c82027",
        roughness: 0.7,
      }),
      borderMaterial,
    ]);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 2.22, 0.125);
    sign.add(face);
    const label = new Mesh(new PlaneGeometry(0.68, 0.34), stopLabelMaterial);
    label.position.set(0, 2.22, 0.132);
    sign.add(label);
    e.add(sign);
    h(signX, signZ, 0.2, 0.2);
  }
  for (let xIndex = 0; xIndex < C.length; xIndex++) {
    for (let zIndex = 0; zIndex < w.length; zIndex++) {
      const x = C[xIndex];
      const z = w[zIndex];
      const connected = {
        west: xIndex > 0,
        east: xIndex < C.length - 1,
        north: zIndex > 0,
        south: zIndex < w.length - 1,
      };
      const arms = [
        [connected.west, -1, 0, connected.east],
        [connected.east, 1, 0, connected.west],
        [connected.north, 0, -1, connected.south],
        [connected.south, 0, 1, connected.north],
      ].filter(([hasRoad]) => {
        return hasRoad;
      });
      if (arms.length === 4) {
        O(x + 14, z + 14, 0, 0);
        O(x - 14, z - 14, Math.PI, 0);
        O(x + 14, z - 14, Math.PI / 2, 1);
        O(x - 14, z + 14, -Math.PI / 2, 1);
      } else {
        for (const [, dx, dz, oppositeConnected] of arms) {
          if (!oppositeConnected) {
            addStopSign(x, z, dx, dz);
          }
        }
      }
    }
  }
  function k(x, z, axis = 0, inward = -1) {
    const footing = new Mesh(new CylinderGeometry(0.19, 0.24, 0.28, 16), d);
    footing.position.set(x, 0.14, z);
    e.add(footing);
    h(x, z, 0.3, 0.3);
    const pole = new Mesh(new CylinderGeometry(0.085, 0.12, 7, 12), d);
    pole.position.set(x, 3.5, z);
    pole.castShadow = true;
    e.add(pole);
    const alongX = axis === 1;
    const arm = new Mesh(new BoxGeometry(alongX ? 0.09 : 2.2, 0.09, alongX ? 2.2 : 0.09), d);
    arm.position.set(x + (alongX ? 0 : inward * 1.05), 6.88, z + (alongX ? inward * 1.05 : 0));
    e.add(arm);
    const fixtureX = x + (alongX ? 0 : inward * 2.05);
    const fixtureZ = z + (alongX ? inward * 2.05 : 0);
    const fixture = new Mesh(new BoxGeometry(0.72, 0.16, 0.48), d);
    fixture.position.set(fixtureX, 6.82, fixtureZ);
    fixture.castShadow = true;
    e.add(fixture);
    const diffuser = new Mesh(new BoxGeometry(0.58, 0.025, 0.36), p);
    diffuser.position.set(fixtureX, 6.72, fixtureZ);
    e.add(diffuser);
    n.push({
      x: fixtureX,
      y: 6.68,
      z: fixtureZ,
    });
  }
  for (const x of C) {
    for (const z of streetlightZs) {
      for (const side of [-1, 1]) {
        k(x + side * 10.2, z, 0, -side);
      }
    }
  }
  for (const z of w) {
    for (const x of streetlightXs) {
      for (const side of [-1, 1]) {
        k(x, z + side * 10.2, 1, -side);
      }
    }
  }
  let A = 9137;
  const j = () => {
    A = (A * 16807) % 2147483647;
    return (A - 1) / 2147483646;
  };
  const M = ["#ffe9c0", "#cfe8ff", "#ffd9a0", "#e8e0ff"];
  const N = ["#3a4250", "#42454d", "#383c44", "#454050", "#3e4855"];
  const P = ["glass", "classic", "classic", "glass"];
  {
    /* ===== DRIFT FURY: city blocks v2 =====
       Every block is split into two lots that sit strictly inside the sidewalks,
       so no building can ever overlap a road, a crosswalk or a curb. */
    const FLOOR_H = 3.6;
    const POD_H = 4.4;
    const LOT_HALF_Z = 12.4;
    const mkCanvas = (cw, ch) => {
      const cv = document.createElement("canvas");
      cv.width = cw;
      cv.height = ch;
      return cv;
    };
    const tint = (hex, k) => {
      const v = parseInt(hex.slice(1), 16);
      const cl = (q) => {
        return Math.max(0, Math.min(255, Math.round(q * k)));
      };
      return `rgb(${cl((v >> 16) & 255)},${cl((v >> 8) & 255)},${cl(v & 255)})`;
    };
    const textureOf = (cv) => {
      const tx = new CanvasTexture(cv);
      tx.wrapS = RepeatWrapping;
      tx.wrapT = RepeatWrapping;
      tx.anisotropy = 8;
      tx.needsUpdate = true;
      return tx;
    };
    const roofMat = new MeshStandardMaterial({
      color: "#23272c",
      roughness: 0.92,
      metalness: 0.05,
    });
    const lotMat = new MeshStandardMaterial({
      map: concreteTexture(1),
      roughness: 0.88,
      metalness: 0.04,
      color: "#8f969c",
    });
    lotMat.userData.tile = 4;
    const tankMat = new MeshStandardMaterial({
      color: "#5a4a3a",
      roughness: 0.85,
    });
    const beaconMat = new MeshStandardMaterial({
      color: "#200000",
      emissive: "#ff2a2a",
      emissiveIntensity: 3.2,
      roughness: 0.4,
    });
    const SIGNS = ["#c6dc77", "#5a9fd4", "#e89978", "#8c87c7", "#ff7a7a"];
    const trimMats = SIGNS.map((col) => {
      return new MeshStandardMaterial({
        color: "#050505",
        emissive: col,
        emissiveIntensity: 1.7,
        roughness: 0.4,
      });
    });

    /* --- facade textures: map + matching emissive map + normal map (one shared random layout) --- */
    const facadeCache = new Map();
    function facadeVariant(kind, wall, glow) {
      const key = kind + wall + glow;
      let hit = facadeCache.get(key);
      if (hit) {
        return hit;
      }
      const glass = kind === "glass";
      const rnd = createRandom(
        key.length * 7919 + wall.charCodeAt(2) * 31 + glow.charCodeAt(3) * 17 + (glass ? 5 : 11),
      );
      const mapCv = mkCanvas(256, 256);
      const glowCv = mkCanvas(256, 256);
      const g2 = mapCv.getContext("2d");
      const ge = glowCv.getContext("2d");
      g2.fillStyle = wall;
      g2.fillRect(0, 0, 256, 256);
      for (let q = 0; q < 1400; q++) {
        g2.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.1)";
        g2.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
      }
      ge.fillStyle = "#000";
      ge.fillRect(0, 0, 256, 256);
      for (let col = 0; col <= 4; col++) {
        g2.fillStyle = "rgba(0,0,0,0.28)";
        g2.fillRect(col * 64 - 1.5, 0, 3, 256);
        g2.fillStyle = "rgba(255,255,255,0.07)";
        g2.fillRect(col * 64 + 1.5, 0, 1.5, 256);
      }
      for (let row = 0; row < 4; row++) {
        g2.fillStyle = "rgba(0,0,0,0.34)";
        g2.fillRect(0, row * 64 + 55, 256, 9);
        g2.fillStyle = "rgba(255,255,255,0.09)";
        g2.fillRect(0, row * 64 + 54, 256, 1.5);
      }
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const ix = glass ? 5 : 11;
          const it = glass ? 7 : 12;
          const ib = glass ? 13 : 16;
          const x0 = col * 64 + ix;
          const y0 = row * 64 + it;
          const ww = 64 - ix * 2;
          const hh = 64 - it - ib;
          const lit = rnd() > 0.44;
          const style = rnd();
          g2.fillStyle = "#10151b";
          g2.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
          const gl = g2.createLinearGradient(0, y0, 0, y0 + hh);
          if (lit) {
            gl.addColorStop(0, tint(glow, 0.95));
            gl.addColorStop(1, tint(glow, 0.62));
          } else {
            gl.addColorStop(0, "#2f465c");
            gl.addColorStop(0.55, "#142130");
            gl.addColorStop(1, "#0a111a");
          }
          g2.fillStyle = gl;
          g2.fillRect(x0, y0, ww, hh);
          if (lit) {
            const eg = ge.createLinearGradient(0, y0, 0, y0 + hh);
            eg.addColorStop(0, tint(glow, 0.75));
            eg.addColorStop(1, tint(glow, 0.42));
            ge.fillStyle = eg;
            ge.fillRect(x0, y0, ww, hh);
            if (style > 0.7) {
              for (let by = y0 + 2; by < y0 + hh * 0.6; by += 4) {
                g2.fillStyle = "rgba(20,14,8,0.35)";
                g2.fillRect(x0, by, ww, 1.6);
                ge.fillStyle = "rgba(0,0,0,0.55)";
                ge.fillRect(x0, by, ww, 1.6);
              }
            } else if (style > 0.45) {
              g2.fillStyle = "rgba(40,20,10,0.35)";
              g2.fillRect(x0, y0, ww * 0.22, hh);
              g2.fillRect(x0 + ww * 0.78, y0, ww * 0.22, hh);
              ge.fillStyle = "rgba(0,0,0,0.5)";
              ge.fillRect(x0, y0, ww * 0.22, hh);
              ge.fillRect(x0 + ww * 0.78, y0, ww * 0.22, hh);
            }
          } else {
            g2.fillStyle = "rgba(255,255,255,0.07)";
            g2.beginPath();
            g2.moveTo(x0, y0 + hh);
            g2.lineTo(x0 + ww * 0.55, y0);
            g2.lineTo(x0 + ww * 0.8, y0);
            g2.lineTo(x0 + ww * 0.25, y0 + hh);
            g2.closePath();
            g2.fill();
          }
          g2.fillStyle = "rgba(255,255,255,0.1)";
          g2.fillRect(x0, y0, ww, 2);
          for (const ctx of [g2, ge]) {
            ctx.fillStyle = ctx === g2 ? "#10151b" : "#000";
            ctx.fillRect(x0 + ww / 2 - 1, y0, 2, hh);
            if (!glass) {
              ctx.fillRect(x0, y0 + hh * 0.42, ww, 2);
            }
          }
          g2.fillStyle = "rgba(255,255,255,0.16)";
          g2.fillRect(x0 - 3, y0 + hh + 2, ww + 6, 2.5);
          if (!glass && rnd() > 0.88) {
            g2.fillStyle = "#868d94";
            g2.fillRect(x0 + ww * 0.2, y0 + hh + 4, ww * 0.6, 6);
            g2.fillStyle = "#4b5158";
            g2.fillRect(x0 + ww * 0.2, y0 + hh + 8, ww * 0.6, 2);
          }
        }
      }
      hit = {
        glass,
        map: textureOf(mapCv),
        glow: textureOf(glowCv),
        normal: normalMapFromHeight(mapCv, glass ? 1.1 : 1.9),
      };
      facadeCache.set(key, hit);
      return hit;
    }
    const facadeMatCache = new Map();
    function facadeMaterial(key, fv, rx, ry) {
      const mk = key + "|" + rx + "|" + ry;
      let hit = facadeMatCache.get(mk);
      if (hit) {
        return hit;
      }
      const cp = (tx) => {
        const c2 = tx.clone();
        c2.repeat.set(rx, ry);
        c2.needsUpdate = true;
        return c2;
      };
      hit = new MeshPhysicalMaterial({
        map: cp(fv.map),
        normalMap: cp(fv.normal),
        normalScale: new Vector2(fv.glass ? 0.14 : 0.32, fv.glass ? 0.14 : 0.32),
        emissiveMap: cp(fv.glow),
        emissive: "#ffffff",
        emissiveIntensity: 1.15,
        roughness: fv.glass ? 0.22 : 0.8,
        metalness: fv.glass ? 0.3 : 0.05,
        clearcoat: fv.glass ? 0.85 : 0.14,
        clearcoatRoughness: 0.22,
        envMapIntensity: fv.glass ? 1.2 : 0.25,
      });
      facadeMatCache.set(mk, hit);
      return hit;
    }

    /* --- lit shop-fronts for the ground floor --- */
    const shopCache = new Map();
    function shopMaterial(sign, rx) {
      const mk = sign + "|" + rx;
      let hit = shopCache.get(mk);
      if (hit) {
        return hit;
      }
      const rnd = createRandom(sign.charCodeAt(2) * 131 + sign.charCodeAt(4) * 7);
      const cv = mkCanvas(256, 128);
      const cvE = mkCanvas(256, 128);
      const g2 = cv.getContext("2d");
      const ge = cvE.getContext("2d");
      g2.fillStyle = "#1b2027";
      g2.fillRect(0, 0, 256, 128);
      ge.fillStyle = "#000";
      ge.fillRect(0, 0, 256, 128);
      for (let bay = 0; bay < 2; bay++) {
        const bx0 = bay * 128;
        g2.fillStyle = sign;
        g2.fillRect(bx0 + 14, 6, 100, 18);
        ge.fillStyle = sign;
        ge.fillRect(bx0 + 14, 6, 100, 18);
        for (let k = 0; k < 6; k++) {
          const lw = 6 + Math.floor(rnd() * 8);
          g2.fillStyle = "rgba(0,0,0,0.6)";
          g2.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
          ge.fillStyle = "#000";
          ge.fillRect(bx0 + 20 + k * 15, 11, lw, 8);
        }
        g2.fillStyle = "#0c0f12";
        g2.fillRect(bx0 + 6, 38, 116, 82);
        const gl = g2.createLinearGradient(0, 42, 0, 118);
        gl.addColorStop(0, "#ffe6b8");
        gl.addColorStop(1, "#b57a3c");
        g2.fillStyle = gl;
        g2.fillRect(bx0 + 9, 41, 110, 76);
        const eg = ge.createLinearGradient(0, 42, 0, 118);
        eg.addColorStop(0, "rgba(255,226,170,0.85)");
        eg.addColorStop(1, "rgba(180,120,60,0.6)");
        ge.fillStyle = eg;
        ge.fillRect(bx0 + 9, 41, 110, 76);
        for (let k = 0; k < 4; k++) {
          const sx = bx0 + 14 + k * 26;
          const sh = 14 + Math.floor(rnd() * 26);
          g2.fillStyle = "rgba(30,18,10,0.55)";
          g2.fillRect(sx, 117 - sh, 14, sh);
          ge.fillStyle = "rgba(0,0,0,0.5)";
          ge.fillRect(sx, 117 - sh, 14, sh);
        }
        for (const ctx of [g2, ge]) {
          ctx.fillStyle = ctx === g2 ? "#0c0f12" : "#000";
          ctx.fillRect(bx0 + 62, 41, 4, 76);
          ctx.fillRect(bx0 + 9, 70, 110, 3);
        }
      }
      g2.fillStyle = "#0b0e11";
      g2.fillRect(0, 118, 256, 10);
      const mp = textureOf(cv);
      const em = textureOf(cvE);
      mp.repeat.set(rx, 1);
      em.repeat.set(rx, 1);
      hit = new MeshPhysicalMaterial({
        map: mp,
        emissiveMap: em,
        emissive: "#ffffff",
        emissiveIntensity: 1.3,
        roughness: 0.45,
        metalness: 0.2,
        clearcoat: 0.5,
        envMapIntensity: 0.6,
      });
      shopCache.set(mk, hit);
      return hit;
    }

    /* --- blocks --- */
    for (let bi = 0; bi < C.length - 1; bi++) {
      for (let bj = 0; bj < w.length - 1; bj++) {
        const bx = (C[bi] + C[bi + 1]) / 2;
        const bz = (w[bj] + w[bj + 1]) / 2;
        m(37.2, 0.14, 27.2, bx, 0.02, bz, lotMat);
        if (
          FUEL_STATIONS.some((st) => {
            return Math.abs(st.x - bx) < 32 && Math.abs(st.z - bz) < 32;
          })
        ) {
          continue;
        }
        for (const side of [-1, 1]) {
          if (j() < 0.15) {
            continue;
          }
          const sW = 11 + j() * 4.5;
          const cD = 14 + j() * 8.8;
          const hTarget = 14 + j() * 48;
          const kind = P[Math.floor(j() * P.length)];
          const wall = N[Math.floor(j() * N.length)];
          const glow = M[Math.floor(j() * M.length)];
          const signIdx = Math.floor(j() * SIGNS.length);
          const glass = kind === "glass";
          const bxC = bx + side * (0.9 + sW / 2);
          const bzC = bz + (j() - 0.5) * 2 * Math.max(0, (2 * LOT_HALF_Z - (cD + 1)) / 2);
          const tall = hTarget > 32;
          const l1 = tall ? Math.round((hTarget * 0.62) / FLOOR_H) * FLOOR_H : Math.max(POD_H + 6, hTarget);
          const hs = l1 - POD_H;
          const rY = Math.max(1, Math.round(hs / 14.4));
          const fv = facadeVariant(kind, wall, glow);
          const vKey = kind + wall + glow;
          const fz = facadeMaterial(vKey, fv, Math.max(1, Math.round(sW / 12)), rY);
          const fx = facadeMaterial(vKey, fv, Math.max(1, Math.round(cD / 12)), rY);
          const shopZ = shopMaterial(SIGNS[signIdx], Math.max(1, Math.round((sW + 1) / 8)));
          const shopX = shopMaterial(SIGNS[signIdx], Math.max(1, Math.round((cD + 1) / 8)));
          // ground floor shop podium, cornice, tower shaft
          m(sW + 1, POD_H, cD + 1, bxC, POD_H / 2, bzC, [shopX, shopX, a, f, shopZ, shopZ], true);
          m(sW + 1.2, 0.3, cD + 1.2, bxC, POD_H + 0.15, bzC, a);
          m(sW, hs, cD, bxC, POD_H + hs / 2, bzC, [fx, fx, roofMat, roofMat, fz, fz], true);
          // corner pilasters / frame fins
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              m(
                glass ? 0.4 : 0.7,
                hs,
                glass ? 0.4 : 0.7,
                bxC + (sx * sW) / 2,
                POD_H + hs / 2,
                bzC + (sz * cD) / 2,
                glass ? d : a,
              );
            }
          }
          // floor-group ledges
          if (!glass) {
            for (let k = 1; k < rY; k++) {
              m(sW + 0.35, 0.3, cD + 0.35, bxC, POD_H + (k * hs) / rY, bzC, a);
            }
          }
          let topY = l1;
          let topW = sW;
          let topD = cD;
          if (tall) {
            const sU = sW * 0.74;
            const cU = cD * 0.74;
            const hU = Math.max(6, hTarget - l1);
            const rYU = Math.max(1, Math.round(hU / 14.4));
            const fzU = facadeMaterial(vKey, fv, Math.max(1, Math.round(sU / 12)), rYU);
            const fxU = facadeMaterial(vKey, fv, Math.max(1, Math.round(cU / 12)), rYU);
            m(sW + 0.5, 0.3, cD + 0.5, bxC, l1 + 0.15, bzC, a);
            m(sU, hU, cU, bxC, l1 + 0.3 + hU / 2, bzC, [fxU, fxU, roofMat, roofMat, fzU, fzU], true);
            topY = l1 + 0.3 + hU;
            topW = sU;
            topD = cU;
          }
          // roof cap + parapet
          m(topW + 0.35, 0.28, topD + 0.35, bxC, topY + 0.14, bzC, d);
          m(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC + topD / 2 - 0.2, a);
          m(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC - topD / 2 + 0.2, a);
          m(0.4, 0.9, topD - 0.4, bxC + topW / 2 - 0.2, topY + 0.75, bzC, a);
          m(0.4, 0.9, topD - 0.4, bxC - topW / 2 + 0.2, topY + 0.75, bzC, a);
          // roof equipment
          const nUnits = 1 + Math.floor(j() * 3);
          for (let uI = 0; uI < nUnits; uI++) {
            const uh = 1 + j();
            m(
              1.8 + j() * 2,
              uh,
              1.8 + j() * 2,
              bxC + (j() - 0.5) * (topW - 4),
              topY + 0.28 + uh / 2,
              bzC + (j() - 0.5) * (topD - 4),
              f,
            );
          }
          if (j() > 0.55) {
            const tx = bxC + (j() - 0.5) * (topW - 5);
            const tz = bzC + (j() - 0.5) * (topD - 5);
            for (const lx of [-0.8, 0.8]) {
              for (const lz of [-0.8, 0.8]) {
                m(0.14, 1.5, 0.14, tx + lx, topY + 1.03, tz + lz, d);
              }
            }
            const tank = new Mesh(new CylinderGeometry(1.3, 1.3, 2.2, 16), tankMat);
            tank.position.set(tx, topY + 2.6, tz);
            tank.castShadow = true;
            e.add(tank);
            const tankCap = new Mesh(new ConeGeometry(1.4, 0.8, 16), d);
            tankCap.position.set(tx, topY + 4.1, tz);
            e.add(tankCap);
          }
          if (tall || j() > 0.5) {
            const mh = 6 + j() * 6;
            const mast = new Mesh(new CylinderGeometry(0.05, 0.08, mh, 6), d);
            mast.position.set(bxC, topY + 0.28 + mh / 2, bzC);
            e.add(mast);
            const beacon = new Mesh(new SphereGeometry(0.2, 10, 8), beaconMat);
            beacon.position.set(bxC, topY + 0.28 + mh, bzC);
            e.add(beacon);
          }
          // glowing LED trim on the street-facing edges
          m(topW, 0.14, 0.14, bxC, topY - 0.5, bzC + topD / 2 + 0.05, trimMats[signIdx]);
          m(0.14, 0.14, topD, bxC + topW / 2 + 0.05, topY - 0.5, bzC, trimMats[signIdx]);
          m(sW + 1.02, 0.1, 0.1, bxC, POD_H - 0.12, bzC + (cD + 1) / 2 + 0.02, trimMats[signIdx]);
          m(0.1, 0.1, cD + 1.02, bxC + (sW + 1) / 2 + 0.02, POD_H - 0.12, bzC, trimMats[signIdx]);
        }
      }
    }
  }
  {
    /* ===== DRIFT FURY: street trees v1 (sidewalk only, with trunk colliders) ===== */
    const fc = document.createElement("canvas");
    fc.width = 256;
    fc.height = 256;
    const fg = fc.getContext("2d");
    const frnd = createRandom(5150);
    fg.fillStyle = "#2c5a2a";
    fg.fillRect(0, 0, 256, 256);
    const greens = ["#3f7a35", "#2a5a28", "#4f8a3c", "#1f4a22", "#5f9645", "#35692f"];
    for (let q = 0; q < 2600; q++) {
      fg.fillStyle = greens[Math.floor(frnd() * greens.length)];
      fg.save();
      fg.translate(frnd() * 256, frnd() * 256);
      fg.rotate(frnd() * 6.283);
      fg.beginPath();
      fg.ellipse(0, 0, 2.2 + frnd() * 3.2, 1.1 + frnd() * 1.5, 0, 0, 6.283);
      fg.fill();
      fg.restore();
    }
    for (let q = 0; q < 700; q++) {
      fg.fillStyle = `rgba(8,22,10,${0.25 + frnd() * 0.3})`;
      fg.fillRect(frnd() * 256, frnd() * 256, 3, 3);
    }
    const leafTex = new CanvasTexture(fc);
    leafTex.wrapS = RepeatWrapping;
    leafTex.wrapT = RepeatWrapping;
    leafTex.colorSpace = "srgb";
    leafTex.anisotropy = 8;
    leafTex.repeat.set(2, 2);
    const leafMat = new MeshStandardMaterial({
      map: leafTex,
      bumpMap: leafTex,
      bumpScale: 1.2,
      roughness: 0.92,
      metalness: 0,
    });
    const barkCanvas = document.createElement("canvas");
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const barkCtx = barkCanvas.getContext("2d");
    const barkRnd = createRandom(9271);
    const barkGradient = barkCtx.createLinearGradient(0, 0, 128, 0);
    barkGradient.addColorStop(0, "#30271f");
    barkGradient.addColorStop(0.24, "#66503a");
    barkGradient.addColorStop(0.52, "#493829");
    barkGradient.addColorStop(0.78, "#71563c");
    barkGradient.addColorStop(1, "#30271f");
    barkCtx.fillStyle = barkGradient;
    barkCtx.fillRect(0, 0, 128, 256);
    for (let line = 0; line < 70; line++) {
      const x = barkRnd() * 128;
      const shade = Math.floor(barkRnd() * 45);
      barkCtx.strokeStyle =
        line % 3
          ? `rgba(22,15,10,${0.12 + barkRnd() * 0.34})`
          : `rgba(190,151,105,${0.08 + barkRnd() * 0.2})`;
      barkCtx.lineWidth = 0.5 + barkRnd() * 2;
      barkCtx.beginPath();
      barkCtx.moveTo(x, 0);
      barkCtx.bezierCurveTo(
        x + (barkRnd() - 0.5) * 18,
        84,
        x + (barkRnd() - 0.5) * 18,
        172,
        x + (barkRnd() - 0.5) * 12,
        256,
      );
      barkCtx.stroke();
      if (line < 7) {
        barkCtx.fillStyle = `rgba(${shade},${shade * 0.78},${shade * 0.55},.08)`;
        barkCtx.fillRect(x, 0, 1 + barkRnd() * 4, 256);
      }
    }
    const barkTex = new CanvasTexture(barkCanvas);
    barkTex.wrapS = RepeatWrapping;
    barkTex.wrapT = RepeatWrapping;
    barkTex.colorSpace = "srgb";
    barkTex.anisotropy = 8;
    const barkMat = new MeshStandardMaterial({
      map: barkTex,
      bumpMap: barkTex,
      bumpScale: 0.12,
      roughness: 0.96,
      color: "#b6a18a",
    });
    const spots = [];
    for (const ax of C) {
      for (const side of [-1, 1]) {
        for (let tz = w[0] - 4; tz <= w[w.length - 1] + 4; tz += 12) {
          if (
            w.some((sz) => {
              return Math.abs(tz - sz) < 14.5;
            })
          ) {
            continue;
          }
          if (
            streetlightZs.some((pz) => {
              return Math.abs(tz - pz) < 4.5;
            })
          ) {
            continue;
          }
          spots.push([ax + side * 10.2, tz, 0.88 + j() * 0.28]);
        }
      }
    }
    const CLUMPS = [
      [0, -0.12, 0, 1.2, 0.98, 1.12],
      [0, 0.72, 0, 1.22, 1.02, 1.14],
      [0.78, 0.32, 0.12, 0.94, 0.84, 0.9],
      [-0.76, 0.38, -0.14, 0.98, 0.88, 0.92],
      [0.16, 0.52, 0.76, 0.9, 0.82, 0.94],
      [-0.2, 0.28, -0.76, 0.94, 0.8, 0.9],
      [0.12, 1.35, 0.08, 0.84, 0.8, 0.86],
      [-0.34, -0.08, 0.36, 0.72, 0.7, 0.78],
    ];
    const trunkHeight = (scale) => {
      return 4.85 * scale;
    };
    const trunks = new InstancedMesh(new CylinderGeometry(0.13, 0.24, 1, 12), barkMat, spots.length);
    const branches = new InstancedMesh(new CylinderGeometry(0.055, 0.095, 1, 8), barkMat, spots.length * 4);
    trunks.castShadow = true;
    branches.castShadow = true;
    const crowns = new InstancedMesh(new SphereGeometry(1, 14, 12), leafMat, spots.length * CLUMPS.length);
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    let ci = 0;
    let bi = 0;
    spots.forEach(([tx, tz, treeScale], ti) => {
      const ground = 0.22;
      const height = trunkHeight(treeScale);
      _.set(tx, ground + height / 2, tz);
      v.identity();
      y.set(treeScale * (0.9 + j() * 0.18), height, treeScale * (0.9 + j() * 0.18));
      g.compose(_, v, y);
      trunks.setMatrixAt(ti, g);
      for (let branch = 0; branch < 4; branch++) {
        const angle = (branch * Math.PI) / 2 + (j() - 0.5) * 0.42;
        const length = treeScale * (1.45 + j() * 0.35);
        const direction = new Vector3(Math.cos(angle) * 0.82, 0.52 + j() * 0.16, Math.sin(angle) * 0.82);
        direction.normalize();
        v.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        _.set(
          tx + direction.x * length * 0.48,
          ground + height * (0.62 + (branch % 2) * 0.1),
          tz + direction.z * length * 0.48,
        );
        y.set(1, length, 1);
        g.compose(_, v, y);
        branches.setMatrixAt(bi++, g);
      }
      for (const [ox, oy, oz, rx, ry, rz] of CLUMPS) {
        const clumpScale = treeScale * (0.88 + j() * 0.24);
        _.set(tx + ox * treeScale, ground + height + oy * treeScale, tz + oz * treeScale);
        v.setFromAxisAngle(new Vector3(0, 1, 0), (j() - 0.5) * 0.7);
        y.set(rx * clumpScale, ry * clumpScale * (0.88 + j() * 0.24), rz * clumpScale);
        g.compose(_, v, y);
        crowns.setMatrixAt(ci++, g);
      }
      h(tx, tz, 0.3, 0.3);
    });
    trunks.instanceMatrix.needsUpdate = true;
    branches.count = bi;
    branches.instanceMatrix.needsUpdate = true;
    crowns.count = ci;
    crowns.instanceMatrix.needsUpdate = true;
    e.add(trunks);
    e.add(branches);
    e.add(crowns);
  }
  const stationSteel = new MeshStandardMaterial({
    color: "#879199",
    roughness: 0.38,
    metalness: 0.72,
  });
  const stationDarkSteel = new MeshStandardMaterial({
    color: "#252c31",
    roughness: 0.58,
    metalness: 0.48,
  });
  const stationWhite = new MeshStandardMaterial({
    color: "#e8e9e4",
    roughness: 0.62,
    metalness: 0.12,
  });
  const stationRed = new MeshStandardMaterial({
    color: "#b83132",
    roughness: 0.38,
    metalness: 0.22,
  });
  const stationParkingPaint = new MeshStandardMaterial({
    color: "#d9d9ce",
    roughness: 0.82,
    metalness: 0,
  });
  const stationGlass = new MeshPhysicalMaterial({
    color: "#a8c4ce",
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.32,
    side: 2,
  });
  const stationWindowFrame = new MeshStandardMaterial({
    color: "#252b30",
    roughness: 0.4,
    metalness: 0.56,
  });
  const stationTileTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    const tileSize = 64;
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const shade = 89 + ((row * 17 + column * 11) % 13);
        context.fillStyle = `rgb(${shade},${shade + 2},${shade - 2})`;
        context.fillRect(column * tileSize + 2, row * tileSize + 2, tileSize - 4, tileSize - 4);
      }
    }
    context.strokeStyle = "rgba(15,19,20,.75)";
    context.lineWidth = 3;
    for (let line = 0; line <= 8; line++) {
      context.beginPath();
      context.moveTo(line * tileSize, 0);
      context.lineTo(line * tileSize, 512);
      context.stroke();
      context.beginPath();
      context.moveTo(0, line * tileSize);
      context.lineTo(512, line * tileSize);
      context.stroke();
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationFloor = new MeshStandardMaterial({
    color: "#b5b6ad",
    map: stationTileTexture,
    bumpMap: stationTileTexture,
    bumpScale: 0.028,
    roughness: 0.68,
    metalness: 0.025,
  });
  const stationScreen = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const context = canvas.getContext("2d");
    context.fillStyle = "#071317";
    context.fillRect(0, 0, 256, 160);
    context.strokeStyle = "#537078";
    context.lineWidth = 5;
    context.strokeRect(5, 5, 246, 150);
    context.fillStyle = "#75e0c0";
    context.font = "bold 54px monospace";
    context.textAlign = "center";
    context.fillText("87.9", 128, 68);
    context.font = "bold 24px monospace";
    context.fillText("L / $", 128, 112);
    context.fillStyle = "#9ec2b2";
    context.font = "16px sans-serif";
    context.fillText("TAP  •  INSERT", 128, 140);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationScreenMat = new MeshStandardMaterial({
    map: stationScreen,
    emissiveMap: stationScreen,
    emissive: "#9bdbc8",
    emissiveIntensity: 0.65,
    roughness: 0.32,
    metalness: 0.08,
  });
  const stationAwningLight = new MeshStandardMaterial({
    color: "#fff5df",
    emissive: "#ffe7b5",
    emissiveIntensity: 1.35,
    roughness: 0.35,
  });
  const stationSignTexture = (() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 192;
    const context = canvas.getContext("2d");
    context.fillStyle = "#17252a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#c6dc77";
    context.fillRect(0, 0, 18, canvas.height);
    context.fillRect(canvas.width - 18, 0, 18, canvas.height);
    context.fillStyle = "#f5f1e6";
    context.font = "bold 76px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("NORTHLINE  •  DÉPANNEUR", canvas.width / 2, canvas.height / 2);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = "srgb";
    return texture;
  })();
  const stationSignMat = new MeshStandardMaterial({
    map: stationSignTexture,
    emissiveMap: stationSignTexture,
    emissive: "#d7edac",
    emissiveIntensity: 0.6,
    roughness: 0.48,
  });
  const stationShelfMat = new MeshStandardMaterial({
    color: "#4a5051",
    roughness: 0.64,
    metalness: 0.42,
  });
  const stationProductMats = [
    new MeshStandardMaterial({
      color: "#c44a36",
      roughness: 0.64,
    }),
    new MeshStandardMaterial({
      color: "#d5b247",
      roughness: 0.58,
    }),
    new MeshStandardMaterial({
      color: "#577f9c",
      roughness: 0.57,
    }),
    new MeshStandardMaterial({
      color: "#65805b",
      roughness: 0.7,
    }),
    new MeshStandardMaterial({
      color: "#eee4cb",
      roughness: 0.65,
    }),
  ];
  const stationShelfFrames = new InstancedMesh(new BoxGeometry(0.72, 2.05, 0.55), stationShelfMat, 18);
  const stationShelfBoards = new InstancedMesh(new BoxGeometry(0.82, 0.055, 0.68), stationSteel, 72);
  const stationCoolerShelves = new InstancedMesh(new BoxGeometry(1.12, 0.035, 0.42), stationSteel, 36);
  const stationHoseSegments = new InstancedMesh(
    new CylinderGeometry(0.035, 0.035, 1, 8),
    stationDarkSteel,
    48,
  );
  let stationShelfFrameCount = 0;
  let stationShelfBoardCount = 0;
  let stationCoolerShelfCount = 0;
  let stationHoseCount = 0;
  const stationShelfProducts = stationProductMats.map((material) => {
    return new InstancedMesh(new BoxGeometry(0.17, 0.27, 0.2), material, 216);
  });
  const stationCoolerProducts = stationProductMats.map((material) => {
    return new InstancedMesh(new BoxGeometry(0.12, 0.25, 0.12), material, 72);
  });
  const stationShelfProductCounts = stationProductMats.map(() => {
    return 0;
  });
  const stationCoolerProductCounts = stationProductMats.map(() => {
    return 0;
  });
  const placeStationProduct = (meshes, counts, materialIndex, x, yPos, z) => {
    const mesh = meshes[materialIndex];
    const instance = counts[materialIndex]++;
    _.set(x, yPos, z);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const placeStationInstance = (mesh, instance, x, yPos, z, scaleX = 1, scaleY = 1, scaleZ = 1) => {
    _.set(x, yPos, z);
    v.identity();
    y.set(scaleX, scaleY, scaleZ);
    g.compose(_, v, y);
    mesh.setMatrixAt(instance, g);
  };
  const stationPumpFace = (x, y, z, side) => {
    const face = new Mesh(new PlaneGeometry(0.42, 0.3), stationScreenMat);
    face.position.set(x, y, z + side * 0.317);
    if (side < 0) {
      face.rotation.y = Math.PI;
    }
    e.add(face);
    const bezel = m(0.5, 0.38, 0.035, x, y, z + side * 0.295, stationDarkSteel);
    bezel.renderOrder = 2;
    face.renderOrder = 3;
    m(0.22, 0.12, 0.025, x, y - 0.34, z + side * 0.323, stationDarkSteel);
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 3; column++) {
        const button = new Mesh(
          new CylinderGeometry(0.025, 0.025, 0.022, 10),
          column === 0 ? stationRed : stationSteel,
        );
        button.position.set(x - 0.13 + column * 0.13, y - 0.48 - row * 0.095, z + side * 0.326);
        e.add(button);
      }
    }
    m(0.35, 0.12, 0.03, x, y - 0.75, z + side * 0.327, stationDarkSteel);
  };
  const addFuelPump = (x, z, groundY) => {
    m(1.55, 0.14, 3.8, x, groundY + 0.12, z, stationSteel);
    m(1.46, 0.055, 3.68, x, groundY + 0.218, z, stationDarkSteel);
    m(0.82, 0.2, 0.72, x, groundY + 0.34, z, stationDarkSteel);
    m(0.76, 1.34, 0.62, x, groundY + 1.11, z, stationWhite);
    m(0.765, 0.17, 0.625, x, groundY + 1.72, z, stationRed);
    m(0.79, 0.105, 0.65, x, groundY + 1.86, z, stationSteel);
    h(x, z, 0.42, 0.38);
    for (const side of [-1, 1]) {
      stationPumpFace(x, groundY + 1.36, z, side);
    }
    for (const side of [-1, 1]) {
      const hoseX = x + side * 0.39;
      const hoseZ = z + 0.05;
      const points = [
        [hoseX, groundY + 1.48, hoseZ],
        [x + side * 0.62, groundY + 1.52, hoseZ],
        [x + side * 0.7, groundY + 1.35, hoseZ + 0.08],
        [x + side * 0.7, groundY + 0.83, hoseZ + 0.13],
        [x + side * 0.55, groundY + 0.7, hoseZ + 0.18],
      ];
      for (let segment = 0; segment < points.length - 1; segment++) {
        const from = new Vector3(...points[segment]);
        const to = new Vector3(...points[segment + 1]);
        const delta = new Vector3().subVectors(to, from);
        const length = delta.length();
        _.copy(from).add(to).multiplyScalar(0.5);
        v.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
        y.set(1, length, 1);
        g.compose(_, v, y);
        stationHoseSegments.setMatrixAt(stationHoseCount++, g);
      }
      m(0.075, 0.28, 0.075, x + side * 0.4, groundY + 1.56, z - 0.17, stationSteel);
      m(0.075, 0.34, 0.075, x + side * 0.4, groundY + 1.4, z + 0.22, stationDarkSteel);
      m(0.12, 0.08, 0.1, x + side * 0.4, groundY + 1.56, z + 0.3, stationRed);
    }
    const bollardMat = stationRed;
    for (const side of [-1, 1]) {
      m(0.12, 0.62, 0.12, x + side * 0.91, groundY + 0.43, z + 1.44, bollardMat);
      m(0.14, 0.08, 0.14, x + side * 0.91, groundY + 0.76, z + 1.44, stationWhite);
      h(x + side * 0.91, z + 1.44, 0.1, 0.1);
    }
  };
  const storeShell = new MeshStandardMaterial({
    color: "#c5c1b4",
    roughness: 0.84,
    metalness: 0.03,
  });
  const storeRoofMat = new MeshStandardMaterial({
    color: "#353b3e",
    roughness: 0.72,
    metalness: 0.3,
  });
  const coolerMat = new MeshStandardMaterial({
    color: "#eaf0eb",
    roughness: 0.27,
    metalness: 0.3,
    emissive: "#7cc9dc",
    emissiveIntensity: 0.12,
  });
  const coolerGlass = new MeshPhysicalMaterial({
    color: "#d8efff",
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.18,
    side: 2,
  });
  const counterMat = new MeshStandardMaterial({
    color: "#41352b",
    roughness: 0.72,
    metalness: 0.1,
  });
  const addStationStore = (station, index, groundY) => {
    const shopX = station.x;
    const shopZ = station.z + 11.15;
    const frontZ = shopZ - 4.35;
    const backZ = shopZ + 4.35;
    const wallHeight = 3.55;
    const halfWidth = 5.8;
    m(11.8, 0.2, 9, shopX, groundY + 0.1, shopZ, stationFloor);
    m(12.15, 0.22, 0.22, shopX, groundY + 0.14, shopZ, stationDarkSteel);
    m(0.24, wallHeight, 9, shopX - halfWidth, groundY + wallHeight / 2, shopZ, storeShell, true);
    m(0.24, wallHeight, 9, shopX + halfWidth, groundY + wallHeight / 2, shopZ, storeShell, true);
    m(11.8, wallHeight, 0.24, shopX, groundY + wallHeight / 2, backZ, storeShell, true);
    const storefrontCenter = 3;
    const storefrontWidth = 4.25;
    for (const side of [-1, 1]) {
      const windowX = shopX + side * storefrontCenter;
      m(storefrontWidth, 0.8, 0.24, windowX, groundY + 0.4, frontZ, storeShell);
      m(storefrontWidth, 0.47, 0.24, windowX, groundY + 3.31, frontZ, storeShell);
      h(windowX, frontZ, storefrontWidth / 2, 0.14);
    }
    m(1.7, 0.3, 0.24, shopX, groundY + 3.4, frontZ, storeShell);
    m(12.35, 0.18, 9.35, shopX, groundY + 3.72, shopZ, storeRoofMat);
    m(12.5, 0.15, 0.18, shopX, groundY + 3.58, frontZ, stationRed);
    m(12.5, 0.15, 0.18, shopX, groundY + 3.58, backZ, stationRed);
    m(0.18, 0.15, 9.2, shopX - 6.1, groundY + 3.58, shopZ, stationRed);
    m(0.18, 0.15, 9.2, shopX + 6.1, groundY + 3.58, shopZ, stationRed);
    for (const side of [-1, 1]) {
      m(
        storefrontWidth,
        2.25,
        0.035,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.14,
        stationGlass,
      );
      for (const frameX of [-1, 1]) {
        m(
          0.055,
          2.35,
          0.07,
          shopX + side * storefrontCenter + frameX * (storefrontWidth / 2 - 0.06),
          groundY + 1.95,
          frontZ - 0.19,
          stationWindowFrame,
        );
      }
      m(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 0.78,
        frontZ - 0.19,
        stationWindowFrame,
      );
      m(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 3.12,
        frontZ - 0.19,
        stationWindowFrame,
      );
      m(
        0.055,
        2.25,
        0.065,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.19,
        stationWindowFrame,
      );
    }
    m(0.09, 2.28, 0.09, shopX - 0.9, groundY + 1.92, frontZ - 0.19, stationWindowFrame);
    m(0.09, 2.28, 0.09, shopX + 0.9, groundY + 1.92, frontZ - 0.19, stationWindowFrame);
    m(1.16, 0.045, 0.5, shopX, groundY + 0.17, frontZ - 0.3, stationDarkSteel);
    const openDoor = new Mesh(new BoxGeometry(0.78, 2.18, 0.075), stationGlass);
    openDoor.position.set(shopX + 0.24, groundY + 1.24, frontZ + 0.04);
    openDoor.rotation.y = -0.72;
    e.add(openDoor);
    m(0.12, 0.12, 0.12, shopX + 0.24, groundY + 2.38, frontZ + 0.04, stationSteel);
    m(0.045, 0.24, 0.035, shopX - 0.05, groundY + 1.22, frontZ - 0.12, stationSteel);
    const sign = new Mesh(new PlaneGeometry(5.2, 0.72), stationSignMat);
    sign.position.set(shopX, groundY + 3.05, frontZ - 0.205);
    sign.rotation.y = Math.PI;
    e.add(sign);
    for (const side of [-1, 1]) {
      m(0.13, 3.6, 0.13, shopX + side * 6.22, groundY + 1.8, shopZ, stationSteel);
    }
    m(4.5, 0.12, 0.72, shopX, groundY + 1.04, shopZ + 3.65, counterMat);
    m(4.5, 0.7, 0.16, shopX, groundY + 0.64, shopZ + 3.95, counterMat);
    m(0.56, 0.12, 0.4, shopX - 0.95, groundY + 1.17, shopZ + 3.35, stationDarkSteel);
    m(0.48, 0.48, 0.04, shopX - 0.95, groundY + 1.47, shopZ + 3.32, stationScreenMat);
    m(0.12, 0.25, 0.16, shopX + 1.75, groundY + 1.18, shopZ + 3.54, stationSteel);
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfZ = shopZ - 1.5 + shelf * 1.15;
      for (const side of [-1, 1]) {
        const shelfX = shopX + side * 4.45;
        placeStationInstance(stationShelfFrames, stationShelfFrameCount++, shelfX, groundY + 1.08, shelfZ);
        for (let level = 0; level < 4; level++) {
          const shelfY = groundY + 0.42 + level * 0.49;
          placeStationInstance(stationShelfBoards, stationShelfBoardCount++, shelfX, shelfY, shelfZ);
          for (let product = 0; product < 3; product++) {
            const materialIndex = (product + level + shelf + index) % stationProductMats.length;
            placeStationProduct(
              stationShelfProducts,
              stationShelfProductCounts,
              materialIndex,
              shelfX - 0.25 + product * 0.25,
              shelfY + 0.16,
              shelfZ,
            );
          }
        }
        h(shelfX, shelfZ, 0.4, 0.32);
      }
    }
    for (let cooler = 0; cooler < 3; cooler++) {
      const coolerX = shopX - 2.5 + cooler * 1.65;
      const coolerZ = shopZ + 0.3;
      m(1.48, 2.3, 0.65, coolerX, groundY + 1.18, coolerZ, coolerMat);
      m(1.35, 1.95, 0.035, coolerX, groundY + 1.26, coolerZ - 0.35, coolerGlass);
      m(0.045, 2, 0.07, coolerX, groundY + 1.26, coolerZ - 0.385, stationSteel);
      for (let level = 0; level < 4; level++) {
        placeStationInstance(
          stationCoolerShelves,
          stationCoolerShelfCount++,
          coolerX,
          groundY + 0.55 + level * 0.42,
          coolerZ - 0.04,
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler) % stationProductMats.length,
          coolerX - 0.38,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1,
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler + 2) % stationProductMats.length,
          coolerX,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1,
        );
        placeStationProduct(
          stationCoolerProducts,
          stationCoolerProductCounts,
          (level + cooler + 4) % stationProductMats.length,
          coolerX + 0.38,
          groundY + 0.7 + level * 0.42,
          coolerZ - 0.1,
        );
      }
      m(0.04, 0.32, 0.04, coolerX + 0.52, groundY + 1.25, coolerZ - 0.4, stationSteel);
      h(coolerX, coolerZ, 0.74, 0.36);
    }
    h(shopX, shopZ + 3.76, 2.28, 0.43);
    for (let light = 0; light < 2; light++) {
      const lightX = shopX + (light ? 3.5 : -3.5);
      m(1.7, 0.045, 0.34, lightX, groundY + 3.39, shopZ - 0.15, stationAwningLight);
    }
    const insideLight = new PointLight("#fff0d5", 0.55, 17, 2);
    insideLight.position.set(shopX, groundY + 2.8, shopZ);
    e.add(insideLight);
    const outsideLight = new PointLight("#dceeff", 0.55, 15, 2);
    outsideLight.position.set(shopX, groundY + 3.3, frontZ - 1);
    e.add(outsideLight);
  };
  for (let stationIndex = 0; stationIndex < FUEL_STATIONS.length; stationIndex++) {
    const station = FUEL_STATIONS[stationIndex];
    const groundY = terrainHeight(station.x, station.z);
    m(26, 0.14, 22, station.x, groundY + 0.07, station.z, o);
    const access = stationRoadAccesses[stationIndex];
    const roadEdgeX = access.roadX + access.side * 9;
    const stationEdgeX = station.x - access.side * 13;
    const accessLength = Math.abs(stationEdgeX - roadEdgeX) + 3;
    const accessCenterX = (stationEdgeX + roadEdgeX) / 2;
    m(accessLength, 0.12, 9.5, accessCenterX, groundY + 0.07, station.z, r);
    const canopy = new MeshStandardMaterial({
      color: stationIndex === 1 ? "#d8e1e0" : "#e8eef2",
      roughness: 0.52,
      metalness: 0.16,
    });
    const canopyTop = new MeshStandardMaterial({
      color: "#343b40",
      roughness: 0.62,
      metalness: 0.25,
    });
    m(24.5, 0.45, 16, station.x, groundY + 5.2, station.z, canopy);
    m(24.3, 0.12, 15.8, station.x, groundY + 5.49, station.z, canopyTop);
    m(24.7, 0.12, 0.22, station.x, groundY + 4.94, station.z - 8.02, stationRed);
    m(24.7, 0.12, 0.22, station.x, groundY + 4.94, station.z + 8.02, stationRed);
    m(0.16, 0.08, 15.8, station.x - 12.1, groundY + 4.93, station.z, stationSteel);
    m(0.16, 0.08, 15.8, station.x + 12.1, groundY + 4.93, station.z, stationSteel);
    for (let rib = -4; rib <= 4; rib++) {
      m(0.045, 0.06, 15.7, station.x + rib * 2.6, groundY + 5.57, station.z, stationSteel);
    }
    for (let side of [-1, 1]) {
      m(20, 0.38, 0.1, station.x, groundY + 5.23, station.z + side * 8.1, stationSignMat);
    }
    for (let x of [-11.8, 11.8]) {
      for (let z of [-7, 7]) {
        m(0.48, 5.2, 0.48, station.x + x, groundY + 2.6, station.z + z, stationSteel, true);
        m(0.64, 0.12, 0.64, station.x + x, groundY + 0.2, station.z + z, stationDarkSteel);
      }
    }
    for (let lampX of [-7.5, -2.5, 2.5, 7.5]) {
      for (let lampZ of [-5, 5]) {
        m(2.1, 0.045, 0.7, station.x + lampX, groundY + 4.94, station.z + lampZ, stationAwningLight);
      }
    }
    const canopyLight = new PointLight("#fff0d5", 0.7, 28, 2);
    canopyLight.position.set(station.x, groundY + 4.62, station.z);
    e.add(canopyLight);
    addFuelPump(station.x - 4, station.z - 2.35, groundY);
    addFuelPump(station.x + 4, station.z - 2.35, groundY);
    addStationStore(station, stationIndex, groundY);
    for (const [parkingX, parkingZ, acrossX] of [
      [station.x - 9, station.z - 6, false],
      [station.x + 9, station.z - 6, false],
      [station.x - 9, station.z + 7.5, true],
    ]) {
      for (const side of [-1, 1]) {
        if (acrossX) {
          m(5.6, 0.018, 0.085, parkingX, groundY + 0.16, parkingZ + side * 1.4, stationParkingPaint);
        } else {
          m(0.085, 0.018, 5.6, parkingX + side * 1.4, groundY + 0.16, parkingZ, stationParkingPaint);
        }
      }
    }
    m(0.28, 7, 0.28, station.x + 12, groundY + 3.5, station.z + 9, stationSteel);
    m(3, 1.4, 0.3, station.x + 12, groundY + 7, station.z + 9, stationSignMat);
    const priceBoard = new Mesh(new PlaneGeometry(2.3, 0.72), stationScreenMat);
    priceBoard.position.set(station.x + 12, groundY + 7, station.z + 8.83);
    priceBoard.rotation.y = Math.PI;
    e.add(priceBoard);
    const canopyBadge = new Mesh(new PlaneGeometry(4.4, 0.48), stationSignMat);
    canopyBadge.position.set(station.x, groundY + 5.22, station.z - 8.09);
    e.add(canopyBadge);
  }
  for (const [mesh, count] of [
    [stationShelfFrames, stationShelfFrameCount],
    [stationShelfBoards, stationShelfBoardCount],
    [stationCoolerShelves, stationCoolerShelfCount],
    [stationHoseSegments, stationHoseCount],
  ]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    e.add(mesh);
  }
  for (let index = 0; index < stationProductMats.length; index++) {
    const shelfProducts = stationShelfProducts[index];
    shelfProducts.count = stationShelfProductCounts[index];
    shelfProducts.instanceMatrix.needsUpdate = true;
    e.add(shelfProducts);
    const coolerProducts = stationCoolerProducts[index];
    coolerProducts.count = stationCoolerProductCounts[index];
    coolerProducts.instanceMatrix.needsUpdate = true;
    e.add(coolerProducts);
  }
  m(28, 0.15, 820, 175, 0.025, -290, i);
  for (let e = -680; e < 150; e += 12) {
    E(175, e, 0.22, 7, 0.14);
  }
  m(0.2, 0.02, 820, 168, 0.14, -290, c);
  m(0.2, 0.02, 820, 182, 0.14, -290, c);
  const F = new InstancedMesh(
    new BoxGeometry(0.1, 0.04, 0.1),
    new MeshStandardMaterial({
      color: "#ffeecc",
      emissive: "#ffcc66",
      emissiveIntensity: 2.2,
    }),
    200,
  );
  let I = 0;
  for (let e = -680; e < 150; e += 6) {
    _.set(171.5, 0.16, e);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    F.setMatrixAt(I++, g);
  }
  F.count = I;
  F.instanceMatrix.needsUpdate = true;
  e.add(F);
  const L = new BoxGeometry(0.12, 0.9, 0.12);
  const R = new BoxGeometry(0.6, 0.85, 11);
  const z = new InstancedMesh(L, d, 200);
  const ee = new InstancedMesh(R, a, 200);
  z.castShadow = true;
  ee.castShadow = true;
  ee.receiveShadow = true;
  let B = 0;
  for (let e = -690; e < 160; e += 14) {
    if (Math.abs(e - 70) >= 11 && Math.abs(e + 80) >= 11) {
      for (let t of [-15, 15]) {
        _.set(175 + t, 0.45, e);
        v.identity();
        y.set(1, 1, 1);
        g.compose(_, v, y);
        z.setMatrixAt(B, g);
        ee.setMatrixAt(B, g);
        h(175 + t, e, 0.3, 5.5);
        B++;
      }
    }
  }
  z.count = B;
  ee.count = B;
  z.instanceMatrix.needsUpdate = true;
  ee.instanceMatrix.needsUpdate = true;
  e.add(z);
  e.add(ee);
  m(60, 0.12, 18, 147, 0.02, 70, i);
  m(60, 0.12, 18, 147, 0.02, -80, i);
  for (let e = -155; e > -520; e -= 4) {
    const t = e - 4;
    const n = mountainRoadX(e);
    const i = mountainRoadX(t);
    const o = terrainHeight(n, e);
    const s = Math.hypot(4, i - n) + 1;
    const c = m(14, 0.18, s, n, o, e, r);
    c.rotation.y = -Math.atan2(i - n, 4);
    if (Math.round(e / 8) % 2 == 0) {
      const t = m(0.22, 0.02, 2, n, o + 0.13, e, l);
      t.rotation.y = c.rotation.y;
    }
    for (let t of [-1, 1]) {
      const r = m(0.3, 0.65, s, n + t * 7.5, o + 0.42, e, a);
      r.rotation.y = c.rotation.y;
    }
  }
  m(18, 0.1, 36, 0, 0, -130, r);
  for (let e = 0; e < 10; e++) {
    const t = -132 - e * 3.4;
    const n = t - 3.4;
    const i = (-25 * e) / 10;
    const a = (-25 * (e + 1)) / 10;
    const o = m(15, 0.15, 5.4, (i + a) / 2, terrainHeight(i, t), (t + n) / 2, r);
    o.rotation.y = -Math.atan2(a - i, 3.4);
  }
  const closureFaceCanvas = document.createElement("canvas");
  closureFaceCanvas.width = 512;
  closureFaceCanvas.height = 128;
  const closureFaceContext = closureFaceCanvas.getContext("2d");
  closureFaceContext.fillStyle = "#e96b1b";
  closureFaceContext.fillRect(0, 0, 512, 128);
  closureFaceContext.save();
  closureFaceContext.beginPath();
  closureFaceContext.rect(0, 0, 512, 128);
  closureFaceContext.clip();
  closureFaceContext.translate(-128, 0);
  closureFaceContext.rotate(-Math.PI / 4);
  for (let stripe = -256; stripe < 768; stripe += 112) {
    closureFaceContext.fillStyle = "#eee9dc";
    closureFaceContext.fillRect(stripe, -256, 46, 768);
    closureFaceContext.fillStyle = "rgba(45, 45, 45, .35)";
    closureFaceContext.fillRect(stripe + 46, -256, 8, 768);
  }
  closureFaceContext.restore();
  const closureFaceTexture = new CanvasTexture(closureFaceCanvas);
  closureFaceTexture.colorSpace = "srgb";
  const closureFaceMaterial = new MeshStandardMaterial({
    map: closureFaceTexture,
    roughness: 0.58,
    metalness: 0.02,
  });
  const closureOrange = new MeshStandardMaterial({
    color: "#eb701f",
    roughness: 0.72,
    metalness: 0.02,
  });
  const closureDark = new MeshStandardMaterial({
    color: "#373b3e",
    roughness: 0.84,
    metalness: 0.12,
  });
  const closureLamp = new MeshStandardMaterial({
    color: "#ffad32",
    emissive: "#ff8518",
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  function addRoadClosure(x, z, width, depth, yaw = 0) {
    const barrier = new Group();
    barrier.position.set(x, terrainHeight(x, z), z);
    barrier.rotation.y = yaw;
    const moduleLength = 4.2;
    const moduleCount = Math.ceil(width / moduleLength);
    const actualWidth = moduleCount * moduleLength;
    const firstX = -actualWidth / 2 + moduleLength / 2;
    for (let index = 0; index < moduleCount; index++) {
      const localX = firstX + index * moduleLength;
      const base = new Mesh(new BoxGeometry(moduleLength - 0.08, 0.32, depth), closureDark);
      base.position.set(localX, 0.16, 0);
      barrier.add(base);
      const lowerBody = new Mesh(new BoxGeometry(moduleLength - 0.14, 0.34, depth - 0.06), closureOrange);
      lowerBody.position.set(localX, 0.49, 0);
      barrier.add(lowerBody);
      const upperBody = new Mesh(new BoxGeometry(moduleLength - 0.38, 0.42, depth - 0.32), closureOrange);
      upperBody.position.set(localX, 0.87, 0);
      barrier.add(upperBody);
      for (const faceSide of [-1, 1]) {
        const face = new Mesh(new BoxGeometry(moduleLength - 0.62, 0.3, 0.025), closureFaceMaterial);
        face.position.set(localX, 0.88, faceSide * (depth / 2 - 0.15));
        barrier.add(face);
      }
      const join = new Mesh(new BoxGeometry(0.12, 0.16, depth - 0.12), closureDark);
      join.position.set(localX + moduleLength / 2 - 0.02, 0.32, 0);
      barrier.add(join);
      if (index === 0 || index === moduleCount - 1) {
        const lamp = new Mesh(new CylinderGeometry(0.13, 0.13, 0.12, 12), closureLamp);
        lamp.position.set(localX, 1.14, 0);
        barrier.add(lamp);
      }
    }
    e.add(barrier);
    const cosine = Math.abs(Math.cos(yaw));
    const sine = Math.abs(Math.sin(yaw));
    h(x, z, (cosine * actualWidth) / 2 + (sine * depth) / 2, (sine * actualWidth) / 2 + (cosine * depth) / 2);
  }
  addRoadClosure(175, -695, 28, 1.4, Math.PI / 2);
  const te = new MeshStandardMaterial({
    color: "#2c3a36",
    roughness: 0.95,
  });
  const ne = new InstancedMesh(new ConeGeometry(1, 1, 14), te, 60);
  ne.castShadow = true;
  for (let e = 0; e < 60; e++) {
    const t = -185 - j() * 350;
    const n = j() > 0.5 ? 1 : -1;
    const i = 18 + j() * 55;
    const a = 18 + j() * 26;
    const r = mountainRoadX(t) + n * Math.max(30 + j() * 70, a * 1.7 + 12);
    _.set(r, terrainHeight(r, t) + i / 2 - 4, t);
    v.identity();
    y.set(a, i, a);
    g.compose(_, v, y);
    ne.setMatrixAt(e, g);
    h(r, t, a * 0.6, a * 0.6);
  }
  ne.instanceMatrix.needsUpdate = true;
  e.add(ne);
  const re = new MeshStandardMaterial({
    color: "#423d34",
    roughness: 0.9,
  });
  const ie = new MeshStandardMaterial({
    color: "#1f4736",
    roughness: 0.9,
  });
  const ae = new InstancedMesh(new CylinderGeometry(0.25, 0.4, 4, 12), re, 120);
  const oe = [
    new ConeGeometry(2.8, 3.5, 16),
    new ConeGeometry(2.3, 3.5, 16),
    new ConeGeometry(1.8, 3.5, 16),
  ].map((e) => {
    const t = new InstancedMesh(e, ie, 120);
    t.castShadow = true;
    return t;
  });
  for (let e = 0; e < 120; e++) {
    const t = -165 - j() * 360;
    const n = mountainRoadX(t) + (j() > 0.5 ? 1 : -1) * (12 + j() * 14);
    const r = terrainHeight(n, t);
    _.set(n, r + 2, t);
    v.identity();
    y.set(1, 1, 1);
    g.compose(_, v, y);
    ae.setMatrixAt(e, g);
    for (let i = 0; i < 3; i++) {
      _.set(n, r + 4 + i * 2, t);
      g.compose(_, v, y);
      oe[i].setMatrixAt(e, g);
    }
    h(n, t, 0.6, 0.6);
  }
  ae.instanceMatrix.needsUpdate = true;
  e.add(ae);
  for (let t of oe) {
    t.instanceMatrix.needsUpdate = true;
    e.add(t);
  }
  const H = new BufferGeometry();
  const se = [];
  for (let e = 0; e < 500; e++) {
    se.push((Math.random() - 0.5) * 1000, 220 + Math.random() * 250, (Math.random() - 0.5) * 1000);
  }
  H.setAttribute("position", new Float32BufferAttribute(se, 3));
  e.add(
    new Points(
      H,
      new PointsMaterial({
        color: "#ffffff",
        size: 1.6,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
      }),
    ),
  );
  return {
    solids: t,
    lampPositions: n,
    signals,
  };
}
