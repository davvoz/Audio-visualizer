import * as THREE from 'three';

export class BarVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 100;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.bars = [];
    }

    init() {
        const barWidth = 2;
        const barGap = 0.5;
        for (let i = 0; i < 128; i++) {
            const geometry = new THREE.BoxGeometry(barWidth, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const bar = new THREE.Mesh(geometry, material);
            bar.position.x = (i - 128 / 2) * (barWidth + barGap);
            this.bars.push(bar);
            this.scene.add(bar);
        }
    }

    update(dataArray) {
        this.bars.forEach((bar, index) => {
            bar.scale.y = dataArray[index] / 255 * 50;
            bar.rotation.y += 0.01;
        });
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.bars.forEach(bar => {
            this.scene.remove(bar);
            bar.geometry.dispose();
            bar.material.dispose();
        });
        this.bars = [];
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
