import {
  MeshStandardMaterial,
  BoxGeometry,
  Mesh,
  PlaneGeometry,
  Group,
  CylinderGeometry,
  CanvasTexture,
} from "three";
/** Traffic signals at four-way crossings and stop signs at the other intersections. */
export function buildTrafficControl(world) {
  const { addSolid, poleMetal, roadXs, roadZs, scene, signals } = world;
  function addTrafficSignal(x, z, facing, axis) {
    const pole = new Group();
    pole.position.set(x, 0, z);
    pole.rotation.y = facing;
    const base = new Mesh(new CylinderGeometry(0.24, 0.28, 0.16, 16), poleMetal);
    base.position.y = 0.08;
    pole.add(base);
    const mast = new Mesh(new CylinderGeometry(0.085, 0.11, 4.65, 12), poleMetal);
    mast.position.y = 2.46;
    mast.castShadow = true;
    pole.add(mast);
    const bracket = new Mesh(new BoxGeometry(0.11, 0.1, 0.34), poleMetal);
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
      const hood = new Mesh(new BoxGeometry(0.31, 0.055, 0.14), poleMetal);
      hood.position.set(0, y + 0.17, 0.46);
      pole.add(hood);
    }
    scene.add(pole);
    addSolid(x, z, 0.3, 0.3);
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
    const post = new Mesh(new CylinderGeometry(0.075, 0.085, 2.35, 10), poleMetal);
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
    scene.add(sign);
    addSolid(signX, signZ, 0.2, 0.2);
  }
  for (let xIndex = 0; xIndex < roadXs.length; xIndex++) {
    for (let zIndex = 0; zIndex < roadZs.length; zIndex++) {
      const x = roadXs[xIndex];
      const z = roadZs[zIndex];
      const connected = {
        west: xIndex > 0,
        east: xIndex < roadXs.length - 1,
        north: zIndex > 0,
        south: zIndex < roadZs.length - 1,
      };
      const arms = [
        [connected.west, -1, 0, connected.east],
        [connected.east, 1, 0, connected.west],
        [connected.north, 0, -1, connected.south],
        [connected.south, 0, 1, connected.north],
      ].filter(([hasRoad]) => hasRoad);
      if (arms.length === 4) {
        addTrafficSignal(x + 14, z + 14, 0, 0);
        addTrafficSignal(x - 14, z - 14, Math.PI, 0);
        addTrafficSignal(x + 14, z - 14, Math.PI / 2, 1);
        addTrafficSignal(x - 14, z + 14, -Math.PI / 2, 1);
      } else {
        for (const [, dx, dz, oppositeConnected] of arms) {
          if (!oppositeConnected) {
            addStopSign(x, z, dx, dz);
          }
        }
      }
    }
  }
}
