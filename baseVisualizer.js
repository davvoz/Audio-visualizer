import * as THREE from 'three';

export class BaseVisualizer {
    constructor(container, params = {}) {
        this.container = container;
        this.params = params;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.time = 0;
    }

    init() {
        // Initialization code using this.params
    }

    update(dataArray) {
        // Update code using dataArray
    }

    dispose() {
        // Ensure the element is still in the container before attempting to remove it
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
    }

    static getControls() {
        return {}; // Override in subclasses to return specific controls
    }

    setParams(params) {
        this.params = { ...this.params, ...params };
        this.init(); // Re-initialize with new parameters
    }
}
