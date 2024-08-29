import * as THREE from 'three';

export class ImmaginePulsanteVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 50;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.particleSystem = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.time = 0;
        this.audioData = new Float32Array(128);

        this.container.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    init() {
        const particlesCount = 5000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        const sizes = new Float32Array(particlesCount);

        for (let i = 0; i < particlesCount * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;

            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = Math.sin(angle) * radius;
            positions[i + 2] = (Math.random() - 0.5) * 10;

            const color = new THREE.Color();
            color.setHSL(Math.random(), 1.0, 0.5 + Math.random() * 0.5);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;

            sizes[i / 3] = Math.random() * 2 + 1;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });

        this.particleSystem = new THREE.Points(particles, material);
        this.scene.add(this.particleSystem);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(dataArray) {
        this.time += 0.01;
        this.audioData.set(dataArray);

        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        const colors = this.particleSystem.geometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
            const angle = Math.atan2(positions[i + 1], positions[i]);
            const radius = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2);
            const newRadius = radius + Math.sin(this.time + angle * 5) * 0.5;

            positions[i] = Math.cos(angle) * newRadius;
            positions[i + 1] = Math.sin(angle) * newRadius;
            positions[i + 2] += Math.sin(this.time * 2 + radius * 0.1) * 0.05;

            const audioIndex = Math.floor(i / positions.length * this.audioData.length);
            sizes[i / 3] = Math.max(1, this.audioData[audioIndex] * 5 + Math.sin(this.time + radius * 0.2) * 0.5);

            const color = new THREE.Color();
            color.setHSL((this.time * 0.05 + radius * 0.02) % 1, 1.0, 0.5 + this.audioData[audioIndex] * 0.5);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.particleSystem);

        if (intersects.length > 0) {
            const index = intersects[0].index;
            sizes[index] = 10 + Math.sin(this.time * 10) * 5;
            const color = new THREE.Color();
            color.setRGB(1, 1, 1);
            colors[index * 3] = color.r;
            colors[index * 3 + 1] = color.g;
            colors[index * 3 + 2] = color.b;
        }

        this.camera.position.x = Math.sin(this.time * 0.2) * 5;
        this.camera.position.y = Math.cos(this.time * 0.2) * 5;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.particleSystem.geometry.dispose();
        this.particleSystem.material.dispose();
        this.scene.remove(this.particleSystem);
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}