import { Mesh, Sphere, Matrix4, Matrix3, Vector3, BufferGeometry, BufferAttribute } from "three";
/* ---- static batching: merge never-moving meshes that share an identical material into one draw per area ---- */
function materialKey(material, ids) {
  const parts = [];
  for (const key of Object.keys(material).sort()) {
    if (key === "uuid" || key === "name" || key === "version" || key === "userData" || key === "_listeners") {
      continue;
    }
    const value = material[key];
    let token;
    if (
      value === null ||
      value === undefined ||
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean"
    ) {
      token = String(value);
    } else if (value.isColor) {
      token = "c" + value.getHexString();
    } else if (value.isTexture) {
      token = "t" + value.uuid;
    } else if (value.isVector2 || value.isVector3 || value.isEuler) {
      token = "v" + value.toArray().join(",");
    } else if (key === "defines") {
      token = JSON.stringify(value);
    } else {
      if (!ids.has(value)) {
        ids.set(value, ids.size);
      }
      token = "o" + ids.get(value);
    }
    parts.push(key + "=" + token);
  }
  return parts.join("|");
}
export function batchStaticMeshes(root, keepMaterials = new Set(), cellSize = 48, skip = new Set()) {
  root.updateMatrixWorld(true);
  const canonical = new Map();
  const objectIds = new Map();
  const groups = new Map();
  const removed = new Set();
  const baseBeforeRender = Mesh.prototype.onBeforeRender;
  const canonicalMaterial = (material) => {
    if (keepMaterials.has(material)) {
      return material;
    }
    const key = materialKey(material, objectIds);
    let hit = canonical.get(key);
    if (!hit) {
      canonical.set(key, (hit = material));
    }
    return hit;
  };
  const sphere = new Sphere();
  const rootInverse = root.matrixWorld.clone().invert();
  const relative = new Matrix4();
  const eligible = (object) => {
    if (
      object.name ||
      !object.isMesh ||
      object.type !== "Mesh" ||
      object.isInstancedMesh ||
      object.isSkinnedMesh
    ) {
      return false;
    }
    if (
      !object.frustumCulled ||
      object.layers.mask !== 1 ||
      object.onBeforeRender !== baseBeforeRender ||
      object.morphTargetInfluences
    ) {
      return false;
    }
    const geometry = object.geometry;
    if (
      !geometry.isBufferGeometry ||
      !geometry.attributes.position ||
      Object.keys(geometry.morphAttributes).length
    ) {
      return false;
    }
    if (geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity) {
      return false;
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (
      materials.some((material) => {
        return !material || material.transparent;
      })
    ) {
      return false;
    }
    if (Array.isArray(object.material) && !geometry.groups.length) {
      return false;
    }
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name];
      if (
        attribute.isInterleavedBufferAttribute ||
        !(attribute.array instanceof Float32Array) ||
        attribute.normalized
      ) {
        return false;
      }
      if (
        name !== "position" &&
        name !== "normal" &&
        name !== "uv" &&
        name !== "uv1" &&
        name !== "uv2" &&
        name !== "color"
      ) {
        return false;
      }
    }
    const positions = geometry.attributes.position.array;
    for (let index = 0; index < positions.length; index++) {
      if (!Number.isFinite(positions[index])) {
        return false;
      }
    }
    return true;
  };
  const visit = (object, visible) => {
    if (skip.has(object)) {
      return;
    }
    visible = visible && object.visible;
    for (const child of object.children) {
      visit(child, visible);
    }
    if (!visible || !eligible(object)) {
      return;
    }
    const geometry = object.geometry;
    const names = Object.keys(geometry.attributes).sort();
    const matrix = relative.multiplyMatrices(rootInverse, object.matrixWorld).clone();
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }
    sphere.copy(geometry.boundingSphere).applyMatrix4(matrix);
    const signature = names
      .map((name) => {
        return name + geometry.attributes[name].itemSize;
      })
      .join(",");
    const total = geometry.index ? geometry.index.count : geometry.attributes.position.count;
    const pieces = Array.isArray(object.material)
      ? geometry.groups.map((group) => {
          return {
            material: object.material[group.materialIndex],
            start: group.start,
            count: Math.min(group.count, total - group.start),
          };
        })
      : [
          {
            material: object.material,
            start: 0,
            count: total,
          },
        ];
    for (const piece of pieces) {
      if (!piece.material || piece.count <= 0) {
        continue;
      }
      const material = canonicalMaterial(piece.material);
      const key = [
        material.uuid,
        signature,
        object.castShadow ? 1 : 0,
        object.receiveShadow ? 1 : 0,
        object.renderOrder,
        Math.floor(sphere.center.x / cellSize),
        Math.floor(sphere.center.z / cellSize),
      ].join("/");
      let group = groups.get(key);
      if (!group) {
        groups.set(
          key,
          (group = {
            material,
            names,
            cast: object.castShadow,
            receive: object.receiveShadow,
            renderOrder: object.renderOrder,
            items: [],
            objects: new Set(),
            vertices: 0,
            indices: 0,
          }),
        );
      }
      group.items.push({
        object,
        matrix,
        start: piece.start,
        count: piece.count,
      });
      group.objects.add(object);
      group.vertices += geometry.attributes.position.count;
      group.indices += piece.count;
    }
  };
  visit(root, true);
  const normalMatrix = new Matrix3();
  const vector = new Vector3();
  let merged = 0;
  let batches = 0;
  for (const group of groups.values()) {
    if (group.items.length < 2) {
      const { object } = group.items[0];
      if (!Array.isArray(object.material)) {
        object.material = group.material;
      }
      continue;
    }
    const arrays = {};
    for (const name of group.names) {
      arrays[name] = new Float32Array(
        group.vertices * group.items[0].object.geometry.attributes[name].itemSize,
      );
    }
    const indices = group.vertices > 65535 ? new Uint32Array(group.indices) : new Uint16Array(group.indices);
    let vertexOffset = 0;
    let indexOffset = 0;
    for (const { object, matrix, start, count: pieceCount } of group.items) {
      const geometry = object.geometry;
      const count = geometry.attributes.position.count;
      normalMatrix.getNormalMatrix(matrix);
      for (const name of group.names) {
        const source = geometry.attributes[name];
        const size = source.itemSize;
        const target = arrays[name];
        if (name === "position" || name === "normal") {
          for (let index = 0; index < count; index++) {
            vector.fromBufferAttribute(source, index);
            if (name === "position") {
              vector.applyMatrix4(matrix);
            } else {
              vector.applyMatrix3(normalMatrix).normalize();
            }
            target[(vertexOffset + index) * 3] = vector.x;
            target[(vertexOffset + index) * 3 + 1] = vector.y;
            target[(vertexOffset + index) * 3 + 2] = vector.z;
          }
        } else {
          target.set(source.array.subarray(0, count * size), vertexOffset * size);
        }
      }
      const flip = matrix.determinant() < 0;
      const source = geometry.index ? geometry.index.array : null;
      const at = (index) => {
        return source ? source[index] : index;
      };
      for (let index = start; index + 2 < start + pieceCount; index += 3) {
        indices[indexOffset++] = at(index) + vertexOffset;
        indices[indexOffset++] = at(flip ? index + 2 : index + 1) + vertexOffset;
        indices[indexOffset++] = at(flip ? index + 1 : index + 2) + vertexOffset;
      }
      vertexOffset += count;
    }
    const geometry = new BufferGeometry();
    for (const name of group.names) {
      geometry.setAttribute(
        name,
        new BufferAttribute(arrays[name], group.items[0].object.geometry.attributes[name].itemSize),
      );
    }
    geometry.setIndex(
      new BufferAttribute(indexOffset === indices.length ? indices : indices.slice(0, indexOffset), 1),
    );
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    const mesh = new Mesh(geometry, group.material);
    mesh.castShadow = group.cast;
    mesh.receiveShadow = group.receive;
    mesh.renderOrder = group.renderOrder;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    root.add(mesh);
    group.objects.forEach((object) => {
      return removed.add(object);
    });
    merged += group.items.length;
    batches++;
  }
  // a multi-material mesh only goes away when every one of its pieces was merged
  for (const group of groups.values()) {
    if (group.items.length < 2) {
      group.objects.forEach((object) => {
        return removed.delete(object);
      });
    }
  }
  removed.forEach((object) => {
    return object.parent && object.parent.remove(object);
  });
  for (const group of groups.values()) {
    if (group.items.length >= 2) {
      for (const object of group.objects) {
        if (!removed.has(object) && Array.isArray(object.material)) {
          // partially merged multi-material mesh: hide the pieces now drawn by a batch
          const merged = new Set(
            group.items
              .filter((item) => {
                return item.object === object;
              })
              .map((item) => {
                return item.start;
              }),
          );
          object.geometry = object.geometry.clone();
          object.geometry.groups = object.geometry.groups.filter((entry) => {
            return !merged.has(entry.start) || object.material[entry.materialIndex] === undefined;
          });
        }
      }
    }
  }
  const prune = (object) => {
    for (const child of [...object.children]) {
      prune(child);
    }
    if (object !== root && !object.children.length && object.type === "Group") {
      object.parent.remove(object);
    }
  };
  prune(root);
  const geometries = new Set();
  root.traverse((object) => {
    return object.geometry && geometries.add(object.geometry);
  });
  removed.forEach((object) => {
    return geometries.has(object.geometry) || object.geometry.dispose();
  });
  return {
    merged,
    batches,
  };
}
