import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';



export class Wave3DVisualizer2 {
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

        this.frequencyBins = 128;
        this.timeSteps = 128;

        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        this.composer.addPass(this.bloomPass);

        //creiamo dei controlli per la scena con dat.gui
        this.rotationSpeedy = 0.001;
        this.rotationSpeedx = 0.001;
        this.rotationSpeedz = 0.001;
        //TODO: aggiungere i controlli per la velocità di rotazione

        this.controls = {
            rotationSpeedY: 0.001,
            rotationSpeedX: 0.01,
            rotationSpeedZ: 0.001,
            zoom: 0.01,
            moveX: 0.01,
            moveY: 0.01,
        };

        // Initialize dat.GUI
        this.gui = new dat.GUI();
        this.addGuiControls();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }
    addGuiControls() {
        const rotationFolder = this.gui.addFolder('Rotation Speed');
        rotationFolder.add(this.controls, 'rotationSpeedX', -0.01, 0.01).name('X Axis');
        rotationFolder.add(this.controls, 'rotationSpeedY', -0.01, 0.01).name('Y Axis');
        rotationFolder.add(this.controls, 'rotationSpeedZ', -0.01, 0.01).name('Z Axis');
        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.add(this.controls, 'zoom', -0.1, 0.1).name('Zoom');
        cameraFolder.add(this.controls, 'moveX', -0.1, 0.1).name('Move X');
        cameraFolder.add(this.controls, 'moveY', -0.1, 0.1).name('Move Y');
        rotationFolder.open();
    }
    init() {
        this.geometry = new THREE.PlaneGeometry(100, 100, this.frequencyBins - 1, this.timeSteps - 1);
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 pos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
            fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(sin(vUv.x * 10.0 + time) * 0.5 + 0.5, sin(vUv.y * 10.0 + time) * 0.5 + 0.5, 1.0, 1.0);
          }
        `,
            wireframe: false,
            flatShading: true
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        const light = new THREE.PointLight(0xffffff, 1, 500);
        light.position.set(0, 50, 50);
        this.scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
    }

    update(dataArray) {
        const vertices = this.geometry.attributes.position.array;

        // Shift all existing data one step back
        for (let i = 0; i < this.frequencyBins; i++) {
            for (let j = this.timeSteps - 1; j > 0; j--) {
                const currentIndex = (i + j * this.frequencyBins) * 3;
                const previousIndex = (i + (j - 1) * this.frequencyBins) * 3;
                vertices[currentIndex + 2] = vertices[previousIndex + 2];
            }
        }

        // Add new data at the front
        for (let i = 0; i < this.frequencyBins; i++) {
            const index = i * 3;
            const frequency = (i / this.frequencyBins) * 100 - 50;
            const intensity = dataArray[i] / 255 * 20;  // Scale intensity to a reasonable height

            vertices[index] = frequency;
            vertices[index + 1] = 0;  // Set Y to 0 as we're using Z for height now
            vertices[index + 2] = intensity;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();

        this.material.uniforms.time.value += 0.016;
        this.mesh.rotation.y += this.controls.rotationSpeedY;
        this.mesh.rotation.x += this.controls.rotationSpeedX;
        this.mesh.rotation.z += this.controls.rotationSpeedZ;

        this.camera.position.z += this.controls.zoom;
        this.camera.position.x += this.controls.moveX;
        this.camera.position.y += this.controls.moveY;


        this.composer.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material) this.material.dispose();
        if (this.mesh) this.scene.remove(this.mesh);
        //distruggi la gui
        this.gui.destroy();
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}