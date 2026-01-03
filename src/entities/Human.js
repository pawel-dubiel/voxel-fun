import * as THREE from 'three';

export default class Human {
    constructor(scene, position, terrainGenerator, cohort = null) {
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
        this.position = position.clone();
        this.cohort = cohort; // { center: Vector3, direction: number }
        
        // Random walk parameters
        this.velocity = new THREE.Vector3();
        this.speed = 1.5 + Math.random() * 1.0; 
        this.direction = cohort ? cohort.direction : Math.random() * Math.PI * 2;
        this.changeDirTimer = 0;
        this.panicTimer = 0;
        
        this.group = new THREE.Group();
        this.group.position.copy(this.position);
        
        // Materials (Roman style: red/white)
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
        const shirtMat = new THREE.MeshLambertMaterial({ color: cohort ? 0x990000 : 0xdddddd }); 
        const pantsMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        this.head = new THREE.Mesh(headGeo, skinMat);
        this.head.position.y = 1.45;
        this.group.add(this.head);
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(0.4, 0.5, 0.25);
        this.body = new THREE.Mesh(bodyGeo, shirtMat);
        this.body.position.y = 1.0;
        this.group.add(this.body);

        // Optional: Simple Shield for Romans
        if (cohort) {
            const shieldGeo = new THREE.BoxGeometry(0.3, 0.5, 0.1);
            const shieldMat = new THREE.MeshLambertMaterial({ color: 0xaa8822 });
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.position.set(0.3, 1.0, 0.15);
            this.group.add(shield);
        }
        
        // Arms / Legs same as before...
        const armGeo = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        this.armL = new THREE.Mesh(armGeo, shirtMat);
        this.armL.position.set(-0.3, 1.0, 0);
        this.group.add(this.armL);
        
        this.armR = new THREE.Mesh(armGeo, shirtMat);
        this.armR.position.set(0.3, 1.0, 0);
        this.group.add(this.armR);
        
        const legGeo = new THREE.BoxGeometry(0.18, 0.6, 0.2);
        this.legL = new THREE.Mesh(legGeo, pantsMat);
        this.legL.position.set(-0.12, 0.4, 0);
        this.group.add(this.legL);
        
        this.legR = new THREE.Mesh(legGeo, pantsMat);
        this.legR.position.set(0.12, 0.4, 0);
        this.group.add(this.legR);
        
        this.scene.add(this.group);
        
        this.time = Math.random() * 100;
        this.active = true;
    }

    panic() {
        this.panicTimer = 5.0; // Panic for 5 seconds
        this.speed = 6.0; // Run away fast
    }
    
    update(deltaTime) {
        if (!this.active) return;
        
        this.time += deltaTime;
        
        if (this.panicTimer > 0) {
            this.panicTimer -= deltaTime;
            // Run away from current direction
            if (Math.random() < 0.05) this.direction += (Math.random() - 0.5) * Math.PI;
        } else if (this.cohort) {
            // March in formation
            this.direction = this.cohort.direction;
            this.speed = 1.5;
        } else {
            // Random walk logic as before
            this.changeDirTimer -= deltaTime;
            if (this.changeDirTimer <= 0) {
                this.changeDirTimer = 1 + Math.random() * 4;
                this.direction += (Math.random() - 0.5) * 2.0;
            }
        }
        
        const dx = Math.sin(this.direction) * this.speed;
        const dz = Math.cos(this.direction) * this.speed;
        
        this.position.x += dx * deltaTime;
        this.position.z += dz * deltaTime;
        
        const terrainHeight = this.terrainGenerator.getHeightAt(this.position.x, this.position.z);
        this.position.y = terrainHeight;
        
        this.group.position.copy(this.position);
        this.group.rotation.y = this.direction;
        
        const animSpeed = this.speed * 4;
        const swing = Math.sin(this.time * animSpeed);
        this.legL.rotation.x = swing * 0.8;
        this.legR.rotation.x = -swing * 0.8;
        this.armL.rotation.x = -swing * 0.8;
        this.armR.rotation.x = swing * 0.8;
    }
    
    destroy() {
        this.scene.remove(this.group);
        this.active = false;
    }
}