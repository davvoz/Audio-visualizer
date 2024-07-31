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
        this.tunnelSegments = 64; // Aumentato per una maggiore definizione
        this.ringSegments = 32; // Aumentato per una maggiore definizione
        this.rings = [];
        this.solids = [];
        this.cameraOffset = new THREE.Vector3();
        this.cameraTarget = new THREE.Vector3();
        this.cameraLerpFactor = 0.05;
        this.maxCameraOffset = 1.5;
        this.init();
    }

    init() {
        const tunnelGeometry = new THREE.CylinderGeometry(this.tunnelRadius, this.tunnelRadius, this.tunnelLength, this.tunnelSegments, 1, true);
        const tunnelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00ffff) },
                color2: { value: new THREE.Color(0xff00ff) },
                color3: { value: new THREE.Color(0xffff00) }, // Aggiunto un terzo colore per maggiore psichedelia
                audioData: { value: new Float32Array(128) }, // Nuovo uniform per i dati audio
            },
            vertexShader: `
                varying vec2 vUv;
                uniform float time;
                uniform float audioData[128];
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Deforma il tunnel in base ai dati audio
                    float audioInfluence = audioData[int(uv.y * 128.0)] * 0.2;
                    pos.x += sin(pos.z * 0.1 + time) * audioInfluence;
                    pos.y += cos(pos.z * 0.1 + time) * audioInfluence;
                    
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
        this.createSolids();

        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(0, 0, 10);
        pointLight.castShadow = true;
        pointLight.shadow.mapSize.width = 2048; // Aumentata la risoluzione delle ombre
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

        for (let i = 0; i < 50; i++) { // Aumentato il numero di anelli
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.z = -i * (this.tunnelLength / 50);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.y = Math.random() * Math.PI;
            ring.rotation.z = Math.random() * Math.PI;
            this.rings.push(ring);
            this.scene.add(ring);
        }
    }

    createSolids() {
        const solidTypes = [
            { geometry: new THREE.SphereGeometry(0.5, 32, 32), color: 0xff0000 },
            { geometry: new THREE.BoxGeometry(0.5, 0.5, 0.5), color: 0x00ff00 },
            { geometry: new THREE.TetrahedronGeometry(0.5), color: 0x0000ff },
            { geometry: new THREE.OctahedronGeometry(0.5), color: 0xffff00 },
            { geometry: new THREE.DodecahedronGeometry(0.5), color: 0xff00ff }
        ];

        for (let i = 0; i < 50; i++) { // Aumentato il numero di solidi
            const type = solidTypes[i % solidTypes.length];
            const material = new THREE.MeshPhongMaterial({ 
                color: type.color,
                emissive: type.color,
                emissiveIntensity: 0.5,
                shininess: 100
            });
            const solid = new THREE.Mesh(type.geometry, material);
            solid.position.set(
                (Math.random() - 0.5) * this.tunnelRadius * 2,
                (Math.random() - 0.5) * this.tunnelRadius * 2,
                -i * (this.tunnelLength / 50)
            );
            solid.castShadow = true;
            this.solids.push(solid);
            this.scene.add(solid);
        }
    }

    update(dataArray) {
        this.time += 0.01;

        this.updateCameraPosition(dataArray);

        // Aggiorniamo i valori uniformi del materiale shader
        this.tunnel.material.uniforms.time.value = this.time;
        this.tunnel.material.uniforms.audioData.value = dataArray;

        this.cameraGroup.position.z -= 0.5;
        if (this.cameraGroup.position.z < -this.tunnelLength) {
            this.cameraGroup.position.z = 0;
        }
        
        // Movimento della telecamera
        this.camera.position.z -= 0.5;
        if (this.camera.position.z < -this.tunnelLength) {
            this.camera.position.z = 0;
        }

        // Aggiorniamo gli anelli
        this.rings.forEach((ring, index) => {
            const dataIndex = Math.floor(index / this.rings.length * dataArray.length);
            const scale = 1 + dataArray[dataIndex] / 255 * 0.5;
            ring.scale.set(scale, scale, 1);
            
            ring.position.z += 0.5;
            if (ring.position.z > this.camera.position.z) {
                ring.position.z -= this.tunnelLength;
            }
            
            ring.rotation.z += 1 * (dataArray[dataIndex] / 255);
            
            const hue = (this.time * 0.1 + dataArray[dataIndex] / 255) % 1;
            ring.material.color.setHSL(hue, 1, 0.5);
            ring.material.emissive.setHSL(hue, 1, 0.5);
        });

        // Aggiorniamo i solidi
        this.solids.forEach((solid, index) => {
            const dataIndex = Math.floor(index / this.solids.length * dataArray.length);
            const scale = 1 + dataArray[dataIndex] / 255;
            solid.scale.set(scale, scale, scale);
            
            solid.position.z += 0.5;
            if (solid.position.z > this.camera.position.z) {
                solid.position.z -= this.tunnelLength;
                solid.position.x = (Math.random() - 0.5) * this.tunnelRadius * 2;
                solid.position.y = (Math.random() - 0.5) * this.tunnelRadius * 2;
            }
            
            solid.rotation.x += 0.02 * (dataArray[dataIndex] / 255);
            solid.rotation.y += 0.02 * (dataArray[dataIndex] / 255);
            
            const hue = (this.time * 0.1 + dataArray[dataIndex] / 255) % 1;
            solid.material.color.setHSL(hue, 1, 0.5);
            solid.material.emissive.setHSL(hue, 1, 0.5);
        });

        this.renderer.render(this.scene, this.camera);
    }

    updateCameraPosition(dataArray) {
        // Calcoliamo la media dei dati audio per le frequenze basse, medie e alte
        const lowFreq = this.getAverageFrequency(dataArray, 0, 10);
        const midFreq = this.getAverageFrequency(dataArray, 11, 100);
        const highFreq = this.getAverageFrequency(dataArray, 101, 127);

        // Usiamo le frequenze per influenzare il movimento della telecamera
        this.cameraTarget.x = (lowFreq - 128) / 255 * this.maxCameraOffset;
        this.cameraTarget.y = (midFreq - 128) / 255 * this.maxCameraOffset;
        
        // Aggiungiamo un leggero movimento circolare basato sulle alte frequenze
        const angle = this.time * 2 + highFreq * 0.05;
        this.cameraTarget.x += Math.sin(angle) * 0.5;
        this.cameraTarget.y += Math.cos(angle) * 0.5;

        // Applichiamo un'interpolazione lineare per un movimento più fluido
        this.cameraOffset.lerp(this.cameraTarget, this.cameraLerpFactor);

        // Aggiorniamo la posizione del gruppo della telecamera
        this.cameraGroup.position.x = this.cameraOffset.x;
        this.cameraGroup.position.y = this.cameraOffset.y;

        // Aggiungiamo una leggera rotazione alla telecamera basata sul movimento
        this.camera.rotation.z = -this.cameraOffset.x * 0.1;
        this.camera.rotation.x = -this.cameraOffset.y * 0.1;
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

        this.solids.forEach(solid => {
            this.scene.remove(solid);
            solid.geometry.dispose();
            solid.material.dispose();
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}