import * as THREE from 'three';

export class RadialWavesVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.time = 0;
        this.circles = [];
        this.circleCount = 50;
        this.maxRadius = 4;
    }

    init() {
        this.createCircles();
        this.addLights();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    createCircles() {
        for (let i = 0; i < this.circleCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color().setHSL(i / this.circleCount, 1, 0.5),
                linewidth: 2
            });

            const points = [];
            const segments = 64;
            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2;
                const x = Math.cos(theta);
                const y = Math.sin(theta);
                points.push(new THREE.Vector3(x, y, 0));
            }

            geometry.setFromPoints(points);
            const circle = new THREE.Line(geometry, material);
            circle.scale.setScalar((i + 1) / this.circleCount * this.maxRadius);
            this.circles.push(circle);
            this.scene.add(circle);
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
        this.circles.forEach((circle, index) => {
            const dataIndex = Math.floor(index / this.circleCount * dataArray.length);
            const scale = ((index + 1) / this.circleCount * this.maxRadius) * (1 + dataArray[dataIndex] / 255 * 0.5);

            circle.scale.setScalar(scale);
            circle.rotation.z = this.time * (index + 1) * 0.1;

            const hue = (this.time * 0.1 + dataArray[dataIndex] / 255) % 1;
            circle.material.color.setHSL(hue, 1, 0.5);
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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