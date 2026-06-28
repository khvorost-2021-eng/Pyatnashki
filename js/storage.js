"use strict";

// ========== CLOUD STORAGE (Яндекс PlayerData) ==========
async function saveToCloud(data) {
    if (!isLocal && player) {
        try {
            await player.setData(data, true);
            console.log('[Cloud] Saved to PlayerData');
        } catch (e) {
            console.error("Cloud save error:", e);
            // Fallback на localStorage если облако недоступно
            try { localStorage.setItem('puzzle15_data', JSON.stringify(data)); } catch (e2) {}
        }
    } else {
        try { localStorage.setItem('puzzle15_data', JSON.stringify(data)); } catch (e) {}
    }
}

async function loadFromCloud() {
    if (!isLocal && player) {
        try {
            const data = await player.getData();
            console.log('[Cloud] Loaded from PlayerData:', data);
            return data || {};
        } catch (e) {
            console.warn("Cloud load error, fallback to localStorage:", e);
            try {
                const raw = localStorage.getItem('puzzle15_data');
                return raw ? JSON.parse(raw) : {};
            } catch (e2) { return {}; }
        }
    } else {
        try {
            const raw = localStorage.getItem('puzzle15_data');
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
}

function saveState() {
    const data = {
        bestTime: state.bestTime,
        bestMoves: state.bestMoves,
        wins: state.wins,
        gamesPlayed: state.gamesPlayed,
        unlockedSkins: state.unlockedSkins,
        currentTheme: state.currentTheme,
        currentSkin: state.currentSkin,
        musicEnabled: state.musicEnabled,
        musicVolume: state.musicVolume
    };
    saveToCloud(data);
}