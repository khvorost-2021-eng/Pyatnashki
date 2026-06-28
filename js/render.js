"use strict";
const boardEl = document.getElementById("board");
const shuffleBtn = document.getElementById("shuffle-btn");
let tileEls = {};
let currentScale = 1;

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
    el.classList.toggle('correct', (v === i + 1));
  }
}

function updateTilePositions() {
  if (Object.keys(tileEls).length === 0 || state.board.length === 0) return;
  
  const rect = boardEl.getBoundingClientRect();
  const boardWidth = rect.width;
  const boardHeight = rect.height;
  
  if (boardWidth === 0 || boardHeight === 0) return;

  const gap = 6;
  const innerPadding = 4;
  const boardSize = Math.min(boardWidth, boardHeight);
  const availableSize = boardSize - innerPadding * 2;
  const tileSize = (availableSize - gap * (SIZE + 1)) / SIZE;
  const offsetX = (boardWidth - boardSize) / 2 + innerPadding;
  const offsetY = (boardHeight - boardSize) / 2 + innerPadding;

  for (let i = 0; i < TOTAL; i++) {
    const v = state.board[i];
    if (v === EMPTY || v === undefined) continue;
    const row = Math.floor(i / SIZE), col = i % SIZE;
    const x = offsetX + gap + col * (tileSize + gap);
    const y = offsetY + gap + row * (tileSize + gap);
    const el = tileEls[v];
    if (!el) continue;
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