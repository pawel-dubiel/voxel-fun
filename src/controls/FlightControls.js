import * as THREE from 'three';

export default class FlightControls {

    constructor(camera, terrainGenerator, shootCallback) {

        this.camera = camera;

        this.terrainGenerator = terrainGenerator;

        this.shootCallback = shootCallback;

        this.velocity = new THREE.Vector3();

        this.position = new THREE.Vector3(0, 60, 0);

        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ'); // Order YXZ for stable yaw

        this.keys = {};

        this.throttle = 0;

        this.maxThrottle = 20; // Increased for snappier response

        this.gravity = -20; // Stronger gravity for weight

        this.lift = 40; // Stronger lift

        this.drag = 0.92; // More drag for easier stopping

        this.pitchSpeed = 2.0;

        this.yawSpeed = 2.0;

        this.rollSpeed = 2.0;
        
        this.maxTilt = Math.PI / 4; // Max 45 degrees tilt

        this.maxSpeed = 25; // Speed cap

        this.mouseNDC = new THREE.Vector2();
        this.hasMousePosition = false;

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);

        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        window.addEventListener('mousemove', (event) => this.updateMousePosition(event));

        window.addEventListener('mousedown', (event) => this.shoot(event));

    }

    updateMousePosition(event) {
        if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) {
            throw new Error('updateMousePosition requires a mouse event with clientX and clientY.');
        }

        if (!Number.isFinite(window.innerWidth) || !Number.isFinite(window.innerHeight) || window.innerWidth <= 0 || window.innerHeight <= 0) {
            throw new Error('updateMousePosition requires a valid window size.');
        }

        this.mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.hasMousePosition = true;
    }

    shoot(event) {

        if (this.shootCallback) {
            if (event) {
                this.updateMousePosition(event);
            }

            if (!this.hasMousePosition) {
                throw new Error('shoot requires a mouse position before firing.');
            }

            const target = new THREE.Vector3(this.mouseNDC.x, this.mouseNDC.y, 0.5);
            target.unproject(this.camera);
            const direction = target.sub(this.camera.position).normalize();

            if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y) || !Number.isFinite(direction.z)) {
                throw new Error('shoot computed an invalid direction vector.');
            }

            this.shootCallback(this.position.clone(), direction);

        }

    }

    update(deltaTime) {

        // Input

        let pitchInput = 0, yawInput = 0, rollInput = 0;

        if (this.keys['KeyW']) pitchInput = -1;

        if (this.keys['KeyS']) pitchInput = 1;

        if (this.keys['KeyA']) yawInput = 1; // Yaw Left

        if (this.keys['KeyD']) yawInput = -1; // Yaw Right

        if (this.keys['KeyQ']) rollInput = 1; // Roll Left (Banking)

        if (this.keys['KeyE']) rollInput = -1; // Roll Right

        // Altitude Control (Arcade style: direct vertical velocity influence)
        let verticalInput = 0;
        if (this.keys['Space']) verticalInput = 1;
        if (this.keys['ShiftLeft']) verticalInput = -1;

        // Apply Rotations directly
        this.rotation.y += yawInput * this.yawSpeed * deltaTime;

        // Pitch & Roll: Move towards target based on input, auto-center if no input
        const targetPitch = pitchInput * this.maxTilt;
        const targetRoll = rollInput * this.maxTilt;
        
        // Lerp rotation towards target (Auto-stabilization)
        const lerpFactor = 3.0 * deltaTime;
        this.rotation.x += (targetPitch - this.rotation.x) * lerpFactor;
        this.rotation.z += (targetRoll - this.rotation.z) * lerpFactor;

        // Clamp rotations just in case
        this.rotation.x = THREE.MathUtils.clamp(this.rotation.x, -this.maxTilt, this.maxTilt);
        this.rotation.z = THREE.MathUtils.clamp(this.rotation.z, -this.maxTilt, this.maxTilt);

        // Physics
        
        // Vertical movement: Mix of throttle/gravity and direct control
        // For arcade: Space = Up, Shift = Down, neutral = Hover (gravity compensated)
        const hoverForce = -this.gravity; // Force needed to hover
        let liftForce = hoverForce; 
        
        if (verticalInput !== 0) {
             liftForce += verticalInput * this.lift;
        }

        this.velocity.y += (liftForce + this.gravity) * deltaTime;
        
        // Horizontal movement: Based on tilt
        // Pitching down (negative X) propels forward (negative Z)
        // Rolling (Z) propels sideways (X)
        
        const forwardAccel = -this.rotation.x * 60; // Acceleration factor
        const sideAccel = this.rotation.z * 60;

        const forwardVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
        const rightVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

        this.velocity.add(forwardVector.multiplyScalar(forwardAccel * deltaTime));
        this.velocity.add(rightVector.multiplyScalar(sideAccel * deltaTime));

        // Drag / Damping
        this.velocity.x *= this.drag;
        this.velocity.z *= this.drag;
        this.velocity.y *= 0.95; // Vertical drag

        // Speed Cap (Horizontal)
        const horizontalVel = new THREE.Vector2(this.velocity.x, this.velocity.z);
        if (horizontalVel.length() > this.maxSpeed) {
            horizontalVel.setLength(this.maxSpeed);
            this.velocity.x = horizontalVel.x;
            this.velocity.z = horizontalVel.y;
        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Collision detection

        const terrainHeight = this.terrainGenerator.getHeightAt(this.position.x, this.position.z);

        if (this.position.y < terrainHeight + 2) { // Keep slightly above ground

            this.position.y = terrainHeight + 2;

            this.velocity.y = Math.max(this.velocity.y, 0); 

        }

        // Update camera

        this.camera.position.copy(this.position);

        this.camera.rotation.copy(this.rotation);

    }

}
