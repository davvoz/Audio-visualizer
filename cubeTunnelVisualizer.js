import * as THREE from 'three';

export class CubeTunnelVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.time = 0;
        this.tunnelLength = 500;
        this.cubeSize = 1;
        this.cubes = [];
        this.audioData = new Float32Array(128);

        this.init();
    }

    init() {
        this.createCubes();
        this.addLights();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    createCubes() {
        const cubeGeometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.5 });

        for (let i = 0; i < 100; i++) {
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                -i * (this.tunnelLength / 100)
            );
            this.cubes.push(cube);
            this.scene.add(cube);
        }
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(0, 0, 10);
        this.scene.add(pointLight);
    }

    update(dataArray) {
        this.time += 0.01;
        this.audioData = dataArray;

        this.updateCubes();

        this.renderer.render(this.scene, this.camera);
    }

    updateCubes() {
        this.cubes.forEach((cube, index) => {
            const dataIndex = Math.floor(index / this.cubes.length * this.audioData.length);
            const scale = 1 + this.audioData[dataIndex] / 255 * 2;

            cube.scale.set(scale, scale, scale);
            cube.rotation.x += 0.02 * (this.audioData[dataIndex] / 255);
            cube.rotation.y += 0.02 * (this.audioData[dataIndex] / 255);

            const hue = (this.time * 0.1 + this.audioData[dataIndex] / 255) % 1;
            cube.material.color.setHSL(hue, 1, 0.5);

            cube.position.z += 0.5;
            if (cube.position.z > this.camera.position.z) {
                cube.position.z -= this.tunnelLength;
                cube.position.x = (Math.random() - 0.5) * 10;
                cube.position.y = (Math.random() - 0.5) * 10;
            }
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        window.removeEventListener('resize', this.onWindowResize.bind(this), false);
        
        this.cubes.forEach(cube => {
            this.scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
