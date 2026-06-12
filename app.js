"use strict";

// ========== КОНФИГ ДЛЯ ТЕСТА ==========
const UNLOCK_ALL_SKINS = true;

// ========== YANDEX SDK STATE ==========
let ysdk = null;
let player = null;
let lb = null;
let isLocal = true;
const LEADERBOARD_NAME = 'fifteenpuzzle';

// ========== GAME STATE ==========
const SIZE = 4;
const TOTAL = SIZE * SIZE;
const EMPTY = 0;

const state = {
    board: [], moves: 0, time: 0, startTime: null, timerId: null,
    isRunning: false, hasStarted: false,
    bestTime: null, bestMoves: null, wins: 0, gamesPlayed: 0,
    unlockedSkins: ["standard"], currentTheme: "classic", currentSkin: "standard",
    musicEnabled: false, musicVolume: 0.3,
    _wasTimerRunning: false, _wasMusicPlaying: false, _isPaused: false
};

const SKINS = {
    standard:    { nameKey: "skinStandard",    requirement: null },
    wood:        { nameKey: "skinWood",        requirement: { type: "wins",  value: 5 } },
    gold:        { nameKey: "skinGold",        requirement: { type: "wins",  value: 25 } },
    lightning:   { nameKey: "skinLightning",   requirement: { type: "time",  value: 120 } },
    strategist:  { nameKey: "skinStrategist",  requirement: { type: "moves", value: 30 } },
    neon:        { nameKey: "skinNeon",        requirement: { type: "wins",  value: 50 } },
    space:       { nameKey: "skinSpace",       requirement: { type: "wins",  value: 100 } },
    rainbow:     { nameKey: "skinRainbow",     requirement: { type: "time",  value: 60 } }
};

const THEMES = {
    classic: "themeClassic",
    light:   "themeLight",
    night:   "themeNight",
    forest:  "themeForest"
};

// ========== CLOUD STORAGE ==========
async function saveToCloud(data) {
    if (!isLocal && player) {
        try { await player.setData(data, true); }
        catch (e) { console.error("Cloud save error:", e); }
    } else {
        try { localStorage.setItem('puzzle15_data', JSON.stringify(data)); } catch (e) {}
    }
}

async function loadFromCloud() {
    if (!isLocal && player) {
        try { return (await player.getData()) || {}; }
        catch (e) { return {}; }
    } else {
        try {
            const raw = localStorage.getItem('puzzle15_data');
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
}

function saveState() {
    const data = {
        bestTime: state.bestTime, bestMoves: state.bestMoves,
        wins: state.wins, gamesPlayed: state.gamesPlayed,
        unlockedSkins: state.unlockedSkins, currentTheme: state.currentTheme,
        currentSkin: state.currentSkin, musicEnabled: state.musicEnabled, musicVolume: state.musicVolume
    };
    saveToCloud(data);
}

// ========== LEADERBOARD ==========
async function submitScore(time) {
    if (!isLocal && lb) {
        try { await lb.setLeaderboardScore(LEADERBOARD_NAME, time); }
        catch (e) { console.error("LB submit error:", e); }
    }
}

async function getLeaderboardEntries() {
    if (!isLocal && lb) {
        try {
            const res = await lb.getLeaderboardEntries(LEADERBOARD_NAME, {
                quantityTop: 10, quantityAround: 3, includeUser: true
            });
            return res.entries || [];
        } catch (e) { return []; }
    }
    return [];
}

// ========== ADS ==========
function showInterstitialAd() {
    if (!isLocal && ysdk) {
        ysdk.adv.showFullscreenAdv({
            callbacks: {
                onClose: () => { if (state._wasMusicPlaying && state.musicEnabled) MusicEngine.start(); },
                onError: (e) => console.error('Ad error:', e)
            }
        });
    }
}

// ========== BOARD LOGIC ==========
function solvedBoard() {
    const b = [];
    for (let i = 1; i < TOTAL; i++) b.push(i);
    b.push(EMPTY);
    return b;
}

function getEmptyIndex(board) { return board.indexOf(EMPTY); }

function getNeighbors(idx) {
    const r = Math.floor(idx / SIZE), c = idx % SIZE, res = [];
    if (r > 0) res.push(idx - SIZE);
    if (r < SIZE - 1) res.push(idx + SIZE);
    if (c > 0) res.push(idx - 1);
    if (c < SIZE - 1) res.push(idx + 1);
    return res;
}

function isSolved(board) {
    for (let i = 0; i < TOTAL - 1; i++) if (board[i] !== i + 1) return false;
    return board[TOTAL - 1] === EMPTY;
}

function shuffleBoard() {
    let board = solvedBoard();
    let emptyIdx = getEmptyIndex(board);
    let lastEmpty = -1;
    const STEPS = 300 + Math.floor(Math.random() * 200);
    
    for (let i = 0; i < STEPS; i++) {
        const neighbors = getNeighbors(emptyIdx).filter(n => n !== lastEmpty);
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
        board[emptyIdx] = board[pick];
        board[pick] = EMPTY;
        lastEmpty = emptyIdx;
        emptyIdx = pick;
    }
    
    if (isSolved(board)) return shuffleBoard();
    return board;
}

function canMove(idx) { return getNeighbors(getEmptyIndex(state.board)).includes(idx); }

function moveTile(idx) {
    if (!canMove(idx)) return false;
    const emptyIdx = getEmptyIndex(state.board);
    state.board[emptyIdx] = state.board[idx];
    state.board[idx] = EMPTY;
    return true;
}

// ========== RENDER ==========
const boardEl = document.getElementById("board");
const shuffleBtn = document.getElementById("shuffle-btn");
let tileEls = {};

function renderBoard() {
    if (Object.keys(tileEls).length === 0) {
        for (let v = 1; v < TOTAL; v++) {
            const el = document.createElement("div");
            el.className = "tile";
            el.textContent = v;
            el.dataset.value = v;
            boardEl.appendChild(el);
            tileEls[v] = el;
        }
    }
    updateTilePositions();
}

function updateCorrectHighlights() {
    for (let i = 0; i < TOTAL; i++) {
        const v = state.board[i];
        if (v === EMPTY) continue;
        const el = tileEls[v];
        if (!el) continue;
        const isCorrect = (v === i + 1);
        el.classList.toggle('correct', isCorrect);
    }
}

function updateTilePositions() {
    // 🛡 ЗАЩИТА: Если фишки еще не созданы или доска пуста, прерываем выполнение
    if (Object.keys(tileEls).length === 0 || state.board.length === 0) return;

    const boardRect = boardEl.getBoundingClientRect();
    if (boardRect.width === 0 || boardRect.height === 0) return;
    
    const gap = 6;
    const innerPadding = 4;

    const boardSize = Math.min(boardRect.width, boardRect.height);
    const availableSize = boardSize - innerPadding * 2;
    const tileSize = (availableSize - gap * (SIZE + 1)) / SIZE;

    const offsetX = (boardRect.width - boardSize) / 2 + innerPadding;
    const offsetY = (boardRect.height - boardSize) / 2 + innerPadding;

    for (let i = 0; i < TOTAL; i++) {
        const v = state.board[i];
        if (v === EMPTY || v === undefined) continue;
        
        const row = Math.floor(i / SIZE), col = i % SIZE;
        const x = offsetX + gap + col * (tileSize + gap);
        const y = offsetY + gap + row * (tileSize + gap);
        const el = tileEls[v];
        
        if (!el) continue; // Дополнительная защита
        
        el.style.width = tileSize + "px";
        el.style.height = tileSize + "px";
        el.style.setProperty("--pos", `translate(${x}px, ${y}px)`);
        el.style.transform = `translate(${x}px, ${y}px)`;
    }
    updateCorrectHighlights();
}

function updateStats() {
    document.getElementById("moves").textContent = state.moves;
    document.getElementById("timer").textContent = formatTime(state.time);
    document.getElementById("best-time").textContent = state.bestTime != null ? formatTime(state.bestTime) : "--:--";
    document.getElementById("best-moves").textContent = state.bestMoves != null ? state.bestMoves : "—";
}

function formatTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateShuffleBtnText() {
    shuffleBtn.textContent = state.hasStarted ? t("startOver") : t("shuffle");
}

// ========== INPUT ==========
function handleBoardClick(e) {
    if (state._isPaused) return;
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const value = parseInt(tile.dataset.value, 10);
    const idx = state.board.indexOf(value);
    if (idx === -1 || !canMove(idx)) return;
    
    if (!state.hasStarted) {
        state.hasStarted = true;
        updateShuffleBtnText();
        startTimer();
    }
    
    if (moveTile(idx)) {
        state.moves++;
        updateTilePositions();
        updateStats();
        if (isSolved(state.board)) onWin();
    }
}

boardEl.addEventListener("click", handleBoardClick);
window.addEventListener("resize", updateTilePositions);

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

// ========== RECORDS & UNLOCKS ==========
function applyTheme(themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
    document.body.setAttribute("data-theme", themeId);
}

function applySkin(skinId) {
    document.body.setAttribute("data-skin", skinId);
}

async function loadRecords() {
    const data = await loadFromCloud();
    state.bestTime = data.bestTime != null ? data.bestTime : null;
    state.bestMoves = data.bestMoves != null ? data.bestMoves : null;
    state.wins = data.wins != null ? data.wins : 0;
    state.gamesPlayed = data.gamesPlayed != null ? data.gamesPlayed : 0;
    state.unlockedSkins = data.unlockedSkins || ["standard"];
    state.currentTheme = data.currentTheme || "classic";
    state.currentSkin = data.currentSkin || "standard";
    state.musicEnabled = data.musicEnabled === true;
    state.musicVolume = data.musicVolume != null ? data.musicVolume : 0.3;
    
    if (UNLOCK_ALL_SKINS) {
        const allSkinIds = Object.keys(SKINS);
        const hasNewSkins = allSkinIds.some(id => !state.unlockedSkins.includes(id));
        if (hasNewSkins) {
            state.unlockedSkins = [...allSkinIds];
            saveState();
            console.log('%c[TEST] Все скины разблокированы!', 'color: #2ecc71; font-weight: bold;');
        }
    }

    applyTheme(state.currentTheme);
    applySkin(state.currentSkin);
}

function saveRecordIfBetter(time, moves) {
    let newRecord = false;
    if (state.bestTime == null || time < state.bestTime) {
        state.bestTime = time;
        newRecord = true;
    }
    if (state.bestMoves == null || moves < state.bestMoves) {
        state.bestMoves = moves;
        newRecord = true;
    }
    if (newRecord) {
        submitScore(state.bestTime);
        saveState();
    }
    updateStats();
    return newRecord;
}

function checkUnlocks(time, moves) {
    const newUnlocks = [];
    for (const [skinId, skinData] of Object.entries(SKINS)) {
        if (state.unlockedSkins.includes(skinId) || !skinData.requirement) continue;
        const req = skinData.requirement;
        let unlocked = false;
        if (req.type === "wins" && state.wins >= req.value) unlocked = true;
        else if (req.type === "time" && time < req.value) unlocked = true;
        else if (req.type === "moves" && moves < req.value) unlocked = true;
        
        if (unlocked) {
            state.unlockedSkins.push(skinId);
            newUnlocks.push(t(skinData.nameKey));
        }
    }
    if (newUnlocks.length > 0) saveState();
    return newUnlocks;
}

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

// ========== UI ==========
const winScreen = document.getElementById("win-screen");
const settingsScreen = document.getElementById("settings-screen");
const rulesScreen = document.getElementById("rules-screen");
const recordsScreen = document.getElementById("records-screen");
const loadingScreen = document.getElementById("loading-screen");
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

function showWinScreen(time, moves, isNewRecord, unlockedSkins) {
    document.getElementById("win-time").textContent = formatTime(time);
    document.getElementById("win-moves").textContent = moves;
    const recEl = document.getElementById("win-record");
    recEl.classList.toggle("hidden", !isNewRecord);
    const unlocksEl = document.getElementById("win-unlocks");
    if (unlockedSkins.length > 0) {
        unlocksEl.textContent = t("newSkinUnlocked") + " " + unlockedSkins.join(", ");
        unlocksEl.classList.remove("hidden");
    } else {
        unlocksEl.classList.add("hidden");
    }
    winScreen.classList.remove("hidden");
}

function onWin() {
    stopTimer();
    state.wins++;
    state.gamesPlayed++;
    const isNew = saveRecordIfBetter(state.time, state.moves);
    const unlockedSkins = checkUnlocks(state.time, state.moves);
    saveState();
    
    showWinScreen(state.time, state.moves, isNew, unlockedSkins);

    if (state.gamesPlayed > 0 && state.gamesPlayed % 3 === 0) {
        setTimeout(() => showInterstitialAd(), 1500);
    }
}

function newGame() {
    winScreen.classList.add("hidden");
    resetTimer();
    state.moves = 0;
    state.hasStarted = false;
    state.board = shuffleBoard();
    renderBoard();
    updateStats();
    updateShuffleBtnText();
}

// ========== СТАРТОВЫЙ ЭКРАН ==========
function hideStartScreen() {
    startScreen.classList.add("fade-out");
    if (state.musicEnabled) {
        if (!MusicEngine.initialized) {
            MusicEngine.init();
            MusicEngine.setVolume(state.musicVolume);
        }
        MusicEngine.start();
    }
    setTimeout(() => { startScreen.remove(); }, 500);
}

startBtn.addEventListener("click", hideStartScreen);

// ========== SETTINGS & RECORDS UI ==========
const settingsRefs = { rendered: false, themeItems: {}, skinItems: {}, langItems: {} };

function showSettings() {
    if (!settingsRefs.rendered) { buildSettingsDOM(); settingsRefs.rendered = true; }
    refreshSettingsUI();
    settingsScreen.classList.remove("hidden");
}

async function showRecords() {
    recordsScreen.classList.remove("hidden");
    const list = document.getElementById("records-list");
    list.innerHTML = `<div class="loading-text">${t('loadingRecords')}</div>`;
    const entries = await getLeaderboardEntries();
    list.innerHTML = "";

    if (entries.length === 0) {
        list.innerHTML = `<div class="no-records">${t('noRecords')}</div>`;
        return;
    }

    entries.forEach(entry => {
        const item = document.createElement("div");
        item.className = "record-item";
        if (entry.rank === 1) item.classList.add("top-1");
        else if (entry.rank === 2) item.classList.add("top-2");
        else if (entry.rank === 3) item.classList.add("top-3");
        if (entry.user) item.classList.add("is-user");

        const name = entry.user
            ? (entry.user.publicName || entry.user.uniqueName || t('anonymous'))
            : t('anonymous');

        item.innerHTML = `
            <div class="record-rank">${entry.rank}</div>
            <div class="record-name">${name}</div>
            <div class="record-score">${formatTime(entry.score)}</div>
        `;
        list.appendChild(item);
    });
}

function buildSettingsDOM() {
    const themeGrid = document.getElementById("theme-grid");
    const skinGrid = document.getElementById("skin-grid");
    const langGrid = document.getElementById("lang-grid");
    
    themeGrid.innerHTML = "";
    skinGrid.innerHTML = "";
    if (langGrid) langGrid.innerHTML = "";
    
    settingsRefs.themeItems = {};
    settingsRefs.skinItems = {};
    settingsRefs.langItems = {};

    for (const [themeId, themeKey] of Object.entries(THEMES)) {
        const item = document.createElement("div");
        item.className = "theme-item";
        item.innerHTML = `<div class="theme-preview" data-theme="${themeId}"></div><div class="theme-name">${t(themeKey)}</div>`;
        item.addEventListener("click", () => {
            if (state.currentTheme !== themeId) {
                state.currentTheme = themeId;
                applyTheme(themeId);
                refreshSettingsUI();
                saveState();
            }
        });
        themeGrid.appendChild(item);
        settingsRefs.themeItems[themeId] = item;
    }

    for (const [skinId, skinData] of Object.entries(SKINS)) {
        const item = document.createElement("div");
        item.className = "skin-item";
        let reqHtml = "";
        if (skinData.requirement) {
            const req = skinData.requirement;
            if (req.type === "wins") {
                const plural = req.value === 1 ? t("win") : t("wins");
                reqHtml = `<div class="skin-requirement">${t("unlockedAfter")} ${req.value} ${plural}</div>`;
            } else if (req.type === "time") {
                const plural = (req.value / 60) === 1 ? t("minute") : t("minutes");
                reqHtml = `<div class="skin-requirement">${t("underMinutes")} ${req.value / 60} ${plural}</div>`;
            } else if (req.type === "moves") {
                reqHtml = `<div class="skin-requirement">${t("underMoves")} ${req.value} ${t("movesCount")}</div>`;
            }
        }
        item.innerHTML = `<div class="skin-preview" data-skin="${skinId}">5</div><div class="skin-name">${t(skinData.nameKey)}</div>${reqHtml}`;
        item.addEventListener("click", () => {
            if (!state.unlockedSkins.includes(skinId)) return;
            if (state.currentSkin !== skinId) {
                state.currentSkin = skinId;
                applySkin(skinId);
                refreshSettingsUI();
                saveState();
            }
        });
        skinGrid.appendChild(item);
        settingsRefs.skinItems[skinId] = item;
    }

    if (langGrid) {
        const languages = [
            { code: 'ru', label: t('langRu'), flag: '🇷🇺' },
            { code: 'en', label: t('langEn'), flag: '🇬🇧' }
        ];
        languages.forEach(lang => {
            const item = document.createElement('div');
            item.className = 'lang-item';
            item.innerHTML = `<span class="lang-flag">${lang.flag}</span><span class="lang-label">${lang.label}</span>`;
            item.addEventListener('click', () => {
                if (currentLang !== lang.code) {
                    setLanguage(lang.code);
                    try { localStorage.setItem('puzzle15_lang', lang.code); } catch(e) {}
                    settingsRefs.rendered = false;
                    buildSettingsDOM();
                    refreshSettingsUI();
                    updateShuffleBtnText();
                    updateStats();
                }
            });
            langGrid.appendChild(item);
            settingsRefs.langItems[lang.code] = item;
        });
    }

    const musicToggle = document.getElementById("music-toggle");
    const volumeSlider = document.getElementById("volume-slider");
    const volumeValue = document.getElementById("volume-value");

    musicToggle.addEventListener("click", () => {
        state.musicEnabled = !state.musicEnabled;
        if (state.musicEnabled) {
            if (!MusicEngine.initialized) MusicEngine.init();
            MusicEngine.setVolume(state.musicVolume);
            MusicEngine.start();
        } else {
            MusicEngine.stop();
        }
        refreshSettingsUI();
        saveState();
    });

    volumeSlider.addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10) / 100;
        state.musicVolume = v;
        MusicEngine.setVolume(v);
        volumeValue.textContent = Math.round(v * 100) + "%";
        saveState();
    });

    settingsRefs.musicToggle = musicToggle;
    settingsRefs.volumeControl = document.getElementById("volume-control");
    settingsRefs.volumeSlider = volumeSlider;
    settingsRefs.volumeValue = volumeValue;
}

function refreshSettingsUI() {
    for (const [id, item] of Object.entries(settingsRefs.themeItems)) {
        item.classList.toggle("active", id === state.currentTheme);
    }
    for (const [id, item] of Object.entries(settingsRefs.skinItems)) {
        const isUnlocked = state.unlockedSkins.includes(id);
        item.classList.toggle("active", id === state.currentSkin);
        item.classList.toggle("locked", !isUnlocked);
    }
    if (settingsRefs.langItems) {
        for (const [code, item] of Object.entries(settingsRefs.langItems)) {
            item.classList.toggle("active", code === currentLang);
        }
    }
    if (settingsRefs.musicToggle) {
        settingsRefs.musicToggle.classList.toggle("active", state.musicEnabled);
        settingsRefs.volumeControl.classList.toggle("active", state.musicEnabled);
        settingsRefs.volumeSlider.value = Math.round(state.musicVolume * 100);
        settingsRefs.volumeValue.textContent = Math.round(state.musicVolume * 100) + "%";
    }
}

function renderDemoBoard() {
    const demoBoard = document.getElementById("demo-board");
    if (demoBoard.children.length === TOTAL) return;
    demoBoard.innerHTML = "";
    for (let i = 1; i < TOTAL; i++) {
        const tile = document.createElement("div");
        tile.className = "demo-tile";
        tile.textContent = i;
        demoBoard.appendChild(tile);
    }
    const emptyTile = document.createElement("div");
    emptyTile.className = "demo-tile empty";
    demoBoard.appendChild(emptyTile);
}

// ========== YANDEX SDK INIT ==========
async function initYSDK() {
    try {
        if (typeof YaGames !== 'undefined') {
            ysdk = await YaGames.init();
            isLocal = false;
            
            try {
                const i18n = ysdk.environment?.i18n;
                if (i18n && i18n.lang && LANG[i18n.lang]) {
                    window.__yandexLang = i18n.lang;
                    setLanguage(i18n.lang);
                }
            } catch (e) {}

            try { player = await ysdk.getPlayer(); } catch (e) { console.warn("Player init failed:", e); }
            try { lb = await ysdk.getLeaderboards(); } catch (e) { console.warn("LB init failed:", e); }

            ysdk.features?.LoadingAPI?.ready?.();
            ysdk.on?.('pause', () => onPause());
            ysdk.on?.('resume', () => onResume());
        } else {
            console.log("Running in local mode (SDK not found)");
        }
    } catch (e) {
        console.error("Yandex SDK init failed:", e);
    }
}

// ========== ОПРЕДЕЛЕНИЕ УСТРОЙСТВА ==========
function detectDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = (
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase()) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /macintel/i.test(navigator.platform)) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window)
    );
    
    document.body.classList.toggle('is-mobile', isMobile);
    document.body.classList.toggle('is-desktop', !isMobile);
    
    if (typeof updateTilePositions === 'function') {
        setTimeout(updateTilePositions, 50);
    }
}

// ========== MAIN INIT ==========
async function init() {
    setLanguage(detectLanguage());
    applyLang();
    detectDevice();
    
    await initYSDK();
    await loadRecords();

    MusicEngine._volume = state.musicVolume;
    newGame();

    shuffleBtn.addEventListener("click", newGame);
    document.getElementById("play-again-btn").addEventListener("click", newGame);
    document.getElementById("settings-btn").addEventListener("click", showSettings);
    document.getElementById("settings-close-btn").addEventListener("click", () => settingsScreen.classList.add("hidden"));
    document.getElementById("rules-btn").addEventListener("click", () => { renderDemoBoard(); rulesScreen.classList.remove("hidden"); });
    document.getElementById("rules-close-btn").addEventListener("click", () => rulesScreen.classList.add("hidden"));
    document.getElementById("records-btn").addEventListener("click", showRecords);
    document.getElementById("records-close-btn").addEventListener("click", () => recordsScreen.classList.add("hidden"));

    document.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("dragstart", (e) => e.preventDefault());
    let lastTouchEnd = 0;
    document.addEventListener("touchend", (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

    window.addEventListener('resize', () => {
        detectDevice();
        updateTilePositions();
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            detectDevice();
            updateTilePositions();
        }, 150);
    });

    loadingScreen.classList.add("hidden");
}

init();