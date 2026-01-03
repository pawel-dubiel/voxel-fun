export default class Chunk {

    constructor(x, y, z, voxels, size = 16) {

        this.x = x;

        this.y = y;

        this.z = z;

        this.voxels = voxels;

        this.size = size;

        this.terrainMesh = null;

        this.buildingMesh = null;

    }

}