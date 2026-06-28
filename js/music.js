"use strict";

// ========== MUSIC ENGINE ==========
const MusicEngine = {
    ctx: null, masterGain: null, noteTimer: null, isPlaying: false,
    initialized: false, _volume: 0.3,
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0;
            const delay = this.ctx.createDelay(); delay.delayTime.value = 0.35;
            const feedback = this.ctx.createGain(); feedback.gain.value = 0.35;
            const filter = this.ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1800;
            const wetGain = this.ctx.createGain(); wetGain.gain.value = 0.45;
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.connect(delay);
            delay.connect(filter); filter.connect(feedback); feedback.connect(delay);
            delay.connect(wetGain); wetGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) { console.warn("Web Audio API недоступен:", e); }
    },

    setVolume(v) {
        this._volume = v;
        if (this.isPlaying && this.masterGain && this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.3);
        }
    },

    start() {
        if (this.isPlaying || !this.ctx) return;
        if (this.ctx.state === "suspended") this.ctx.resume();
        this.isPlaying = true;
        this.masterGain.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 1.5);
        this.playPad();
        this.scheduleNext();
    },

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.masterGain && this.ctx) this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
        if (this.noteTimer) { clearTimeout(this.noteTimer); this.noteTimer = null; }
    },

    playPad() {
        if (!this.isPlaying || !this.ctx) return;
        const chordSize = 2 + Math.floor(Math.random() * 2);
        const used = new Set(), notes = [];
        while (notes.length < chordSize) {
            const idx = Math.floor(Math.random() * this.scale.length);
            if (!used.has(idx)) { used.add(idx); notes.push(this.scale[idx]); }
        }
        notes.forEach((freq, i) => {
            this.playNote(freq, 5 + Math.random() * 3, i * 0.15);
            if (Math.random() < 0.4) this.playNote(freq / 2, 6 + Math.random() * 2, i * 0.15 + 0.3);
        });
    },

    playNote(freq, duration, delay) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + delay;
        const osc1 = this.ctx.createOscillator(); osc1.type = "sine"; osc1.frequency.value = freq;
        const osc2 = this.ctx.createOscillator(); osc2.type = "triangle"; osc2.frequency.value = freq * 1.003;
        const filter = this.ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 1500; filter.Q.value = 0.7;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.8);
        gain.gain.linearRampToValueAtTime(0.08, now + 2.5);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + duration + 0.2); osc2.stop(now + duration + 0.2);
    },

    scheduleNext() {
        if (!this.isPlaying) return;
        const delay = 3500 + Math.random() * 4000;
        this.noteTimer = setTimeout(() => { this.playPad(); this.scheduleNext(); }, delay);
    }
};