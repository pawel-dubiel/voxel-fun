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

        this.minThrottle = 0;

        this.maxThrottle = 1;

        this.throttleResponse = 0.6;

        this.gravity = -18; // Gravity

        this.lift = 0.9; // Lift coefficient

        this.verticalControl = 20;

        this.drag = 0.92; // More drag for easier stopping

        this.pitchSpeed = 1.8;

        this.yawSpeed = 1.4;

        this.rollSpeed = 2.4;

        this.turnRate = 0.6;

        this.maxPitch = Math.PI / 3;

        this.maxRoll = Math.PI / 2.2;

        this.maxSpeed = 35;

        this.throttle = 0.35;

        this.forwardSpeed = this.throttle * this.maxSpeed;

        this.mouseNDC = new THREE.Vector2();
        this.hasMousePosition = false;

        this.cameraPosition = this.position.clone();
        this.cameraRotation = this.rotation.clone();
        this.cameraLag = 6;
        this.cameraBankFactor = 0.15;

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
        let throttleInput = 0;

        if (this.keys['KeyW']) pitchInput = -1;

        if (this.keys['KeyS']) pitchInput = 1;

        if (this.keys['KeyA']) rollInput = 1; // Roll Left (Banking)

        if (this.keys['KeyD']) rollInput = -1; // Roll Right

        if (this.keys['KeyQ']) yawInput = 1; // Yaw Left

        if (this.keys['KeyE']) yawInput = -1; // Yaw Right

        // Altitude Control (Arcade style: direct vertical velocity influence)
        let verticalInput = 0;
        if (this.keys['Space']) verticalInput = 1;
        if (this.keys['KeyC']) verticalInput = -1;

        if (this.keys['ShiftLeft']) throttleInput = 1;
        if (this.keys['ControlLeft']) throttleInput = -1;

        // Apply Rotations directly
        this.rotation.x += pitchInput * this.pitchSpeed * deltaTime;
        this.rotation.z += rollInput * this.rollSpeed * deltaTime;
        this.rotation.y += yawInput * this.yawSpeed * deltaTime;

        // Banked turning
        this.rotation.y += this.rotation.z * this.turnRate * deltaTime;

        // Clamp rotations
        this.rotation.x = THREE.MathUtils.clamp(this.rotation.x, -this.maxPitch, this.maxPitch);
        this.rotation.z = THREE.MathUtils.clamp(this.rotation.z, -this.maxRoll, this.maxRoll);

        // Physics

        this.throttle = THREE.MathUtils.clamp(
            this.throttle + throttleInput * this.throttleResponse * deltaTime,
            this.minThrottle,
            this.maxThrottle
        );

        const forwardVector = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
        const upVector = new THREE.Vector3(0, 1, 0).applyEuler(this.rotation);

        const targetSpeed = this.throttle * this.maxSpeed;
        const speedDelta = targetSpeed - this.forwardSpeed;
        this.forwardSpeed += speedDelta * 0.8 * deltaTime;
        this.forwardSpeed = THREE.MathUtils.clamp(this.forwardSpeed, 0, this.maxSpeed);

        const currentForward = this.velocity.dot(forwardVector);
        const forwardDelta = this.forwardSpeed - currentForward;
        this.velocity.addScaledVector(forwardVector, forwardDelta);

        const liftForce = this.lift * this.forwardSpeed;
        this.velocity.addScaledVector(upVector, liftForce * deltaTime);
        this.velocity.y += this.gravity * deltaTime;

        if (verticalInput !== 0) {
            this.velocity.y += verticalInput * this.verticalControl * deltaTime;
        }

        // Drag / Damping
        this.velocity.x *= this.drag;
        this.velocity.z *= this.drag;
        this.velocity.y *= 0.95; // Vertical drag

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Collision detection

        const terrainHeight = this.terrainGenerator.getHeightAt(this.position.x, this.position.z);

        if (this.position.y < terrainHeight + 2) { // Keep slightly above ground

            this.position.y = terrainHeight + 2;

            this.velocity.y = Math.max(this.velocity.y, 0); 

        }

        // Update camera
        const posLerp = 1 - Math.exp(-this.cameraLag * deltaTime);
        this.cameraPosition.lerp(this.position, posLerp);
        this.camera.position.copy(this.cameraPosition);

        const targetRotation = new THREE.Euler(
            this.rotation.x,
            this.rotation.y,
            this.rotation.z + this.rotation.z * this.cameraBankFactor,
            this.rotation.order
        );

        const rotLerp = 1 - Math.exp(-this.cameraLag * deltaTime);
        this.cameraRotation.x += (targetRotation.x - this.cameraRotation.x) * rotLerp;
        this.cameraRotation.y += (targetRotation.y - this.cameraRotation.y) * rotLerp;
        this.cameraRotation.z += (targetRotation.z - this.cameraRotation.z) * rotLerp;
        this.camera.rotation.copy(this.cameraRotation);

    }

}
