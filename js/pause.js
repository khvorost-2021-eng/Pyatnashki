"use strict";

// ========== PAUSE / RESUME ==========
document.addEventListener("visibilitychange", () => { if (document.hidden) onPause(); else onResume(); });
window.addEventListener("pagehide", onPause);
window.addEventListener("blur", onPause);
window.addEventListener("focus", onResume);

function onPause() {
    if (state._isPaused) return;
    state._isPaused = true;
    state._wasTimerRunning = state.isRunning;
    state._wasMusicPlaying = state.musicEnabled && MusicEngine.isPlaying;
    if (state.isRunning) stopTimer();
    if (state._wasMusicPlaying) MusicEngine.stop();
}

function onResume() {
    if (!state._isPaused) return;
    state._isPaused = false;
    if (state._wasTimerRunning && state.hasStarted && !isSolved(state.board)) startTimer();
    if (state._wasMusicPlaying && state.musicEnabled) {
        if (!MusicEngine.initialized) { MusicEngine.init(); MusicEngine.setVolume(state.musicVolume); }
        MusicEngine.start();
    }
}