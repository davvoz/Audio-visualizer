import { AudioVisualizer } from './audioVisualizer.js';
import { GUIController } from './guiController.js';

class AudioPlayer {
    constructor() {
        this.audioQueue = [];
        this.currentAudioIndex = -1;
        this.audio = null;
        this.guiController = null;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.source = null;
        this.isPlaying = false;
        this.visualizer = new AudioVisualizer(this.audioContext, this.source);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('audioFileInput').addEventListener('change', this.handleFileInput.bind(this));
        document.getElementById('playButton').addEventListener('click', this.togglePlayPause.bind(this));
        document.getElementById('nextButton').addEventListener('click', this.playNext.bind(this));
        document.getElementById('previousButton').addEventListener('click', this.playPrevious.bind(this));
        document.getElementById('trackList').addEventListener('click', this.handleTrackListClick.bind(this));
        document.getElementById('progressContainer').addEventListener('click', this.seekAudio.bind(this));
    }

    createTrackElement(file, index) {
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.innerHTML = `
                    <span class="track-name">${file.name}</span>
                    <button class="btn play-track" data-index="${index}">Play</button>
                    <button class="btn remove-track" data-index="${index}">Remove</button>
                `;
        return trackElement;
    }

    updateTrackList() {
        const trackList = document.getElementById('trackList');
        trackList.innerHTML = '';
        this.audioQueue.forEach((file, index) => {
            const trackElement = this.createTrackElement(file, index);
            if (index === this.currentAudioIndex) {
                trackElement.classList.add('playing');
            }
            trackList.appendChild(trackElement);
        });
        this.updateButtonStates();
    }

    handleFileInput(event) {
        const files = event.target.files;
        if (files.length > 0) {
            this.audioQueue = this.audioQueue.concat(Array.from(files));
            this.updateTrackList();
            if (this.currentAudioIndex === -1) {
                this.currentAudioIndex = 0;
                this.playNextAudio();
            }
        }
    }

    togglePlayPause() {
        if (this.audio) {
            if (this.isPlaying) {
                this.pause();
            } else {
                this.play();
            }
        } else if (this.audioQueue.length > 0) {
            this.playNextAudio();
        }
    }

    play() {
        if (this.audio) {
            this.audio.play();
            this.audioContext.resume();
            this.isPlaying = true;
            document.getElementById('playButton').textContent = 'Pause';
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.audioContext.suspend();
            this.isPlaying = false;
            document.getElementById('playButton').textContent = 'Play';
        }
    }

    playNext() {
        if (this.currentAudioIndex < this.audioQueue.length - 1) {
            this.currentAudioIndex++;
            this.playNextAudio();
        }
    }

    playPrevious() {
        if (this.currentAudioIndex > 0) {
            this.currentAudioIndex--;
            this.playNextAudio();
        }
    }

    handleTrackListClick(event) {
        if (event.target.classList.contains('play-track')) {
            const index = parseInt(event.target.dataset.index);
            this.currentAudioIndex = index;
            this.playNextAudio();
        } else if (event.target.classList.contains('remove-track')) {
            const index = parseInt(event.target.dataset.index);
            this.removeTrack(index);
        }
    }

    removeTrack(index) {
        this.audioQueue.splice(index, 1);
        if (index === this.currentAudioIndex) {
            this.playNextAudio();
        } else if (index < this.currentAudioIndex) {
            this.currentAudioIndex--;
        }
        this.updateTrackList();
    }

    playNextAudio() {
        if (this.audio) {
            this.audio.pause();
        }

        if (this.currentAudioIndex >= 0 && this.currentAudioIndex < this.audioQueue.length) {
            const file = this.audioQueue[this.currentAudioIndex];
            this.audio = new Audio(URL.createObjectURL(file));
            this.audio.crossOrigin = "anonymous";


            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.visualizer.setParam(this.audioContext, this.source);

            if (!this.guiController) {
                this.guiController = new GUIController(this.visualizer);
                this.guiController.init();
            }

            this.audio.addEventListener('ended', this.playNext.bind(this));
            this.audio.addEventListener('timeupdate', this.updateProgressBar.bind(this));
            this.audio.addEventListener('loadedmetadata', this.updateTrackInfo.bind(this));

            this.play();
            this.updateTrackList();
        } else {
            this.isPlaying = false;
            document.getElementById('playButton').textContent = 'Play';
        }

        this.updateButtonStates();
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (this.audio && progressBar) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    seekAudio(event) {
        if (this.audio) {
            const progressContainer = document.getElementById('progressContainer');
            const clickPosition = (event.clientX - progressContainer.getBoundingClientRect().left) / progressContainer.clientWidth;
            this.audio.currentTime = clickPosition * this.audio.duration;
        }
    }

    updateTrackInfo() {
        const trackInfoElement = document.getElementById('trackInfo');
        if (trackInfoElement && this.audio) {
            const currentTrack = this.audioQueue[this.currentAudioIndex];
            trackInfoElement.textContent = `Now Playing: ${currentTrack.name} (${this.formatTime(this.audio.duration)})`;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateButtonStates() {
        document.getElementById('previousButton').disabled = this.currentAudioIndex <= 0;
        document.getElementById('nextButton').disabled = this.currentAudioIndex >= this.audioQueue.length - 1;
    }
}

// Initialize the audio player
const audioPlayer = new AudioPlayer();

// Update the initial display
audioPlayer.updateTrackList();