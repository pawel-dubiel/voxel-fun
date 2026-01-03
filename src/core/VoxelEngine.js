import * as THREE from 'three';

import SceneManager from './SceneManager.js';

import TerrainGenerator from '../terrain/TerrainGenerator.js';

import Chunk from '../terrain/Chunk.js';

import VoxelRenderer from '../rendering/VoxelRenderer.js';

import FlightControls from '../controls/FlightControls.js';

import Helicopter from '../entities/Helicopter.js';

import Missile from '../entities/Missile.js';

import DebrisSystem from '../entities/DebrisSystem.js';

import Human from '../entities/Human.js';

export default class VoxelEngine {

    constructor() {

        this.sceneManager = new SceneManager();

        this.terrainGenerator = new TerrainGenerator();

        this.voxelRenderer = new VoxelRenderer(this.sceneManager.scene);
        
        this.debrisSystem = new DebrisSystem(this.sceneManager.scene);

        this.flightControls = new FlightControls(this.sceneManager.camera, this.terrainGenerator, this.shoot.bind(this));

        this.chunks = new Map();

        this.chunkSize = 32;

        this.renderDistance = 3;

        this.lastTime = 0;

        this.animate = this.animate.bind(this);

        this.pendingCollapseChunks = new Set();
        this.collapseAccumulator = 0;
        this.collapseInterval = 1 / 30;
        this.collapseMaxStepsPerFrame = 2;

        // Enemy helicopters

        this.enemies = [];

        for (let i = 0; i < 3; i++) {

            const pos = new THREE.Vector3((i - 1) * 50, 60, 50);

            const enemy = new Helicopter(this.sceneManager.scene, pos, this.terrainGenerator);

            this.enemies.push(enemy);

        }
        
        // Roman Army Cohorts
        this.humans = [];
        this.cohorts = [];
        
        for (let c = 0; c < 10; c++) {
            const cohortCenter = new THREE.Vector3(
                (Math.random() - 0.5) * 400,
                0,
                (Math.random() - 0.5) * 400
            );
            const cohortDir = Math.random() * Math.PI * 2;
            const cohortObj = { center: cohortCenter, direction: cohortDir };
            this.cohorts.push(cohortObj);

            // 10x10 grid for each cohort (100 men per cohort = 1000 total)
            for (let i = 0; i < 10; i++) {
                for (let k = 0; k < 10; k++) {
                    const x = cohortCenter.x + (i - 5) * 2;
                    const z = cohortCenter.z + (k - 5) * 2;
                    const h = this.terrainGenerator.getHeightAt(x, z);
                    const pos = new THREE.Vector3(x, h, z);
                    this.humans.push(new Human(this.sceneManager.scene, pos, this.terrainGenerator, cohortObj));
                }
            }
        }

        // Missiles

        this.missiles = [];

        // HUD

        this.altitudeEl = document.getElementById('altitude');

        this.speedEl = document.getElementById('speed');

        this.animate(0);

    }

    shoot(position, direction) {

        const missile = new Missile(this.sceneManager.scene, position, direction);

        this.missiles.push(missile);

    }

    getChunkKey(chunkX, chunkY, chunkZ) {
        return `${chunkX},${chunkY},${chunkZ}`;
    }

    getVoxel(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const key = this.getChunkKey(chunkX, chunkY, chunkZ);
        
        const chunk = this.chunks.get(key);
        if (!chunk) return 0;

        const localX = ((Math.floor(x) % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((Math.floor(y) % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((Math.floor(z) % this.chunkSize) + this.chunkSize) % this.chunkSize;

        return chunk.voxels[localX * this.chunkSize * this.chunkSize + localY * this.chunkSize + localZ];
    }

    setVoxel(x, y, z, value) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkY = Math.floor(y / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const key = this.getChunkKey(chunkX, chunkY, chunkZ);
        
        const chunk = this.chunks.get(key);
        if (!chunk) return null;

        const localX = ((Math.floor(x) % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localY = ((Math.floor(y) % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((Math.floor(z) % this.chunkSize) + this.chunkSize) % this.chunkSize;

        chunk.voxels[localX * this.chunkSize * this.chunkSize + localY * this.chunkSize + localZ] = value;
        return chunk;
    }

    createExplosion(position, radius) {
        const affectedChunks = new Set();
        const center = position.clone();
        const r2 = radius * radius;

        let terrainDestroyed = 0;
        let buildingDestroyed = 0;
        let castleDestroyed = 0;

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    const dist2 = x*x + y*y + z*z;
                    if (dist2 <= r2) {
                        const worldX = center.x + x;
                        const worldY = center.y + y;
                        const worldZ = center.z + z;
                        
                        const voxelType = this.getVoxel(worldX, worldY, worldZ);
                        // Only remove solid blocks
                        if (voxelType > 0) {
                            if (voxelType === 1) terrainDestroyed++;
                            else if (voxelType === 2) buildingDestroyed++;
                            else if (voxelType === 3) castleDestroyed++;

                            const chunk = this.setVoxel(worldX, worldY, worldZ, 0);
                            if (chunk) affectedChunks.add(chunk);
                        }
                    }
                }
            }
        }

        // Spawn debris based on what was destroyed
        if (terrainDestroyed > 0) {
            this.debrisSystem.spawn(position, terrainDestroyed, 0x00ff00);
        }
        if (buildingDestroyed > 0) {
            this.debrisSystem.spawn(position, buildingDestroyed, 0x808080);
        }
        if (castleDestroyed > 0) {
            this.debrisSystem.spawn(position, castleDestroyed, 0x444444);
        }

        this.queueCollapse(affectedChunks);

        // Re-render affected chunks
        for (const chunk of affectedChunks) {
            this.voxelRenderer.renderChunk(chunk);
        }
    }

    queueCollapse(affectedChunks) {
        if (!(affectedChunks instanceof Set)) {
            throw new Error('queueCollapse requires a Set of chunks.');
        }

        if (affectedChunks.size === 0) return;

        const chunksToCheck = new Set();
        const neighborRadius = 1;

        const addChunkIfValid = (chunk) => {
            if (!chunk) return;

            if (!Number.isFinite(chunk.x) || !Number.isFinite(chunk.y) || !Number.isFinite(chunk.z)) {
                throw new Error('queueCollapse requires chunks with numeric coordinates.');
            }

            if (!Number.isFinite(chunk.size) || chunk.size !== this.chunkSize) {
                throw new Error('queueCollapse requires chunks with the expected size.');
            }

            chunksToCheck.add(chunk);
        };

        const addChunkColumn = (startChunk) => {
            if (!startChunk) return;

            let cursor = startChunk;
            while (cursor) {
                addChunkIfValid(cursor);
                const aboveKey = this.getChunkKey(cursor.x, cursor.y + 1, cursor.z);
                cursor = this.chunks.get(aboveKey);
            }

            cursor = startChunk;
            while (cursor) {
                const belowKey = this.getChunkKey(cursor.x, cursor.y - 1, cursor.z);
                cursor = this.chunks.get(belowKey);
                if (cursor) addChunkIfValid(cursor);
            }
        };

        for (const chunk of affectedChunks) {
            if (!chunk || !Number.isFinite(chunk.x) || !Number.isFinite(chunk.y) || !Number.isFinite(chunk.z)) {
                throw new Error('queueCollapse requires chunks with numeric coordinates.');
            }

            if (!Number.isFinite(chunk.size) || chunk.size !== this.chunkSize) {
                throw new Error('queueCollapse requires chunks with the expected size.');
            }

            for (let dx = -neighborRadius; dx <= neighborRadius; dx++) {
                for (let dy = -neighborRadius; dy <= neighborRadius; dy++) {
                    for (let dz = -neighborRadius; dz <= neighborRadius; dz++) {
                        const key = this.getChunkKey(chunk.x + dx, chunk.y + dy, chunk.z + dz);
                        const neighbor = this.chunks.get(key);
                        if (neighbor) addChunkColumn(neighbor);
                    }
                }
            }
        }

        if (chunksToCheck.size === 0) return;

        for (const chunk of chunksToCheck) {
            this.pendingCollapseChunks.add(chunk);
        }
    }

    performCollapseStep(chunksToCheck) {
        if (!(chunksToCheck instanceof Set)) {
            throw new Error('performCollapseStep requires a Set of chunks.');
        }

        if (chunksToCheck.size === 0) {
            return { moved: false, changedChunks: new Set() };
        }

        const chunkList = Array.from(chunksToCheck);
        chunkList.sort((a, b) => b.y - a.y);

        const moves = [];
        const changedChunks = new Set();
        let moved = false;

        for (const chunk of chunkList) {
            if (!chunk || !Number.isFinite(chunk.x) || !Number.isFinite(chunk.y) || !Number.isFinite(chunk.z)) {
                throw new Error('performCollapseStep requires chunks with numeric coordinates.');
            }

            if (!Number.isFinite(chunk.size) || chunk.size !== this.chunkSize) {
                throw new Error('performCollapseStep requires chunks with the expected size.');
            }

            const key = this.getChunkKey(chunk.x, chunk.y, chunk.z);
            if (this.chunks.get(key) !== chunk) {
                throw new Error('performCollapseStep requires chunks to be loaded.');
            }

            const size = chunk.size;
            const baseY = chunk.y * size;

            for (let j = size - 1; j >= 0; j--) {
                for (let i = 0; i < size; i++) {
                    for (let k = 0; k < size; k++) {
                        const idx = i * size * size + j * size + k;
                        const voxelType = chunk.voxels[idx];

                        if (voxelType !== 2 && voxelType !== 3) {
                            continue;
                        }

                        const worldY = baseY + j;

                        if (worldY < 0) {
                            throw new Error('performCollapseStep does not support building or castle voxels below world Y 0.');
                        }

                        if (worldY === 0) {
                            continue;
                        }

                        let belowChunk = chunk;
                        let belowIndex = idx - size;

                        if (j === 0) {
                            const belowKey = this.getChunkKey(chunk.x, chunk.y - 1, chunk.z);
                            belowChunk = this.chunks.get(belowKey);

                            if (!belowChunk) {
                                throw new Error('performCollapseStep requires the chunk below to be loaded.');
                            }

                            if (!Number.isFinite(belowChunk.size) || belowChunk.size !== size) {
                                throw new Error('performCollapseStep requires matching chunk sizes across boundaries.');
                            }

                            belowIndex = i * size * size + (size - 1) * size + k;
                        }

                        if (belowChunk.voxels[belowIndex] === 0) {
                            moves.push({
                                fromChunk: chunk,
                                fromIndex: idx,
                                toChunk: belowChunk,
                                toIndex: belowIndex,
                                voxelType
                            });
                        }
                    }
                }
            }
        }

        for (const move of moves) {
            if (move.toChunk.voxels[move.toIndex] !== 0) {
                throw new Error('performCollapseStep planned a move into a filled voxel.');
            }

            move.toChunk.voxels[move.toIndex] = move.voxelType;
            move.fromChunk.voxels[move.fromIndex] = 0;
            changedChunks.add(move.fromChunk);
            changedChunks.add(move.toChunk);
            moved = true;
        }

        return { moved, changedChunks };
    }

    processCollapse(deltaTime) {
        if (!Number.isFinite(deltaTime)) {
            throw new Error('processCollapse requires a numeric deltaTime.');
        }

        if (this.pendingCollapseChunks.size === 0) return;

        if (!Number.isFinite(this.collapseInterval) || this.collapseInterval <= 0) {
            throw new Error('processCollapse requires a positive collapseInterval.');
        }

        if (!Number.isFinite(this.collapseMaxStepsPerFrame) || this.collapseMaxStepsPerFrame < 1) {
            throw new Error('processCollapse requires collapseMaxStepsPerFrame >= 1.');
        }

        this.collapseAccumulator += deltaTime;
        if (this.collapseAccumulator < this.collapseInterval) return;

        const rawSteps = Math.floor(this.collapseAccumulator / this.collapseInterval);
        const steps = Math.min(rawSteps, this.collapseMaxStepsPerFrame);

        this.collapseAccumulator -= steps * this.collapseInterval;

        const chunksToRender = new Set();

        for (let step = 0; step < steps; step++) {
            const { moved, changedChunks } = this.performCollapseStep(this.pendingCollapseChunks);

            for (const chunk of changedChunks) {
                chunksToRender.add(chunk);
            }

            if (!moved) {
                this.pendingCollapseChunks.clear();
                break;
            }
        }

        for (const chunk of chunksToRender) {
            this.voxelRenderer.renderChunk(chunk);
        }
    }

    checkCollisions() {
        // Missile vs Entities
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            let hit = false;

            // Enemy Collision
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (missile.position.distanceTo(enemy.position) < 3) {
                    missile.destroy();
                    this.missiles.splice(i, 1);
                    enemy.destroy();
                    this.enemies.splice(j, 1);
                    hit = true;
                    break;
                }
            }
            if (hit) continue;
            
            // Human Collision
            for (let j = this.humans.length - 1; j >= 0; j--) {
                 const human = this.humans[j];
                 if (missile.position.distanceTo(human.position) < 2) {
                      human.destroy();
                      this.humans.splice(j, 1);
                      this.debrisSystem.spawn(human.position, 10, 0xff0000);
                 }
            }

            // Terrain Collision
            if (this.getVoxel(missile.position.x, missile.position.y, missile.position.z) > 0) {
                this.createExplosion(missile.position, 5); // Big hole radius 5
                
                // Kill/Panic humans near explosion
                for (let j = this.humans.length - 1; j >= 0; j--) {
                    const human = this.humans[j];
                    const dist = human.position.distanceTo(missile.position);
                    if (dist < 8) {
                         human.destroy();
                         this.humans.splice(j, 1);
                         this.debrisSystem.spawn(human.position, 10, 0xff0000);
                    } else if (dist < 25) {
                         human.panic(); // Trigger panic behavior
                    }
               }
               
                missile.destroy();
                this.missiles.splice(i, 1);
            }
        }
    }

    animate(time) {

        const deltaTime = (time - this.lastTime) / 1000;

        this.lastTime = time;

        this.flightControls.update(deltaTime);
        
        // Update debris with collision callback
        this.debrisSystem.update(deltaTime, (x, y, z) => {
            // Check against actual voxel data
            if (this.getVoxel(x, y, z) > 0) return true;
            
            // Fallback: Check against base terrain height for distant/unloaded areas
            // or to catch particles falling through small gaps
            const h = this.terrainGenerator.getHeightAt(x, z);
            if (y < h) return true;
            
            return false;
        });

        this.enemies.forEach(enemy => enemy.update(deltaTime));
        
        this.humans.forEach(human => human.update(deltaTime));

        // Update missiles

        this.missiles = this.missiles.filter(missile => missile.update(deltaTime));

        // Check collisions

        this.checkCollisions();

        this.processCollapse(deltaTime);

        // Update HUD

        const altitude = Math.round(this.flightControls.position.y);

        const speed = Math.round(this.flightControls.velocity.length() * 10) / 10;

        this.altitudeEl.textContent = altitude;

        this.speedEl.textContent = speed;

        this.updateChunks();

        this.sceneManager.render();

        requestAnimationFrame(this.animate);

    }

    updateChunks() {
        const cameraPos = this.sceneManager.camera.position;
        const chunkX = Math.floor(cameraPos.x / this.chunkSize);
        const chunkY = Math.floor(cameraPos.y / this.chunkSize);
        const chunkZ = Math.floor(cameraPos.z / this.chunkSize);

        const activeKeys = new Set();

        for (let x = chunkX - this.renderDistance; x <= chunkX + this.renderDistance; x++) {
            for (let y = chunkY - this.renderDistance; y <= chunkY + this.renderDistance; y++) {
                for (let z = chunkZ - this.renderDistance; z <= chunkZ + this.renderDistance; z++) {
                    const key = `${x},${y},${z}`;
                    activeKeys.add(key);

                    if (!this.chunks.has(key)) {
                        const voxels = this.terrainGenerator.generateChunk(x, y, z, this.chunkSize);
                        const chunk = new Chunk(x, y, z, voxels, this.chunkSize);
                        this.voxelRenderer.renderChunk(chunk);
                        this.chunks.set(key, chunk);
                    }
                }
            }
        }

        // Remove old chunks
        for (const [key, chunk] of this.chunks) {
            if (!activeKeys.has(key)) {
                this.voxelRenderer.disposeChunk(chunk);
                this.chunks.delete(key);
            }
        }
    }

}
