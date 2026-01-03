export default class BuildingGenerator {
    static VOXEL_STONE = 3;
    static VOXEL_WOOD = 4;
    static VOXEL_PLASTER = 5;
    static VOXEL_ROOF = 6;
    static VOXEL_WINDOW = 7;
    static VOXEL_WOOD_DARK = 8;
    static VOXEL_ROOF_RED = 9;
    static VOXEL_ROOF_GREEN = 10;

    constructor() {}

    static getVoxelAt(lx, ly, lz, width, height, depth, seed) {
        // Deterministic features based on seed
        const roofType = seed % 2; // 0: X-axis, 1: Z-axis
        const roofColorRoll = (seed >> 8) % 3;
        let roofVoxel = this.VOXEL_ROOF;
        if (roofColorRoll === 1) roofVoxel = this.VOXEL_ROOF_RED;
        else if (roofColorRoll === 2) roofVoxel = this.VOXEL_ROOF_GREEN;
        
        const timberSpacing = 2 + (seed % 2);
        
        // Foundation (Stone)
        const foundationHeight = 1 + (seed % 2);
        if (ly < foundationHeight) return this.VOXEL_STONE;

        // Roof
        const roofHeight = Math.floor(height * 0.45);
        const wallHeight = height - roofHeight;
        
        if (ly >= wallHeight) {
            const roofY = ly - wallHeight;
            if (roofType === 0) {
                // Gabled roof along X axis
                const offset = roofY;
                if (lx >= offset && lx < width - offset && lz >= 0 && lz < depth) {
                    // Roof ends/trim
                    if (lx === offset || lx === width - offset - 1 || lz === 0 || lz === depth - 1) {
                        return this.VOXEL_WOOD_DARK;
                    }
                    return roofVoxel;
                }
            } else {
                // Gabled roof along Z axis
                const offset = roofY;
                if (lz >= offset && lz < depth - offset && lx >= 0 && lx < width) {
                    // Roof ends/trim
                    if (lz === offset || lz === depth - offset - 1 || lx === 0 || lx === width - 1) {
                        return this.VOXEL_WOOD_DARK;
                    }
                    return roofVoxel;
                }
            }
            return 0;
        }

        // Walls (Timber framing style)
        const isEdgeX = (lx === 0 || lx === width - 1);
        const isEdgeZ = (lz === 0 || lz === depth - 1);

        if (isEdgeX || isEdgeZ) {
            // Horizontal beams
            if (ly === foundationHeight || ly === wallHeight - 1 || ly === Math.floor((foundationHeight + wallHeight) / 2)) {
                return this.VOXEL_WOOD_DARK;
            }

            // Vertical beams
            const isVerticalBeam = (lx % timberSpacing === 0) || (lz % timberSpacing === 0);
            if (isVerticalBeam) return this.VOXEL_WOOD_DARK;

            // Windows
            const isWindowPos = ly > foundationHeight + 1 && ly < wallHeight - 1 && (ly % 3 !== 0);
            if (isWindowPos) {
                if (isEdgeX && lz > 1 && lz < depth - 2 && lz % 3 === 1) return this.VOXEL_WINDOW;
                if (isEdgeZ && lx > 1 && lx < width - 2 && lx % 3 === 1) return this.VOXEL_WINDOW;
            }

            return this.VOXEL_PLASTER;
        }

        // Interior (empty)
        return 0;
    }
}
