import * as THREE from 'three';

export default class VoxelRenderer {

    constructor(scene) {

        this.scene = scene;

        this.terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

        this.buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        this.castleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark gray stone

    }

    renderChunk(chunk, voxelAt) {
        if (!chunk) {
            throw new Error('renderChunk requires a chunk.');
        }

        if (typeof voxelAt !== 'function') {
            throw new Error('renderChunk requires a voxelAt callback.');
        }

        if (!Number.isFinite(chunk.size)) {
            throw new Error('renderChunk requires a chunk with a numeric size.');
        }

        if (!Number.isFinite(chunk.x) || !Number.isFinite(chunk.y) || !Number.isFinite(chunk.z)) {
            throw new Error('renderChunk requires a chunk with numeric coordinates.');
        }

        const size = chunk.size;
        const baseX = chunk.x * size;
        const baseY = chunk.y * size;
        const baseZ = chunk.z * size;

        this.disposeMesh(chunk.terrainMesh);
        this.disposeMesh(chunk.buildingMesh);
        this.disposeMesh(chunk.castleMesh);

        const typePresence = this.getTypePresence(chunk);

        const terrainGeometry = this.buildGreedyGeometry(chunk, 1, voxelAt);
        const buildingGeometry = typePresence.hasBuilding
            ? this.buildGreedyGeometry(chunk, 2, voxelAt)
            : null;
        const castleGeometry = typePresence.hasCastle
            ? this.buildGreedyGeometry(chunk, 3, voxelAt)
            : null;

        if (terrainGeometry) {
            const terrainMesh = new THREE.Mesh(terrainGeometry, this.terrainMaterial);
            terrainMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(terrainMesh);
            chunk.terrainMesh = terrainMesh;
        } else {
            chunk.terrainMesh = null;
        }

        if (buildingGeometry) {
            const buildingMesh = new THREE.Mesh(buildingGeometry, this.buildingMaterial);
            buildingMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(buildingMesh);
            chunk.buildingMesh = buildingMesh;
        } else {
            chunk.buildingMesh = null;
        }

        if (castleGeometry) {
            const castleMesh = new THREE.Mesh(castleGeometry, this.castleMaterial);
            castleMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(castleMesh);
            chunk.castleMesh = castleMesh;
        } else {
            chunk.castleMesh = null;
        }
    }

    buildGreedyGeometry(chunk, voxelType, voxelAt) {
        if (!Number.isFinite(voxelType)) {
            throw new Error('buildGreedyGeometry requires a numeric voxelType.');
        }

        if (typeof voxelAt !== 'function') {
            throw new Error('buildGreedyGeometry requires a voxelAt callback.');
        }

        if (!Number.isFinite(chunk.size)) {
            throw new Error('buildGreedyGeometry requires a chunk with a numeric size.');
        }

        if (!Number.isFinite(chunk.x) || !Number.isFinite(chunk.y) || !Number.isFinite(chunk.z)) {
            throw new Error('buildGreedyGeometry requires a chunk with numeric coordinates.');
        }

        const size = chunk.size;
        const dims = [size, size, size];
        const baseX = chunk.x * size;
        const baseY = chunk.y * size;
        const baseZ = chunk.z * size;
        const voxels = chunk.voxels;

        const positions = [];
        const normals = [];
        const indices = [];

        const getVoxel = (x, y, z) => {
            if (x >= 0 && x < size && y >= 0 && y < size && z >= 0 && z < size) {
                const idx = x * size * size + y * size + z;
                const value = voxels[idx];
                if (!Number.isFinite(value)) {
                    throw new Error('chunk.voxels must contain numeric voxel types.');
                }
                return value;
            }

            const value = voxelAt(baseX + x, baseY + y, baseZ + z);
            if (!Number.isFinite(value)) {
                throw new Error('voxelAt must return a numeric voxel type.');
            }
            return value;
        };

        const x = [0, 0, 0];

        for (let d = 0; d < 3; d++) {
            const u = (d + 1) % 3;
            const v = (d + 2) % 3;
            const q = [0, 0, 0];
            q[d] = 1;

            const mask = new Array(dims[u] * dims[v]);
            x[d] = -1;

            while (x[d] < dims[d]) {
                let n = 0;

                for (x[v] = 0; x[v] < dims[v]; ++x[v]) {
                    for (x[u] = 0; x[u] < dims[u]; ++x[u]) {
                        const a = getVoxel(x[0], x[1], x[2]);
                        const b = getVoxel(x[0] + q[0], x[1] + q[1], x[2] + q[2]);

                        if (a === voxelType && b === 0) {
                            mask[n++] = 1;
                        } else if (b === voxelType && a === 0) {
                            mask[n++] = -1;
                        } else {
                            mask[n++] = 0;
                        }
                    }
                }

                x[d]++;
                n = 0;

                for (let j = 0; j < dims[v]; ++j) {
                    for (let i = 0; i < dims[u]; ) {
                        const c = mask[n];

                        if (c === 0) {
                            i++;
                            n++;
                            continue;
                        }

                        let w = 1;
                        while (i + w < dims[u] && mask[n + w] === c) {
                            w++;
                        }

                        let h = 1;
                        for (; j + h < dims[v]; h++) {
                            let k = 0;
                            for (; k < w; k++) {
                                if (mask[n + k + h * dims[u]] !== c) {
                                    break;
                                }
                            }
                            if (k < w) {
                                break;
                            }
                        }

                        x[u] = i;
                        x[v] = j;

                        const du = [0, 0, 0];
                        const dv = [0, 0, 0];
                        du[u] = w;
                        dv[v] = h;

                        const x0 = [x[0], x[1], x[2]];
                        const x1 = [x[0] + du[0], x[1] + du[1], x[2] + du[2]];
                        const x2 = [x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2]];
                        const x3 = [x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]];

                        const normal = [0, 0, 0];
                        normal[d] = c > 0 ? 1 : -1;

                        const vertIndex = positions.length / 3;
                        const pushVertex = (vx, vy, vz) => {
                            positions.push(vx, vy, vz);
                            normals.push(normal[0], normal[1], normal[2]);
                        };

                        if (c > 0) {
                            pushVertex(x0[0], x0[1], x0[2]);
                            pushVertex(x1[0], x1[1], x1[2]);
                            pushVertex(x2[0], x2[1], x2[2]);
                            pushVertex(x3[0], x3[1], x3[2]);
                        } else {
                            pushVertex(x0[0], x0[1], x0[2]);
                            pushVertex(x3[0], x3[1], x3[2]);
                            pushVertex(x2[0], x2[1], x2[2]);
                            pushVertex(x1[0], x1[1], x1[2]);
                        }

                        indices.push(
                            vertIndex,
                            vertIndex + 1,
                            vertIndex + 2,
                            vertIndex,
                            vertIndex + 2,
                            vertIndex + 3
                        );

                        for (let l = 0; l < h; l++) {
                            for (let k = 0; k < w; k++) {
                                mask[n + k + l * dims[u]] = 0;
                            }
                        }

                        i += w;
                        n += w;
                    }
                }
            }
        }

        if (positions.length === 0) {
            return null;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();

        return geometry;
    }

    getTypePresence(chunk) {
        if (!chunk) {
            throw new Error('getTypePresence requires a chunk.');
        }

        if (!Number.isFinite(chunk.size)) {
            throw new Error('getTypePresence requires a chunk with a numeric size.');
        }

        if (!chunk.voxels) {
            throw new Error('getTypePresence requires chunk.voxels.');
        }

        const size = chunk.size;
        const count = size * size * size;
        let hasBuilding = false;
        let hasCastle = false;

        for (let idx = 0; idx < count; idx++) {
            const value = chunk.voxels[idx];
            if (!Number.isFinite(value)) {
                throw new Error('chunk.voxels must contain numeric voxel types.');
            }

            if (value === 2) {
                hasBuilding = true;
                if (hasCastle) break;
            } else if (value === 3) {
                hasCastle = true;
                if (hasBuilding) break;
            }
        }

        return { hasBuilding, hasCastle };
    }

    disposeMesh(mesh) {
        if (!mesh) return;

        this.scene.remove(mesh);

        if (mesh.geometry) {
            mesh.geometry.dispose();
        }
    }

    disposeChunk(chunk) {
        this.disposeMesh(chunk.terrainMesh);
        this.disposeMesh(chunk.buildingMesh);
        this.disposeMesh(chunk.castleMesh);
        chunk.terrainMesh = null;
        chunk.buildingMesh = null;
        chunk.castleMesh = null;
    }

}
