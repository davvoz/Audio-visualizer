import * as THREE from 'three';

export class HorrorCircusVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.objects = [];
        this.lights = [];

        this.init();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    init() {
        this.createCrazyLights();
        this.createDancingShapes();
        this.createPulsatingBackground();
    }

    createCrazyLights() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        for (let i = 0; i < 10; i++) {
            const light = new THREE.PointLight(colors[i % colors.length], 2, 50);
            light.position.set(
                Math.random() * 60 - 30,
                Math.random() * 60 - 30,
                Math.random() * 60 - 30
            );
            this.scene.add(light);
            this.lights.push(light);
        }
    }

    createDancingShapes() {
        const geometries = [
            new THREE.TorusKnotGeometry(2, 0.5, 100, 16),
            new THREE.OctahedronGeometry(2),
            new THREE.TetrahedronGeometry(2),
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.BoxGeometry(3, 3, 3)
        ];

        for (let i = 0; i < 50; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = new THREE.MeshPhongMaterial({
                color: Math.random() * 0xffffff,
                shininess: 100,
                specular: 0xffffff,
                flatShading: true,
            });
            const mesh = new THREE.Mesh(geometry, material);
            
            mesh.position.set(
                Math.random() * 80 - 40,
                Math.random() * 80 - 40,
                Math.random() * 80 - 40
            );
            
            mesh.scale.setScalar(Math.random() * 0.5 + 0.5);
            
            this.scene.add(mesh);
            this.objects.push({
                mesh,
                basePosition: mesh.position.clone(),
                rotationSpeed: new THREE.Vector3(
                    Math.random() * 0.1 - 0.05,
                    Math.random() * 0.1 - 0.05,
                    Math.random() * 0.1 - 0.05
                ),
                pulseSpeed: Math.random() * 0.1 + 0.05
            });
        }
    }

    createPulsatingBackground() {
        const geometry = new THREE.SphereGeometry(100, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.5
        });
        this.background = new THREE.Mesh(geometry, material);
        this.scene.add(this.background);
    }

    update(dataArray) {
        const time = this.clock.getElapsedTime();

        // Crazy camera movement
        this.camera.position.x = Math.sin(time * 0.5) * 30;
        this.camera.position.y = Math.cos(time * 0.3) * 30;
        this.camera.lookAt(0, 0, 0);

        // Animate lights
        this.lights.forEach((light, index) => {
            light.position.x = Math.sin(time * 2 + index) * 30;
            light.position.y = Math.cos(time * 3 + index) * 30;
            light.position.z = Math.sin(time * 4 + index) * 30;
            light.intensity = 2 + Math.sin(time * 10 + index) * 1.5;
        });

        // Animate dancing shapes
        this.objects.forEach((object, index) => {
            const { mesh, basePosition, rotationSpeed, pulseSpeed } = object;
            
            // Rotation
            mesh.rotation.x += rotationSpeed.x;
            mesh.rotation.y += rotationSpeed.y;
            mesh.rotation.z += rotationSpeed.z;
            
            // Pulsating scale
            const scale = 1 + Math.sin(time * pulseSpeed) * 0.5;
            mesh.scale.setScalar(scale);
            
            // Chaotic movement
            mesh.position.x = basePosition.x + Math.sin(time * 2 + index) * 10;
            mesh.position.y = basePosition.y + Math.cos(time * 3 + index) * 10;
            mesh.position.z = basePosition.z + Math.sin(time * 4 + index) * 10;
            
            // Random color changes
            if (Math.random() < 0.01) {
                mesh.material.color.setHex(Math.random() * 0xffffff);
            }
        });

        // Pulsating background
        this.background.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;

        // Use audio data to influence the visualization
        if (dataArray) {
            const averageAudio = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            const normalizedAudio = averageAudio / 255;
            
            // Make everything go crazy based on audio intensity
            this.objects.forEach(object => {
                object.mesh.scale.addScalar(normalizedAudio);
                object.rotationSpeed.multiplyScalar(1 + normalizedAudio);
            });
            
            this.lights.forEach(light => {
                light.intensity += normalizedAudio * 5;
            });
            
            this.background.material.opacity += normalizedAudio * 0.5;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.objects.forEach(obj => {
            this.scene.remove(obj.mesh);
            obj.mesh.material.dispose();
            obj.mesh.geometry.dispose();
        });

        this.lights.forEach(light => {
            this.scene.remove(light);
        });

        this.scene.remove(this.background);
        this.background.material.dispose();
        this.background.geometry.dispose();

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}