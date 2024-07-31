import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class NeonCityVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.frequencyBins = 512;
        this.buildings = [];
        this.neonSigns = [];
        this.hologramsData = [];

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.glitchPass = new GlitchPass();
        this.composer.addPass(this.glitchPass);

        this.chromaticAberrationPass = new ShaderPass({
            uniforms: {
                "tDiffuse": { value: null },
                "resolution": { value: new THREE.Vector2(1, 1) },
                "power": { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform float power;
                varying vec2 vUv;

                void main() {
                    vec2 direction = normalize(vUv - vec2(0.5));
                    vec2 velocity = direction * power * vec2(1.0 / resolution.x, 1.0 / resolution.y);
                    vec4 r = texture2D(tDiffuse, vUv - velocity);
                    vec4 g = texture2D(tDiffuse, vUv);
                    vec4 b = texture2D(tDiffuse, vUv + velocity);
                    gl_FragColor = vec4(r.r, g.g, b.b, g.a);
                }
            `
        });
        this.composer.addPass(this.chromaticAberrationPass);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.init();
    }

    init() {
        // Cyberpunk grid floor
        const gridHelper = new THREE.GridHelper(200, 20, 0x00ff00, 0x00ff00);
        this.scene.add(gridHelper);

        // Create buildings
        for (let i = 0; i < 50; i++) {
            this.createBuilding();
        }

        // Create neon signs
        for (let i = 0; i < 20; i++) {
            this.createNeonSign();
        }

        // Hologram projector
        const projectorGeometry = new THREE.CylinderGeometry(2, 2, 10, 32);
        const projectorMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, emissive: 0x0000ff, emissiveIntensity: 0.5 });
        this.hologramProjector = new THREE.Mesh(projectorGeometry, projectorMaterial);
        this.hologramProjector.position.set(0, 5, 0);
        this.scene.add(this.hologramProjector);

        // Hologram
        this.hologramGeometry = new THREE.BufferGeometry();
        const hologramMaterial = new THREE.PointsMaterial({
            size: 0.5,
            sizeAttenuation: true,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        this.hologram = new THREE.Points(this.hologramGeometry, hologramMaterial);
        this.scene.add(this.hologram);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x101010);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 50, 50);
        this.scene.add(pointLight);
    }

    createBuilding() {
        const width = Math.random() * 15 + 5;
        const height = Math.random() * 100 + 20;
        const depth = Math.random() * 15 + 5;

        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: new THREE.Color(Math.random(), Math.random(), Math.random()),
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });

        const building = new THREE.Mesh(geometry, material);
        building.position.set(
            Math.random() * 200 - 100,
            height / 2,
            Math.random() * 200 - 100
        );

        this.scene.add(building);
        this.buildings.push(building);
    }

    createNeonSign() {
        const signGeometry = new THREE.PlaneGeometry(10, 3);
        const signMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });

        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(
            Math.random() * 180 - 90,
            Math.random() * 80 + 10,
            Math.random() * 180 - 90
        );
        sign.rotation.y = Math.random() * Math.PI * 2;

        this.scene.add(sign);
        this.neonSigns.push(sign);
    }

    updateHologram(dataArray) {
        const positions = [];
        const colors = [];
        const hueIncrement = 1 / this.frequencyBins;

        for (let i = 0; i < this.frequencyBins; i++) {
            const value = dataArray[i] / 255;
            const x = (i / this.frequencyBins) * 40 - 20;
            const y = value * 50;
            const z = 0;

            positions.push(x, y, z);

            const hue = i * hueIncrement;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            colors.push(color.r, color.g, color.b);
        }

        this.hologramGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.hologramGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.hologramGeometry.attributes.position.needsUpdate = true;
        this.hologramGeometry.attributes.color.needsUpdate = true;
    }

    update(dataArray) {
        const time = Date.now() * 0.001;
        const bassValue = dataArray[0] / 255;

        // Update buildings
        this.buildings.forEach((building, index) => {
            const scaleFactor = 1 + Math.sin(time * 2 + index) * 0.1 * bassValue;
            building.scale.y = scaleFactor;
            building.material.emissiveIntensity = 0.5 + bassValue * 0.5;
        });

        // Update neon signs
        this.neonSigns.forEach((sign, index) => {
            sign.material.opacity = 0.5 + Math.sin(time * 3 + index) * 0.3;
            const blinkIntensity = Math.sin(time * 10 + index * 10) * 0.5 + 0.5;
            sign.material.color.offsetHSL(0.001, 0, blinkIntensity * bassValue);
        });

        // Update hologram
        this.updateHologram(dataArray);
        this.hologram.rotation.y = time * 0.5;

        // Camera movement
        this.camera.position.x = Math.sin(time * 0.5) * 100;
        this.camera.position.z = Math.cos(time * 0.5) * 100;
        this.camera.position.y = 50 + Math.sin(time) * 20;
        this.camera.lookAt(0, 0, 0);

        // Update post-processing effects
        this.bloomPass.strength = 1 + bassValue;
        this.glitchPass.goWild = bassValue > 0.8;
        this.chromaticAberrationPass.uniforms.power.value = bassValue * 0.01;

        this.composer.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        this.renderer.dispose();
        this.composer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}