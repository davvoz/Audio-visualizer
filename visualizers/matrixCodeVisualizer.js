import * as THREE from 'three';

export class MatrixCodeVisualizer {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            -window.innerWidth / 2, window.innerWidth / 2,
            window.innerHeight / 2, -window.innerHeight / 2,
            -1, 1
        );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.ideograms = [];
        this.columns = 20;
        this.ideogramSize = window.innerWidth / this.columns;
    }

    createIdeogram() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00FF00';
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;

        const charCode = 0x4E00 + Math.floor(Math.random() * (0x9FFF - 0x4E00));
        const character = String.fromCharCode(charCode);

        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(character, 64, 64);

        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * 128, Math.random() * 128);
            ctx.lineTo(Math.random() * 128, Math.random() * 128);
            ctx.stroke();
        }

        return new THREE.CanvasTexture(canvas);
    }

    init() {
        for (let i = 0; i < this.columns; i++) {
            const column = [];
            const numIdeograms = Math.floor(Math.random() * 5) + 3; // 3 to 7 ideograms per column
            for (let j = 0; j < numIdeograms; j++) {
                const geometry = new THREE.PlaneGeometry(this.ideogramSize, this.ideogramSize);
                const material = new THREE.MeshBasicMaterial({
                    map: this.createIdeogram(),
                    transparent: true,
                    opacity: Math.random() * 0.5 + 0.5
                });
                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.set(
                    (i - this.columns / 2 + 0.5) * this.ideogramSize,
                    window.innerHeight / 2 + this.ideogramSize * j,
                    0
                );

                column.push({
                    mesh: mesh,
                    speed: Math.random() * 1 + 0.5,
                    initialOpacity: material.opacity
                });

                this.scene.add(mesh);
            }
            this.ideograms.push(column);
        }
    }

    update(dataArray) {
        this.ideograms.forEach((column, columnIndex) => {
            column.forEach((ideogram, index) => {
                // Move ideogram down
                ideogram.mesh.position.y -= ideogram.speed;

                // Reset position when ideogram reaches bottom
                if (ideogram.mesh.position.y < -window.innerHeight / 2 - this.ideogramSize) {
                    // Move to top of the screen
                    ideogram.mesh.position.y = window.innerHeight / 2 + this.ideogramSize;

                    // Update texture
                    ideogram.mesh.material.map = this.createIdeogram();
                    ideogram.mesh.material.needsUpdate = true;

                    // Randomize speed
                    ideogram.speed = Math.random() * 1 + 0.5;
                }

                // Update speed and opacity based on audio data
                const dataIndex = columnIndex % dataArray.length;
                const intensity = dataArray[dataIndex] / 255;
                ideogram.mesh.material.opacity = ideogram.initialOpacity * (0.5 + intensity * 1.5);

                // Update geometry dimensions
                ideogram.mesh.scale.x = 0.5 + intensity * 0.5;
                ideogram.mesh.scale.y = 0.5 + intensity * 0.5;

                ideogram.speed = 0.5 + intensity * 1.5;
            });
        });

        this.renderer.render(this.scene, this.camera);
    }


    dispose() {
        this.ideograms.flat().forEach(ideogram => {
            this.scene.remove(ideogram.mesh);
            ideogram.mesh.geometry.dispose();
            ideogram.mesh.material.dispose();
            ideogram.mesh.material.map.dispose();
        });
        this.ideograms = [];
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
