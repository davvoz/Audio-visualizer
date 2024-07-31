import * as THREE from 'three';

export class Wave3DVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.geometry = null;
        this.material = null;
        this.mesh = null;

        this.waveWidth = 128;
        this.waveHeight = 128;

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    init() {
        this.geometry = new THREE.PlaneGeometry(100, 100, this.waveWidth - 1, this.waveHeight - 1);
        this.material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            wireframe: true
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.mesh);

        const light = new THREE.PointLight(0xffffff, 1, 500);
        light.position.set(0, 50, 50);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        const vertices = this.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = i / 3 % this.waveWidth;
            const y = Math.floor(i / 3 / this.waveWidth);

            const index = (x + y * this.waveWidth) % dataArray.length;
            vertices[i + 2] = dataArray[index] / 10;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.mesh.rotation.z += 0.005;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material) this.material.dispose();
        if (this.mesh) this.scene.remove(this.mesh);
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}