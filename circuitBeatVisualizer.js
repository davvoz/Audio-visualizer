import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';


export class CircuitBeatVisualizer  {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 20, 40);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000); // Set background color
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        this.time = 0;
        this.particles = [];
        this.geometryObjects = [];
        this.cameraOrbitRadius = 60; // Radius of camera orbit
        this.cameraOrbitSpeed = 0.1; // Speed of camera rotation
        this.cameraHeight = 30; // Height of the camera
        this.init();
    }

    init() {
        this.addLights();
        this.createParticles();
        this.createGeometry();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        this.spotLight = new THREE.SpotLight(0xffffff, 2);
        this.spotLight.position.set(100, 100, 100);
        this.spotLight.angle = Math.PI / 6;
        this.spotLight.penumbra = 0.5;
        this.spotLight.castShadow = true;
        this.scene.add(this.spotLight);

        const pointLight = new THREE.PointLight(0x00ff00, 2, 100);
        pointLight.position.set(0, 0, 0);
        this.scene.add(pointLight);
    }

    createParticles() {
        const particleCount = 100;
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 1.5,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particleSystem);
    }

    createGeometry() {
        const geometryCount = 5; // Number of geometries to create
        const radius = 30; // Radius of the circular arrangement

        for (let i = 0; i < geometryCount; i++) {
            const geometry = new THREE.TorusKnotGeometry(5, 1, 64, 8);
            const material = new THREE.MeshPhysicalMaterial({
                color: 0xffffff,
                metalness: 0.5,
                roughness: 0.9,
                reflectivity: 0.1,
                clearcoat: 1,
                clearcoatRoughness: 0.9
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Calculate position on a circle
            const angle = (i / geometryCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            mesh.position.set(x, 0, z);
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            this.scene.add(mesh);
            this.geometryObjects.push(mesh);
        }
    }


    update(dataArray) {
        this.time += 0.016;
    
        // Easing function for smooth camera orbit
        const easeOutSine = (t) => Math.sin((t * Math.PI) / 2);
        const easedTime = easeOutSine(this.time * this.cameraOrbitSpeed);
    
        // Calculate the target position for the camera
        const targetX = Math.cos(easedTime) * this.cameraOrbitRadius;
        const targetZ = Math.sin(easedTime) * this.cameraOrbitRadius;
    
        // Damping factor for smooth camera movement
        const dampingFactor = 0.1;
    
        // Lerp the camera's current position towards the target position
        this.camera.position.x += (targetX - this.camera.position.x) * dampingFactor;
        this.camera.position.z += (targetZ - this.camera.position.z) * dampingFactor;
    
        // Optionally, adjust the camera's height based on some condition or data
        this.camera.position.y = this.cameraHeight + Math.sin(this.time * 0.5) * 5;
    
        // Make the camera look at the center of the scene
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    
        // Rotate and scale geometries based on the music data
        this.geometryObjects.forEach((obj, index) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
    
            const dataIndex = Math.floor(index / this.geometryObjects.length * dataArray.length);
            const amplitude = dataArray[dataIndex] / 255;
    
            obj.scale.setScalar(1 + amplitude * 2);
            obj.material.color.setHSL(dataArray[dataIndex] / 255, 1, 0.5);
        });
    
        // Update particle system
        const positions = this.particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(this.time * 2 + positions[i] * 0.02) * 0.5;
            if (positions[i + 1] > 100) positions[i + 1] = -100;
            const dataIndex = Math.floor(i / 3 / 100 * dataArray.length);
            const amplitude = dataArray[dataIndex] / 255;
            this.particleSystem.geometry.attributes.position.array[i + 2] = amplitude * 200;
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    
        // Update spotlight position to follow the camera
        this.spotLight.position.copy(this.camera.position);
    
        // Adjust bloom strength dynamically
        this.bloomPass.strength = 1.5 + Math.sin(this.time) * 0.5;
    
        // Render the scene with post-processing effects
        this.composer.render();
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.geometryObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        this.scene.remove(this.particleSystem);
        this.particleSystem.geometry.dispose();
        this.particleSystem.material.dispose();

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}