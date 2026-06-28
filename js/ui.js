"use strict";

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

  let currentUserUniqueName = null;
  if (player && player.getUniqueName) {
    try { currentUserUniqueName = player.getUniqueName(); } catch (e) {}
  }

  entries.forEach(entry => {
    const item = document.createElement("div");
    item.className = "record-item";
    if (entry.rank === 1) item.classList.add("top-1");
    else if (entry.rank === 2) item.classList.add("top-2");
    else if (entry.rank === 3) item.classList.add("top-3");

    const name = entry.publicName
        || entry.uniqueName
        || (entry.player && (entry.player.publicName || entry.player.uniqueName))
        || t('anonymous');

    if (currentUserUniqueName && entry.uniqueName && entry.uniqueName === currentUserUniqueName) {
      item.classList.add("is-user");
    }

    item.innerHTML = `
      <div class="record-rank">${entry.rank}</div>
      <div class="record-name">${name}</div>
      <div class="record-score">${formatTime(entry.score)}</div>
    `;
    list.appendChild(item);
  });
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