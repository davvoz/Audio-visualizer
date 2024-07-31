import * as THREE from 'three';

export class BarVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 100);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.visualElements = [];
        this.params = {
            visualizationType: 'bars',
            colorScheme: 'rainbow',
            rotationSpeed: 0.001,
            pulseFactor: 0.1,
            particleCount: 1000,
            particleSize: 0.5,
            particleSpeed: 0.01,
            geometryType: 'box',
            waveformResolution: 128,
            bassIntensity: 1.5,
            trebleIntensity: 1.0,
            cameraMovement: 'orbit',
            cameraSpeed: 0.5,
        };

        this.gui = new dat.GUI();
        this.addGuiControls();
        this.init();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    addGuiControls() {
        this.gui.add(this.params, 'visualizationType', ['bars', 'sphere', 'spiral', 'particles']).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'colorScheme', ['rainbow', 'heatmap', 'electric', 'pastel']).onChange(this.updateColors.bind(this));
        this.gui.add(this.params, 'rotationSpeed', 0, 0.05);
        this.gui.add(this.params, 'pulseFactor', 0, 1);
        this.gui.add(this.params, 'particleCount', 100, 10000).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'particleSize', 0.1, 2).onChange(this.updateParticleSize.bind(this));
        this.gui.add(this.params, 'particleSpeed', 0, 0.1);
        this.gui.add(this.params, 'geometryType', ['box', 'sphere', 'torus']).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'waveformResolution', [64, 128, 256]).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'bassIntensity', 0.5, 3);
        this.gui.add(this.params, 'trebleIntensity', 0.5, 3);
        this.gui.add(this.params, 'cameraMovement', ['orbit', 'wave', 'spiral', 'random']);
        this.gui.add(this.params, 'cameraSpeed', 0.1, 2);
    }

    init() {
        this.scene.background = new THREE.Color(0x000000);
        this.resetVisualization();
    }

    resetVisualization() {
        // Clear existing elements
        this.visualElements.forEach(element => {
            this.scene.remove(element);
            if (element.geometry) element.geometry.dispose();
            if (element.material) element.material.dispose();
        });
        this.visualElements = [];

        switch (this.params.visualizationType) {
            case 'bars':
                this.createBars();
                break;
            case 'sphere':
                this.createSphere();
                break;
            case 'spiral':
                this.createSpiral();
                break;
            case 'particles':
                this.createParticles();
                break;
        }
    }

    createBars() {
        const geometry = this.getGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        for (let i = 0; i < this.params.waveformResolution; i++) {
            const bar = new THREE.Mesh(geometry, material.clone());
            const theta = (i / this.params.waveformResolution) * Math.PI * 2;
            bar.position.x = Math.sin(theta) * 50;
            bar.position.z = Math.cos(theta) * 50;
            bar.rotation.y = theta;
            this.visualElements.push(bar);
            this.scene.add(bar);
        }

        // Add a point light in the center
        const light = new THREE.PointLight(0xffffff, 1, 100);
        this.scene.add(light);
    }

    createSphere() {
        const geometry = new THREE.SphereGeometry(40, this.params.waveformResolution, this.params.waveformResolution);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            wireframe: true,
            emissive: 0x444444,
        });
        const sphere = new THREE.Mesh(geometry, material);
        this.visualElements.push(sphere);
        this.scene.add(sphere);

        // Add point lights around the sphere
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(0xffffff, 0.5, 100);
            light.position.set(
                Math.sin(i * Math.PI * 2 / 3) * 60,
                0,
                Math.cos(i * Math.PI * 2 / 3) * 60
            );
            this.scene.add(light);
        }
    }

    createSpiral() {
        const geometry = this.getGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        for (let i = 0; i < this.params.waveformResolution; i++) {
            const element = new THREE.Mesh(geometry, material.clone());
            const theta = (i / this.params.waveformResolution) * Math.PI * 10;
            const radius = 2 + i * 0.3;
            element.position.x = Math.sin(theta) * radius;
            element.position.y = i - this.params.waveformResolution / 2;
            element.position.z = Math.cos(theta) * radius;
            element.rotation.y = theta;
            this.visualElements.push(element);
            this.scene.add(element);
        }

        // Add a directional light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        this.scene.add(light);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.params.particleCount * 3);
        const colors = new Float32Array(this.params.particleCount * 3);

        for (let i = 0; i < this.params.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: this.params.particleSize,
            vertexColors: true,
        });

        const particles = new THREE.Points(geometry, material);
        this.visualElements.push(particles);
        this.scene.add(particles);
    }

    getGeometry() {
        switch (this.params.geometryType) {
            case 'box':
                return new THREE.BoxGeometry(1, 1, 1);
            case 'sphere':
                return new THREE.SphereGeometry(0.5, 8, 8);
            case 'torus':
                return new THREE.TorusGeometry(0.3, 0.2, 8, 16);
        }
    }

    updateColors() {
        this.visualElements.forEach((element, index) => {
            if (element.material) {
                element.material.color.setHSL(
                    this.getColor(index / this.visualElements.length),
                    1,
                    0.5
                );
            }
        });
    }

    getColor(t) {
        switch (this.params.colorScheme) {
            case 'rainbow':
                return t;
            case 'heatmap':
                return 0.6 - t * 0.6;
            case 'electric':
                return 0.6 + t * 0.2;
            case 'pastel':
                return 0.75 + t * 0.1;
        }
    }

    updateParticleSize() {
        if (this.params.visualizationType === 'particles') {
            this.visualElements[0].material.size = this.params.particleSize;
        }
    }

    updateCamera(time, bassValue) {
        const speed = this.params.cameraSpeed;
        switch (this.params.cameraMovement) {
            case 'orbit':
                this.camera.position.x = Math.sin(time * speed) * 100;
                this.camera.position.z = Math.cos(time * speed) * 100;
                break;
            case 'wave':
                this.camera.position.y = Math.sin(time * speed) * 20;
                break;
            case 'spiral':
                this.camera.position.x = Math.sin(time * speed) * (50 + time);
                this.camera.position.z = Math.cos(time * speed) * (50 + time);
                this.camera.position.y = Math.sin(time * speed * 0.5) * 50;
                break;
            case 'random':
                if (Math.random() < 0.01) {
                    this.camera.position.x = (Math.random() - 0.5) * 200;
                    this.camera.position.y = (Math.random() - 0.5) * 200;
                    this.camera.position.z = (Math.random() - 0.5) * 200;
                }
                break;
        }
        this.camera.lookAt(0, 0, 0);
        this.camera.position.multiplyScalar(1 + bassValue * 0.2);
    }

    update(dataArray) {
        const time = this.clock.getElapsedTime();
        const bassValue = dataArray.slice(0, 4).reduce((a, b) => a + b) / 4 / 255;
        const trebleValue = dataArray.slice(-4).reduce((a, b) => a + b) / 4 / 255;

        this.updateCamera(time, bassValue);

        switch (this.params.visualizationType) {
            case 'bars':
            case 'spiral':
                this.visualElements.forEach((element, index) => {
                    const value = dataArray[index] / 255;
                    element.scale.y = 1 + value * 10 * (index < 64 ? this.params.bassIntensity : this.params.trebleIntensity);
                    element.material.emissive.setHSL(this.getColor(index / this.visualElements.length), 1, value * 0.5);
                });
                break;
            case 'sphere':
                const sphere = this.visualElements[0];
                sphere.geometry.vertices.forEach((vertex, index) => {
                    const value = dataArray[index % this.params.waveformResolution] / 255;
                    const factor = 1 + value * 2 * (index < this.params.waveformResolution / 2 ? this.params.bassIntensity : this.params.trebleIntensity);
                    vertex.normalize().multiplyScalar(40 * factor);
                });
                sphere.geometry.verticesNeedUpdate = true;
                sphere.geometry.normalsNeedUpdate = true;
                sphere.geometry.computeVertexNormals();
                sphere.material.emissive.setHSL(this.getColor(bassValue), 1, trebleValue * 0.5);
                break;
            case 'particles':
                const particles = this.visualElements[0];
                const positions = particles.geometry.attributes.position.array;
                for (let i = 0; i < this.params.particleCount; i++) {
                    const ix = i * 3;
                    const value = dataArray[i % this.params.waveformResolution] / 255;
                    positions[ix] += Math.sin(time + i) * this.params.particleSpeed * value;
                    positions[ix + 1] += Math.cos(time + i * 1.1) * this.params.particleSpeed * value;
                    positions[ix + 2] += Math.sin(time + i * 1.2) * this.params.particleSpeed * value;

                    if (Math.abs(positions[ix]) > 50) positions[ix] *= -0.9;
                    if (Math.abs(positions[ix + 1]) > 50) positions[ix + 1] *= -0.9;
                    if (Math.abs(positions[ix + 2]) > 50) positions[ix + 2] *= -0.9;
                }
                particles.geometry.attributes.position.needsUpdate = true;
                break;
        }

        this.scene.rotation.y += this.params.rotationSpeed;
        this.scene.scale.x = this.scene.scale.y = this.scene.scale.z = 1 + Math.sin(time * 2) * this.params.pulseFactor * bassValue;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.visualElements.forEach(element => {
            this.scene.remove(element);
            if (element.geometry) element.geometry.dispose();
            if (element.material) element.material.dispose();
        });
        this.gui.destroy();
        this.renderer.dispose();
        this. analyserNode.disconnect();
    }
}