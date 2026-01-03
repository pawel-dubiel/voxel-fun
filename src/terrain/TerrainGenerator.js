import { createNoise2D } from 'simplex-noise';

export default class TerrainGenerator {

    constructor(seed = 0) {

        this.noise2D = createNoise2D(() => seed);

    }

    getHeightAt(worldX, worldZ) {

        return this.noise2D(worldX * 0.005, worldZ * 0.005) * 40 + 40;

    }

    generateChunk(x, y, z, size = 16) {

        const voxels = new Uint8Array(size * size * size);

        // Deterministic building properties for this column (x, z)
        const hasBuilding = (Math.abs(x * 31 + z * 17) % 5) === 0;
        const buildingHeight = 10 + (Math.abs(x * 13 + z * 7) % 20);
        
        // Castle rarity: 1 in 20 chunks roughly
        const hasCastle = (Math.abs(x * 7 + z * 3) % 20) === 0;

        for (let i = 0; i < size; i++) {

            for (let j = 0; j < size; j++) {

                for (let k = 0; k < size; k++) {

                    const worldX = x * size + i;
                    const worldZ = z * size + k;
                    const voxelY = y * size + j;

                    let height = this.getHeightAt(worldX, worldZ);
                    
                    // Flatten terrain for castle
                    if (hasCastle && i >= 2 && i <= 13 && k >= 2 && k <= 13) {
                         // Base height on the center of the chunk
                         height = this.getHeightAt(x * size + 8, z * size + 8);
                    }

                    let isVoxel = voxelY < height ? 1 : 0;

                    // Add buildings
                    if (!hasCastle && hasBuilding && i >= 4 && i <= 12 && k >= 4 && k <= 12 && voxelY >= height && voxelY < height + buildingHeight) {
                        isVoxel = 2; // Building voxel
                    }
                    
                    // Add Castle
                    if (hasCastle && voxelY >= height) {
                        const cx = i - 8; // Center relative coordinates (-8 to 7)
                        const cz = k - 8;
                        const cy = voxelY - height; // Height relative to base
                        
                        // Castle Dimensions
                        const wallHeight = 8;
                        const towerHeight = 12;
                        const towerRadius = 2;
                        
                        // Corner Towers
                        const isTower = (Math.abs(cx) > 4 && Math.abs(cz) > 4);
                        
                        // Walls
                        const isWallX = (Math.abs(cx) > 4 && Math.abs(cz) <= 4);
                        const isWallZ = (Math.abs(cz) > 4 && Math.abs(cx) <= 4);
                        
                        // Central Keep
                        const isKeep = (Math.abs(cx) <= 2 && Math.abs(cz) <= 2);
                        
                        // Render
                        if (isTower && cy < towerHeight) {
                             isVoxel = 3;
                             // Battlements on top
                             if (cy === towerHeight - 1 && (cx + cz) % 2 !== 0) isVoxel = 0;
                        } else if ((isWallX || isWallZ) && cy < wallHeight) {
                             isVoxel = 3;
                             // Battlements
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