import * as THREE from 'three';

export default class VoxelRenderer {

    constructor(scene) {

        this.scene = scene;

        this.terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest Green

        this.buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        this.castleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 }); // Stone Gray
        this.woodMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 }); // Brown
        this.plasterMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 }); // Off-white
        this.roofMaterial = new THREE.MeshLambertMaterial({ color: 0x303f9f }); // Indigo roof
        this.roofRedMaterial = new THREE.MeshLambertMaterial({ color: 0xb71c1c }); // Dark Red roof
        this.roofGreenMaterial = new THREE.MeshLambertMaterial({ color: 0x1b5e20 }); // Dark Green roof
        this.windowMaterial = new THREE.MeshLambertMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.6 }); // Light Blue Glass
        this.woodDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x3e2723 }); // Dark Brown

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
        this.disposeMesh(chunk.woodMesh);
        this.disposeMesh(chunk.plasterMesh);
        this.disposeMesh(chunk.roofMesh);
        this.disposeMesh(chunk.windowMesh);
        this.disposeMesh(chunk.woodDarkMesh);
        this.disposeMesh(chunk.roofRedMesh);
        this.disposeMesh(chunk.roofGreenMesh);

        const typePresence = this.getTypePresence(chunk);

        const terrainGeometry = this.buildGreedyGeometry(chunk, 1, voxelAt);
        const buildingGeometry = typePresence.hasBuilding
            ? this.buildGreedyGeometry(chunk, 2, voxelAt)
            : null;
        const castleGeometry = typePresence.hasCastle
            ? this.buildGreedyGeometry(chunk, 3, voxelAt)
            : null;
        const woodGeometry = typePresence.hasWood ? this.buildGreedyGeometry(chunk, 4, voxelAt) : null;
        const plasterGeometry = typePresence.hasPlaster ? this.buildGreedyGeometry(chunk, 5, voxelAt) : null;
        const roofGeometry = typePresence.hasRoof ? this.buildGreedyGeometry(chunk, 6, voxelAt) : null;
        const windowGeometry = typePresence.hasWindow ? this.buildGreedyGeometry(chunk, 7, voxelAt) : null;
        const woodDarkGeometry = typePresence.hasWoodDark ? this.buildGreedyGeometry(chunk, 8, voxelAt) : null;
        const roofRedGeometry = typePresence.hasRoofRed ? this.buildGreedyGeometry(chunk, 9, voxelAt) : null;
        const roofGreenGeometry = typePresence.hasRoofGreen ? this.buildGreedyGeometry(chunk, 10, voxelAt) : null;

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

        if (woodGeometry) {
            const woodMesh = new THREE.Mesh(woodGeometry, this.woodMaterial);
            woodMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(woodMesh);
            chunk.woodMesh = woodMesh;
        } else {
            chunk.woodMesh = null;
        }

        if (plasterGeometry) {
            const plasterMesh = new THREE.Mesh(plasterGeometry, this.plasterMaterial);
            plasterMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(plasterMesh);
            chunk.plasterMesh = plasterMesh;
        } else {
            chunk.plasterMesh = null;
        }

        if (roofGeometry) {
            const roofMesh = new THREE.Mesh(roofGeometry, this.roofMaterial);
            roofMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(roofMesh);
            chunk.roofMesh = roofMesh;
        } else {
            chunk.roofMesh = null;
        }

        if (windowGeometry) {
            const windowMesh = new THREE.Mesh(windowGeometry, this.windowMaterial);
            windowMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(windowMesh);
            chunk.windowMesh = windowMesh;
        } else {
            chunk.windowMesh = null;
        }

        if (woodDarkGeometry) {
            const woodDarkMesh = new THREE.Mesh(woodDarkGeometry, this.woodDarkMaterial);
            woodDarkMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(woodDarkMesh);
            chunk.woodDarkMesh = woodDarkMesh;
        } else {
            chunk.woodDarkMesh = null;
        }

        if (roofRedGeometry) {
            const roofRedMesh = new THREE.Mesh(roofRedGeometry, this.roofRedMaterial);
            roofRedMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(roofRedMesh);
            chunk.roofRedMesh = roofRedMesh;
        } else {
            chunk.roofRedMesh = null;
        }

        if (roofGreenGeometry) {
            const roofGreenMesh = new THREE.Mesh(roofGreenGeometry, this.roofGreenMaterial);
            roofGreenMesh.position.set(baseX, baseY, baseZ);
            this.scene.add(roofGreenMesh);
            chunk.roofGreenMesh = roofGreenMesh;
        } else {
            chunk.roofGreenMesh = null;
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
        const presence = {
            hasBuilding: false,
            hasCastle: false,
            hasWood: false,
            hasPlaster: false,
            hasRoof: false,
            hasWindow: false,
            hasWoodDark: false,
            hasRoofRed: false,
            hasRoofGreen: false
        };

        for (let idx = 0; idx < count; idx++) {
            const value = chunk.voxels[idx];
            if (!Number.isFinite(value)) {
                throw new Error('chunk.voxels must contain numeric voxel types.');
            }

            if (value === 2) presence.hasBuilding = true;
            else if (value === 3) presence.hasCastle = true;
            else if (value === 4) presence.hasWood = true;
            else if (value === 5) presence.hasPlaster = true;
            else if (value === 6) presence.hasRoof = true;
            else if (value === 7) presence.hasWindow = true;
            else if (value === 8) presence.hasWoodDark = true;
            else if (value === 9) presence.hasRoofRed = true;
            else if (value === 10) presence.hasRoofGreen = true;
        }

        return presence;
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
        this.disposeMesh(chunk.woodMesh);
        this.disposeMesh(chunk.plasterMesh);
        this.disposeMesh(chunk.roofMesh);
        this.disposeMesh(chunk.windowMesh);
        this.disposeMesh(chunk.woodDarkMesh);
        this.disposeMesh(chunk.roofRedMesh);
        this.disposeMesh(chunk.roofGreenMesh);
        
        chunk.terrainMesh = null;
        chunk.buildingMesh = null;
        chunk.castleMesh = null;
        chunk.woodMesh = null;
        chunk.plasterMesh = null;
        chunk.roofMesh = null;
        chunk.windowMesh = null;
        chunk.woodDarkMesh = null;
        chunk.roofRedMesh = null;
        chunk.roofGreenMesh = null;
    }

}
