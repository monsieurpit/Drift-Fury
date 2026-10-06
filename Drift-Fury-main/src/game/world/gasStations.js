import { scannedSet } from "./scannedTextures.js";
import {
  MeshStandardMaterial,
  BoxGeometry,
  Mesh,
  Vector3,
  PlaneGeometry,
  CylinderGeometry,
  CanvasTexture,
  MeshPhysicalMaterial,
  InstancedMesh,
  PointLight,
} from "three";
import { FUEL_STATIONS } from "../data/stations.js";
import { terrainHeight } from "./terrain.js";
/** Fuel stations: canopy, pumps, forecourt and the walk-in store with its shelves and coolers. */
export function buildGasStations(world) {
  const {
    addBox,
    addSolid,
    concreteMaterial,
    roadMaterial,
    scene,
    stationRoadAccesses,
    tmpMatrix,
    tmpPosition,
    tmpRotation,
    tmpScale,
  } = world;
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
  // Dépanneur floor: photo-scanned ceramic floor tiles (Poly Haven "floor_tiles_06", CC0, ~3 m per tile).
  const floorScan = scannedSet("floor_tiles_06", [0.5, 0.5, 0.48]);
  const stationFloor = new MeshStandardMaterial({
    color: "#e2e2dc",
    map: floorScan.map,
    normalMap: floorScan.normalMap,
    roughnessMap: floorScan.armMap,
    aoMap: floorScan.armMap,
    roughness: 0.9,
    metalness: 0,
  });
  stationFloor.userData.tile = 3;
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
  const stationShelfProducts = stationProductMats.map(
    (material) => new InstancedMesh(new BoxGeometry(0.17, 0.27, 0.2), material, 216),
  );
  const stationCoolerProducts = stationProductMats.map(
    (material) => new InstancedMesh(new BoxGeometry(0.12, 0.25, 0.12), material, 72),
  );
  const stationShelfProductCounts = stationProductMats.map(() => 0);
  const stationCoolerProductCounts = stationProductMats.map(() => 0);
  const placeStationProduct = (meshes, counts, materialIndex, x, yPos, z) => {
    const mesh = meshes[materialIndex];
    const instance = counts[materialIndex]++;
    tmpPosition.set(x, yPos, z);
    tmpRotation.identity();
    tmpScale.set(1, 1, 1);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    mesh.setMatrixAt(instance, tmpMatrix);
  };
  const placeStationInstance = (mesh, instance, x, yPos, z, scaleX = 1, scaleY = 1, scaleZ = 1) => {
    tmpPosition.set(x, yPos, z);
    tmpRotation.identity();
    tmpScale.set(scaleX, scaleY, scaleZ);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    mesh.setMatrixAt(instance, tmpMatrix);
  };
  const stationPumpFace = (x, y, z, side) => {
    const face = new Mesh(new PlaneGeometry(0.42, 0.3), stationScreenMat);
    face.position.set(x, y, z + side * 0.317);
    if (side < 0) {
      face.rotation.y = Math.PI;
    }
    scene.add(face);
    const bezel = addBox(0.5, 0.38, 0.035, x, y, z + side * 0.295, stationDarkSteel);
    bezel.renderOrder = 2;
    face.renderOrder = 3;
    addBox(0.22, 0.12, 0.025, x, y - 0.34, z + side * 0.323, stationDarkSteel);
    for (let row = 0; row < 2; row++) {
      for (let column = 0; column < 3; column++) {
        const button = new Mesh(
          new CylinderGeometry(0.025, 0.025, 0.022, 10),
          column === 0 ? stationRed : stationSteel,
        );
        button.position.set(x - 0.13 + column * 0.13, y - 0.48 - row * 0.095, z + side * 0.326);
        scene.add(button);
      }
    }
    addBox(0.35, 0.12, 0.03, x, y - 0.75, z + side * 0.327, stationDarkSteel);
  };
  const addFuelPump = (x, z, groundY) => {
    addBox(1.55, 0.14, 3.8, x, groundY + 0.12, z, stationSteel);
    addBox(1.46, 0.055, 3.68, x, groundY + 0.218, z, stationDarkSteel);
    addBox(0.82, 0.2, 0.72, x, groundY + 0.34, z, stationDarkSteel);
    addBox(0.76, 1.34, 0.62, x, groundY + 1.11, z, stationWhite);
    addBox(0.765, 0.17, 0.625, x, groundY + 1.72, z, stationRed);
    addBox(0.79, 0.105, 0.65, x, groundY + 1.86, z, stationSteel);
    addSolid(x, z, 0.42, 0.38);
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
        tmpPosition.copy(from).add(to).multiplyScalar(0.5);
        tmpRotation.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
        tmpScale.set(1, length, 1);
        tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
        stationHoseSegments.setMatrixAt(stationHoseCount++, tmpMatrix);
      }
      addBox(0.075, 0.28, 0.075, x + side * 0.4, groundY + 1.56, z - 0.17, stationSteel);
      addBox(0.075, 0.34, 0.075, x + side * 0.4, groundY + 1.4, z + 0.22, stationDarkSteel);
      addBox(0.12, 0.08, 0.1, x + side * 0.4, groundY + 1.56, z + 0.3, stationRed);
    }
    const bollardMat = stationRed;
    for (const side of [-1, 1]) {
      addBox(0.12, 0.62, 0.12, x + side * 0.91, groundY + 0.43, z + 1.44, bollardMat);
      addBox(0.14, 0.08, 0.14, x + side * 0.91, groundY + 0.76, z + 1.44, stationWhite);
      addSolid(x + side * 0.91, z + 1.44, 0.1, 0.1);
    }
  };
  // Dépanneur walls: photo-scanned painted plaster (Poly Haven "beige_wall_001", CC0, ~3 m per tile).
  const plasterScan = scannedSet("beige_wall_001", [0.4, 0.36, 0.3]);
  const storeShell = new MeshStandardMaterial({
    color: "#e4e0d6",
    map: plasterScan.map,
    normalMap: plasterScan.normalMap,
    roughnessMap: plasterScan.armMap,
    aoMap: plasterScan.armMap,
    roughness: 1,
    metalness: 0,
  });
  storeShell.userData.tile = 3;
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
    addBox(11.8, 0.2, 9, shopX, groundY + 0.1, shopZ, stationFloor);
    addBox(12.15, 0.22, 0.22, shopX, groundY + 0.14, shopZ, stationDarkSteel);
    addBox(0.24, wallHeight, 9, shopX - halfWidth, groundY + wallHeight / 2, shopZ, storeShell, true);
    addBox(0.24, wallHeight, 9, shopX + halfWidth, groundY + wallHeight / 2, shopZ, storeShell, true);
    addBox(11.8, wallHeight, 0.24, shopX, groundY + wallHeight / 2, backZ, storeShell, true);
    const storefrontCenter = 3;
    const storefrontWidth = 4.25;
    for (const side of [-1, 1]) {
      const windowX = shopX + side * storefrontCenter;
      addBox(storefrontWidth, 0.8, 0.24, windowX, groundY + 0.4, frontZ, storeShell);
      addBox(storefrontWidth, 0.47, 0.24, windowX, groundY + 3.31, frontZ, storeShell);
      addSolid(windowX, frontZ, storefrontWidth / 2, 0.14);
    }
    addBox(1.7, 0.3, 0.24, shopX, groundY + 3.4, frontZ, storeShell);
    addBox(12.35, 0.18, 9.35, shopX, groundY + 3.72, shopZ, storeRoofMat);
    addBox(12.5, 0.15, 0.18, shopX, groundY + 3.58, frontZ, stationRed);
    addBox(12.5, 0.15, 0.18, shopX, groundY + 3.58, backZ, stationRed);
    addBox(0.18, 0.15, 9.2, shopX - 6.1, groundY + 3.58, shopZ, stationRed);
    addBox(0.18, 0.15, 9.2, shopX + 6.1, groundY + 3.58, shopZ, stationRed);
    for (const side of [-1, 1]) {
      addBox(
        storefrontWidth,
        2.25,
        0.035,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.14,
        stationGlass,
      );
      for (const frameX of [-1, 1]) {
        addBox(
          0.055,
          2.35,
          0.07,
          shopX + side * storefrontCenter + frameX * (storefrontWidth / 2 - 0.06),
          groundY + 1.95,
          frontZ - 0.19,
          stationWindowFrame,
        );
      }
      addBox(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 0.78,
        frontZ - 0.19,
        stationWindowFrame,
      );
      addBox(
        storefrontWidth,
        0.065,
        0.08,
        shopX + side * storefrontCenter,
        groundY + 3.12,
        frontZ - 0.19,
        stationWindowFrame,
      );
      addBox(
        0.055,
        2.25,
        0.065,
        shopX + side * storefrontCenter,
        groundY + 1.95,
        frontZ - 0.19,
        stationWindowFrame,
      );
    }
    addBox(0.09, 2.28, 0.09, shopX - 0.9, groundY + 1.92, frontZ - 0.19, stationWindowFrame);
    addBox(0.09, 2.28, 0.09, shopX + 0.9, groundY + 1.92, frontZ - 0.19, stationWindowFrame);
    addBox(1.16, 0.045, 0.5, shopX, groundY + 0.17, frontZ - 0.3, stationDarkSteel);
    const openDoor = new Mesh(new BoxGeometry(0.78, 2.18, 0.075), stationGlass);
    openDoor.position.set(shopX + 0.24, groundY + 1.24, frontZ + 0.04);
    openDoor.rotation.y = -0.72;
    scene.add(openDoor);
    addBox(0.12, 0.12, 0.12, shopX + 0.24, groundY + 2.38, frontZ + 0.04, stationSteel);
    addBox(0.045, 0.24, 0.035, shopX - 0.05, groundY + 1.22, frontZ - 0.12, stationSteel);
    const sign = new Mesh(new PlaneGeometry(5.2, 0.72), stationSignMat);
    sign.position.set(shopX, groundY + 3.05, frontZ - 0.205);
    sign.rotation.y = Math.PI;
    scene.add(sign);
    for (const side of [-1, 1]) {
      addBox(0.13, 3.6, 0.13, shopX + side * 6.22, groundY + 1.8, shopZ, stationSteel);
    }
    addBox(4.5, 0.12, 0.72, shopX, groundY + 1.04, shopZ + 3.65, counterMat);
    addBox(4.5, 0.7, 0.16, shopX, groundY + 0.64, shopZ + 3.95, counterMat);
    addBox(0.56, 0.12, 0.4, shopX - 0.95, groundY + 1.17, shopZ + 3.35, stationDarkSteel);
    addBox(0.48, 0.48, 0.04, shopX - 0.95, groundY + 1.47, shopZ + 3.32, stationScreenMat);
    addBox(0.12, 0.25, 0.16, shopX + 1.75, groundY + 1.18, shopZ + 3.54, stationSteel);
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
        addSolid(shelfX, shelfZ, 0.4, 0.32);
      }
    }
    for (let cooler = 0; cooler < 3; cooler++) {
      const coolerX = shopX - 2.5 + cooler * 1.65;
      const coolerZ = shopZ + 0.3;
      addBox(1.48, 2.3, 0.65, coolerX, groundY + 1.18, coolerZ, coolerMat);
      addBox(1.35, 1.95, 0.035, coolerX, groundY + 1.26, coolerZ - 0.35, coolerGlass);
      addBox(0.045, 2, 0.07, coolerX, groundY + 1.26, coolerZ - 0.385, stationSteel);
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
      addBox(0.04, 0.32, 0.04, coolerX + 0.52, groundY + 1.25, coolerZ - 0.4, stationSteel);
      addSolid(coolerX, coolerZ, 0.74, 0.36);
    }
    addSolid(shopX, shopZ + 3.76, 2.28, 0.43);
    for (let light = 0; light < 2; light++) {
      const lightX = shopX + (light ? 3.5 : -3.5);
      addBox(1.7, 0.045, 0.34, lightX, groundY + 3.39, shopZ - 0.15, stationAwningLight);
    }
    const insideLight = new PointLight("#fff0d5", 0.55, 17, 2);
    insideLight.position.set(shopX, groundY + 2.8, shopZ);
    scene.add(insideLight);
    const outsideLight = new PointLight("#dceeff", 0.55, 15, 2);
    outsideLight.position.set(shopX, groundY + 3.3, frontZ - 1);
    scene.add(outsideLight);
  };
  for (let stationIndex = 0; stationIndex < FUEL_STATIONS.length; stationIndex++) {
    const station = FUEL_STATIONS[stationIndex];
    const groundY = terrainHeight(station.x, station.z);
    addBox(26, 0.14, 22, station.x, groundY + 0.07, station.z, concreteMaterial);
    const access = stationRoadAccesses[stationIndex];
    const roadEdgeX = access.roadX + access.side * 9;
    const stationEdgeX = station.x - access.side * 13;
    const accessLength = Math.abs(stationEdgeX - roadEdgeX) + 3;
    const accessCenterX = (stationEdgeX + roadEdgeX) / 2;
    addBox(accessLength, 0.12, 9.5, accessCenterX, groundY + 0.07, station.z, roadMaterial);
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
    addBox(24.5, 0.45, 16, station.x, groundY + 5.2, station.z, canopy);
    addBox(24.3, 0.12, 15.8, station.x, groundY + 5.49, station.z, canopyTop);
    addBox(24.7, 0.12, 0.22, station.x, groundY + 4.94, station.z - 8.02, stationRed);
    addBox(24.7, 0.12, 0.22, station.x, groundY + 4.94, station.z + 8.02, stationRed);
    addBox(0.16, 0.08, 15.8, station.x - 12.1, groundY + 4.93, station.z, stationSteel);
    addBox(0.16, 0.08, 15.8, station.x + 12.1, groundY + 4.93, station.z, stationSteel);
    for (let rib = -4; rib <= 4; rib++) {
      addBox(0.045, 0.06, 15.7, station.x + rib * 2.6, groundY + 5.57, station.z, stationSteel);
    }
    for (let side of [-1, 1]) {
      addBox(20, 0.38, 0.1, station.x, groundY + 5.23, station.z + side * 8.1, stationSignMat);
    }
    for (let x of [-11.8, 11.8]) {
      for (let z of [-7, 7]) {
        addBox(0.48, 5.2, 0.48, station.x + x, groundY + 2.6, station.z + z, stationSteel, true);
        addBox(0.64, 0.12, 0.64, station.x + x, groundY + 0.2, station.z + z, stationDarkSteel);
      }
    }
    for (let lampX of [-7.5, -2.5, 2.5, 7.5]) {
      for (let lampZ of [-5, 5]) {
        addBox(2.1, 0.045, 0.7, station.x + lampX, groundY + 4.94, station.z + lampZ, stationAwningLight);
      }
    }
    const canopyLight = new PointLight("#fff0d5", 0.7, 28, 2);
    canopyLight.position.set(station.x, groundY + 4.62, station.z);
    scene.add(canopyLight);
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
          addBox(5.6, 0.018, 0.085, parkingX, groundY + 0.16, parkingZ + side * 1.4, stationParkingPaint);
        } else {
          addBox(0.085, 0.018, 5.6, parkingX + side * 1.4, groundY + 0.16, parkingZ, stationParkingPaint);
        }
      }
    }
    addBox(0.28, 7, 0.28, station.x + 12, groundY + 3.5, station.z + 9, stationSteel);
    addBox(3, 1.4, 0.3, station.x + 12, groundY + 7, station.z + 9, stationSignMat);
    const priceBoard = new Mesh(new PlaneGeometry(2.3, 0.72), stationScreenMat);
    priceBoard.position.set(station.x + 12, groundY + 7, station.z + 8.83);
    priceBoard.rotation.y = Math.PI;
    scene.add(priceBoard);
    const canopyBadge = new Mesh(new PlaneGeometry(4.4, 0.48), stationSignMat);
    canopyBadge.position.set(station.x, groundY + 5.22, station.z - 8.09);
    scene.add(canopyBadge);
  }
  for (const [mesh, count] of [
    [stationShelfFrames, stationShelfFrameCount],
    [stationShelfBoards, stationShelfBoardCount],
    [stationCoolerShelves, stationCoolerShelfCount],
    [stationHoseSegments, stationHoseCount],
  ]) {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }
  for (let index = 0; index < stationProductMats.length; index++) {
    const shelfProducts = stationShelfProducts[index];
    shelfProducts.count = stationShelfProductCounts[index];
    shelfProducts.instanceMatrix.needsUpdate = true;
    scene.add(shelfProducts);
    const coolerProducts = stationCoolerProducts[index];
    coolerProducts.count = stationCoolerProductCounts[index];
    coolerProducts.instanceMatrix.needsUpdate = true;
    scene.add(coolerProducts);
  }
}
