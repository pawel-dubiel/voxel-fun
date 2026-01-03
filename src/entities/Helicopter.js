import * as THREE from 'three';

export default class Helicopter {

    constructor(scene, position, terrainGenerator) {

        this.scene = scene;

        this.terrainGenerator = terrainGenerator;

        this.position = position.clone();

        this.velocity = new THREE.Vector3();

        this.rotation = new THREE.Euler();

        // Create simple helicopter mesh

        const geometry = new THREE.BoxGeometry(2, 0.5, 4);

        const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });

        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.copy(this.position);

        this.scene.add(this.mesh);

        this.throttle = 5;

        this.gravity = -9.8;

        this.lift = 5;

        this.drag = 0.9;

        this.pitchSpeed = 0.5;

        this.yawSpeed = 0.5;

        this.time = 0;

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

        this.mesh.position.copy(this.position);

        this.mesh.rotation.copy(this.rotation);

    }

    destroy() {

        this.scene.remove(this.mesh);

    }

}