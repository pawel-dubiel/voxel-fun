import { createNoise2D } from 'simplex-noise';
import BuildingGenerator from './BuildingGenerator.js';

export default class TerrainGenerator {

    constructor(seed = 0) {
        this.noise2D = createNoise2D(() => seed);
    }

    getHeightAt(worldX, worldZ) {
        return this.noise2D(worldX * 0.005, worldZ * 0.005) * 40 + 40;
    }

    generateChunk(x, y, z, size = 16) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            throw new Error('generateChunk requires numeric chunk coordinates.');
        }

        if (!Number.isFinite(size) || size <= 0) {
            throw new Error('generateChunk requires a positive numeric size.');
        }

        const voxels = new Uint8Array(size * size * size);

        // Deterministic building properties for this chunk
        const buildingSpots = [];
        const gridRes = Math.floor(size / 8);

        if (!Number.isFinite(gridRes) || gridRes <= 0) {
            throw new Error('generateChunk requires size to be at least 8.');
        }

        for (let bx = 0; bx < gridRes; bx++) {
            for (let bz = 0; bz < gridRes; bz++) {
                const seed = Math.abs((x * gridRes + bx) * 131 + (z * gridRes + bz) * 17) % 1000;
                const isTower = seed % 29 === 0;
                if (isTower) {
                    buildingSpots.push({
                        lx: bx * 8 + 2,
                        lz: bz * 8 + 2,
                        width: 4 + (seed % 2),
                        depth: 4 + ((seed >> 2) % 2),
                        height: 18 + ((seed >> 4) % 14),
                        seed,
                        style: 'tower'
                    });
                } else if (seed % 7 === 0) {
                    buildingSpots.push({
                        lx: bx * 8 + 1,
                        lz: bz * 8 + 1,
                        width: 4 + (seed % 4),
                        depth: 4 + ((seed >> 2) % 4),
                        height: 6 + ((seed >> 4) % 9),
                        seed,
                        style: 'house'
                    });
                }
            }
        }

        for (const spot of buildingSpots) {
            if (!Number.isFinite(spot.lx) || !Number.isFinite(spot.lz)) {
                throw new Error('generateChunk requires building spots with numeric positions.');
            }

            if (!Number.isFinite(spot.width) || !Number.isFinite(spot.depth) || !Number.isFinite(spot.height)) {
                throw new Error('generateChunk requires building spots with numeric dimensions.');
            }

            if (!Number.isFinite(spot.seed)) {
                throw new Error('generateChunk requires building spots with a numeric seed.');
            }

            if (typeof spot.style !== 'string') {
                throw new Error('generateChunk requires building spots with a style.');
            }

            if (spot.lx < 0 || spot.lz < 0 || spot.lx + spot.width > size || spot.lz + spot.depth > size) {
                throw new Error('generateChunk requires building spots to fit within chunk bounds.');
            }
        }
        
        const hasCastle = (Math.abs(x * 7 + z * 3) % 20) === 0;
        const castleBaseHeight = hasCastle
            ? this.getHeightAt(x * size + size / 2, z * size + size / 2)
            : null;

        if (hasCastle && !Number.isFinite(castleBaseHeight)) {
            throw new Error('generateChunk requires a numeric castle base height.');
        }

        const buildingIndex = new Int32Array(size * size);
        buildingIndex.fill(-1);

        for (let idx = 0; idx < buildingSpots.length; idx++) {
            const spot = buildingSpots[idx];
            const baseHeight = this.getHeightAt(x * size + spot.lx, z * size + spot.lz);

            if (!Number.isFinite(baseHeight)) {
                throw new Error('generateChunk requires building spots with numeric base heights.');
            }

            spot.baseHeight = baseHeight;
            spot.template = BuildingGenerator.getTemplate(
                spot.width,
                spot.height,
                spot.depth,
                spot.seed,
                spot.style
            );

            for (let lx = 0; lx < spot.width; lx++) {
                for (let lz = 0; lz < spot.depth; lz++) {
                    const i = spot.lx + lx;
                    const k = spot.lz + lz;
                    buildingIndex[i * size + k] = idx;
                }
            }
        }

        for (let i = 0; i < size; i++) {
            for (let k = 0; k < size; k++) {
                const worldX = x * size + i;
                const worldZ = z * size + k;
                
                let height = this.getHeightAt(worldX, worldZ);
                
                // Flatten terrain for castle
                if (hasCastle && i >= 2 && i <= size - 3 && k >= 2 && k <= size - 3) {
                     height = castleBaseHeight;
                }
                
                // Flatten terrain for buildings
                const spotIndex = buildingIndex[i * size + k];
                if (spotIndex >= 0) {
                    height = buildingSpots[spotIndex].baseHeight;
                }

                for (let j = 0; j < size; j++) {
                    const voxelY = y * size + j;
                    let isVoxel = voxelY < height ? 1 : 0;

                    // Add buildings
                    if (!hasCastle && spotIndex >= 0) {
                        const spot = buildingSpots[spotIndex];
                        if (voxelY >= spot.baseHeight && voxelY < spot.baseHeight + spot.height) {
                            const localY = Math.floor(voxelY - spot.baseHeight);

                            if (!Number.isFinite(localY)) {
                                throw new Error('generateChunk encountered an invalid building localY.');
                            }

                            if (localY >= 0 && localY < spot.height) {
                                const localX = i - spot.lx;
                                const localZ = k - spot.lz;

                                if (localX < 0 || localZ < 0 || localX >= spot.width || localZ >= spot.depth) {
                                    throw new Error('generateChunk encountered an invalid building local coordinate.');
                                }

                                const bVoxel = spot.template[localX * spot.height * spot.depth + localY * spot.depth + localZ];
                                if (!Number.isFinite(bVoxel)) {
                                    throw new Error('generateChunk encountered a non-numeric building voxel.');
                                }

                                if (bVoxel !== 0) isVoxel = bVoxel;
                            }
                        }
                    }
                    
                    // Add Castle
                    if (hasCastle && voxelY >= height) {
                        const cx = i - size/2; 
                        const cz = k - size/2;
                        const cy = voxelY - height;
                        
                        const innerSize = Math.floor(size / 2) - 2;
                        const wallHeight = 8;
                        const towerHeight = 12;
                        
                        const isTower = (Math.abs(cx) > innerSize - 2 && Math.abs(cz) > innerSize - 2) && (Math.abs(cx) < innerSize + 1 && Math.abs(cz) < innerSize + 1);
                        const isWallX = (Math.abs(cx) > innerSize - 2 && Math.abs(cx) < innerSize) && (Math.abs(cz) <= innerSize - 2);
                        const isWallZ = (Math.abs(cz) > innerSize - 2 && Math.abs(cz) < innerSize) && (Math.abs(cx) <= innerSize - 2);
                        const isKeep = (Math.abs(cx) <= 2 && Math.abs(cz) <= 2);
                        
                        if (isTower && cy < towerHeight) {
                             isVoxel = 3;
                             if (cy === towerHeight - 1 && (cx + cz) % 2 !== 0) isVoxel = 0;
                        } else if ((isWallX || isWallZ) && cy < wallHeight) {
                             isVoxel = 3;
                             if (cy === wallHeight - 1 && (cx + cz) % 2 !== 0) isVoxel = 0;
                        } else if (isKeep && cy < towerHeight + 4) {
                             isVoxel = 3;
                        }
                    }

                    voxels[i * size * size + j * size + k] = isVoxel;
                }
            }
        }

        return voxels;
    }
}
