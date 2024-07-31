import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export class MatrixCodeVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this.frequencyBins = 256;
        this.maxPoints = 5000;

        this.initMatrixCodePass();
        this.initBulletTimePass();
        this.initDigitalRain();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    initMatrixCodePass() {
        this.matrixCodePass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                bassIntensity: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform vec2 resolution;
                uniform float bassIntensity;
                varying vec2 vUv;

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }

                void main() {
                    vec2 st = gl_FragCoord.xy / resolution.xy;
                    vec2 pixelSize = 1.0 / resolution.xy;
                    
                    float speed = 0.5 + bassIntensity * 2.0;
                    float y = mod(st.y - time * speed, 1.0);
                    
                    float id = floor(st.x * 50.0) + floor(y * 50.0) * 50.0;
                    float r = random(vec2(id, floor(time * 20.0)));
                    
                    vec4 color = texture2D(tDiffuse, vUv);
                    
                    if (r > 0.9) {
                        color = vec4(0.0, 1.0, 0.0, 1.0);
                    } else if (r > 0.8) {
                        color = mix(color, vec4(0.0, 1.0, 0.0, 1.0), 0.5);
                    }
                    
                    color.rgb *= (1.0 - y * 0.8);
                    
                    gl_FragColor = color;
                }
            `
        });
        this.composer.addPass(this.matrixCodePass);
    }

    initBulletTimePass() {
        this.bulletTimePass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                distortion: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform float distortion;
                varying vec2 vUv;

                void main() {
                    vec2 center = vec2(0.5, 0.5);
                    vec2 uv = vUv;
                    vec2 dir = uv - center;
                    float dist = length(dir);
                    float strength = smoothstep(0.4, 0.7, dist);
                    
                    uv = center + normalize(dir) * (dist + sin(dist * 10.0 - time * 5.0) * 0.1 * distortion * strength);
                    
                    gl_FragColor = texture2D(tDiffuse, uv);
                }
            `
        });
        this.composer.addPass(this.bulletTimePass);
    }

    initDigitalRain() {
        const particleCount = this.maxPoints;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Math.random() * 20 - 10;
            positions[i * 3 + 1] = Math.random() * 20 - 10;
            positions[i * 3 + 2] = Math.random() * 20 - 10;

            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 0;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Compute bounding sphere
        particleGeometry.computeBoundingSphere();

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.digitalRain = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.digitalRain);
    }

    update(dataArray) {
        const time = Date.now() * 0.001;
        const bassValue = dataArray[0] / 255;

        this.updateMatrixCodeEffect(time, bassValue);
        this.updateBulletTimeEffect(time, bassValue);
        this.updateDigitalRainParticles(dataArray);
        this.updateCamera(time);

        this.composer.render();
    }

    updateMatrixCodeEffect(time, bassValue) {
        this.matrixCodePass.uniforms.time.value = time;
        this.matrixCodePass.uniforms.bassIntensity.value = bassValue;
    }

    updateBulletTimeEffect(time, bassValue) {
        this.bulletTimePass.uniforms.time.value = time;
        this.bulletTimePass.uniforms.distortion.value = bassValue * 0.5;
    }

    updateDigitalRainParticles(dataArray) {
        const positions = this.digitalRain.geometry.attributes.position.array;
        const colors = this.digitalRain.geometry.attributes.color.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= (0.1 + dataArray[0] / 255 * 0.2);  // Y position (falling speed)

            if (positions[i + 1] < -10) {
                positions[i + 1] = 10;
                positions[i] = Math.random() * 20 - 10;  // Randomize X position
                positions[i + 2] = Math.random() * 20 - 10;  // Randomize Z position
            }

            const particleIndex = i / 3;
            const frequencyIndex = Math.floor(particleIndex / positions.length * dataArray.length);
            const audioIntensity = dataArray[frequencyIndex] / 255;

            colors[i] = audioIntensity * 0.5;  // R
            colors[i + 1] = 0.5 + audioIntensity * 0.5;  // G
            colors[i + 2] = audioIntensity * 0.2;  // B
        }

        this.digitalRain.geometry.attributes.position.needsUpdate = true;
        this.digitalRain.geometry.attributes.color.needsUpdate = true;
    }

    updateCamera(time) {
        this.camera.position.x = Math.sin(time * 0.5) * 3;
        this.camera.position.y = Math.cos(time * 0.4) * 3;
        this.camera.lookAt(0, 0, 0);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.matrixCodePass.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.scene.remove(this.digitalRain);
        this.digitalRain.geometry.dispose();
        this.digitalRain.material.dispose();
        this.renderer.dispose();
        this.composer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }

    detectFrequencyHits(dataArray) {
        const bassValue = dataArray[0] / 255;
        const midValue = dataArray[32] / 255;
        const highValue = dataArray[64] / 255;

        if (bassValue > 0.8) {
            this.triggerBulletTimeEffect(bassValue);
        }

        if (midValue > 0.7) {
            this.intensifyMatrixCode(midValue);
        }

        if (highValue > 0.6) {
            this.accelerateDigitalRain(highValue);
        }
    }

    triggerBulletTimeEffect(intensity) {
        this.bulletTimePass.uniforms.distortion.value = intensity;
    }

    intensifyMatrixCode(intensity) {
        this.matrixCodePass.uniforms.bassIntensity.value = intensity;
    }

    accelerateDigitalRain(intensity) {
        const positions = this.digitalRain.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] -= intensity * 0.5;
        }
        this.digitalRain.geometry.attributes.position.needsUpdate = true;
    }
}