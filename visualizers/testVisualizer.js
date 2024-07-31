import * as THREE from 'three';
import { BaseVisualizer } from './baseVisualizer.js';

export class TestVisualizer extends BaseVisualizer {
    static getControls() {
        return {
            x: { min: -50, max: 50, default: 0 },
            y: { min: -50, max: 50, default: 0 },
            fontSize: { min: 10, max: 50, default: 24 }
        };
    }

    constructor(container, params) {
        super(container, params);
        console.log('TestVisualizer constructor called', { container, params });
        this.container = container;
        this.params = params;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Set black background

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.z = 100;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Add a simple cube for testing
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        this.textMesh = null;

        // Initial render
        this.renderer.render(this.scene, this.camera);

        console.log('Scene initialized');
    }

    init() {
        console.log('TestVisualizer init called');
        this.createText("Hello World!");
        this.renderer.render(this.scene, this.camera);
    }

    createText(text) {
        console.log('TestVisualizer createText called', { text });
        if (this.textMesh) {
            this.scene.remove(this.textMesh);
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        context.font = `${this.params.fontSize}px Arial`;
        context.fillStyle = 'white';
        context.fillText(text, 0, 128);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const geometry = new THREE.PlaneGeometry(50, 25);
        this.textMesh = new THREE.Mesh(geometry, material);
        this.textMesh.position.set(this.params.x, this.params.y, 0);
        this.scene.add(this.textMesh);
        
        console.log('Text mesh created and added to scene');
        this.renderer.render(this.scene, this.camera);
    }

    update(dataArray) {
        console.log('TestVisualizer update called', { dataArray });
        const text = dataArray.join(' ');
        this.createText(text);
        
        // Rotate the cube for visual feedback
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    setParams(newParams) {
        console.log('TestVisualizer setParams called', { newParams });
        Object.assign(this.params, newParams);
        if (this.textMesh) {
            this.textMesh.position.set(this.params.x, this.params.y, 0);
            this.createText(this.textMesh.material.map.image.getContext('2d').canvas.toDataURL());
        }
    }

    dispose() {
        console.log('TestVisualizer dispose called');
        if (this.textMesh) {
            this.scene.remove(this.textMesh);
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
        }
        if (this.cube) {
            this.scene.remove(this.cube);
            this.cube.geometry.dispose();
            this.cube.material.dispose();
        }
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}