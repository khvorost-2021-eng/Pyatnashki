"use strict";
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
}

// ========== ✅ АДАПТАЦИЯ ЧЕРЕЗ TRANSFORM: SCALE() ==========
function adaptToWindow() {
  const container = document.querySelector('.game-container');
  const app = document.querySelector('.app');
  if (!container || !app) return;
  
  container.style.transform = 'none';
  void container.offsetHeight;
  
  // ✅ На мобильных — CSS уже адаптирован через body.is-mobile, не масштабируем!
  if (document.body.classList.contains('is-mobile')) {
    requestAnimationFrame(updateTilePositions);
    return;
  }
  
  // Десктоп — масштабируем если не помещается
  const appWidth = app.offsetWidth;
  const appHeight = app.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  const scaleX = windowWidth / appWidth;
  const scaleY = windowHeight / appHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  
  container.style.transform = scale < 1 ? `scale(${scale})` : 'none';
  
  requestAnimationFrame(updateTilePositions);
}

window.adaptToWindow = adaptToWindow;

// ========== ЗАПРЕТ МАСШТАБИРОВАНИЯ БРАУЗЕРОМ ==========
function preventZoom(e) {
  if (e.ctrlKey || e.metaKey) e.preventDefault();
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) &&
      (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || e.key === '_')) {
    e.preventDefault();
  }
});

document.addEventListener('wheel', preventZoom, { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

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

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      detectDevice();
      adaptToWindow();
    }, 50);
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      detectDevice();
      adaptToWindow();
    }, 200);
  });

  setTimeout(adaptToWindow, 100);
  loadingScreen.classList.add("hidden");
}

init();