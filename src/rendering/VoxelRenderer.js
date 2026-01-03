import * as THREE from 'three';

export default class VoxelRenderer {

    constructor(scene) {

        this.scene = scene;

        this.geometry = new THREE.BoxGeometry(1, 1, 1);

        this.terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

        this.buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        
        this.castleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 }); // Dark gray stone

    }

    renderChunk(chunk) {

        const size = chunk.size || 16;

        if (chunk.terrainMesh) this.scene.remove(chunk.terrainMesh);
        if (chunk.buildingMesh) this.scene.remove(chunk.buildingMesh);
        if (chunk.castleMesh) this.scene.remove(chunk.castleMesh);

        const maxInstances = size * size * size;

        const terrainMesh = new THREE.InstancedMesh(this.geometry, this.terrainMaterial, maxInstances);
        const buildingMesh = new THREE.InstancedMesh(this.geometry, this.buildingMaterial, maxInstances);
        const castleMesh = new THREE.InstancedMesh(this.geometry, this.castleMaterial, maxInstances);

        let terrainCount = 0;
        let buildingCount = 0;
        let castleCount = 0;

        const matrix = new THREE.Matrix4();

        for (let i = 0; i < size; i++) {

            for (let j = 0; j < size; j++) {

                for (let k = 0; k < size; k++) {

                    const voxelType = chunk.voxels[i * size * size + j * size + k];

                    matrix.setPosition(chunk.x * size + i, chunk.y * size + j, chunk.z * size + k);

                    if (voxelType === 1) {
                        terrainMesh.setMatrixAt(terrainCount++, matrix);
                    } else if (voxelType === 2) {
                        buildingMesh.setMatrixAt(buildingCount++, matrix);
                    } else if (voxelType === 3) {
                        castleMesh.setMatrixAt(castleCount++, matrix);
                    }

                }

            }

        }

        terrainMesh.count = terrainCount;
        buildingMesh.count = buildingCount;
        castleMesh.count = castleCount;

        chunk.terrainMesh = terrainMesh;
        chunk.buildingMesh = buildingMesh;
        chunk.castleMesh = castleMesh;

        if (terrainCount > 0) this.scene.add(terrainMesh);
        if (buildingCount > 0) this.scene.add(buildingMesh);
        if (castleCount > 0) this.scene.add(castleMesh);

    }

    disposeChunk(chunk) {
        if (chunk.terrainMesh) {
            this.scene.remove(chunk.terrainMesh);
            chunk.terrainMesh.dispose();
            chunk.terrainMesh = null;
        }
        if (chunk.buildingMesh) {
            this.scene.remove(chunk.buildingMesh);
            chunk.buildingMesh.dispose();
            chunk.buildingMesh = null;
        }
        if (chunk.castleMesh) {
            this.scene.remove(chunk.castleMesh);
            chunk.castleMesh.dispose();
            chunk.castleMesh = null;
        }
    }

}