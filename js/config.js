// ==================== 游戏配置 ====================
const CONFIG = {
    language: 'zh',
    leaderboardSize: 10,
    strongTransferRate: 40,
    weakTransferRate: 5,
    aiSeagullCount: 20,
    aiPlayerCount: 3,
    worldWidth: 5000,
    worldHeight: 5000,
    minZoom: 0.5,
    maxZoom: 3.0,
    initialPlayerPower: 100,
    maxSeagullSize: 5.0,  // 海鸥的最大显示大小（防止能力值很高时海鸥占满屏幕）
    scallopPowerValue: 10,  // 默认值，会被不同大小的扇贝覆盖
    scallopSizeIncrease: 0.1,
    showPowerTransfers: true,
    enableMiniMap: true,
    enableEnhancedAI: true,
    // 扇贝配置
    scallopTypes: {
        small: {
            size: 6,
            powerValue: 5,
            probability: 0.5,  // 50%
            colors: {
                outer: '#FFFACD',
                inner: '#FFE4B5'
            }
        },
        medium: {
            size: 10,
            powerValue: 10,
            probability: 0.35,  // 35%
            colors: {
                outer: '#FFFFFF',
                inner: '#FFB74D'
            }
        },
        large: {
            size: 15,
            powerValue: 20,
            probability: 0.15,  // 15%
            colors: {
                outer: '#FFD700',
                inner: '#FF8C00'
            }
        }
    },
    scallopCount: 500,  // 扇贝总数量（可配置）
    scallopDensity: 500,  // 扇贝密度（每次重新生成时的数量）
    
    // 扇贝王系统
    scallopKing: {
        enabled: true,  // 是否启用扇贝王
        growthTime: 60000,  // 成长为扇贝王的时间（毫秒）60秒
        powerPercentOfTopSeagull: 0.05,  // 扇贝王能力值为最高海鸥的5%
        minPowerValue: 50,  // 最低能力值
        size: 25,  // 扇贝王的大小
        probability: 0.02,  // 2%概率生成扇贝王候选
        colors: {
            outer: '#FF1493',  // 深粉色
            inner: '#FF69B4',  // 粉红色
            glow: '#FFD700'    // 金色光晕
        }
    },
    
    // 变质扇贝系统
    spoiledScallop: {
        enabled: true,  // 是否启用变质扇贝
        probability: 0.08,  // 8%概率变质
        powerMultiplier: -10,  // 扣除能力值倍数（负值表示扣除）
        colors: {
            outer: '#696969',  // 深灰色
            inner: '#2F4F2F'   // 暗绿色
        },
        warningDistance: 80  // 警告距离（在此距离内会显示警告标记）
    },
    
    // 排行榜奖章系统
    leaderboardBadges: {
        enabled: true,  // 是否显示排行榜奖章
        showRankNumber: true,  // 是否显示排名数字
        showTrophies: true,  // 是否显示前三名奖杯
        trophyColors: {
            first: '#FFD700',   // 金色
            second: '#C0C0C0',  // 银色
            third: '#CD7F32'    // 铜色
        }
    },
    
    // 扇贝成长系统
    scallopGrowth: {
        enabled: true,  // 是否启用成长系统
        smallToMediumTime: 15000,  // 小扇贝成长为中扇贝的时间（毫秒）15秒
        mediumToLargeTime: 25000,  // 中扇贝成长为大扇贝的时间（毫秒）25秒
        growthSpeed: 1.0,  // 成长速度倍率（1.0 = 正常速度，2.0 = 2倍速）
        showGrowthEffect: true  // 是否显示成长特效
    }
};

// ==================== 多语言支持 ====================
const TRANSLATIONS = {
    zh: {
        gameTitle: "海鸥吃扇贝.io",
        gameSubtitle: "完整版：多用户、能力值系统、智能AI、中英文双语、小地图",
        playerNameLabel: "玩家名称",
        powerLabel: "能力值",
        sizeLabel: "大小",
        scallopsEatenLabel: "吃掉扇贝",
        gameTimeLabel: "游戏时间",
        playerCountLabel: "玩家数量",
        aiPlayerCountStatic: "AI玩家数量",
        leaderboardSizeLabel: "排行榜数量",
        strongTransferLabel: "强海鸥获得%",
        weakTransferLabel: "弱海鸥损失%",
        aiCountLabel: "AI海鸥数量",
        aiPlayerCountLabel: "AI玩家数量",
        scallopDensityLabel: "扇贝密度",
        growthSpeedLabel: "成长速度",
        startButton: "开始游戏",
        pauseButton: "暂停/继续",
        restartButton: "重新开始",
        changeNameButton: "更改名称",
        languageBtn: "English",
        minimapBtn: "切换小地图",
        gameStatusTitle: "游戏状态",
        gameSettingsTitle: "游戏设置",
        instructionsTitle: "游戏说明",
        leaderboardTitle: "排行榜",
        updateButton: "更新",
        gameOverTitle: "游戏结束!",
        finalPowerLabel: "最终能力值:",
        lastUpdateLabel: "最后更新:",
        instruction1: "鼠标左键拖拽控制海鸥移动",
        instruction2: "拖拽时按住右键加速",
        instruction3: "吃掉扇贝增加能力值和大小",
        instruction4: "强海鸥遇到弱海鸥会转移能力值",
        instruction5: "能力值清零时海鸥死亡",
        instruction6: "使用滚轮或+/-按钮缩放地图",
        instruction7: "点击小地图快速跳转位置",
        instruction8: "AI玩家具有智能觅食和避险能力",
        controlHintTitle: "游戏控制说明",
        controlHintText: "使用鼠标拖拽控制海鸥移动：",
        controlHintStart: "点击任意位置开始游戏",
        overlayCoord: "坐标:",
        overlayMap: "地图:",
        overlaySpeed: "速度:",
        overlayZoom: "缩放:"
    },
    en: {
        gameTitle: "Seagull Eat Scallops.io",
        gameSubtitle: "Complete: Multiplayer, Power System, Smart AI, Bilingual, Mini Map",
        playerNameLabel: "Player Name",
        powerLabel: "Power",
        sizeLabel: "Size",
        scallopsEatenLabel: "Scallops Eaten",
        gameTimeLabel: "Game Time",
        playerCountLabel: "Player Count",
        aiPlayerCountStatic: "AI Player Count",
        leaderboardSizeLabel: "Leaderboard Size",
        strongTransferLabel: "Strong Gain %",
        weakTransferLabel: "Weak Lose %",
        aiCountLabel: "AI Seagulls",
        aiPlayerCountLabel: "AI Players",
        scallopDensityLabel: "Scallop Density",
        growthSpeedLabel: "Growth Speed",
        startButton: "Start Game",
        pauseButton: "Pause/Resume",
        restartButton: "Restart",
        changeNameButton: "Change Name",
        languageBtn: "中文",
        minimapBtn: "Toggle Mini Map",
        gameStatusTitle: "Game Status",
        gameSettingsTitle: "Game Settings",
        instructionsTitle: "Instructions",
        leaderboardTitle: "Leaderboard",
        updateButton: "Update",
        gameOverTitle: "Game Over!",
        finalPowerLabel: "Final Power:",
        lastUpdateLabel: "Last Update:",
        instruction1: "Left-click and drag to control seagull",
        instruction2: "Hold right-click while dragging to boost",
        instruction3: "Eat scallops to increase power and size",
        instruction4: "Stronger seagulls transfer power from weaker ones",
        instruction5: "Seagull dies when power reaches zero",
        instruction6: "Use mouse wheel or +/- buttons to zoom",
        instruction7: "Click mini map to jump to location",
        instruction8: "AI players have intelligent foraging and evasion",
        controlHintTitle: "Game Controls",
        controlHintText: "Use mouse to control seagull movement:",
        controlHintStart: "Click anywhere to start game",
        overlayCoord: "Coord:",
        overlayMap: "Map:",
        overlaySpeed: "Speed:",
        overlayZoom: "Zoom:"
    }
};

// 导出配置
window.CONFIG = CONFIG;
window.TRANSLATIONS = TRANSLATIONS;