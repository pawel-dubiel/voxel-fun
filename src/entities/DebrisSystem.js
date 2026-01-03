import * as THREE from 'three';

export default class DebrisSystem {
    constructor(scene, maxParticles = 10000) {
        this.scene = scene;
        this.maxParticles = maxParticles;
        this.particles = []; 
        this.cursor = 0; // Ring buffer cursor
        
        // Small cubes for debris, matching voxel size roughly (or slightly smaller for style)
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); 
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); 
        
        this.mesh = new THREE.InstancedMesh(geometry, material, maxParticles);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(maxParticles * 3), 3);
        this.scene.add(this.mesh);
        
        this.dummy = new THREE.Object3D();
        this.colorDummy = new THREE.Color();
        
        // Initialize pool
        for(let i=0; i<maxParticles; i++) {
            this.particles.push({
                position: new THREE.Vector3(0, -1000, 0),
                velocity: new THREE.Vector3(),
                active: false,
                resting: true
            });
            // Hide initially
            this.dummy.position.set(0, -1000, 0);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
    }
    
    spawn(position, count, colorHex) {
        this.colorDummy.setHex(colorHex);

        for (let k = 0; k < count; k++) {
            const i = this.cursor;
            this.cursor = (this.cursor + 1) % this.maxParticles;

            const p = this.particles[i];
            p.active = true;
            p.resting = false;
            p.position.copy(position);
            
            // Jitter to match volume roughly
            p.position.x += (Math.random() - 0.5) * 2;
            p.position.y += (Math.random() - 0.5) * 2;
            p.position.z += (Math.random() - 0.5) * 2;

            // Explosion velocity - outward + up
            p.velocity.set(
                (Math.random() - 0.5) * 20,
                (Math.random() * 20) + 5, 
                (Math.random() - 0.5) * 20
            );
            
            this.mesh.setColorAt(i, this.colorDummy);
        }
        
        this.mesh.instanceColor.needsUpdate = true;
    }
    
    update(deltaTime, collisionCallback) {
        let needsUpdate = false;

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.particles[i];
            
            if (p.active && !p.resting) {
                // Apply Gravity
                p.velocity.y -= 40 * deltaTime; // Gravity

                // Proposed new position
                const nextPos = p.position.clone().addScaledVector(p.velocity, deltaTime);

                // Check collision with world (voxels)
                // We check the destination. if it's solid, we stop.
                if (collisionCallback(nextPos.x, nextPos.y, nextPos.z)) {
                    // Hit something!
                    p.resting = true;
                    // p.active remains true so it stays visible
                    
                    // Simple friction/stop
                    p.velocity.set(0,0,0);
                    
                    // Optional: Snap to grid? Nah, let them pile messily.
                } else if (nextPos.y < 0) {
                     // Hard floor safety
                     p.resting = true;
                     p.position.y = 0;
                } else {
                    p.position.copy(nextPos);
                }

                // Update Visuals
                this.dummy.position.copy(p.position);
                // Rotate while moving
                if (!p.resting) {
                    this.dummy.rotation.x += p.velocity.z * deltaTime * 0.2;
                    this.dummy.rotation.z -= p.velocity.x * deltaTime * 0.2;
                }
                this.dummy.updateMatrix();
                this.mesh.setMatrixAt(i, this.dummy.matrix);
                needsUpdate = true;
            }
        }
        
        if (needsUpdate) {
            this.mesh.instanceMatrix.needsUpdate = true;
        }
    }
}