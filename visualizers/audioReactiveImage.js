import * as THREE from 'three';

export class AudioReactiveImageVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.uniforms = {
            tDiffuse: { value: null },
            resolution: { value: new THREE.Vector2() },
            audioData: { value: new Float32Array(128) },
            time: { value: 0 }
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader(),
            fragmentShader: this.fragmentShader()
        });

        this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
        this.scene.add(this.mesh);

        this.textureLoader = new THREE.TextureLoader();
        
        // Carica immediatamente l'immagine
        this.loadImage();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    loadImage() {
        const imageUrl = 'assets/indi.jpeg'; //assets\indi.jpeg
        this.textureLoader.load(
            imageUrl,
            (texture) => {
                this.uniforms.tDiffuse.value = texture;
                this.onWindowResize();
                console.log('Immagine caricata con successo');
            },
            undefined,
            (error) => {
                console.error('Errore nel caricamento dell\'immagine:', error);
            }
        );
    }

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.uniforms.tDiffuse.value) {
            const imgAspect = this.uniforms.tDiffuse.value.image.width / this.uniforms.tDiffuse.value.image.height;
            const windowAspect = window.innerWidth / window.innerHeight;
            
            if (windowAspect > imgAspect) {
                this.uniforms.resolution.value.x = window.innerHeight * imgAspect;
                this.uniforms.resolution.value.y = window.innerHeight;
            } else {
                this.uniforms.resolution.value.x = window.innerWidth;
                this.uniforms.resolution.value.y = window.innerWidth / imgAspect;
            }
        }
    }

    vertexShader() {
        return `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    fragmentShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            uniform float audioData[128];
            uniform float time;
            varying vec2 vUv;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution;
                vec4 texColor = texture2D(tDiffuse, vUv);
                
                float lowFreq = audioData[0] * 2.0;
                float midFreq = audioData[64] * 2.0;
                float highFreq = audioData[127] * 2.0;

                float r = texColor.r + lowFreq * sin(time + vUv.x * 10.0) * 0.2;
                float g = texColor.g + midFreq * cos(time + vUv.y * 10.0) * 0.2;
                float b = texColor.b + highFreq * sin(time + (vUv.x + vUv.y) * 10.0) * 0.2;

                gl_FragColor = vec4(r, g, b, texColor.a);
            }
        `;
    }

    update(dataArray) {
        this.uniforms.audioData.value.set(dataArray);
        this.uniforms.time.value += 0.05;
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        this.material.dispose();
        this.mesh.geometry.dispose();
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}