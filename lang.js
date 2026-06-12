const LANG = {
    ru: {
        title: "Пятнашки",
        subtitle: "Классическая головоломка",
        loading: "Загрузка...",
        startGame: "Начать игру",

        time: "Время",
        moves: "Ходы",
        bestTime: "Рекорд",
        bestMoves: "Мин. ходов",

        shuffle: "Перемешать",
        startOver: "Начать заново",
        settings: "Настройки",
        rules: "Правила",
        records: "Рекорды",
        playAgain: "Играть снова",

        winTitle: "🎉 Победа!",
        winText: "Вы собрали пятнашки!",
        yourTime: "Ваше время",
        yourMoves: "Ваши ходы",
        newRecord: "🏆 Новый рекорд!",
        newSkinUnlocked: "🎁 Новый скин открыт:",

        settingsTitle: "Настройки",
        themesTitle: "Тема",
        skinsTitle: "Скины фишек",
        languageTitle: "Язык",
        musicTitle: "Музыка",
        musicEnabled: "Фоновая музыка",
        recordsTitle: "Таблица лидеров",
        noRecords: "Пока нет рекордов. Будьте первым!",
        loadingRecords: "Загрузка...",
        anonymous: "Игрок",

        rulesTitle: "Правила",
        rulesGoal: "Цель игры",
        rulesText: "Расставьте числа от 1 до 15 по порядку. Нажимайте на фишки рядом с пустой клеткой. Пустая клетка должна быть в правом нижнем углу.",
        correctPosition: "Правильная расстановка:",
        howToPlay: "Как играть",
        controlTapDesc: "Нажимайте на фишку, расположенную рядом с пустой клеткой — она переместится на свободное место",
        controlTip: "Двигайте фишки по одной, постепенно собирая ряды сверху вниз",

        themeClassic: "Классическая",
        themeLight: "Светлая",
        themeNight: "Ночь",
        themeForest: "Лес",

        skinStandard: "Стандартный",
        skinWood: "Деревянный",
        skinGold: "Золотой",
        skinLightning: "Молния",
        skinStrategist: "Стратег",
        skinNeon: "Неон",
        skinSpace: "Космос",
        skinRainbow: "Радужный",

        unlockedAfter: "После",
        wins: "побед",
        win: "победы",
        underMinutes: "Меньше",
        underMoves: "Меньше",
        minutes: "минут",
        minute: "минуты",
        movesCount: "ходов",

        langRu: "Русский",
        langEn: "English"
    },

    en: {
        title: "15 Puzzle",
        subtitle: "Classic sliding puzzle",
        loading: "Loading...",
        startGame: "Start Game",

        time: "Time",
        moves: "Moves",
        bestTime: "Best",
        bestMoves: "Min. moves",

        shuffle: "Shuffle",
        startOver: "Start Over",
        settings: "Settings",
        rules: "Rules",
        records: "Records",
        playAgain: "Play Again",

        winTitle: "🎉 You Win!",
        winText: "You solved the puzzle!",
        yourTime: "Your time",
        yourMoves: "Your moves",
        newRecord: "🏆 New Record!",
        newSkinUnlocked: "🎁 New skin unlocked:",

        settingsTitle: "Settings",
        themesTitle: "Theme",
        skinsTitle: "Tile Skins",
        languageTitle: "Language",
        musicTitle: "Music",
        musicEnabled: "Background music",
        recordsTitle: "Leaderboard",
        noRecords: "No records yet. Be the first!",
        loadingRecords: "Loading...",
        anonymous: "Player",

        rulesTitle: "Rules",
        rulesGoal: "Goal",
        rulesText: "Arrange the numbers from 1 to 15 in order. Tap tiles next to the empty space to move them. The empty space should end up in the bottom-right corner.",
        correctPosition: "Correct arrangement:",
        howToPlay: "How to play",
        controlTapDesc: "Tap a tile next to the empty space — it will slide into the free spot",
        controlTip: "Move tiles one by one, solving the rows from top to bottom",

        themeClassic: "Classic",
        themeLight: "Light",
        themeNight: "Night",
        themeForest: "Forest",

        skinStandard: "Standard",
        skinWood: "Wooden",
        skinGold: "Golden",
        skinLightning: "Lightning",
        skinStrategist: "Strategist",
        skinNeon: "Neon",
        skinSpace: "Space",
        skinRainbow: "Rainbow",

        unlockedAfter: "After",
        wins: "wins",
        win: "win",
        underMinutes: "Under",
        underMoves: "Under",
        minutes: "minutes",
        minute: "minute",
        movesCount: "moves",

        langRu: "Русский",
        langEn: "English"
    }
};

let currentLang = 'ru';

function setLanguage(lang) {
    if (LANG[lang]) {
        currentLang = lang;
        applyLang();
    }
}

function t(key) {
    return (LANG[currentLang] && LANG[currentLang][key]) || LANG.ru[key] || key;
}

function applyLang() {
    document.documentElement.setAttribute('lang', currentLang);
    document.title = t('title');
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        if (LANG[currentLang] && LANG[currentLang][key]) {
            el.textContent = LANG[currentLang][key];
        } else if (LANG.ru[key]) {
            el.textContent = LANG.ru[key];
        }
    });
}

function detectLanguage() {
    try {
        const saved = localStorage.getItem('puzzle15_lang');
        if (saved && LANG[saved]) return saved;
    } catch (e) {}

    if (window.__yandexLang && LANG[window.__yandexLang]) return window.__yandexLang;

    const browserLang = (navigator.language || navigator.userLanguage || 'ru').slice(0, 2).toLowerCase();
    if (LANG[browserLang]) return browserLang;

    return 'ru';
}