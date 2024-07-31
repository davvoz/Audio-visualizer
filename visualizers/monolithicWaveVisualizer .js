import * as THREE from 'three';

export class MonolithicWaveVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 100, 200);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.ringMeshes = [];
        this.particleSystems = [];
        this.particlesCountPerRing = 100;

        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        this.init();
    }

    init() {
        // Add ground plane
        const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -50;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Create rings and particle systems
        const ringCount = 10;
        const ringRadius = 50;
        const ringHeight = 10;

        for (let i = 0; i < ringCount; i++) {
            const ringGeometry = new THREE.RingGeometry(ringRadius, ringRadius + 5, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color(`hsl(${(i * 360) / ringCount}, 100%, 50%)`),
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = i * ringHeight - (ringCount / 2) * ringHeight;
            ring.rotation.x = Math.PI / 2;
            this.scene.add(ring);
            this.ringMeshes.push(ring);

            // Create particle system for this ring
            this.createParticleSystem(i);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
    }

    createParticleSystem(ringIndex) {
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(this.particlesCountPerRing * 3);
        const velocityArray = new Float32Array(this.particlesCountPerRing * 3);
        const colorArray = new Float32Array(this.particlesCountPerRing * 3);

        const ring = this.ringMeshes[ringIndex];
        const ringRadius = 50;
        const color = new THREE.Color(`hsl(${(ringIndex * 360) / 10}, 100%, 50%)`);

        for (let i = 0; i < this.particlesCountPerRing; i++) {
            // Position particles on the ring's circumference
            const angle = (i / this.particlesCountPerRing) * Math.PI * 2;
            const x = ringRadius * Math.cos(angle);
            const z = ringRadius * Math.sin(angle);
            const y = ring.position.y;

            posArray[i * 3] = x;
            posArray[i * 3 + 1] = y;
            posArray[i * 3 + 2] = z;

            // Randomized initial velocity
            velocityArray[i * 3] = (Math.random() - 0.5) * 0.5;
            velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            // Set particle color based on the ring
            color.toArray(colorArray, i * 3);
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        this.particleSystems.push(particleSystem);
        this.scene.add(particleSystem);
    }

    
update(dataArray) {
    const time = this.clock.getElapsedTime();
    const explosionDuration = 5; // Duration for explosion phase in seconds

    // Update rings and particles
    this.ringMeshes.forEach((ring, index) => {
        const audioIndex = index % dataArray.length;
        const audioValue = dataArray[audioIndex] / 255;

        // Scale and rotate rings
        ring.scale.setScalar(1 + audioValue);
        ring.rotation.z += Math.sin(time * 0.5 + index) * 0.01;

        // Determine the phase (explosion or suction) based on time
        const phase = Math.floor(time / explosionDuration) % 2 === 0 ? 'explosion' : 'suction';

        // Update corresponding particle system
        this.updateParticles(this.particleSystems[index], audioValue, time, phase);
    });

    this.renderer.render(this.scene, this.camera);
}

updateParticles(particleSystem, audioValue, time, phase) {
    const positions = particleSystem.geometry.attributes.position.array;
    const velocities = particleSystem.geometry.attributes.velocity.array;
    const colors = particleSystem.geometry.attributes.color.array;
    const ringRadius = 50;

    for (let i = 0; i < positions.length; i += 3) {
        // Explosion phase: Particles move outward
        if (phase === 'explosion') {
            positions[i] += velocities[i] * (1 + audioValue * 5);
            positions[i + 1] += velocities[i + 1] * (1 + audioValue * 5);
            positions[i + 2] += velocities[i + 2] * (1 + audioValue * 5);
        } 
        // Suction phase: Particles move back to the center of the ring
        else if (phase === 'suction') {
            const distanceToCenter = Math.sqrt(
                positions[i] ** 2 + 
                positions[i + 1] ** 2 + 
                positions[i + 2] ** 2
            );

            const directionToCenter = [
                -positions[i] / distanceToCenter,
                -positions[i + 1] / distanceToCenter,
                -positions[i + 2] / distanceToCenter
            ];

            positions[i] += directionToCenter[0] * Math.abs(velocities[i]) * 5;
            positions[i + 1] += directionToCenter[1] * Math.abs(velocities[i + 1]) * 5;
            positions[i + 2] += directionToCenter[2] * Math.abs(velocities[i + 2]) * 5;
        }

        // Reset particles when they get too close to the center during suction
        if (phase === 'suction' && Math.abs(positions[i]) < 1 && Math.abs(positions[i + 1]) < 1 && Math.abs(positions[i + 2]) < 1) {
            // Reset to original position on the ring
            const angle = (i / positions.length) * Math.PI * 2;
            positions[i] = ringRadius * Math.cos(angle);
            positions[i + 1] = 0; // Center y-position
            positions[i + 2] = ringRadius * Math.sin(angle);

            // Reset velocity for next explosion
            velocities[i] = (Math.random() - 0.5) * 0.5;
            velocities[i + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i + 2] = (Math.random() - 0.5) * 0.5;
        }

        // Update particle colors (optional)
        if (phase === 'explosion') {
            colors[i] = 0.5 + 0.5 * Math.sin(time + audioValue);
            colors[i + 1] = 0.5 + 0.5 * Math.sin(time + audioValue * 2);
            colors[i + 2] = 0.5 + 0.5 * Math.sin(time + audioValue * 3);
        } else if (phase === 'suction') {
            colors[i] = 0.3 + 0.3 * Math.sin(time + audioValue);
            colors[i + 1] = 0.3 + 0.3 * Math.sin(time + audioValue * 2);
            colors[i + 2] = 0.3 + 0.3 * Math.sin(time + audioValue * 3);
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;
}

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.ringMeshes.forEach(mesh => mesh.geometry.dispose());
        this.particleSystems.forEach(system => system.geometry.dispose());
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
