import * as THREE from 'three';

export class PsychedelicCubesVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 10;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        
        this.cubes = [];
        this.time = 0;
    }

    init() {
        const numCubes = 200;

        for (let i = 0; i < numCubes; i++) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
                shininess: 100
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            cube.rotation.set(
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI
            );
            this.cubes.push(cube);
            this.scene.add(cube);
        }

        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(0, 0, 10);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        this.time += 0.01;

        this.cubes.forEach((cube, index) => {
            const dataIndex = Math.floor(index / this.cubes.length * dataArray.length);
            const scale = 1 + dataArray[dataIndex] / 255 * 2;
            cube.scale.set(scale, scale, scale);

            cube.rotation.x += 0.02;
            cube.rotation.y += 0.03;
            cube.position.z += Math.sin(this.time + index) * 0.01;

            const hue = (this.time + index / this.cubes.length) % 1;
            cube.material.color.setHSL(hue, 1, 0.5);
        });

        this.camera.position.x = Math.sin(this.time * 0.5) * 5;
        this.camera.position.y = Math.cos(this.time * 0.5) * 5;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.cubes.forEach(cube => {
            this.scene.remove(cube);
            cube.geometry.dispose();
            cube.material.dispose();
        });
        this.cubes = [];
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
