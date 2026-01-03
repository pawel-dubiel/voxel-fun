import * as THREE from 'three';

export default class Helicopter {

    constructor(scene, position, terrainGenerator, debrisSystem) {
        if (!scene) {
            throw new Error('Helicopter requires a scene.');
        }

        if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
            throw new Error('Helicopter requires a position with numeric x, y, z.');
        }

        if (!terrainGenerator) {
            throw new Error('Helicopter requires a terrainGenerator.');
        }

        if (!debrisSystem) {
            throw new Error('Helicopter requires a debrisSystem.');
        }

        this.scene = scene;

        this.terrainGenerator = terrainGenerator;

        this.debrisSystem = debrisSystem;

        this.position = position.clone();

        this.velocity = new THREE.Vector3();

        this.rotation = new THREE.Euler();

        // Create voxel-style helicopter mesh
        this.group = new THREE.Group();
        this.group.position.copy(this.position);

        this.bodyGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc3333,
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x220909,
            emissiveIntensity: 0.08
        });
        this.detailMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.3,
            emissive: 0x050505,
            emissiveIntensity: 0.05
        });
        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x335577,
            roughness: 0.2,
            metalness: 0,
            emissive: 0x0c1b24,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.65
        });

        const addVoxel = (x, y, z, material) => {
            if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
                throw new Error('Helicopter voxel requires numeric coordinates.');
            }

            if (!material) {
                throw new Error('Helicopter voxel requires a material.');
            }

            const voxel = new THREE.Mesh(this.bodyGeometry, material);
            voxel.position.set(x, y, z);
            this.group.add(voxel);
        };

        // Body
        for (let x = -1; x <= 1; x++) {
            for (let y = 0; y <= 1; y++) {
                for (let z = -2; z <= 2; z++) {
                    addVoxel(x, y, z, this.bodyMaterial);
                }
            }
        }

        // Cockpit glass
        for (let x = -1; x <= 1; x++) {
            addVoxel(x, 2, -2, this.glassMaterial);
        }

        // Tail boom
        for (let z = 3; z <= 6; z++) {
            addVoxel(0, 1, z, this.bodyMaterial);
        }

        // Tail fin
        addVoxel(0, 2, 6, this.bodyMaterial);

        // Landing skids
        for (let z = -1; z <= 2; z++) {
            addVoxel(-2, 0, z, this.detailMaterial);
            addVoxel(2, 0, z, this.detailMaterial);
        }

        // Rotor mast
        addVoxel(0, 2, 0, this.detailMaterial);

        // Main rotor
        for (let x = -3; x <= 3; x++) {
            if (x === 0) continue;
            addVoxel(x, 3, 0, this.detailMaterial);
        }

        // Tail rotor
        addVoxel(1, 2, 7, this.detailMaterial);
        addVoxel(-1, 2, 7, this.detailMaterial);

        this.scene.add(this.group);

        this.throttle = 5;

        this.gravity = -9.8;

        this.lift = 5;

        this.drag = 0.9;

        this.pitchSpeed = 0.5;

        this.yawSpeed = 0.5;

        this.time = 0;

        this.destroyed = false;

    }

    update(deltaTime) {

        this.time += deltaTime;

        // Simple AI: oscillate

        const pitch = Math.sin(this.time) * 0.1;

        const yaw = Math.cos(this.time * 0.5) * 0.1;

        this.rotation.x += pitch * this.pitchSpeed * deltaTime;

        this.rotation.y += yaw * this.yawSpeed * deltaTime;

        const liftForce = this.throttle * this.lift;

        const gravityForce = this.gravity;

        this.velocity.y += (liftForce + gravityForce) * deltaTime;

        this.velocity.multiplyScalar(this.drag);

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Collision

        const terrainHeight = this.terrainGenerator.getHeightAt(this.position.x, this.position.z);

        if (this.position.y < terrainHeight + 2) {

            this.position.y = terrainHeight + 2;

            this.velocity.y = Math.max(this.velocity.y, 0);

        }

        this.group.position.copy(this.position);

        this.group.rotation.copy(this.rotation);

    }

    destroy() {

        if (this.destroyed) return;

        this.destroyed = true;

        this.debrisSystem.spawn(this.position, 40, 0xcc3333);
        this.debrisSystem.spawnImpact(this.position, 12, 0x222222);

        this.scene.remove(this.group);
        this.bodyGeometry.dispose();
        this.bodyMaterial.dispose();
        this.detailMaterial.dispose();
        this.glassMaterial.dispose();

    }

}
