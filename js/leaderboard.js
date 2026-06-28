"use strict";

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