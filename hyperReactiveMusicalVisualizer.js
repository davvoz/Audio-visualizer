import * as THREE from 'three';

export class HyperReactiveMusicalVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 50);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.objects = [];
        this.lights = [];
        this.audioData = new Array(128).fill(0);

        this.init();
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    init() {
        this.createAudioReactiveLights();
        this.createFrequencyBars();
        this.createPulsatingBackground();
        this.createAudioWaveform();
    }

    createAudioReactiveLights() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(colors[i], 2, 100);
            light.position.set(
                Math.cos(i / 6 * Math.PI * 2) * 30,
                Math.sin(i / 6 * Math.PI * 2) * 30,
                0
            );
            this.scene.add(light);
            this.lights.push(light);
        }
    }

    createFrequencyBars() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });

        for (let i = 0; i < 64; i++) {
            const bar = new THREE.Mesh(geometry, material.clone());
            bar.position.set(i - 32, 0, 0);
            this.scene.add(bar);
            this.objects.push(bar);
        }
    }

    createPulsatingBackground() {
        const geometry = new THREE.SphereGeometry(100, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.5
        });
        this.background = new THREE.Mesh(geometry, material);
        this.scene.add(this.background);
    }

    createAudioWaveform() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(256 * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.waveform = new THREE.Line(geometry, material);
        this.scene.add(this.waveform);
    }

    update(dataArray) {
        const time = this.clock.getElapsedTime();

        if (dataArray) {
            this.audioData = dataArray;
        }

        // Hyper-reactive camera movement
        const bassLevel = this.getFrequencyRangeValue(this.audioData, 0, 10) / 255;
        this.camera.position.x = Math.sin(time * 2) * 30 * (1 + bassLevel);
        this.camera.position.y = Math.cos(time * 1.5) * 30 * (1 + bassLevel);
        this.camera.lookAt(0, 0, 0);

        // Animate audio-reactive lights
        this.lights.forEach((light, index) => {
            const freqLevel = this.getFrequencyRangeValue(this.audioData, index * 20, (index + 1) * 20) / 255;
            light.intensity = 2 + freqLevel * 8;
            light.distance = 50 + freqLevel * 100;
            light.position.x = Math.cos(time * 2 + index) * 30 * (1 + freqLevel);
            light.position.y = Math.sin(time * 2 + index) * 30 * (1 + freqLevel);
        });

        // Animate frequency bars
        this.objects.forEach((bar, index) => {
            const freqLevel = this.audioData[index] / 255;
            bar.scale.y = 1 + freqLevel * 20;
            bar.position.y = bar.scale.y / 2;
            bar.material.color.setHSL(freqLevel, 1, 0.5);
        });

        // Pulsating background
        const averageLevel = this.getAverageAudioLevel(this.audioData);
        this.background.material.opacity = 0.3 + averageLevel * 0.5;
        this.background.material.color.setHSL(time % 1, 1, averageLevel * 0.5);

        // Update audio waveform
        const positions = this.waveform.geometry.attributes.position.array;
        for (let i = 0; i < 128; i++) {
            positions[i * 6] = i - 64;
            positions[i * 6 + 1] = this.audioData[i] / 10 - 10;
            positions[i * 6 + 2] = -10;

            positions[i * 6 + 3] = i - 64;
            positions[i * 6 + 4] = this.audioData[i] / 10 - 10;
            positions[i * 6 + 5] = 10;
        }
        this.waveform.geometry.attributes.position.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }

    getFrequencyRangeValue(dataArray, start, end) {
        const slice = dataArray.slice(start, end);
        return slice.reduce((total, num) => total + num, 0) / slice.length;
    }

    getAverageAudioLevel(dataArray) {
        return dataArray.reduce((total, num) => total + num, 0) / dataArray.length / 255;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.objects.forEach(obj => {
            this.scene.remove(obj);
            obj.material.dispose();
            obj.geometry.dispose();
        });

        this.lights.forEach(light => {
            this.scene.remove(light);
        });

        this.scene.remove(this.background);
        this.background.material.dispose();
        this.background.geometry.dispose();

        this.scene.remove(this.waveform);
        this.waveform.material.dispose();
        this.waveform.geometry.dispose();

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}