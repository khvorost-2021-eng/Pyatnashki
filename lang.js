const LANG = {
    ru: {
        title: "Пятнашки", time: "Время", moves: "Ходы", bestTime: "Рекорд", bestMoves: "Мин. ходов",
        shuffle: "Перемешать", startOver: "Начать заново", settings: "Настройки", rules: "Правила",
        winTitle: "🎉 Победа!", winText: "Вы собрали пятнашки!", yourTime: "Ваше время",
        yourMoves: "Ваши ходы", newRecord: "🏆 Новый рекорд!", playAgain: "Играть снова",
        settingsTitle: "Настройки", themesTitle: "Тема", skinsTitle: "Скины фишек",
        musicTitle: "Музыка", musicEnabled: "Фоновая музыка", rulesTitle: "Правила",
        rulesGoal: "Цель игры",
        rulesText: "Расставьте числа от 1 до 15 по порядку. Нажимайте на фишки рядом с пустой клеткой. Пустая клетка должна быть в правом нижнем углу.",
        correctPosition: "Правильная расстановка:", howToPlay: "Как играть",
        themeClassic: "Классическая", themeLight: "Светлая", themeNight: "Ночь", themeForest: "Лес",
        skinStandard: "Стандартный", skinWood: "Деревянный", skinGold: "Золотой", skinLightning: "Молния",
        skinStrategist: "Стратег", skinNeon: "Неон", skinSpace: "Космос", skinRainbow: "Радужный",
        unlockedAfter: "После", wins: "побед", win: "победы", underMinutes: "Меньше",
        underMoves: "Меньше", minutes: "минут", minute: "минуты", movesCount: "ходов",
        newSkinUnlocked: "🎁 Новый скин открыт:",
        controlTapDesc: "Нажимайте на фишку, расположенную рядом с пустой клеткой — она переместится на свободное место",
        controlTip: "Двигайте фишки по одной, постепенно собирая ряды сверху вниз",
        loading: "Загрузка...", records: "Рекорды", recordsTitle: "Таблица лидеров",
        noRecords: "Пока нет рекордов. Будьте первым!",
        anonymous: "Игрок", loadingRecords: "Загрузка..."
    }
};

function t(key) { return LANG.ru[key] || key; }

function applyLang() {
    document.querySelectorAll("[data-lang]").forEach(el => {
        const key = el.getAttribute("data-lang");
        if (LANG.ru[key]) el.textContent = LANG.ru[key];
    });
}