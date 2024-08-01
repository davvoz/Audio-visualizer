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
        document.getElementById('headerPlayButton').addEventListener('click', this.togglePlayPause.bind(this));
        document.getElementById('nextButton').addEventListener('click', this.playNext.bind(this));
        document.getElementById('previousButton').addEventListener('click', this.playPrevious.bind(this));
        document.getElementById('trackList').addEventListener('click', this.handleTrackListClick.bind(this));
        document.getElementById('progressContainer').addEventListener('click', this.seekAudio.bind(this));
        document.getElementById('volume').addEventListener('input', this.setVolume.bind(this));
        //listenPlaylist
        document.getElementById('listenPlaylist').addEventListener('click', this.listenPlaylist.bind(this));
    }

    async fetchAudioFile(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    }

    async listenPlaylist() {
        //mostra il contenitore dello spinner
        document.getElementById('loading').classList.remove('hidden');
        const lucioGiolliTracks = [
            { name: 'Arabian nights', url: 'assets/arabian_night.mp3' },
            { name: 'BB choir felio gbb o gh5g (1)', url: 'assets/bb choir felio gbb o gh5g (1).mp3' },
            { name: 'BB choir felio gbb o gh5g', url: 'assets/bb choir felio gbb o gh5g.mp3' },
            { name: 'Bloody mind', url: 'assets/bloody_mind.mp3' },
            { name: 'Btgty choir felio Ssing o gh5g', url: 'assets/btgty choir felio Ssing o gh5g.mp3' },
            { name: 'Calm and war', url: 'assets/calm_and_war.mp3' },
            { name: 'Choir felio Ssing Nights rg bgg sitaro gh5g (1)', url: 'assets/choir felio Ssing Nights rg bgg sitaro gh5g (1).mp3' },
            { name: 'Dark tzigane', url: 'assets/dark_tzigane.mp3' },
            { name: 'Death waltzer', url: 'assets/death_waltzer.mp3' },
            { name: 'Die happy', url: 'assets/die_happy.mp3' },
            { name: 'Distorted child', url: 'assets/distorted_child.mp3' },
            { name: 'Drum and grezzo', url: 'assets/drum_and_grezzo.mp3' },
            { name: 'Elctronic disease', url: 'assets/elctronic_disease.mp3' },
            { name: 'Electronic cello', url: 'assets/electronic_cello.mp3' },
            { name: 'Epic tune', url: 'assets/epic_tune.mp3' },
            { name: 'Gitan', url: 'assets/gitan.mp3' },
            { name: 'Indian night', url: 'assets/indian_night.mp3' },
            { name: 'Industrial dream', url: 'assets/industrial_dream.mp3' },
            { name: 'Industrial drum', url: 'assets/industrial_drum.mp3' },
            { name: 'Lolbgf choir felio Ssing o gh5g (1)', url: 'assets/lolbgf choir felio Ssing o gh5g (1).mp3' },
            { name: 'Lolbgf choir felio Ssing o gh5g (2)', url: 'assets/lolbgf choir felio Ssing o gh5g (2).mp3' },
            { name: 'Lolbgf choir felio Ssing o gh5g', url: 'assets/lolbgf choir felio Ssing o gh5g.mp3' },
            { name: 'Mechanical nightmare', url: 'assets/mechanical_nightmare.mp3' },
            { name: 'Mechanica nightmare melodic', url: 'assets/mechanica_nightmare_melodic.mp3' },
            { name: 'Monk ballad', url: 'assets/monk_ballad.mp3' },
            { name: 'Neoclassical dreams', url: 'assets/neoclassical_dreams.mp4' },
            { name: 'Non volevo diventare una bambola stupida e inutile', url: 'assets/non_volevo_diventare_una_bambola_stupida e inutile.mp3' },
            { name: 'Raw monk', url: 'assets/raw_monk.mp3' },
            { name: 'Siete bruciat dannati', url: 'assets/siete_bruciat_dannati.mp3' },
            { name: 'Suspended in the void', url: 'assets/suspended in the void.mp3' },
            { name: 'Tribal circuits', url: 'assets/tribal_circuits.mp3' },
            { name: 'Vo vale fede (1)', url: 'assets/Vo vale fede (1).mp3' },
            { name: 'Vo vale fede', url: 'assets/Vo vale fede.mp3' },
            { name: 'VPROVao vale fede (1)', url: 'assets/VPROVao vale fede (1).mp3' },
            { name: 'VPROVao vale fede (3)', url: 'assets/VPROVao vale fede (3).mp3' },
            { name: 'VPROVao vale fede (4)', url: 'assets/VPROVao vale fede (4).mp3' },
            { name: 'VPROVao vale fede', url: 'assets/VPROVao vale fede.mp3' }
        ];

        this.audioQueue = await Promise.all(lucioGiolliTracks.map(async track => {
            const blob = await this.fetchAudioFile(track.url);
            return new File([blob], track.name, { type: 'audio/mpeg' });
        }));

        this.updateTrackList();
        document.getElementById('welcome-message').style.display = 'none';
        //chiudi lo spinner
        //chiudi il contenitore dello spinner
        document.getElementById('loading').classList.add('hidden');
        //rileva se la tracklist se è collassata dal toggle
        const isCollapsed = document.getElementById('trackList').classList.contains('collapsed');
        if (isCollapsed) {
            document.getElementById('trackList').classList.toggle('collapsed');
        }
        // If no track is currently playing, start playing the first track
        if (this.currentAudioIndex === -1 && this.audioQueue.length > 0) {
            this.currentAudioIndex = 0;
            this.playNextAudio();
        }
    }



    setVolume(event) {
        if (this.audio) {
            this.audio.volume = event.target.value;
        }
    }

    createTrackElement(file, index) {
        const trackElement = document.createElement('div');
        trackElement.className = 'track';
        trackElement.innerHTML = `
                    <span class="track-name">${file.name}</span>
                    <div class="btn-group">
                        <button class="btn play-track" data-index="${index}">Play</button>
                        <button class="btn remove-track" data-index="${index}">Remove</button>
                    </div>
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
        //se la tracklist è vuota, mostra il messaggio di b
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
            document.getElementById('headerPlayButton').textContent = 'Pause';
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
            this.audioContext.suspend();
            this.isPlaying = false;
            document.getElementById('playButton').textContent = 'Play';
            document.getElementById('headerPlayButton').textContent = 'Play';
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
            //aggiustare il volume
            this.audio.volume = document.getElementById('volume').value;

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
            document.getElementById('headerPlayButton').textContent = 'Play';
        }
        //posizionamo la tracklist con la scrollbar in base alla traccia corrente
        const altezzaRiga = //recupero l'altezza di una riga
            document.querySelector('.track').offsetHeight;
        const posizione = //calcolo la posizione della track corrente
            this.currentAudioIndex * altezzaRiga;

        //andiamoci con un animazione
        document.getElementById('trackList').scrollTo({
            top: posizione,
            behavior: 'smooth'
        });

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