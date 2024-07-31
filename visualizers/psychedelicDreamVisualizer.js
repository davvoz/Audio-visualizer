import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class PsychedelicDreamVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.frequencyBins = 512;
        this.maxPoints = 2000;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.kaleidoscopePass = new ShaderPass({
            uniforms: {
                "tDiffuse": { value: null },
                "sides": { value: 8.0 },
                "angle": { value: 0.0 }
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
                uniform float sides;
                uniform float angle;
                varying vec2 vUv;
                
                void main() {
                    vec2 p = vUv - 0.5;
                    float r = length(p);
                    float a = atan(p.y, p.x) + angle;
                    float tau = 2. * 3.1416 ;
                    a = mod(a, tau/sides);
                    a = abs(a - tau/sides/2.) ;
                    p = r * vec2(cos(a), sin(a));
                    vec4 color = texture2D(tDiffuse, p + 0.5);
                    gl_FragColor = color;
                }
            `
        });
        this.composer.addPass(this.kaleidoscopePass);

        this.rotationSpeed = { x: 0.002, y: 0.002, z: 0.002 };
        this.bassThreshold = 0.5;
        this.lastBassValue = 0;

        this.fractals = [];
        this.dreamBubbles = [];

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.init();
    }

    init() {
        // Main dream line
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 3,
        });

        this.positions = new Float32Array(this.maxPoints * 3);
        this.colors = new Float32Array(this.maxPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        this.dreamLine = new THREE.Line(geometry, material);
        this.scene.add(this.dreamLine);

        // Fractal system
        this.fractalGeometry = new THREE.BufferGeometry();
        this.fractalMaterial = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });
        this.fractalSystem = new THREE.Points(this.fractalGeometry, this.fractalMaterial);
        this.scene.add(this.fractalSystem);

        // Dream bubbles
        this.bubbleGeometry = new THREE.SphereGeometry(1, 32, 32);
        this.bubbleMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            shininess: 100
        });

        // Lighting
        const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
        pointLight.position.set(0, 50, 50);
        this.scene.add(pointLight);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        const time = Date.now() * 0.001;
        const bassValue = dataArray[0] / 255;

        // Update dream line
        for (let i = this.maxPoints - 1; i > 0; i--) {
            this.positions[i * 3] = this.positions[(i - 1) * 3];
            this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
            this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];

            this.colors[i * 3] = this.colors[(i - 1) * 3];
            this.colors[i * 3 + 1] = this.colors[(i - 1) * 3 + 1];
            this.colors[i * 3 + 2] = this.colors[(i - 1) * 3 + 2];
        }

        const radius = 50 + Math.sin(time * 2) * 20;
        const heightScale = 30 + Math.cos(time * 3) * 15;
        this.positions[0] = Math.cos(time * 5) * radius * Math.sin(time * 0.7);
        this.positions[1] = Math.sin(time * 4) * radius * Math.cos(time * 0.8);
        this.positions[2] = (bassValue - 0.5) * heightScale + Math.sin(time * 6) * 10;

        const r = Math.sin(bassValue * Math.PI) * 0.5 + 0.5;
        const g = Math.sin(dataArray[32] / 255 * Math.PI + Math.PI / 3) * 0.5 + 0.5;
        const b = Math.sin(dataArray[64] / 255 * Math.PI + Math.PI * 2 / 3) * 0.5 + 0.5;
        this.colors[0] = r;
        this.colors[1] = g;
        this.colors[2] = b;

        this.dreamLine.geometry.attributes.position.needsUpdate = true;
        this.dreamLine.geometry.attributes.color.needsUpdate = true;

        // Crazy rotation based on audio intensity
        const intensity = (r + g + b) / 3;
        this.dreamLine.rotation.x += this.rotationSpeed.x * intensity * 5;
        this.dreamLine.rotation.y += this.rotationSpeed.y * intensity * 5;
        this.dreamLine.rotation.z += this.rotationSpeed.z * intensity * 5;

        // Camera movement
        this.camera.position.x = Math.sin(time * 0.5) * 100 * Math.cos(time * 0.2);
        this.camera.position.y = Math.cos(time * 0.4) * 100 * Math.sin(time * 0.3);
        this.camera.position.z = Math.sin(time * 0.6) * 100 + 100;
        this.camera.lookAt(0, 0, 0);

        this.detectFrequencyHits(dataArray);
        this.updateFractals();
        this.updateDreamBubbles(dataArray);

        // Update kaleidoscope effect
        this.kaleidoscopePass.uniforms.sides.value = 4 + Math.floor(bassValue * 12);
        this.kaleidoscopePass.uniforms.angle.value = time * 0.2;

        this.composer.render();
    }

    detectFrequencyHits(dataArray) {
        const bassValue = dataArray[0] / 255;
        const midValue = dataArray[32] / 255;
        const highValue = dataArray[64] / 255;

        if (bassValue > this.bassThreshold && bassValue > this.lastBassValue) {
            this.createFractal(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'bass');
        }
        if (midValue > 0.7) {
            this.createFractal(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'mid');
        }
        if (highValue > 0.6) {
            this.createFractal(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'high');
        }
        this.lastBassValue = bassValue;
    }

    createFractal(position, type) {
        let color;
        let particleCount;
        let speed;

        switch (type) {
            case 'bass':
                color = new THREE.Color(1, 0, 0);
                particleCount = 100;
                speed = 2;
                break;
            case 'mid':
                color = new THREE.Color(0, 1, 0);
                particleCount = 75;
                speed = 1.5;
                break;
            case 'high':
                color = new THREE.Color(0, 0, 1);
                particleCount = 50;
                speed = 1;
                break;
        }

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20;
            this.fractals.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    (Math.random() - 0.5) * speed
                ),
                color: color,
                age: 0,
                maxAge: 100 + Math.random() * 50
            });
        }
    }

    updateFractals() {
        const positions = [];
        const colors = [];

        this.fractals = this.fractals.filter(fractal => {
            fractal.position.add(fractal.velocity);
            fractal.velocity.multiplyScalar(0.99);
            fractal.age++;

            if (fractal.age < fractal.maxAge) {
                positions.push(fractal.position.x, fractal.position.y, fractal.position.z);
                const intensity = 1 - fractal.age / fractal.maxAge;
                colors.push(
                    fractal.color.r * intensity,
                    fractal.color.g * intensity,
                    fractal.color.b * intensity
                );
                return true;
            }
            return false;
        });

        this.fractalGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.fractalGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.fractalGeometry.attributes.position.needsUpdate = true;
        this.fractalGeometry.attributes.color.needsUpdate = true;
    }

    createDreamBubble(position, frequency) {
        const bubble = new THREE.Mesh(this.bubbleGeometry, this.bubbleMaterial.clone());
        bubble.position.copy(position);
        bubble.scale.setScalar(Math.random() * 3 + 1);
        bubble.material.color.setHSL(frequency, 1, 0.5);
        this.scene.add(bubble);

        this.dreamBubbles.push({
            mesh: bubble,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            ),
            age: 0,
            maxAge: 200 + Math.random() * 100
        });
    }

    updateDreamBubbles(dataArray) {
        const time = Date.now() * 0.001;

        if (Math.random() < 0.1) {
            const frequency = Math.floor(Math.random() * 256);
            const value = dataArray[frequency] / 255;
            if (value > 0.5) {
                this.createDreamBubble(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 100
                    ),
                    value
                );
            }
        }

        this.dreamBubbles = this.dreamBubbles.filter(bubble => {
            bubble.mesh.position.add(bubble.velocity);
            bubble.mesh.rotation.x += 0.01;
            bubble.mesh.rotation.y += 0.01;
            bubble.age++;

            const scale = 1 + Math.sin(time * 2 + bubble.age * 0.1) * 0.2;
            bubble.mesh.scale.setScalar(scale);

            if (bubble.age < bubble.maxAge) {
                bubble.mesh.material.opacity = 1 - (bubble.age / bubble.maxAge);
                return true;
            } else {
                this.scene.remove(bubble.mesh);
                return false;
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.dreamLine) {
            this.dreamLine.geometry.dispose();
            this.dreamLine.material.dispose();
            this.scene.remove(this.dreamLine);
        }
        this.fractalGeometry.dispose();
        this.fractalMaterial.dispose();
        this.scene.remove(this.fractalSystem);
        this.bubbleGeometry.dispose();
        this.bubbleMaterial.dispose();
        this.dreamBubbles.forEach(bubble => {
            this.scene.remove(bubble.mesh);
        });
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        window.removeEventListener('resize', this.onWindowResize.bind(this), false);
    }
}
