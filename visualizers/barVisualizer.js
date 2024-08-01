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
        this.sphere = null;
        this.params = {
            resolution: 64,
            radius: 40,
            wireframe: true,
            emissiveIntensity: 0.5,
            bassIntensity: 1.5,
            trebleIntensity: 1.0,
            rotationSpeed: 0.001,
            colorScheme: 'rainbow',
        };

        this.gui = new dat.GUI();
        this.addGuiControls();
        this.init();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    addGuiControls() {
        this.gui.add(this.params, 'resolution', [32, 64, 128, 256]).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'radius', 10, 100).onChange(this.resetVisualization.bind(this));
        this.gui.add(this.params, 'wireframe').onChange(this.updateMaterial.bind(this));
        this.gui.add(this.params, 'emissiveIntensity', 0, 1).onChange(this.updateMaterial.bind(this));
        this.gui.add(this.params, 'bassIntensity', 0.5, 3);
        this.gui.add(this.params, 'trebleIntensity', 0.5, 3);
        this.gui.add(this.params, 'rotationSpeed', 0, 0.05);
        this.gui.add(this.params, 'colorScheme', ['rainbow', 'heatmap', 'electric', 'pastel']);
    }

    init() {
        this.scene.background = new THREE.Color(0x000000);
        this.resetVisualization();
        this.addLights();
    }

    resetVisualization() {
        if (this.sphere) {
            this.scene.remove(this.sphere);
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
        }

        const geometry = new THREE.SphereGeometry(this.params.radius, this.params.resolution, this.params.resolution);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            wireframe: this.params.wireframe,
            emissive: 0x444444,
            emissiveIntensity: this.params.emissiveIntensity,
        });
        this.sphere = new THREE.Mesh(geometry, material);
        
        const positionAttribute = this.sphere.geometry.getAttribute('position');
        const originalPositions = new Float32Array(positionAttribute.array.length);
        originalPositions.set(positionAttribute.array);
        this.sphere.geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));

        this.scene.add(this.sphere);
    }

    addLights() {
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

    updateMaterial() {
        if (this.sphere) {
            this.sphere.material.wireframe = this.params.wireframe;
            this.sphere.material.emissiveIntensity = this.params.emissiveIntensity;
        }
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

    update(dataArray) {
        const time = this.clock.getElapsedTime();
        const bassValue = dataArray.slice(0, 4).reduce((a, b) => a + b) / 4 / 255;
        const trebleValue = dataArray.slice(-4).reduce((a, b) => a + b) / 4 / 255;

        const positionAttribute = this.sphere.geometry.getAttribute('position');
        const originalPositions = this.sphere.geometry.getAttribute('originalPosition');
        
        if (originalPositions) {
            for (let i = 0; i < positionAttribute.count; i++) {
                const value = dataArray[i % this.params.resolution] / 255;
                const factor = 1 + value * 2 * (i < this.params.resolution / 2 ? this.params.bassIntensity : this.params.trebleIntensity);
                
                positionAttribute.setXYZ(
                    i,
                    originalPositions.getX(i) * factor,
                    originalPositions.getY(i) * factor,
                    originalPositions.getZ(i) * factor
                );
            }
            
            positionAttribute.needsUpdate = true;
            this.sphere.geometry.computeVertexNormals();
        }

        this.sphere.material.emissive.setHSL(this.getColor(bassValue), 1, trebleValue * 0.5);
        this.sphere.rotation.y += this.params.rotationSpeed;

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.sphere) {
            this.scene.remove(this.sphere);
            this.sphere.geometry.dispose();
            this.sphere.material.dispose();
        }
        this.gui.destroy();
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}