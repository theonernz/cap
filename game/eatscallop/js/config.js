// ==================== 游戏配置 ====================
const CONFIG = {
    // 海鸥世界游戏ID（用于统一认证系统）
    gameId: 'scallopsIO',
    gameName: {
        en: 'Seagull Eat Scallops.io',
        zh: '海鸥吃扇贝.io'
    },
    
    language: 'en',
    leaderboardSize: 10,
    strongTransferRate: 40,
    weakTransferRate: 5,
    aiSeagullCount: 50,      // AI海鸥数量增加到50
    aiPlayerCount: 5,        // AI玩家数量增加到5
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
    scallopCount: 800,  // 扇贝总数量（增加到800）
    scallopDensity: 800,  // 扇贝密度（增加到800）
    
    // 扇贝王系统
    scallopKing: {
        enabled: true,  // 是否启用扇贝王
        maxKingScallops: 1,  // 最大同时存在的扇贝王数量
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
        probability: 0.03,  // 3%概率变质（可配置）
        maxPercentage: 0.03,  // 最多占扇贝总数的3%
        cleanupInterval: 10000,  // 每10秒清理一次多余的变质扇贝
        lifetime: 30000,  // 变质扇贝生命周期（30秒后腐烂消失）
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
        gameSubtitle: "唯一出品：特别为洧麟，雨荷，宇松和语丹制作。",
        statValue: "玩家海鸥",
        defaultPlayerName: "海鸥玩家",
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
        saveButton: "💾 保存游戏",
        loadButton: "📂 加载游戏",
        languageBtn: "English",
        minimapBtn: "切换小地图",
        gameStatusTitle: "游戏状态",
        gameSettingsTitle: "游戏设置",
        instructionsTitle: "游戏说明",
        instructionsPanelTitle: "游戏说明",
        settingsPanelTitle: "游戏设置",
        leaderboardTitle: "排行榜",
        updateButton: "更新",
        gameOverTitle: "游戏结束!",
        gameOverRestartBtn: "重新开始",
        finalPowerLabel: "最终能力值:",
        lastUpdateLabel: "最后更新:",
        instruction1: "鼠标左键点击移动到指定位置（自动跟随鼠标）",
        instruction2: "移动时可实时改变方向，更加流畅",
        instruction3: "吃掉扇贝增加能力值和大小",
        instruction4: "强海鸥遇到弱海鸥会转移能力值",
        instruction5: "能力值清零时海鸥死亡",
        instruction6: "使用滚轮、+/-或按键1/2/3切换3级缩放（1.0x/1.5x/2.0x）",
        instruction7: "点击小地图快速跳转位置",
        instruction8: "AI玩家具有智能觅食和避险能力",
        instruction9: "Ctrl+S 快速保存，Ctrl+L 快速加载",
        controlHintTitle: "游戏控制说明",
        controlHintText: "使用鼠标控制海鸥移动：",
        controlHintStart: "点击任意位置开始游戏",
        controlHintLeftClick: "鼠标左键点击",
        controlHintLeftClickDesc: "移动到指定位置（自动跟随鼠标）",
        controlHintDoubleLeftClick: "双击鼠标左键",
        controlHintDoubleLeftClickDesc: "紧急刹车（瞬间停止）",
        controlHintMouseMove: "移动时自动跟随鼠标",
        controlHintMouseMoveDesc: "实时改变移动方向",
        controlHintRightClick: "鼠标右键点击",
        controlHintRightClickDesc: "速度加成（1.5倍）",
        controlHintDoubleRightClick: "双击鼠标右键",
        controlHintDoubleRightClickDesc: "最大加速（2.0倍）",
        controlHintSpace: "空格键",
        controlHintSpaceDesc: "快速停止",
        controlHintWheel: "鼠标滚轮",
        controlHintWheelDesc: "缩放地图",
        controlHintMinimap: "点击小地图",
        controlHintMinimapDesc: "快速跳转位置",
        lastUpdate: "最后更新:",
        toggleMinimapBtn: "切换小地图",
        overlayCoord: "坐标:",
        overlayMap: "地图:",
        overlaySpeed: "速度:",
        overlayZoom: "缩放:",
        // AI and game text
        aiPlayerPrefix: "AI玩家",
        aiSeagullPrefix: "海鸥",
        fartAttackText: "💥放屁攻击!",
        minimapTitle: "小地图",
        minimapShowBtn: "显示小地图",
        // Prompts and notifications
        promptNewName: "请输入新的玩家名称:",
        notifGameNotStarted: "请先开始游戏!",
        notifSaveSuccess: "游戏已保存!",
        notifSaveFailed: "保存失败!",
        notifLoadingAutoSave: "加载自动保存...",
        notifNoSaveFound: "没有找到保存的游戏!",
        notifLoadSuccess: "游戏已加载!",
        notifLoadFailed: "加载失败!",
        notifSavedAt: "保存于:",
        notifSaveDeleted: "保存已删除",
        notifLoadPrompt: "检测到保存的游戏，是否加载？\n点击\"加载游戏\"按钮继续上次的游戏。",
        // Pause overlay
        pausedTitle: "已暂停",
        pauseResume: "按 暂停/继续 按钮继续游戏",
        pauseWarning: "⚠️ 多人游戏中，游戏世界仍在继续！",
        // 新增翻译
        multiplayerButton: "🌐 开始多人游戏",
        backToLobbyBtn: "⬅️ 返回游戏大厅",
        worldPlatform: "🦅 海鸥世界 Seagull World",
        gameBadge: "游戏: 海鸥吃扇贝",
        singlePlayerButton: "开始游戏（单人模式）"
    },
    en: {
        gameTitle: "Seagull Eat Scallops.io",
        gameSubtitle: "TheOner Product: special for Weilin, Elaine, Jason and Maymay!",
        statValue: "Player Seagull",
        defaultPlayerName: "Player Seagull",
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
        saveButton: "💾 Save Game",
        loadButton: "📂 Load Game",
        languageBtn: "中文",
        minimapBtn: "Toggle Mini Map",
        gameStatusTitle: "Game Status",
        gameSettingsTitle: "Game Settings",
        instructionsTitle: "Instructions",
        instructionsPanelTitle: "Instructions",
        settingsPanelTitle: "Game Settings",
        leaderboardTitle: "Leaderboard",
        updateButton: "Update",
        gameOverTitle: "Game Over!",
        gameOverRestartBtn: "Restart",
        finalPowerLabel: "Final Power:",
        lastUpdateLabel: "Last Update:",
        instruction1: "Left-click to move toward location (auto-follow mouse)",
        instruction2: "Real-time direction change while moving for smoother control",
        instruction3: "Eat scallops to increase power and size",
        instruction4: "Stronger seagulls transfer power from weaker ones",
        instruction5: "Seagull dies when power reaches zero",
        instruction6: "Use mouse wheel, +/-, or keys 1/2/3 for 3-level zoom (1.0x/1.5x/2.0x)",
        instruction7: "Click mini map to jump to location",
        instruction8: "AI players have intelligent foraging and evasion",
        instruction9: "Ctrl+S to quick save, Ctrl+L to quick load",
        controlHintTitle: "Game Controls",
        controlHintText: "Use mouse to control seagull movement:",
        controlHintStart: "Click anywhere to start game",
        controlHintLeftClick: "Left-click",
        controlHintLeftClickDesc: "Move toward location (auto-follow mouse)",
        controlHintDoubleLeftClick: "Double left-click",
        controlHintDoubleLeftClickDesc: "Emergency brake (instant stop)",
        controlHintMouseMove: "Auto-follow mouse while moving",
        controlHintMouseMoveDesc: "Real-time direction change",
        controlHintRightClick: "Right-click",
        controlHintRightClickDesc: "Speed boost (1.5x)",
        controlHintDoubleRightClick: "Double right-click",
        controlHintDoubleRightClickDesc: "Max boost (2.0x)",
        controlHintSpace: "Space key",
        controlHintSpaceDesc: "Quick stop",
        controlHintWheel: "Mouse wheel",
        controlHintWheelDesc: "Zoom map",
        controlHintMinimap: "Click mini map",
        controlHintMinimapDesc: "Jump to location",
        lastUpdate: "Last Update:",
        toggleMinimapBtn: "Toggle Mini Map",
        overlayCoord: "Coord:",
        overlayMap: "Map:",
        overlaySpeed: "Speed:",
        overlayZoom: "Zoom:",
        // AI and game text
        aiPlayerPrefix: "AIPlayer",
        aiSeagullPrefix: "Seagull",
        fartAttackText: "💥Fart Attack!",
        minimapTitle: "Mini Map",
        minimapShowBtn: "Show Mini Map",
        // Prompts and notifications
        promptNewName: "Enter new player name:",
        notifGameNotStarted: "Please start the game first!",
        notifSaveSuccess: "Game saved!",
        notifSaveFailed: "Save failed!",
        notifLoadingAutoSave: "Loading auto-save...",
        notifNoSaveFound: "No saved game found!",
        notifLoadSuccess: "Game loaded!",
        notifLoadFailed: "Load failed!",
        notifSavedAt: "Saved:",
        notifSaveDeleted: "Save deleted",
        notifLoadPrompt: "Saved game detected! Click \"Load Game\" to continue your previous game.",
        // Pause overlay
        pausedTitle: "PAUSED",
        pauseResume: "Press Pause/Resume to continue",
        pauseWarning: "⚠️ Game world continues in multiplayer!",
        // 新增翻译
        multiplayerButton: "🌐 Start Multiplayer",
        backToLobbyBtn: "⬅️ Back to Lobby",
        worldPlatform: "🦅 Seagull World",
        gameBadge: "Game: Seagull Eat Scallops",
        singlePlayerButton: "Start Game (Single Player)"
    }
};

// 导出配置
window.CONFIG = CONFIG;
window.TRANSLATIONS = TRANSLATIONS;