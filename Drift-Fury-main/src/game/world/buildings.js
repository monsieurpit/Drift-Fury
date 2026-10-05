import {
  MeshStandardMaterial,
  Mesh,
  CylinderGeometry,
  CanvasTexture,
  RepeatWrapping,
  MeshPhysicalMaterial,
  Vector2,
  ConeGeometry,
  SphereGeometry,
} from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { createRandom } from "../util/random.js";
import { concreteTexture, normalMapFromHeight } from "./textures.js";
/** City blocks: towers, podiums and storefronts on the lots between the roads. */
export function buildBuildings(world) {
  const { addBox, darkMetal, poleMetal, roadXs, roadZs, scene, sidewalkMaterial } = world;
  let worldSeed = 9137;
  const worldRandom = () => {
    worldSeed = (worldSeed * 16807) % 2147483647;
    return (worldSeed - 1) / 2147483646;
  };
  const windowGlowColors = ["#ffe9c0", "#cfe8ff", "#ffd9a0", "#e8e0ff"];
  const wallColors = ["#3a4250", "#42454d", "#383c44", "#454050", "#3e4855"];
  const facadeKinds = ["glass", "classic", "classic", "glass"];
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
      const cl = (q) => Math.max(0, Math.min(255, Math.round(q * k)));
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
    const trimMats = SIGNS.map(
      (col) =>
        new MeshStandardMaterial({
          color: "#050505",
          emissive: col,
          emissiveIntensity: 1.7,
          roughness: 0.4,
        }),
    );

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
    for (let bi = 0; bi < roadXs.length - 1; bi++) {
      for (let bj = 0; bj < roadZs.length - 1; bj++) {
        const bx = (roadXs[bi] + roadXs[bi + 1]) / 2;
        const bz = (roadZs[bj] + roadZs[bj + 1]) / 2;
        addBox(37.2, 0.14, 27.2, bx, 0.02, bz, lotMat);
        if (FUEL_STATIONS.some((st) => Math.abs(st.x - bx) < 32 && Math.abs(st.z - bz) < 32)) {
          continue;
        }
        for (const side of [-1, 1]) {
          if (worldRandom() < 0.15) {
            continue;
          }
          const sW = 11 + worldRandom() * 4.5;
          const cD = 14 + worldRandom() * 8.8;
          const hTarget = 14 + worldRandom() * 48;
          const kind = facadeKinds[Math.floor(worldRandom() * facadeKinds.length)];
          const wall = wallColors[Math.floor(worldRandom() * wallColors.length)];
          const glow = windowGlowColors[Math.floor(worldRandom() * windowGlowColors.length)];
          const signIdx = Math.floor(worldRandom() * SIGNS.length);
          const glass = kind === "glass";
          const bxC = bx + side * (0.9 + sW / 2);
          const bzC = bz + (worldRandom() - 0.5) * 2 * Math.max(0, (2 * LOT_HALF_Z - (cD + 1)) / 2);
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
          addBox(
            sW + 1,
            POD_H,
            cD + 1,
            bxC,
            POD_H / 2,
            bzC,
            [shopX, shopX, sidewalkMaterial, darkMetal, shopZ, shopZ],
            true,
          );
          addBox(sW + 1.2, 0.3, cD + 1.2, bxC, POD_H + 0.15, bzC, sidewalkMaterial);
          addBox(sW, hs, cD, bxC, POD_H + hs / 2, bzC, [fx, fx, roofMat, roofMat, fz, fz], true);
          // corner pilasters / frame fins
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              addBox(
                glass ? 0.4 : 0.7,
                hs,
                glass ? 0.4 : 0.7,
                bxC + (sx * sW) / 2,
                POD_H + hs / 2,
                bzC + (sz * cD) / 2,
                glass ? poleMetal : sidewalkMaterial,
              );
            }
          }
          // floor-group ledges
          if (!glass) {
            for (let k = 1; k < rY; k++) {
              addBox(sW + 0.35, 0.3, cD + 0.35, bxC, POD_H + (k * hs) / rY, bzC, sidewalkMaterial);
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
            addBox(sW + 0.5, 0.3, cD + 0.5, bxC, l1 + 0.15, bzC, sidewalkMaterial);
            addBox(sU, hU, cU, bxC, l1 + 0.3 + hU / 2, bzC, [fxU, fxU, roofMat, roofMat, fzU, fzU], true);
            topY = l1 + 0.3 + hU;
            topW = sU;
            topD = cU;
          }
          // roof cap + parapet
          addBox(topW + 0.35, 0.28, topD + 0.35, bxC, topY + 0.14, bzC, poleMetal);
          addBox(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC + topD / 2 - 0.2, sidewalkMaterial);
          addBox(topW + 0.4, 0.9, 0.4, bxC, topY + 0.75, bzC - topD / 2 + 0.2, sidewalkMaterial);
          addBox(0.4, 0.9, topD - 0.4, bxC + topW / 2 - 0.2, topY + 0.75, bzC, sidewalkMaterial);
          addBox(0.4, 0.9, topD - 0.4, bxC - topW / 2 + 0.2, topY + 0.75, bzC, sidewalkMaterial);
          // roof equipment
          const nUnits = 1 + Math.floor(worldRandom() * 3);
          for (let uI = 0; uI < nUnits; uI++) {
            const uh = 1 + worldRandom();
            addBox(
              1.8 + worldRandom() * 2,
              uh,
              1.8 + worldRandom() * 2,
              bxC + (worldRandom() - 0.5) * (topW - 4),
              topY + 0.28 + uh / 2,
              bzC + (worldRandom() - 0.5) * (topD - 4),
              darkMetal,
            );
          }
          if (worldRandom() > 0.55) {
            const tx = bxC + (worldRandom() - 0.5) * (topW - 5);
            const tz = bzC + (worldRandom() - 0.5) * (topD - 5);
            for (const lx of [-0.8, 0.8]) {
              for (const lz of [-0.8, 0.8]) {
                addBox(0.14, 1.5, 0.14, tx + lx, topY + 1.03, tz + lz, poleMetal);
              }
            }
            const tank = new Mesh(new CylinderGeometry(1.3, 1.3, 2.2, 16), tankMat);
            tank.position.set(tx, topY + 2.6, tz);
            tank.castShadow = true;
            scene.add(tank);
            const tankCap = new Mesh(new ConeGeometry(1.4, 0.8, 16), poleMetal);
            tankCap.position.set(tx, topY + 4.1, tz);
            scene.add(tankCap);
          }
          if (tall || worldRandom() > 0.5) {
            const mh = 6 + worldRandom() * 6;
            const mast = new Mesh(new CylinderGeometry(0.05, 0.08, mh, 6), poleMetal);
            mast.position.set(bxC, topY + 0.28 + mh / 2, bzC);
            scene.add(mast);
            const beacon = new Mesh(new SphereGeometry(0.2, 10, 8), beaconMat);
            beacon.position.set(bxC, topY + 0.28 + mh, bzC);
            scene.add(beacon);
          }
          // glowing LED trim on the street-facing edges
          addBox(topW, 0.14, 0.14, bxC, topY - 0.5, bzC + topD / 2 + 0.05, trimMats[signIdx]);
          addBox(0.14, 0.14, topD, bxC + topW / 2 + 0.05, topY - 0.5, bzC, trimMats[signIdx]);
          addBox(sW + 1.02, 0.1, 0.1, bxC, POD_H - 0.12, bzC + (cD + 1) / 2 + 0.02, trimMats[signIdx]);
          addBox(0.1, 0.1, cD + 1.02, bxC + (sW + 1) / 2 + 0.02, POD_H - 0.12, bzC, trimMats[signIdx]);
        }
      }
    }
  }
  Object.assign(world, {
    worldRandom,
  });
}
