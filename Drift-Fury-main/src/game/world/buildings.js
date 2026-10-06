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
  SRGBColorSpace,
  Vector3,
  Vector4,
} from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { createRandom } from "../util/random.js";
import { concreteTexture, normalMapFromHeight } from "./textures.js";
import { scannedSet } from "./scannedTextures.js";
/** City blocks: towers, podiums and storefronts on the lots between the roads. */
export function buildBuildings(world) {
  const { addBox, addLight, darkMetal, poleMetal, roadXs, roadZs, scene, sidewalkMaterial } = world;
  let worldSeed = 9137;
  const worldRandom = () => {
    worldSeed = (worldSeed * 16807) % 2147483647;
    return (worldSeed - 1) / 2147483646;
  };
  const windowGlowColors = ["#ffe9c0", "#cfe8ff", "#ffd9a0", "#e8e0ff"];
  const wallColors = ["#3a4250", "#42454d", "#383c44", "#454050", "#3e4855"];
  // Glass towers, classic plastered or brick blocks, offices with ribbon windows, and brick walk-ups with tall
  // narrow windows under stone lintels.
  const facadeKinds = ["glass", "classic", "office", "brick", "classic", "glass", "brick", "office"];
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
    world.lotMaterial = lotMat;
    const tankMat = new MeshStandardMaterial({
      color: "#5a4a3a",
      roughness: 0.85,
    });
    const beaconMat = new MeshStandardMaterial({
      color: "#200000",
      emissive: "#ff2a2a",
      // Small and far: below the bloom threshold, or they blink into flashing blobs as the camera moves.
      emissiveIntensity: 1.0,
      roughness: 0.4,
    });
    const SIGNS = ["#c6dc77", "#5a9fd4", "#e89978", "#8c87c7", "#ff7a7a"];
    const trimMats = SIGNS.map(
      (col) =>
        new MeshStandardMaterial({
          color: "#050505",
          emissive: col,
          // Thin neon strips: below the bloom threshold (they blinked and flashed in the distance).
          emissiveIntensity: 1.0,
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
      const office = kind === "office";
      const brick = kind === "brick";
      const rnd = createRandom(
        key.length * 7919 + wall.charCodeAt(2) * 31 + glow.charCodeAt(3) * 17 + (glass ? 5 : 11),
      );
      const mapCv = mkCanvas(256, 256);
      const glowCv = mkCanvas(256, 256);
      // White where the facade is wall (gets the scanned masonry), black over windows and their frames.
      const maskCv = mkCanvas(256, 256);
      const gm = maskCv.getContext("2d");
      gm.fillStyle = "#fff";
      gm.fillRect(0, 0, 256, 256);
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
          const ix = glass ? 5 : office ? 1.5 : brick ? 19 : 11;
          const it = glass ? 7 : office ? 10 : brick ? 9 : 12;
          const ib = glass ? 13 : office ? 21 : brick ? 13 : 16;
          const x0 = col * 64 + ix;
          const y0 = row * 64 + it;
          const ww = 64 - ix * 2;
          const hh = 64 - it - ib;
          const lit = rnd() > 0.44;
          const style = rnd();
          g2.fillStyle = "#10151b";
          g2.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
          gm.fillStyle = "#000";
          gm.fillRect(x0 - 2, y0 - 2, ww + 4, hh + 4);
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
            if (office) {
              // Ribbon glazing: slim mullions every metre or so.
              for (const f of [0.25, 0.5, 0.75]) ctx.fillRect(x0 + ww * f - 1, y0, 2, hh);
            } else {
              ctx.fillRect(x0 + ww / 2 - 1, y0, 2, hh);
            }
            if (!glass && !office) {
              ctx.fillRect(x0, y0 + hh * (brick ? 0.3 : 0.42), ww, 2);
            }
          }
          if (brick) {
            // Stone lintel over the window and a sill under it.
            g2.fillStyle = "#b9ad97";
            g2.fillRect(x0 - 4, y0 - 7, ww + 8, 5);
            g2.fillRect(x0 - 3, y0 + hh + 2, ww + 6, 3);
            gm.fillStyle = "#000";
            gm.fillRect(x0 - 4, y0 - 7, ww + 8, 5);
            gm.fillRect(x0 - 3, y0 + hh + 2, ww + 6, 3);
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
        kind,
        map: textureOf(mapCv),
        glow: textureOf(glowCv),
        mask: textureOf(maskCv),
        normal: normalMapFromHeight(mapCv, glass || office ? 1.1 : 1.9),
      };
      facadeCache.set(key, hit);
      return hit;
    }
    // Scanned masonry for the wall parts of the facades (Poly Haven, CC0): red brick or painted plaster on
    // the classic buildings, cast concrete between the glazing of the glass towers. Plaster and concrete
    // are recoloured to each building's wall colour; brick keeps its own colour, darkened for the night.
    const wallScans = {
      brick: { set: scannedSet("red_brick_03", [0.12, 0.05, 0.04]), metres: 1.6, keep: 1 },
      plaster: { set: scannedSet("beige_wall_001", [0.4, 0.36, 0.3]), metres: 3, keep: 0 },
      concrete: { set: scannedSet("concrete_wall_003", [0.3, 0.3, 0.28]), metres: 3, keep: 0 },
    };
    const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    function applyWallScan(material, mask, key, glass, facadeKind) {
      const wallHex = wallColors.find((color) => key.includes(color)) || "#3e4855";
      const v = parseInt(wallHex.slice(1), 16);
      const wallLinear = new Vector3(
        srgbToLinear(((v >> 16) & 255) / 255),
        srgbToLinear(((v >> 8) & 255) / 255),
        srgbToLinear((v & 255) / 255),
      );
      // Same layout for a wall colour always gets the same masonry.
      const kind =
        glass || facadeKind === "office"
          ? "concrete"
          : facadeKind === "brick" || wallColors.indexOf(wallHex) % 2 === 0
            ? "brick"
            : "plaster";
      const scan = wallScans[kind];
      // Facade UVs run ~12 m per unit across and ~14.4 m up (see the repeat counts below).
      const uniforms = {
        wallMask: { value: mask },
        wallScan: { value: scan.set.map },
        wallScanNormal: { value: scan.set.normalMap },
        wallScanAverage: { value: scan.set.average },
        wallScanRepeat: { value: new Vector2(12 / scan.metres, 14.4 / scan.metres) },
        wallTarget: { value: wallLinear.clone().multiplyScalar(1.15) },
        wallBaseLuma: { value: wallLinear.dot(new Vector3(0.2126, 0.7152, 0.0722)) },
        wallKeep: { value: scan.keep },
      };
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
uniform sampler2D wallMask;
uniform sampler2D wallScan;
uniform sampler2D wallScanNormal;
uniform vec3 wallScanAverage;
uniform vec2 wallScanRepeat;
uniform vec3 wallTarget;
uniform float wallBaseLuma;
uniform float wallKeep;
float wallAmount;
vec2 wallUv;`,
          )
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
{
  wallAmount = texture2D(wallMask, vMapUv).r;
  // One unit of the (repeated) facade uv is ~12 m across and ~14.4 m up; the scan tiles at its real size.
  wallUv = vNormalMapUv * wallScanRepeat;
  vec3 scan = texture2D(wallScan, wallUv).rgb;
  vec3 masonry = wallKeep > 0.5 ? scan * 0.55 : scan * wallTarget / max(wallScanAverage, vec3(1e-3));
  // Keep the drawn floor bands and shading: scale by how far the canvas departs from the plain wall.
  float shade = clamp(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)) / max(wallBaseLuma, 1e-3), 0.35, 1.4);
  diffuseColor.rgb = mix(diffuseColor.rgb, masonry * shade, wallAmount);
}`,
          )
          .replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
{
  vec3 wallN = texture2D(wallScanNormal, wallUv).xyz * 2.0 - 1.0;
  normal = normalize(mix(normal, normalize(tbn * wallN), wallAmount * 0.85));
}`,
          );
      };
      material.customProgramCacheKey = () => "drift-fury-facade-scan";
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
        normalScale: new Vector2(fv.glass ? 0.14 : fv.kind === "office" ? 0.2 : 0.32, fv.glass ? 0.14 : fv.kind === "office" ? 0.2 : 0.32),
        emissiveMap: cp(fv.glow),
        emissive: "#ffffff",
        emissiveIntensity: 1.15,
        roughness: fv.glass ? 0.22 : fv.kind === "office" ? 0.4 : 0.8,
        metalness: fv.glass ? 0.3 : fv.kind === "office" ? 0.15 : 0.05,
        clearcoat: fv.glass ? 0.85 : fv.kind === "office" ? 0.6 : 0.14,
        clearcoatRoughness: 0.22,
        envMapIntensity: fv.glass ? 1.2 : 0.25,
      });
      applyWallScan(hit, cp(fv.mask), key, fv.glass, fv.kind);
      facadeMatCache.set(mk, hit);
      return hit;
    }

    /* --- lit shop-fronts for the ground floor --- */
    // One storey (4.4 m) by two 4 m bays per texture tile: cornice, a sign band with backlit lettering, a
    // framed shop window (one bay has the door) and a stone plinth. Behind the glass each kind of shop has
    // its own interior lit by its ceiling fixtures; some are closed for the night behind half-lowered
    // shutters. The emissive map carries only what actually glows, at a level bloom does not wash out.
    const SHOP_KINDS = {
      "#c6dc77": {
        name: "PHARMACIE",
        wall: "#e9f1ee",
        light: "#f4fbff",
        goods: ["#ffffff", "#d7efe4", "#8fd1b4", "#f2f2f2", "#cfe0f0"],
        cross: true,
      },
      "#5a9fd4": {
        name: "ÉPICERIE",
        wall: "#e8e2d0",
        light: "#f3f6ff",
        goods: ["#e64b3c", "#f2b134", "#5fae4b", "#f6e27a", "#d9792b", "#7a4b9a"],
      },
      "#e89978": {
        name: "CAFÉ",
        wall: "#7a4a2c",
        light: "#ffcf8a",
        goods: ["#d9a066", "#f1e2c6", "#4b2e1c", "#c98b55"],
        cafe: true,
      },
      "#8c87c7": {
        name: "BOUTIQUE",
        wall: "#d8cfc4",
        light: "#fff1dc",
        goods: ["#22252b", "#b23a48", "#e9e4dc", "#3d5a80", "#c9a66b"],
        racks: true,
      },
      "#ff7a7a": {
        name: "PIZZERIA",
        wall: "#8e3b26",
        light: "#ffbe73",
        goods: ["#e7c27d", "#f4ead2", "#2b5d34", "#b8432f"],
        cafe: true,
      },
    };
    /**
     * Interior mapping (the technique open-world games use for shop windows): each pixel of clear glass casts
     * the view ray into a box-shaped room behind it (4.5 m deep) and shows the back wall, floor, ceiling or
     * side wall it hits, all sampled from the bay's drawn interior. The room shifts with perspective as the
     * camera moves, so the shops read as real spaces instead of pictures on the glass.
     */
    function applyInteriorMapping(
      material,
      { interior, interiorGlow, glassMask, top, bottom, width, height },
    ) {
      const uniforms = {
        shopInterior: { value: interior },
        shopInteriorGlow: { value: interiorGlow },
        shopGlass: { value: glassMask },
        shopBay: { value: new Vector4(top / height, bottom / height, 10 / width, 236 / width) },
      };
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vShopPosition;")
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvShopPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
uniform sampler2D shopInterior;
uniform sampler2D shopInteriorGlow;
uniform sampler2D shopGlass;
uniform vec4 shopBay; // glass top, bottom (fractions of the canvas height from the top), bay x0, width
varying vec3 vShopPosition;
float shopInside;
vec2 shopUv;
float shopShade;
float shopLod;`,
          )
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
{
  // Tangent frame from screen derivatives (taken here, outside any branch): metres per unit of uv.
  vec3 dpx = dFdx(vShopPosition);
  vec3 dpy = dFdy(vShopPosition);
  vec2 dux = dFdx(vMapUv);
  vec2 duy = dFdy(vMapUv);
  float det = dux.x * duy.y - dux.y * duy.x;
  vec3 dPdu = (dpx * duy.y - dpy * dux.y) / det;
  vec3 dPdv = (dpy * dux.x - dpx * duy.x) / det;
  shopLod = log2(max(length(dux) * 512.0, length(duy) * 256.0));
  shopInside = texture2D(shopGlass, vMapUv).r;
  shopShade = 1.0;
  if (shopInside > 0.5 && abs(det) > 1e-12) {
    vec3 tangent = normalize(dPdu);
    vec3 bitangent = normalize(dPdv);
    vec3 inward = -normalize(cross(dPdu, dPdv));
    vec3 view = normalize(vShopPosition - cameraPosition);
    if (dot(view, inward) < 0.0) inward = -inward;
    vec3 dir = vec3(dot(view, tangent), dot(view, bitangent), max(dot(view, inward), 0.05));
    // Where this pixel sits on its bay's glass, in metres from the bottom-left corner.
    vec2 tileUv = fract(vMapUv);
    float bayIndex = floor(tileUv.x * 2.0);
    float bayStart = bayIndex * 0.5 + shopBay.z;
    float glassTop = 1.0 - shopBay.x;
    float glassBottom = 1.0 - shopBay.y;
    vec2 size = vec2(shopBay.w * length(dPdu), (glassTop - glassBottom) * length(dPdv));
    vec3 p = vec3((tileUv.x - bayStart) / shopBay.w * size.x, (tileUv.y - glassBottom) / (glassTop - glassBottom) * size.y, 0.0);
    float depth = 4.5;
    float tx = dir.x > 0.0 ? (size.x - p.x) / dir.x : -p.x / min(dir.x, -1e-4);
    float ty = dir.y > 0.0 ? (size.y - p.y) / dir.y : -p.y / min(dir.y, -1e-4);
    float tz = depth / dir.z;
    float t = min(min(tx, ty), tz);
    vec3 hit = p + dir * t;
    vec2 local; // position in the drawn bay interior, 0..1 across and 0..1 up
    if (t == tz) {
      local = hit.xy / size; // back wall
      shopShade = 1.0;
    } else if (t == ty && dir.y < 0.0) {
      local = vec2(hit.x / size.x, 0.06 * (1.0 - hit.z / depth)); // floor strip, near the glass at the bottom
      shopShade = 0.8;
    } else if (t == ty) {
      local = vec2(hit.x / size.x, 1.0 - 0.07 * hit.z / depth); // ceiling with its light fixtures
      shopShade = 0.9;
    } else {
      // Side walls carry shelving too: the outer quarter of the drawn interior, stretched along the depth.
      float along = hit.z / depth;
      local = vec2(dir.x > 0.0 ? mix(0.985, 0.78, along) : mix(0.015, 0.22, along), hit.y / size.y);
      shopShade = 0.7;
    }
    shopShade *= 1.0 - 0.25 * hit.z / depth;
    local = clamp(local, vec2(0.004), vec2(0.996));
    shopUv = vec2(bayStart + local.x * shopBay.w, glassBottom + local.y * (glassTop - glassBottom));
    vec3 room = textureLod(shopInterior, shopUv, shopLod).rgb * shopShade;
    diffuseColor.rgb = mix(diffuseColor.rgb, room, shopInside);
  }
}`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
if (shopInside > 0.5) {
  totalEmissiveRadiance = mix(totalEmissiveRadiance, textureLod(shopInteriorGlow, shopUv, shopLod).rgb * emissive * shopShade, shopInside);
}`,
          );
      };
      material.customProgramCacheKey = () => "drift-fury-shop-interior";
    }
    const shopCache = new Map();
    function shopMaterial(sign, rx) {
      const mk = sign + "|" + rx;
      let hit = shopCache.get(mk);
      if (hit) {
        return hit;
      }
      const kind = SHOP_KINDS[sign];
      const rnd = createRandom(sign.charCodeAt(2) * 131 + sign.charCodeAt(4) * 7);
      const W = 512;
      const H = 256;
      const cv = mkCanvas(W, H);
      const cvE = mkCanvas(W, H);
      const g = cv.getContext("2d");
      const e = cvE.getContext("2d");
      // The interior of each bay on its own (no frames), sampled by the interior-mapping shader, and a mask
      // of the clear glass it shows through.
      const cvI = mkCanvas(W, H);
      const cvIE = mkCanvas(W, H);
      const cvM = mkCanvas(W, H);
      const gm = cvM.getContext("2d");
      gm.fillStyle = "#000";
      gm.fillRect(0, 0, W, H);
      // Draws into the colour map and the glow map with the same random sequence, so both line up.
      const both = (fn) => {
        const seed = Math.floor(rnd() * 1e9);
        fn(g, false, createRandom(seed));
        fn(e, true, createRandom(seed));
      };
      // Base: dark stone frame everywhere, nothing glowing.
      g.fillStyle = "#2a2d31";
      g.fillRect(0, 0, W, H);
      e.fillStyle = "#000";
      e.fillRect(0, 0, W, H);
      // Cornice and plinth.
      g.fillStyle = "#3b3f45";
      g.fillRect(0, 0, W, 12);
      g.fillStyle = "#4a4d50";
      g.fillRect(0, H - 18, W, 18);
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(0, H - 18, W, 2);
      // Sign band: dark fascia with backlit letters in the sign colour and a soft halo.
      g.fillStyle = "#14171b";
      g.fillRect(10, 16, W - 20, 34);
      both((c, glow, random) => {
        c.font = "bold 24px Helvetica, Arial, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        if (glow) {
          c.shadowColor = sign;
          c.shadowBlur = 10;
        }
        c.fillStyle = glow ? sign : tint(sign, 1.1);
        c.fillText(kind.name, W / 2, 34);
        c.shadowBlur = 0;
        if (kind.cross) {
          // Green pharmacy cross at each end of the fascia.
          for (const cx of [40, W - 40]) {
            c.fillStyle = glow ? "#3dff7a" : "#2fd36a";
            c.fillRect(cx - 4, 20, 8, 26);
            c.fillRect(cx - 13, 29, 26, 8);
          }
        }
      });
      // Two bays of glazing.
      const top = 56;
      const bottom = H - 22;
      const closed = rnd() < 0.22;
      for (let bay = 0; bay < 2; bay++) {
        const x0 = bay * 256 + 10;
        const x1 = x0 + 236;
        const door = bay === 1;
        // Interior, drawn into both maps (the emissive copy is the light the shop gives off).
        both((c, glow, random) => {
          const lit = closed ? 0.12 : 1;
          const scale = (hex, k) => tint(hex, k * (glow ? lit * 0.62 : 0.55 + 0.45 * lit));
          // Back wall lit from the ceiling: bright under the fixtures, falling off toward the floor.
          const wall = c.createLinearGradient(0, top, 0, bottom);
          wall.addColorStop(0, scale(kind.light, 0.95));
          wall.addColorStop(0.35, scale(kind.wall, 0.9));
          wall.addColorStop(1, scale(kind.wall, 0.45));
          c.fillStyle = wall;
          c.fillRect(x0, top, x1 - x0, bottom - top);
          // Ceiling with recessed light fixtures.
          c.fillStyle = scale("#3a3a3a", 0.8);
          c.fillRect(x0, top, x1 - x0, 14);
          for (let f = 0; f < 4; f++) {
            c.fillStyle = closed ? scale("#555555", 1) : glow ? kind.light : "#ffffff";
            c.fillRect(x0 + 18 + f * 56, top + 5, 30, 4);
          }
          if (kind.cafe) {
            // Counter at the back, pendant lamps, small tables and chairs near the glass.
            c.fillStyle = scale("#2a1a10", 1);
            c.fillRect(x0 + 20, bottom - 70, 196, 40);
            c.fillStyle = scale("#c9a46a", 1);
            c.fillRect(x0 + 20, bottom - 72, 196, 4);
            for (let l = 0; l < 3; l++) {
              const lx = x0 + 50 + l * 68;
              c.fillStyle = scale("#1a1a1a", 1);
              c.fillRect(lx, top + 14, 1, 40);
              c.fillStyle = glow && !closed ? kind.light : scale("#ffd79a", 1.1);
              c.beginPath();
              c.arc(lx, top + 58, 8, Math.PI, 0);
              c.fill();
            }
            for (let t = 0; t < 3; t++) {
              const tx = x0 + 30 + t * 70 + random() * 10;
              c.fillStyle = scale("#1c140e", 1);
              c.fillRect(tx, bottom - 26, 34, 4);
              c.fillRect(tx + 16, bottom - 22, 3, 20);
              c.fillRect(tx - 10, bottom - 18, 3, 16);
              c.fillRect(tx + 40, bottom - 18, 3, 16);
            }
            // Shelves of cups and bottles behind the counter.
            for (let r = 0; r < 2; r++) {
              const sy = top + 30 + r * 22;
              c.fillStyle = scale("#3a2616", 1);
              c.fillRect(x0 + 24, sy + 12, 188, 2);
              for (let k = 0; k < 24; k++) {
                c.fillStyle = scale(kind.goods[Math.floor(random() * kind.goods.length)], 0.9);
                const h = 6 + random() * 6;
                c.fillRect(x0 + 26 + k * 7.8, sy + 12 - h, 5, h);
              }
            }
          } else if (kind.racks) {
            // Clothing rails with hanging garments and a couple of mannequins in the window.
            for (let r = 0; r < 2; r++) {
              const ry = top + 34 + r * 46;
              c.fillStyle = scale("#8a8a8a", 1);
              c.fillRect(x0 + 16, ry, 204, 2);
              for (let k = 0; k < 18; k++) {
                c.fillStyle = scale(kind.goods[Math.floor(random() * kind.goods.length)], 0.85);
                c.fillRect(x0 + 18 + k * 11.3, ry + 2, 8, 26 + random() * 12);
              }
            }
            for (let m = 0; m < 2; m++) {
              const mx = x0 + 60 + m * 110;
              c.fillStyle = scale("#e7ddd0", 0.9);
              c.beginPath();
              c.arc(mx, bottom - 92, 7, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = scale(kind.goods[Math.floor(random() * kind.goods.length)], 0.9);
              c.fillRect(mx - 11, bottom - 84, 22, 40);
              c.fillStyle = scale("#e7ddd0", 0.9);
              c.fillRect(mx - 6, bottom - 44, 4, 40);
              c.fillRect(mx + 2, bottom - 44, 4, 40);
            }
          } else {
            // Shelving units full of products, an aisle-end display near the glass.
            for (let r = 0; r < 5; r++) {
              const sy = top + 26 + r * 28;
              if (sy > bottom - 20) break;
              c.fillStyle = scale("#6b6f74", 1);
              c.fillRect(x0 + 8, sy + 16, x1 - x0 - 16, 3);
              let px = x0 + 10;
              while (px < x1 - 14) {
                const w = 4 + random() * 9;
                const h = 7 + random() * 9;
                c.fillStyle = scale(
                  kind.goods[Math.floor(random() * kind.goods.length)],
                  0.85 + random() * 0.25,
                );
                c.fillRect(px, sy + 16 - h, w, h);
                px += w + 1 + random() * 2;
              }
            }
            c.fillStyle = scale("#30343a", 1);
            c.fillRect(x0 + 70, bottom - 40, 96, 40);
          }
          // Floor: darker, a sheen of reflected light along it.
          const floor = c.createLinearGradient(0, bottom - 16, 0, bottom);
          floor.addColorStop(0, scale(kind.wall, 0.35));
          floor.addColorStop(1, scale(kind.light, 0.5));
          c.fillStyle = floor;
          c.fillRect(x0, bottom - 16, x1 - x0, 16);
          if (closed) {
            // Shutter half down: horizontal slats over the top of the window.
            const shutterBottom = top + (bottom - top) * (0.35 + random() * 0.4);
            c.fillStyle = glow ? "#000" : "#5b6066";
            c.fillRect(x0, top, x1 - x0, shutterBottom - top);
            if (!glow) {
              c.fillStyle = "rgba(0,0,0,0.35)";
              for (let y = top + 4; y < shutterBottom; y += 6) c.fillRect(x0, y, x1 - x0, 1.5);
            }
          }
        });
        cvI.getContext("2d").drawImage(cv, x0, top, x1 - x0, bottom - top, x0, top, x1 - x0, bottom - top);
        cvIE.getContext("2d").drawImage(cvE, x0, top, x1 - x0, bottom - top, x0, top, x1 - x0, bottom - top);
        if (!closed) {
          gm.fillStyle = "#fff";
          gm.fillRect(x0, top, x1 - x0, bottom - top);
        }
        // Frame: mullions, transom, door with a push bar (unlit, drawn over both maps and the glass mask).
        [gm].forEach((c) => {
          c.fillStyle = "#000";
          c.fillRect(x0 - 4, top - 4, x1 - x0 + 8, 5);
          c.fillRect(x0 - 4, bottom - 1, x1 - x0 + 8, 5);
          c.fillRect(x0 - 4, top - 4, 5, bottom - top + 8);
          c.fillRect(x1 - 1, top - 4, 5, bottom - top + 8);
          c.fillRect(x0, top + 30, x1 - x0, 3);
          if (door) {
            c.fillRect(x0 + 140, top + 30, 4, bottom - top - 30);
            c.fillRect(x0 + 200, top + 30, 4, bottom - top - 30);
            c.fillRect(x0 + 150, top + 100, 44, 3);
          } else {
            c.fillRect(x0 + 116, top + 30, 4, bottom - top - 30);
          }
        });
        both((c, glow, random) => {
          c.fillStyle = glow ? "#000" : "#15181c";
          c.fillRect(x0 - 4, top - 4, x1 - x0 + 8, 5);
          c.fillRect(x0 - 4, bottom - 1, x1 - x0 + 8, 5);
          c.fillRect(x0 - 4, top - 4, 5, bottom - top + 8);
          c.fillRect(x1 - 1, top - 4, 5, bottom - top + 8);
          c.fillRect(x0, top + 30, x1 - x0, 3);
          if (door) {
            c.fillRect(x0 + 140, top + 30, 4, bottom - top - 30);
            c.fillRect(x0 + 200, top + 30, 4, bottom - top - 30);
            if (!glow) {
              c.fillStyle = "#9aa1a8";
              c.fillRect(x0 + 150, top + 100, 44, 3);
            }
          } else {
            c.fillRect(x0 + 116, top + 30, 4, bottom - top - 30);
          }
        });
        // Glass: a faint diagonal reflection across each pane (colour map only, not emitted).
        const sheen = g.createLinearGradient(x0, top, x1, bottom);
        sheen.addColorStop(0, "rgba(255,255,255,0)");
        sheen.addColorStop(0.45, "rgba(255,255,255,0.07)");
        sheen.addColorStop(0.55, "rgba(255,255,255,0)");
        g.fillStyle = sheen;
        g.fillRect(x0, top, x1 - x0, bottom - top);
      }
      const mp = textureOf(cv);
      const em = textureOf(cvE);
      mp.colorSpace = SRGBColorSpace;
      em.colorSpace = SRGBColorSpace;
      mp.repeat.set(rx, 1);
      em.repeat.set(rx, 1);
      hit = new MeshPhysicalMaterial({
        map: mp,
        emissiveMap: em,
        emissive: "#ffffff",
        emissiveIntensity: 1,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.08,
        envMapIntensity: 0.7,
      });
      const interior = textureOf(cvI);
      const interiorGlow = textureOf(cvIE);
      interior.colorSpace = SRGBColorSpace;
      interiorGlow.colorSpace = SRGBColorSpace;
      const glassMask = textureOf(cvM);
      applyInteriorMapping(hit, { interior, interiorGlow, glassMask, top, bottom, width: W, height: H });
      shopCache.set(mk, hit);
      return hit;
    }

    // Exposed so the street lamps can light the facades and shop fronts (see buildWorld / lampLighting).
    world.buildingMaterials = () => [...facadeMatCache.values(), ...shopCache.values(), lotMat];

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
          // Real light from the shop: its windows light the sidewalk in front, its sign glows in its colour
          // (clusteredLights.js). On the three street-facing sides (not the one facing the next lot). No
          // random numbers here: the city's seeded layout stays the same.
          {
            const shopLight = SHOP_KINDS[SIGNS[signIdx]]?.light || "#fff2dc";
            const halfX = (sW + 1) / 2;
            const halfZ = (cD + 1) / 2;
            for (const [nx, nz, length] of [
              [side, 0, cD + 1],
              [0, 1, sW + 1],
              [0, -1, sW + 1],
            ]) {
              const faceX = bxC + nx * (halfX + 0.35);
              const faceZ = bzC + nz * (halfZ + 0.35);
              const windows = Math.max(1, Math.round(length / 8));
              for (let w = 0; w < windows; w++) {
                const along = ((w + 0.5) / windows - 0.5) * (length - 2);
                addLight({
                  x: faceX + (nx ? 0 : along),
                  y: 2.2,
                  z: faceZ + (nz ? 0 : along),
                  color: shopLight,
                  intensity: 26,
                  range: 10,
                  direction: [nx * 0.8, -0.6, nz * 0.8],
                  cosOuter: 0.0,
                  cosInner: 0.55,
                });
              }
              addLight({
                x: faceX,
                y: POD_H - 0.7,
                z: faceZ,
                color: SIGNS[signIdx],
                intensity: 14,
                range: 8,
                direction: [nx * 0.7, -0.7, nz * 0.7],
                cosOuter: 0.0,
                cosInner: 0.5,
              });
            }
          }
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
