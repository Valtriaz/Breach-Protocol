// src/audioManager.js

const AUDIO_FILES = {
    // UI & General
    buttonClick: './assets/sounds/button-click.wav',
    modalOpen: './assets/sounds/modal_open.mp3',
    modalClose: './assets/sounds/modal_close.mp3',
    nodeUnlocked: './assets/sounds/node_unlocked.mp3',

    // Hacking & Puzzles
    hackStart: './assets/sounds/hack_start.mp3',
    hackAbort: './assets/sounds/hack_abort.mp3',
    puzzleSuccess: './assets/sounds/puzzle-success.wav',
    puzzleFail: './assets/sounds/puzzle-fail.wav',
    traceWarning: './assets/sounds/trace_warning.mp3',

    // Mission & Game State
    missionComplete: './assets/sounds/mission-complete.mp3',
    gameOver: './assets/sounds/game_over.mp3',
    gameWin: './assets/sounds/game_win.mp3',

    // Background
    backgroundAmbiance: './assets/sounds/background_ambiance.mp3',
};

export const audioManager = {
    sounds: {},
    volume: 0.5, // Default volume
    isMuted: false, // Mute state

    init() {
        for (const key in AUDIO_FILES) {
            this.sounds[key] = new Audio(AUDIO_FILES[key]);
            this.sounds[key].preload = 'auto';
            if (key === 'backgroundAmbiance') {
                this.sounds[key].loop = true;
            }
        }
        this.loadSettings();
    },

    play(soundName) {
        if (this.isMuted) return;
        if (this.sounds[soundName]) {
            this.sounds[soundName].volume = this.volume;
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => console.error(`Error playing sound '${soundName}':`, e));
        }
    },

    playBgMusic() {
        if (this.isMuted || !this.sounds.backgroundAmbiance) return;
        this.sounds.backgroundAmbiance.volume = this.volume > 0 ? this.volume / 2 : 0; // Play BGM at half volume
        this.sounds.backgroundAmbiance.play().catch(e => console.error('Error playing BGM:', e));
    },

    setVolume(level) {
        this.volume = parseFloat(level);
        this.saveSettings();
        // Apply volume to all sounds, respecting mute status
        for (const key in this.sounds) {
            this.sounds[key].volume = (key === 'backgroundAmbiance') ? this.volume / 2 : this.volume;
        }
    },

    setMute(muted) {
        this.isMuted = muted;
        this.saveSettings();
        if (this.isMuted) {
            Object.values(this.sounds).forEach(sound => sound.pause());
        } else {
            this.playBgMusic();
        }
    },

    saveSettings() {
        localStorage.setItem('breachProtocolSettings', JSON.stringify({ volume: this.volume, isMuted: this.isMuted }));
    },

    loadSettings() {
        const settingsData = localStorage.getItem('breachProtocolSettings');
        if (settingsData) {
            const settings = JSON.parse(settingsData);
            this.volume = settings.volume ?? 0.5;
            this.isMuted = settings.isMuted ?? false;
        }
    }
};
