import * as THREE from 'three';

export class CircleVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 100;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.circles = [];
    }

    init() {
        const circleRadius = 1;
        for (let i = 0; i < 128; i++) {
            const geometry = new THREE.CircleGeometry(circleRadius, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
            const circle = new THREE.Mesh(geometry, material);
            circle.position.x = (i - 128 / 2) * (circleRadius * 2);
            this.circles.push(circle);
            this.scene.add(circle);
        }
    }

    update(dataArray) {
        this.circles.forEach((circle, index) => {
            circle.scale.y = dataArray[index] / 255 * 50;
            circle.rotation.y += 0.01;
        });
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.circles.forEach(circle => {
            this.scene.remove(circle);
            circle.geometry.dispose();
            circle.material.dispose();
        });
        this.circles = [];
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
