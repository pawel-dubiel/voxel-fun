import * as THREE from 'three';

export default class VoxelRenderer {

    constructor(scene) {

        if (!scene) {
            throw new Error('VoxelRenderer requires a scene.');
        }

        this.scene = scene;

        const surfaceShaderParams = {
            noiseScale: 0.1,
            noiseStrength: 0.12,
            rimStrength: 0.18,
            rimPower: 2.4,
            heightGradientStrength: 0.18,
            heightGradientScale: 0.02,
            heightGradientOffset: 6
        };

        const glassShaderParams = {
            noiseScale: 0.25,
            noiseStrength: 0.04,
            rimStrength: 0.35,
            rimPower: 2.8,
            heightGradientStrength: 0.08,
            heightGradientScale: 0.02,
            heightGradientOffset: 4
        };

        this.terrainMaterial = this.createStylizedMaterial({
            color: 0x2f7d3b,
            roughness: 0.95,
            metalness: 0.02,
            emissive: 0x0b1b0b,
            emissiveIntensity: 0.12,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.buildingMaterial = this.createStylizedMaterial({
            color: 0x8b8b8b,
            roughness: 0.85,
            metalness: 0.08,
            emissive: 0x111111,
            emissiveIntensity: 0.08,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.castleMaterial = this.createStylizedMaterial({
            color: 0x6f6f6f,
            roughness: 0.78,
            metalness: 0.12,
            emissive: 0x0f0f0f,
            emissiveIntensity: 0.08,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.woodMaterial = this.createStylizedMaterial({
            color: 0x7a4b2a,
            roughness: 0.92,
            metalness: 0.03,
            emissive: 0x0f0804,
            emissiveIntensity: 0.1,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.plasterMaterial = this.createStylizedMaterial({
            color: 0xe6e0d7,
            roughness: 0.82,
            metalness: 0.02,
            emissive: 0x1a1712,
            emissiveIntensity: 0.05,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.roofMaterial = this.createStylizedMaterial({
            color: 0x3f5aa5,
            roughness: 0.6,
            metalness: 0.18,
            emissive: 0x10162f,
            emissiveIntensity: 0.12,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.roofRedMaterial = this.createStylizedMaterial({
            color: 0xb23b33,
            roughness: 0.65,
            metalness: 0.15,
            emissive: 0x2a0b0a,
            emissiveIntensity: 0.12,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.roofGreenMaterial = this.createStylizedMaterial({
            color: 0x1d5b2a,
            roughness: 0.7,
            metalness: 0.12,
            emissive: 0x08140a,
            emissiveIntensity: 0.1,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

        this.windowMaterial = this.createStylizedMaterial({
            color: 0x84d6ff,
            roughness: 0.15,
            metalness: 0,
            emissive: 0x2b6f8a,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.65
        }, glassShaderParams);

        this.woodDarkMaterial = this.createStylizedMaterial({
            color: 0x3a241a,
            roughness: 0.94,
            metalness: 0.02,
            emissive: 0x120a07,
            emissiveIntensity: 0.08,
            transparent: false,
            opacity: 1
        }, surfaceShaderParams);

    }

    createStylizedMaterial(materialParams, shaderParams) {
        if (!materialParams || typeof materialParams !== 'object') {
            throw new Error('createStylizedMaterial requires materialParams.');
        }

        if (!shaderParams || typeof shaderParams !== 'object') {
            throw new Error('createStylizedMaterial requires shaderParams.');
        }

        const {
            color,
            roughness,
            metalness,
            emissive,
            emissiveIntensity,
            transparent,
            opacity
        } = materialParams;

        if (!Number.isFinite(color)) {
            throw new Error('createStylizedMaterial requires a numeric color.');
        }

        if (!Number.isFinite(roughness)) {
            throw new Error('createStylizedMaterial requires a numeric roughness.');
        }

        if (!Number.isFinite(metalness)) {
            throw new Error('createStylizedMaterial requires a numeric metalness.');
        }

        if (!Number.isFinite(emissive)) {
            throw new Error('createStylizedMaterial requires a numeric emissive color.');
        }

        if (!Number.isFinite(emissiveIntensity)) {
            throw new Error('createStylizedMaterial requires a numeric emissiveIntensity.');
        }

        if (typeof transparent !== 'boolean') {
            throw new Error('createStylizedMaterial requires transparent to be a boolean.');
        }

        if (!Number.isFinite(opacity)) {
            throw new Error('createStylizedMaterial requires a numeric opacity.');
        }

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness,
            metalness,
            emissive,
            emissiveIntensity,
            transparent,
            opacity
        });

        material.dithering = true;

        this.applyStylizedShader(material, shaderParams);

        return material;
    }

    applyStylizedShader(material, shaderParams) {
        if (!material) {
            throw new Error('applyStylizedShader requires a material.');
        }

        if (!shaderParams || typeof shaderParams !== 'object') {
            throw new Error('applyStylizedShader requires shaderParams.');
        }

        const {
            noiseScale,
            noiseStrength,
            rimStrength,
            rimPower,
            heightGradientStrength,
            heightGradientScale,
            heightGradientOffset
        } = shaderParams;

        if (!Number.isFinite(noiseScale)) {
            throw new Error('applyStylizedShader requires a numeric noiseScale.');
        }

        if (!Number.isFinite(noiseStrength)) {
            throw new Error('applyStylizedShader requires a numeric noiseStrength.');
        }

        if (!Number.isFinite(rimStrength)) {
            throw new Error('applyStylizedShader requires a numeric rimStrength.');
        }

        if (!Number.isFinite(rimPower)) {
            throw new Error('applyStylizedShader requires a numeric rimPower.');
        }

        if (!Number.isFinite(heightGradientStrength)) {
            throw new Error('applyStylizedShader requires a numeric heightGradientStrength.');
        }

        if (!Number.isFinite(heightGradientScale)) {
            throw new Error('applyStylizedShader requires a numeric heightGradientScale.');
        }

        if (!Number.isFinite(heightGradientOffset)) {
            throw new Error('applyStylizedShader requires a numeric heightGradientOffset.');
        }

        material.onBeforeCompile = (shader) => {
            shader.uniforms.uNoiseScale = { value: noiseScale };
            shader.uniforms.uNoiseStrength = { value: noiseStrength };
            shader.uniforms.uRimStrength = { value: rimStrength };
            shader.uniforms.uRimPower = { value: rimPower };
            shader.uniforms.uHeightGradientStrength = { value: heightGradientStrength };
            shader.uniforms.uHeightGradientScale = { value: heightGradientScale };
            shader.uniforms.uHeightGradientOffset = { value: heightGradientOffset };

            shader.vertexShader = `
                varying vec3 vStylizedWorldPosition;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                vStylizedWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
            );

            shader.fragmentShader = `
                varying vec3 vStylizedWorldPosition;
                uniform float uNoiseScale;
                uniform float uNoiseStrength;
                uniform float uRimStrength;
                uniform float uRimPower;
                uniform float uHeightGradientStrength;
                uniform float uHeightGradientScale;
                uniform float uHeightGradientOffset;

                float hashNoise(vec3 p) {
                    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
                }
            ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                float heightFactor = clamp((vStylizedWorldPosition.y + uHeightGradientOffset) * uHeightGradientScale, 0.0, 1.0);
                float heightBoost = mix(1.0 - uHeightGradientStrength, 1.0 + uHeightGradientStrength, heightFactor);
                diffuseColor.rgb *= heightBoost;

                float noise = hashNoise(vStylizedWorldPosition * uNoiseScale);
                diffuseColor.rgb *= 1.0 + (noise - 0.5) * uNoiseStrength;

                float rim = pow(1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0), uRimPower);
                diffuseColor.rgb += vec3(rim * uRimStrength);

                #include <dithering_fragment>`
            );
        };

        material.needsUpdate = true;
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
