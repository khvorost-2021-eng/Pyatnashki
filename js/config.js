"use strict";

const UNLOCK_ALL_SKINS = false;
let ysdk = null;
let player = null;
let lb = null;
let isLocal = true;
const LEADERBOARD_NAME = 'fifteenpuzzle';
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