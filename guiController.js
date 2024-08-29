import { BarVisualizer } from './visualizers/barVisualizer.js';
import { CircleVisualizer } from './visualizers/circleVisualizer.js';
import { TunnelVisualizer } from './visualizers/tunnelVisualizer.js';
import { InteractiveGalaxyVisualizer } from './visualizers/interactiveGalaxyVisualizer.js';
import { PsychedelicCubesVisualizer } from './visualizers/psychedelicCubesVisualizer.js';
import { BrutalistTetrahedronsVisualizer } from './visualizers/brutalistTetrahedronsVisualizer.js';
import { Wave3DVisualizer } from './visualizers/wave3DVisualizer.js';
import { CubeTunnelVisualizer } from './visualizers/cubeTunnelVisualizer.js';
import { RadialWavesVisualizer } from './visualizers/radialWavesVisualizer .js';
import { CircularWavesVisualizer } from './visualizers/circularWavesVisualizer.js';
import { PsychedelicWaveVisualizer } from './visualizers/psychedelicWaveVisualizer.js';
import { CircuitBeatVisualizer } from './visualizers/circuitBeatVisualizer.js';
import { Wave3DVisualizer2 } from './visualizers/wave3DVisualizer2.js';
import { PsychedelicLineVisualizer } from './visualizers/psychedelicLineVisualizer.js';
import { MonolithicWaveVisualizer } from './visualizers/monolithicWaveVisualizer .js';
import { HorrorCircusVisualizer } from './visualizers/horrorCircusVisualizer.js';
import { HyperReactiveMusicalVisualizer } from './visualizers/hyperReactiveMusicalVisualizer.js'
import { NewWaveVisualizer } from './visualizers/newWaveVisualizer.js'
import { PsychedelicDreamVisualizer } from './visualizers/psychedelicDreamVisualizer.js';
import { NeonCityVisualizer } from './visualizers/neonCityVisualizer.js';
//visualizers\matrixCodeVisualizer.js
import { MatrixCodeVisualizer } from './visualizers/matrixCodeVisualizer.js';
import { ImmaginePulsanteVisualizer } from './visualizers/immaginePulsante.js';
import { AudioReactiveImageModifier, AudioReactiveImageVisualizer } from './visualizers/audioReactiveImage.js';
export class GUIController {
    constructor(audioVisualizer) {
        this.audioVisualizer = audioVisualizer;
        this.gui = new dat.GUI();
        this.controls = {
            visualization: 'Circles'
        };
        this.container = document.getElementById('container');
    }

    init() {
        const visualizers = {
            Circles: CircleVisualizer,
            Tunnel: TunnelVisualizer,
            InteractiveGalaxy: InteractiveGalaxyVisualizer,
            PsychedelicCubes: PsychedelicCubesVisualizer,
            BrutalistTetrahedrons: BrutalistTetrahedronsVisualizer,
            Wave3D: Wave3DVisualizer,
            CubeTunnel: CubeTunnelVisualizer,
            RadialWaves: RadialWavesVisualizer,
            CircularWaves: CircularWavesVisualizer,
            PsychedelicWave: PsychedelicWaveVisualizer,
            CircuitBeat: CircuitBeatVisualizer,
            Wave3D2: Wave3DVisualizer2,
            PsychedelicLine: PsychedelicLineVisualizer,
            MonolithicWave: MonolithicWaveVisualizer,
            HorrorCircus: HorrorCircusVisualizer,
            HyperReactiveMusical: HyperReactiveMusicalVisualizer,
            NewWave: NewWaveVisualizer,
            PsychedelicDream: PsychedelicDreamVisualizer,
            NeonCity: NeonCityVisualizer,
            Bars: BarVisualizer,
            MatrixCode: MatrixCodeVisualizer,
            ImmaginePulsante: ImmaginePulsanteVisualizer,
            AudioReactiveImage: AudioReactiveImageVisualizer
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
