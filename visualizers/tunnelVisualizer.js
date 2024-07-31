import * as THREE from 'three';

export class TunnelVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 0;
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.time = 0;
        this.tunnelRadius = 5;
        this.tunnelLength = 500;
        this.tunnelSegments = 64;
        this.ringSegments = 32;
        this.rings = [];
        this.cameraOffset = new THREE.Vector3();
        this.cameraTarget = new THREE.Vector3();
        this.cameraLerpFactor = 0.05;
        this.maxCameraOffset = 1.5;

        // Nuove variabili per il controllo della velocità
        this.baseSpeed = 0.2;
        this.maxSpeedMultiplier = 3;
        this.speedLerpFactor = 0.05;
        this.currentSpeed = 0;
        this.noMusicThreshold = 5; // Soglia per determinare se c'è musica

        this.init();
    }

    init() {
        const tunnelGeometry = new THREE.CylinderGeometry(this.tunnelRadius, this.tunnelRadius, this.tunnelLength, this.tunnelSegments, 1, true);
        const tunnelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00ffff) },
                color2: { value: new THREE.Color(0xff00ff) },
                color3: { value: new THREE.Color(0xffff00) },
                audioData: { value: new Float32Array(128) },
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                uniform float audioData[128];
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    float audioInfluence = audioData[int(uv.y * 128.0)] * 0.2;
                    pos.x += sin(pos.z * 0.1 + time) * audioInfluence;
                    pos.y += cos(pos.z * 0.1 + time) * audioInfluence;
                    
                    // Aggiungere la curva
                    float curveFactor = 0.005;
                    pos.x += sin(pos.z * curveFactor + time) * 5.0;
                    pos.y += cos(pos.z * curveFactor + time) * 5.0;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform vec3 color3;
                uniform float audioData[128];
                varying vec2 vUv;
                
                void main() {
                    float pattern = sin(vUv.y * 20.0 + time * 2.0) * 0.5 + 0.5;
                    float audioInfluence = audioData[int(vUv.y * 128.0)] / 255.0;
                    
                    vec3 color = mix(color1, color2, pattern);
                    color = mix(color, color3, audioInfluence);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide,
            transparent: true
        });

        this.tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
        this.tunnel.rotation.x = Math.PI / 2;
        this.tunnel.receiveShadow = true;
        this.scene.add(this.tunnel);

        this.createRings();

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(0, 0, 10);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 2048;
        pointLight.shadow.mapSize.height = 2048;
        this.scene.add(pointLight);

        this.cameraGroup = new THREE.Group();
        this.cameraGroup.add(this.camera);
        this.scene.add(this.cameraGroup);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    createRings() {
        const ringGeometry = new THREE.RingGeometry(this.tunnelRadius - 0.5, this.tunnelRadius + 0.5, this.ringSegments);
        const ringMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide,
            emissive: 0xffffff,
            emissiveIntensity: 0.5,
        });

        for (let i = 0; i < 50; i++) {
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = -i * (this.tunnelLength / 50);
            ring.rotation.x = Math.PI / 3;
            this.rings.push(ring);
            this.scene.add(ring);
        }
    }

    update(dataArray) {
        this.time += 0.01;

        this.updateCameraPosition(dataArray);

        this.tunnel.material.uniforms.time.value = this.time;
        this.tunnel.material.uniforms.audioData.value = dataArray;

        // Calcola l'energia totale del segnale audio
        const totalEnergy = dataArray.reduce((sum, value) => sum + value, 0);
        
        // Determina se c'è musica basandosi sull'energia totale
        const isThereMusic = totalEnergy > this.noMusicThreshold;

        if (isThereMusic) {
            const bassIntensity = dataArray[0] / 255;
            const targetSpeed = this.baseSpeed + bassIntensity * (this.maxSpeedMultiplier - 1) * this.baseSpeed;
            this.currentSpeed += (targetSpeed - this.currentSpeed) * this.speedLerpFactor;
        } else {
            // Se non c'è musica, rallenta gradualmente fino a fermarsi
            this.currentSpeed *= 0.95; // Fattore di decelerazione
            if (this.currentSpeed < 0.001) this.currentSpeed = 0;
        }

        // Muovi il gruppo della telecamera solo se c'è velocità
        if (this.currentSpeed > 0) {
            this.cameraGroup.position.z -= this.currentSpeed;
            if (this.cameraGroup.position.z < -this.tunnelLength) {
                this.cameraGroup.position.z = 0;
            }
        }

        // Aggiorna gli anelli
        this.rings.forEach((ring, index) => {
            const dataIndex = Math.floor(index / this.rings.length * dataArray.length);
            const scale = 1 + dataArray[dataIndex] / 255 * 0.3;
            ring.scale.set(scale, scale, 1);
            
            // Muovi gli anelli solo se c'è velocità
            if (this.currentSpeed > 0) {
                ring.position.z += this.currentSpeed;
                if (ring.position.z > this.camera.position.z) {
                    ring.position.z -= this.tunnelLength;
                }
            }
            
            // Continua a far ruotare gli anelli anche senza musica, ma più lentamente
            const rotationSpeed = isThereMusic ? 0.5 * (dataArray[dataIndex] / 255) : 0.1;
            ring.rotation.z += rotationSpeed;
            
            // Cambia il colore degli anelli in base al tempo e ai dati audio
            const hue = (this.time * 0.05 + (isThereMusic ? dataArray[dataIndex] / 255 : 0)) % 1;
            ring.material.color.setHSL(hue, 1, 0.5);
            ring.material.emissive.setHSL(hue, 1, 0.5);
        });

        this.renderer.render(this.scene, this.camera);
    }

    updateCameraPosition(dataArray) {
        const lowFreq = this.getAverageFrequency(dataArray, 0, 10);
        const midFreq = this.getAverageFrequency(dataArray, 11, 100);
        const highFreq = this.getAverageFrequency(dataArray, 101, 127);

        this.cameraTarget.x = (lowFreq - 128) / 255 * this.maxCameraOffset * 0.5;
        this.cameraTarget.y = (midFreq - 128) / 255 * this.maxCameraOffset * 0.5;
        
        const angle = this.time + highFreq * 0.02;
        this.cameraTarget.x += Math.sin(angle) * 0.3;
        this.cameraTarget.y += Math.cos(angle) * 0.3;

        this.cameraOffset.lerp(this.cameraTarget, this.cameraLerpFactor * 0.5);

        this.cameraGroup.position.x = this.cameraOffset.x;
        this.cameraGroup.position.y = this.cameraOffset.y;

        this.camera.rotation.z = -this.cameraOffset.x * 0.05;
        this.camera.rotation.x = -this.cameraOffset.y * 0.05;
    }

    getAverageFrequency(dataArray, start, end) {
        let sum = 0;
        for (let i = start; i <= end; i++) {
            sum += dataArray[i];
        }
        return sum / (end - start + 1);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        window.removeEventListener('resize', this.onWindowResize.bind(this), false);
        
        this.scene.remove(this.tunnel);
        this.tunnel.geometry.dispose();
        this.tunnel.material.dispose();

        this.rings.forEach(ring => {
            this.scene.remove(ring);
            ring.geometry.dispose();
            ring.material.dispose();
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
