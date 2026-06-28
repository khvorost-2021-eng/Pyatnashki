"use strict";

// ========== TIMER ==========
function startTimer() {
    if (state.isRunning || state._isPaused) return;
    state.isRunning = true;
    state.startTime = Date.now() - state.time * 1000;
    state.timerId = setInterval(() => {
        state.time = Math.floor((Date.now() - state.startTime) / 1000);
        document.getElementById("timer").textContent = formatTime(state.time);
    }, 250);
}

function stopTimer() {
    state.isRunning = false;
    if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
}

function resetTimer() {
    stopTimer();
    state.time = 0;
    state.startTime = null;
    document.getElementById("timer").textContent = "00:00";
}