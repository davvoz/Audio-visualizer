import { BarVisualizer } from './barVisualizer.js';
import { CircleVisualizer } from './circleVisualizer.js';
import { TunnelVisualizer } from './tunnelVisualizer.js';
import { InteractiveGalaxyVisualizer } from './interactiveGalaxyVisualizer.js';
import { PsychedelicCubesVisualizer } from './psychedelicCubesVisualizer.js';
import { BrutalistTetrahedronsVisualizer } from './brutalistTetrahedronsVisualizer.js';
import { Wave3DVisualizer } from './wave3DVisualizer.js';
import { CubeTunnelVisualizer } from './cubeTunnelVisualizer.js';
import { RadialWavesVisualizer } from './radialWavesVisualizer .js';
import { CircularWavesVisualizer } from './circularWavesVisualizer.js';
import { PsychedelicWaveVisualizer } from './psychedelicWaveVisualizer.js';
import { CircuitBeatVisualizer } from './circuitBeatVisualizer.js';
import { Wave3DVisualizer2 } from './wave3DVisualizer2.js';

export class GUIController {
    constructor(audioVisualizer) {
        this.audioVisualizer = audioVisualizer;
        this.gui = new dat.GUI();
        this.controls = {
            visualization: 'Bars'
        };
        this.container = document.getElementById('container');
    }

    init() {
        const visualizers = {         
            Bars: BarVisualizer,
            Circles: CircleVisualizer,
            Tunnel: TunnelVisualizer,
            InteractiveGalaxy: InteractiveGalaxyVisualizer,
            PsychedelicCubes: PsychedelicCubesVisualizer,
            BrutalistTetrahedrons : BrutalistTetrahedronsVisualizer,
            Wave3D : Wave3DVisualizer,
            CubeTunnel : CubeTunnelVisualizer,
            RadialWaves : RadialWavesVisualizer,
            CircularWaves : CircularWavesVisualizer,
            PsychedelicWave : PsychedelicWaveVisualizer,
            CircuitBeat : CircuitBeatVisualizer,
            Wave3D2 : Wave3DVisualizer2
        };

        this.gui.add(this.controls, 'visualization', Object.keys(visualizers)).onChange((value) => {
            const Visualizer = visualizers[value];
            this.audioVisualizer.setVisualization(new Visualizer(this.container));
        });

        const defaultVisualization = Object.keys(visualizers)[0];
        const DefaultVisualizer = visualizers[defaultVisualization];
        this.audioVisualizer.setVisualization(new DefaultVisualizer(this.container));
        this.audioVisualizer.animate();
    }

    reset() {
        this.gui.destroy();
    }
}
