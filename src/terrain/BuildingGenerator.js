export default class BuildingGenerator {
    static VOXEL_STONE = 3;
    static VOXEL_WOOD = 4;
    static VOXEL_PLASTER = 5;
    static VOXEL_ROOF = 6;
    static VOXEL_WINDOW = 7;
    static VOXEL_WOOD_DARK = 8;
    static VOXEL_ROOF_RED = 9;
    static VOXEL_ROOF_GREEN = 10;
    static templateCache = new Map();

    constructor() {}

    static getVoxelAt(lx, ly, lz, width, height, depth, seed, style) {
        if (!Number.isFinite(lx) || !Number.isFinite(ly) || !Number.isFinite(lz)) {
            throw new Error('getVoxelAt requires numeric local coordinates.');
        }

        if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(depth)) {
            throw new Error('getVoxelAt requires numeric dimensions.');
        }

        if (!Number.isFinite(seed)) {
            throw new Error('getVoxelAt requires a numeric seed.');
        }

        if (typeof style !== 'string') {
            throw new Error('getVoxelAt requires a building style.');
        }

        if (style === 'tower') {
            return this.getTowerVoxelAt(lx, ly, lz, width, height, depth, seed);
        }

        if (style === 'house') {
            return this.getHouseVoxelAt(lx, ly, lz, width, height, depth, seed);
        }

        throw new Error('getVoxelAt requires a supported building style.');
    }

    static getTemplate(width, height, depth, seed, style) {
        if (!Number.isFinite(width) || width <= 0) {
            throw new Error('getTemplate requires a positive numeric width.');
        }

        if (!Number.isFinite(height) || height <= 0) {
            throw new Error('getTemplate requires a positive numeric height.');
        }

        if (!Number.isFinite(depth) || depth <= 0) {
            throw new Error('getTemplate requires a positive numeric depth.');
        }

        if (!Number.isFinite(seed)) {
            throw new Error('getTemplate requires a numeric seed.');
        }

        if (typeof style !== 'string') {
            throw new Error('getTemplate requires a building style.');
        }

        const key = `${style}:${width}:${height}:${depth}:${seed}`;
        const cached = this.templateCache.get(key);
        if (cached) return cached;

        let sampler = null;
        if (style === 'tower') {
            sampler = this.getTowerVoxelAt;
        } else if (style === 'house') {
            sampler = this.getHouseVoxelAt;
        } else {
            throw new Error('getTemplate requires a supported building style.');
        }

        const template = new Uint8Array(width * height * depth);

        for (let lx = 0; lx < width; lx++) {
            for (let ly = 0; ly < height; ly++) {
                for (let lz = 0; lz < depth; lz++) {
                    const voxel = sampler.call(this, lx, ly, lz, width, height, depth, seed);
                    if (!Number.isFinite(voxel)) {
                        throw new Error('getTemplate requires numeric voxel values.');
                    }
                    template[lx * height * depth + ly * depth + lz] = voxel;
                }
            }
        }

        this.templateCache.set(key, template);
        return template;
    }

    static getHouseVoxelAt(lx, ly, lz, width, height, depth, seed) {
        // Deterministic features based on seed
        const roofType = seed % 2; // 0: X-axis, 1: Z-axis
        const roofColorRoll = (seed >> 8) % 3;
        let roofVoxel = this.VOXEL_ROOF;
        if (roofColorRoll === 1) roofVoxel = this.VOXEL_ROOF_RED;
        else if (roofColorRoll === 2) roofVoxel = this.VOXEL_ROOF_GREEN;
        
        const timberSpacing = 2 + (seed % 3);
        
        // Foundation (Stone)
        const foundationHeight = 1 + (seed % 2);
        if (ly < foundationHeight) return this.VOXEL_STONE;

        // Roof
        const roofStyle = seed % 5;
        const roofHeight = roofStyle === 0
            ? 1
            : Math.max(2, Math.floor(height * (0.35 + (seed % 3) * 0.08)));
        const wallHeight = height - roofHeight;
        
        if (ly >= wallHeight) {
            const roofY = ly - wallHeight;
            if (roofStyle === 0) {
                if (roofY === 0) {
                    if (lx === 0 || lx === width - 1 || lz === 0 || lz === depth - 1) {
                        return this.VOXEL_WOOD_DARK;
                    }
                    return roofVoxel;
                }
                return 0;
            } else {
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
