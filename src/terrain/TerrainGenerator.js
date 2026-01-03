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
        const voxels = new Uint8Array(size * size * size);

        // Deterministic building properties for this chunk
        const buildingSpots = [];
        const gridRes = Math.floor(size / 8);
        for (let bx = 0; bx < gridRes; bx++) {
            for (let bz = 0; bz < gridRes; bz++) {
                const seed = Math.abs((x * gridRes + bx) * 131 + (z * gridRes + bz) * 17) % 1000;
                if (seed % 7 === 0) {
                    buildingSpots.push({
                        lx: bx * 8 + 1,
                        lz: bz * 8 + 1,
                        width: 5 + (seed % 2),
                        depth: 5 + ((seed >> 2) % 2),
                        height: 7 + ((seed >> 4) % 5),
                        seed: seed
                    });
                }
            }
        }
        
        const hasCastle = (Math.abs(x * 7 + z * 3) % 20) === 0;

        for (let i = 0; i < size; i++) {
            for (let k = 0; k < size; k++) {
                const worldX = x * size + i;
                const worldZ = z * size + k;
                
                let height = this.getHeightAt(worldX, worldZ);
                
                // Flatten terrain for castle
                if (hasCastle && i >= 2 && i <= size - 3 && k >= 2 && k <= size - 3) {
                     height = this.getHeightAt(x * size + size/2, z * size + size/2);
                }
                
                // Flatten terrain for buildings
                for (const spot of buildingSpots) {
                    if (i >= spot.lx && i < spot.lx + spot.width && k >= spot.lz && k < spot.lz + spot.depth) {
                        height = this.getHeightAt(x * size + spot.lx, z * size + spot.lz);
                    }
                }

                for (let j = 0; j < size; j++) {
                    const voxelY = y * size + j;
                    let isVoxel = voxelY < height ? 1 : 0;

                    // Add buildings
                    if (!hasCastle) {
                        for (const spot of buildingSpots) {
                            if (i >= spot.lx && i < spot.lx + spot.width && 
                                k >= spot.lz && k < spot.lz + spot.depth && 
                                voxelY >= height && voxelY < height + spot.height) {
                                
                                const bVoxel = BuildingGenerator.getVoxelAt(
                                    i - spot.lx, 
                                    Math.floor(voxelY - height), 
                                    k - spot.lz, 
                                    spot.width, 
                                    spot.height, 
                                    spot.depth, 
                                    spot.seed
                                );
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
