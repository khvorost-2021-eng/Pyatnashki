"use strict";

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