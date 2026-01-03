import * as THREE from 'three';

export default class SceneManager {

    constructor() {

        if (typeof window === 'undefined') {
            throw new Error('SceneManager requires window to be available.');
        }

        if (typeof document === 'undefined') {
            throw new Error('SceneManager requires document to be available.');
        }

        this.scene = new THREE.Scene();

        this.renderWidth = 320;
        this.renderHeight = 240;

        this.camera = new THREE.PerspectiveCamera(60, this.renderWidth / this.renderHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'high-performance'
        });

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.useLegacyLights = false;

        this.renderer.setPixelRatio(1);
        this.renderer.setSize(this.renderWidth, this.renderHeight, false);

        const canvas = this.renderer.domElement;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.width = `${this.renderWidth}px`;
        canvas.style.height = `${this.renderHeight}px`;
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.display = 'block';

        document.body.appendChild(canvas);

        this.applyScale();
        this.createLighting();
        this.createSky();

        this.scene.fog = new THREE.FogExp2(0xf0b09a, 0.018);

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

    }

    getViewportSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
            throw new Error('SceneManager requires a valid viewport size.');
        }

        return { width, height };
    }

    handleResize() {
        this.applyScale();
    }

    applyScale() {
        const viewport = this.getViewportSize();
        const rawScale = Math.min(viewport.width / this.renderWidth, viewport.height / this.renderHeight);

        if (!Number.isFinite(rawScale) || rawScale <= 0) {
            throw new Error('SceneManager requires a valid scale.');
        }

        const integerScale = Math.floor(rawScale);
        const scale = integerScale >= 1 ? integerScale : rawScale;

        const canvas = this.renderer.domElement;
        canvas.style.width = `${this.renderWidth * scale}px`;
        canvas.style.height = `${this.renderHeight * scale}px`;
    }

    createLighting() {
        const hemisphereLight = new THREE.HemisphereLight(0xbad7ff, 0x3a2b1b, 0.55);
        this.scene.add(hemisphereLight);

        const sunLight = new THREE.DirectionalLight(0xfff1d6, 1.25);
        sunLight.position.set(80, 120, 40);
        sunLight.target.position.set(0, 0, 0);
        this.scene.add(sunLight);
        this.scene.add(sunLight.target);

        const fillLight = new THREE.DirectionalLight(0x8aa8ff, 0.35);
        fillLight.position.set(-70, 30, -90);
        this.scene.add(fillLight);
    }

    createSky() {
        const topColor = new THREE.Color(0x5b77d1);
        const bottomColor = new THREE.Color(0xf2b18c);

        const skyGeometry = new THREE.SphereGeometry(600, 32, 16);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: topColor },
                bottomColor: { value: bottomColor },
                offset: { value: 20 },
                exponent: { value: 0.55 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;

                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;

                void main() {
                    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
                    float mixAmount = pow(max(h, 0.0), exponent);
                    gl_FragColor = vec4(mix(bottomColor, topColor, mixAmount), 1.0);
                }
            `,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    render() {

        this.renderer.render(this.scene, this.camera);

    }

}
