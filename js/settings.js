"use strict";

const settingsRefs = { rendered: false, themeItems: {}, skinItems: {}, langItems: {} };

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
          
          setTimeout(() => {
            if (typeof window.adaptToWindow === 'function') {
              window.adaptToWindow();
            }
          }, 100);
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