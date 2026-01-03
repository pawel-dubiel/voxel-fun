import * as THREE from 'three';

export default class Missile {

    constructor(scene, position, direction) {

        this.scene = scene;

        this.position = position.clone();

        this.velocity = direction.clone().multiplyScalar(50); // Speed

        this.lifetime = 5; // seconds

        this.time = 0;

        // Create missile mesh

        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 1);
        geometry.rotateX(Math.PI / 2); // Align with Z axis

        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });

        this.mesh = new THREE.Mesh(geometry, material);

        this.mesh.position.copy(this.position);
        this.mesh.lookAt(this.position.clone().add(this.velocity));

        this.scene.add(this.mesh);

    }

    update(deltaTime) {

        this.time += deltaTime;

        if (this.time > this.lifetime) {

            this.destroy();

            return false;

        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        this.mesh.position.copy(this.position);

        return true;

    }

    destroy() {

        this.scene.remove(this.mesh);

    }

}