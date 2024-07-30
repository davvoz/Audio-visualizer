export class AudioVisualizer {
    constructor(audioContext, source) {
        this.audioContext = audioContext;
        this.source = source;
        if (!this.source) {
            this.source = audioContext.createMediaElementSource(new Audio());
        }
        if (!audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.analyser = audioContext.createAnalyser();
        this.source.connect(this.analyser);
        this.analyser.connect(audioContext.destination);
        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.visualizations = [];
    }

    addVisualization(visualization) {
        this.visualizations.push(visualization);
        visualization.init();
    }

    removeVisualizations(visualization) {
        const index = this.visualizations.indexOf(visualization);
        if (index > -1) {
            this.visualizations.splice(index, 1);
        }
    }

    setVisualization(visualization) {
        this.clearVisualizations();
        this.addVisualization(visualization);
    }

    clearVisualizations() {
        this.visualizations.forEach(v => v.dispose());
        this.visualizations = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.analyser.getByteFrequencyData(this.dataArray);
        this.visualizations.forEach(v => v.update(this.dataArray));
    }

    stop() {
        this.clearVisualizations();
        this.audioContext.close();
    }

    setParam(audioContext, source) {
        this.audioContext = audioContext;
        this.source = source;
        this.analyser = audioContext.createAnalyser();
        this.source.connect(this.analyser);
        this.analyser.connect(audioContext.destination);
        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }
}