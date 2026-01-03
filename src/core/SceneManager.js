import * as THREE from 'three';

export default class SceneManager {

    constructor() {

        this.scene = new THREE.Scene();

        // Retro Resolution
        const renderWidth = 320;
        const renderHeight = 240;
        const scale = 3;

        this.camera = new THREE.PerspectiveCamera(60, renderWidth / renderHeight, 0.1, 1000);

        // Disable antialias for pixelated look
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(renderWidth, renderHeight, false);

        // CSS Scaling
        const canvas = this.renderer.domElement;
        canvas.style.width = `${renderWidth * scale}px`;
        canvas.style.height = `${renderHeight * scale}px`;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.border = '1px solid #555';
        canvas.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)';

        document.body.appendChild(this.renderer.domElement);

        // Lights

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);

        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);

        directionalLight.position.set(50, 50, 50);

        this.scene.add(directionalLight);

        // Sky and Fog
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 90);

        // Window resize intentionally removed for fixed window size
    }

    render() {

        this.renderer.render(this.scene, this.camera);

    }

}