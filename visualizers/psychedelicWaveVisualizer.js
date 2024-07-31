import * as THREE from 'three';

export class PsychedelicWaveVisualizer {
    constructor(container) {
        this.container = container;
        this.particleSystem = null;
        this.particlesCount = 10000;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.textSprite = null;

        this.waveWidth = 128;
        this.waveHeight = 128;

        this.clock = new THREE.Clock();

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    init() {
        this.geometry = new THREE.PlaneGeometry(100, 100, this.waveWidth - 1, this.waveHeight - 1);

        // Create custom shader material for psychedelic effects
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                colorA: { value: new THREE.Color(0xff00ff) },
                colorB: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                uniform float time;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    pos.z += sin(pos.x * 0.1 + time) * 5.0;
                    pos.z += cos(pos.y * 0.1 + time) * 5.0;
                    vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition;
                    vNormal = normalize(normalMatrix * normal);
                }
            `,
            fragmentShader: `
                uniform vec3 colorA;
                uniform vec3 colorB;
                uniform float time;
                varying vec2 vUv;
                varying vec3 vNormal;
                void main() {
                    vec3 color = mix(colorA, colorB, vUv.x * sin(time) + vUv.y * cos(time));
                    float light = dot(vNormal, normalize(vec3(1, 1, 1)));
                    gl_FragColor = vec4(color * (0.5 + 0.5 * light), 1.0);
                }
            `,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Add colored lights
        const light1 = new THREE.PointLight(0xff00ff, 1, 500);
        light1.position.set(50, 50, 50);
        light1.castShadow = true;
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0x00ffff, 1, 500);
        light2.position.set(-50, 50, -50);
        light2.castShadow = true;
        this.scene.add(light2);

        // Add directional light for better shadows
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 100, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 10;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Add 2D text as sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 128;
        context.font = "Bold 60px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText("アンキュレット", 228, 80);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        this.textSprite = new THREE.Sprite(spriteMaterial);
        this.textSprite.scale.set(30, 15, 1);
        this.textSprite.position.set(0, -70, 0);
        this.scene.add(this.textSprite);

        // Add particles
        this.createParticleSystem();

    }

    update(dataArray) {
        const time = this.clock.getElapsedTime();
        this.material.uniforms.time.value = time;
        const deltaTime = this.clock.getDelta();


        const vertices = this.geometry.attributes.position.array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = i / 3 % this.waveWidth;
            const y = Math.floor(i / 3 / this.waveWidth);

            const index = (x + y * this.waveWidth) % dataArray.length;
            vertices[i + 2] = dataArray[index] / 5 + Math.sin(x / 10 + time) * 5 + Math.cos(y / 10 + time) * 5;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.mesh.rotation.z += 0.005;

        if (this.textSprite) {
            //ascolta la musica
            const larghezza = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            this.textSprite.scale.set(30 + larghezza, 15 + larghezza, 1);

        }

        //modifichiamo la posizione delle particelle
        this.updateParticles(dataArray, time, deltaTime);



        this.renderer.render(this.scene, this.camera);
    }
    createParticleSystem() {
        const particlesGeometry = new THREE.BufferGeometry();
        const posArray = new Float32Array(this.particlesCount * 3);
        const scaleArray = new Float32Array(this.particlesCount);
        const colorArray = new Float32Array(this.particlesCount * 3);
        const velocityArray = new Float32Array(this.particlesCount * 3); // Nuovo array per la velocità

        for (let i = 0; i < this.particlesCount; i++) {
            // Distribuiamo le particelle in una sfera
            const radius = Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);

            posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            posArray[i * 3 + 2] = radius * Math.cos(phi);
            
            scaleArray[i] = Math.random();

            colorArray[i * 3] = Math.random();
            colorArray[i * 3 + 1] = Math.random();
            colorArray[i * 3 + 2] = Math.random();

            // Inizializziamo la velocità
            velocityArray[i * 3] = (Math.random() - 0.5) * 0.2;
            velocityArray[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
            velocityArray[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        particlesGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocityArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            sizeAttenuation: true,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        this.scene.add(this.particleSystem);
    }

    updateParticles(dataArray, time, deltaTime) {
        if (!this.particleSystem) return;

        const geometry = this.particleSystem.geometry;
        const positionAttribute = geometry.getAttribute('position');
        const scaleAttribute = geometry.getAttribute('scale');
        const colorAttribute = geometry.getAttribute('color');
        const velocityAttribute = geometry.getAttribute('velocity');

        const audioScale = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 128;
        //la sfera si allarga
        this.particleSystem.scale. set(1 + audioScale / 2, 1 + audioScale / 2, 1 + audioScale / 2);     
        for (let i = 0; i < positionAttribute.count; i++) {
            const i3 = i * 3;
            const dataIndex = i % dataArray.length;
            const audioValue = dataArray[dataIndex] / 255;

            // Update position based on velocity and audio
            positionAttribute.array[i3] += velocityAttribute.array[i3] * audioScale * 10;
            positionAttribute.array[i3 + 1] += velocityAttribute.array[i3 + 1] * audioScale * 10;
            positionAttribute.array[i3 + 2] += velocityAttribute.array[i3 + 2] * audioScale * 10;

            // Update velocity
            velocityAttribute.array[i3] += (Math.random() - 0.5) * 0.01 * audioScale;
            velocityAttribute.array[i3 + 1] += (Math.random() - 0.5) * 0.01 * audioScale;
            velocityAttribute.array[i3 + 2] += (Math.random() - 0.5) * 0.01 * audioScale;

            // Limit distance from center
            const distance = Math.sqrt(
                positionAttribute.array[i3]**2 + 
                positionAttribute.array[i3 + 1]**2 + 
                positionAttribute.array[i3 + 2]**2
            );
            if (distance > 50) {
                positionAttribute.array[i3] *= 0.95;
                positionAttribute.array[i3 + 1] *= 0.95;
                positionAttribute.array[i3 + 2] *= 0.95;
            }

            // Update scale based on audio
            scaleAttribute.array[i] = 0.5 + audioValue * 2;

            // Update color based on position and audio
            const r = 0.5 + 0.5 * Math.sin(positionAttribute.array[i3] * 0.1 + time + audioValue);
            const g = 0.5 + 0.5 * Math.sin(positionAttribute.array[i3 + 1] * 0.1 + time * 1.3 + audioValue);
            const b = 0.5 + 0.5 * Math.sin(positionAttribute.array[i3 + 2] * 0.1 + time * 1.7 + audioValue);
            colorAttribute.array[i3] = r;
            colorAttribute.array[i3 + 1] = g;
            colorAttribute.array[i3 + 2] = b;
        }

        positionAttribute.needsUpdate = true;
        scaleAttribute.needsUpdate = true;
        colorAttribute.needsUpdate = true;
        velocityAttribute.needsUpdate = true;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material) this.material.dispose();
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.textSprite) this.scene.remove(this.textSprite);
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
        }
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}