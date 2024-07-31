import * as THREE from 'three';

export class PsychedelicLineVisualizer {
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
        this.waveMeshes = [];
        this.particleSystem = null;

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

        // Create a central monolithic structure with multiple rings
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
            this.waveMeshes.push(ring);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Add particles around the structure
        this.createParticleSystem();
    }

    createParticleSystem() {
        const particlesCount = 100;
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(particlesCount * 3);
        const velocityArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount; i++) {
            posArray[i * 3] = (Math.random() - 0.5) * 400;
            posArray[i * 3 + 1] = Math.random() * 200 - 100;
            posArray[i * 3 + 2] = (Math.random() - 0.5) * 400;

            velocityArray[i * 3] = (Math.random() - 0.5) * 0.5;
            velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 1,
            color: 0xffffff,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particleSystem);
    }

    update(dataArray) {
        
        const time = this.clock.getElapsedTime();
        const particleSystem = this.particleSystem.geometry.attributes.position.array;
        const particleVelocity = this.particleSystem.geometry.attributes.velocity.array;
        const particlesMaterial = this.particleSystem.material;

        const audio = dataArray[0] / 255;
        particlesMaterial.color.setHSL(audio, 1, 0.5);
        particlesMaterial.size = audio * 10;

        for (let i = 0; i < particleSystem.length; i += 3) {
            particleSystem[i] += particleVelocity[i];
            particleSystem[i + 1] += particleVelocity[i + 1];
            particleSystem[i + 2] += particleVelocity[i + 2];

            if (particleSystem[i + 1] < -100) {
                particleSystem[i + 1] = 100;
            }
        }

        this.particleSystem.geometry.attributes.position.needsUpdate = true;

        // Update rings
        this.waveMeshes.forEach((ring, index) => {
            const audioIndex = index % dataArray.length;
            const audioValue = dataArray[audioIndex] / 255;
            ring.scale.setScalar(1 + audioValue);
            ring.rotation.z += Math.sin(time * 0.5 + index) * 0.01;
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.waveMeshes.forEach(mesh => mesh.geometry.dispose());
        this.particleSystem.geometry.dispose();
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}