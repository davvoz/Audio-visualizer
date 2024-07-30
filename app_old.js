import { AudioVisualizer } from './audioVisualizer.js';
import { GUIController } from './guiController.js';

let visualizer;
let guiController;

document.getElementById('audioFileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
        const audio = new Audio(URL.createObjectURL(file));
        audio.crossOrigin = "anonymous";
        audio.play();

        if (visualizer) {
            visualizer.stop();
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);

        visualizer = new AudioVisualizer(audioContext, source);

        if (guiController) {
            guiController.reset();
        }

        guiController = new GUIController(visualizer);
        guiController.init();
    }
});

document.getElementById('playButton').addEventListener('click', function () {
    if (visualizer) {
        visualizer.source.mediaElement.play();
        visualizer.audioContext.resume();
    }
});

document.getElementById('pauseButton').addEventListener('click', function () {
    if (visualizer) {
        visualizer.source.mediaElement.pause();
        visualizer.audioContext.suspend();
    }
});
