import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class NewWaveVisualizer {
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

        this.frequencyBins = 256;
        this.maxPoints = 1000;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.rotationSpeed = { x: 0.002, y: 0.002, z: 0.002 };
        this.bassThreshold = 0.5;
        this.lastBassValue = 0;

        this.explosions = [];
        this.explosionParticles = new THREE.BufferGeometry();
        this.explosionMaterial = new THREE.PointsMaterial({
            size: 3,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
        });
        this.explosionSystem = new THREE.Points(this.explosionParticles, this.explosionMaterial);
        this.scene.add(this.explosionSystem);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.init();
    }

    init() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 3,
        });

        this.positions = new Float32Array(this.maxPoints * 3);
        this.colors = new Float32Array(this.maxPoints * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        this.line = new THREE.Line(geometry, material);
        this.scene.add(this.line);

        const pointLight = new THREE.PointLight(0xffffff, 2, 1000);
        pointLight.position.set(0, 50, 50);
        this.scene.add(pointLight);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        const time = Date.now() * 0.001;
        const bassValue = dataArray[0] / 255;

        // Shift existing points
        for (let i = this.maxPoints - 1; i > 0; i--) {
            this.positions[i * 3] = this.positions[(i - 1) * 3];
            this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
            this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];

            this.colors[i * 3] = this.colors[(i - 1) * 3];
            this.colors[i * 3 + 1] = this.colors[(i - 1) * 3 + 1];
            this.colors[i * 3 + 2] = this.colors[(i - 1) * 3 + 2];
        }

        // Add new point with crazy movement
        const radius = 50 + Math.sin(time * 2) * 20;
        const heightScale = 30 + Math.cos(time * 3) * 15;
        this.positions[0] = Math.cos(time * 5) * radius;
        this.positions[1] = Math.sin(time * 4) * radius;
        this.positions[2] = (bassValue - 0.5) * heightScale;

        // Wild color based on audio data
        const r = Math.sin(bassValue * Math.PI) * 0.5 + 0.5;
        const g = Math.sin(dataArray[32] / 255 * Math.PI + Math.PI / 3) * 0.5 + 0.5;
        const b = Math.sin(dataArray[64] / 255 * Math.PI + Math.PI * 2 / 3) * 0.5 + 0.5;
        this.colors[0] = r;
        this.colors[1] = g;
        this.colors[2] = b;

        this.line.geometry.attributes.position.needsUpdate = true;
        this.line.geometry.attributes.color.needsUpdate = true;

        // Crazy rotation based on audio intensity
        const intensity = (r + g + b) / 3;
        this.line.rotation.x += this.rotationSpeed.x * intensity * 5;
        this.line.rotation.y += this.rotationSpeed.y * intensity * 5;
        this.line.rotation.z += this.rotationSpeed.z * intensity * 5;

        // Camera movement
        this.camera.position.x = Math.sin(time * 0.5) * 100;
        this.camera.position.y = Math.cos(time * 0.4) * 100;
        this.camera.lookAt(0, 0, 0);

        this.detectFrequencyHits(dataArray);
        this.updateExplosions();

        this.composer.render();
    }

    detectFrequencyHits(dataArray) {
        const bassValue = dataArray[0] / 255;
        const midValue = dataArray[32] / 255;
        const highValue = dataArray[64] / 255;

        if (bassValue > this.bassThreshold && bassValue > this.lastBassValue) {
            this.createExplosion(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'bass');
        }
        if (midValue > 0.7) {
            this.createExplosion(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'mid');
        }
        if (highValue > 0.6) {
            this.createExplosion(new THREE.Vector3(this.positions[0], this.positions[1], this.positions[2]), 'high');
        }
        this.lastBassValue = bassValue;
    }

    createExplosion(position, type) {
        let color;
        let particleCount;
        let speed;

        switch (type) {
            case 'bass':
                color = new THREE.Color(1, 0, 0);  // Red for bass
                particleCount = 7;
                speed = 15;
                break;
            case 'mid':
                color = new THREE.Color(0, 1, 0);  // Green for mid
                particleCount = 7;
                speed = 10;
                break;
            case 'high':
                color = new THREE.Color(0, 0, 1);  // Blue for high
                particleCount = 7;
                speed = 20;
                break;
        }

        for (let i = 0; i < particleCount; i++) {
            this.explosions.push({
                position: position.clone(),
                velocity: new THREE.Vector3(
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1,
                    Math.random() * 2 - 1
                ).normalize().multiplyScalar(Math.random() * speed + 5),
                color: color,
                age: 0,
                maxAge: 100 + Math.random() * 50
            });
        }
    }

    updateExplosions() {
        const positions = [];
        const colors = [];

        this.explosions = this.explosions.filter(explosion => {
            explosion.position.add(explosion.velocity);
            explosion.velocity.multiplyScalar(0.98);
            explosion.age++;

            if (explosion.age < explosion.maxAge) {
                positions.push(explosion.position.x, explosion.position.y, explosion.position.z);
                const intensity = 1 - explosion.age / explosion.maxAge;
                colors.push(
                    explosion.color.r * intensity,
                    explosion.color.g * intensity,
                    explosion.color.b * intensity
                );
                return true;
            }
            return false;
        });

        this.explosionParticles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.explosionParticles.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.explosionParticles.attributes.position.needsUpdate = true;
        this.explosionParticles.attributes.color.needsUpdate = true;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.line) {
            this.line.geometry.dispose();
            this.line.material.dispose();
            this.scene.remove(this.line);
        }
        this.explosionParticles.dispose();
        this.explosionMaterial.dispose();
        this.scene.remove(this.explosionSystem);
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}