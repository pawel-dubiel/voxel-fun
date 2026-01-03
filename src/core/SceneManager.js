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

        const viewport = this.getViewportSize();

        this.camera = new THREE.PerspectiveCamera(60, viewport.width / viewport.height, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });

        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.useLegacyLights = false;

        this.renderer.setSize(viewport.width, viewport.height, false);

        const pixelRatio = this.getPixelRatio();
        this.renderer.setPixelRatio(Math.min(pixelRatio, 2));

        const canvas = this.renderer.domElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.display = 'block';

        document.body.appendChild(canvas);

        this.createLighting();
        this.createSky();

        this.scene.fog = new THREE.Fog(0xf5c7a6, 90, 240);

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

    getPixelRatio() {
        const ratio = window.devicePixelRatio;

        if (!Number.isFinite(ratio) || ratio <= 0) {
            throw new Error('SceneManager requires a valid devicePixelRatio.');
        }

        return ratio;
    }

    handleResize() {
        const viewport = this.getViewportSize();
        const pixelRatio = this.getPixelRatio();

        this.camera.aspect = viewport.width / viewport.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(viewport.width, viewport.height, false);
        this.renderer.setPixelRatio(Math.min(pixelRatio, 2));
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
        const topColor = new THREE.Color(0x6aa8ff);
        const bottomColor = new THREE.Color(0xf5c7a6);

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
