"use strict";

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