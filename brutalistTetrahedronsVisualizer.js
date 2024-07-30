import * as THREE from 'three';

export class BrutalistTetrahedronsVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.tetrahedrons = [];
        this.time = 0;
    }

    init() {
        const numTetrahedrons = 100;

        for (let i = 0; i < numTetrahedrons; i++) {
            const geometry = new THREE.TetrahedronGeometry(1, 0);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
                metalness: 0.8,
                roughness: 0.6
            });
            const tetrahedron = new THREE.Mesh(geometry, material);
            tetrahedron.position.set(
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50
            );
            tetrahedron.rotation.set(
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI,
                Math.random() * 2 * Math.PI
            );
            this.tetrahedrons.push(tetrahedron);
            this.scene.add(tetrahedron);
        }

        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x303030);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        this.time += 0.02;

        this.tetrahedrons.forEach((tetrahedron, index) => {
            const dataIndex = Math.floor(index / this.tetrahedrons.length * dataArray.length);
            const scale = 1 + dataArray[dataIndex] / 255 * 4; // Increased scale sensitivity
            tetrahedron.scale.set(scale, scale, scale);

            tetrahedron.rotation.x += 0.1; // Increased rotation speed
            tetrahedron.rotation.y += 0.1;
            tetrahedron.position.z += Math.sin(this.time * 2 + index * 0.1) * 0.05; // Enhanced z movement

            const hue = (this.time * 0.1 + index / this.tetrahedrons.length) % 1; // Faster color cycling
            tetrahedron.material.color.setHSL(hue, 0.8, 0.5);
        });

        // Enhanced camera movement
        this.camera.position.x = Math.sin(this.time * 0.5) * 25;
        this.camera.position.y = Math.cos(this.time * 0.5) * 25;
        this.camera.position.z = 20 + Math.sin(this.time * 0.2) * 10; // Dynamic z-position
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.tetrahedrons.forEach(tetrahedron => {
            this.scene.remove(tetrahedron);
            tetrahedron.geometry.dispose();
            tetrahedron.material.dispose();
        });
        this.tetrahedrons = [];
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}