"use strict";

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