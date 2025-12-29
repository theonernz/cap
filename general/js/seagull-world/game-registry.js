// ==================== 海鸥世界游戏注册系统 ====================
/**
 * Seagull World Game Registry
 * 统一管理海鸥世界平台下的所有游戏
 * 支持多游戏共享账号系统
 */

const SeagullWorldGameRegistry = {
    // 当前游戏ID（在各游戏的config.js中配置）
    currentGameId: 'scallopsIO',
    
    // 游戏注册表
    games: {
        scallopsIO: {
            id: 'scallopsIO',
            name: {
                en: 'Seagull Eat Scallops.io',
                zh: '海鸥吃扇贝.io'
            },
            version: '1.0.8',
            category: 'action',
            icon: '🦅',
            description: {
                en: 'Control a seagull to eat scallops and grow stronger!',
                zh: '控制海鸥吃扇贝，成长为最强者！'
            },
            stats: {
                totalPlays: 0,
                totalPlayTime: 0,
                highScore: 0,
                achievements: []
            }
        }
        // 未来可添加更多游戏：
        // seagullRacing: { ... },
        // seagullAdventure: { ... },
        // etc.
    },
    
    /**
     * 获取当前游戏信息
     */
    getCurrentGame() {
        return this.games[this.currentGameId];
    },
    
    /**
     * 获取游戏显示名称
     * @param {string} lang - 'en' or 'zh'
     */
    getGameName(lang = 'en') {
        const game = this.getCurrentGame();
        return game ? game.name[lang] || game.name.en : 'Unknown Game';
    },
    
    /**
     * 获取所有游戏列表
     */
    getAllGames() {
        return Object.values(this.games);
    },
    
    /**
     * 检查游戏是否存在
     * @param {string} gameId
     */
    isGameRegistered(gameId) {
        return !!this.games[gameId];
    },
    
    /**
     * 更新游戏统计数据
     * @param {string} gameId
     * @param {Object} stats - { totalPlays, totalPlayTime, highScore, achievements }
     */
    updateGameStats(gameId, stats) {
        if (this.isGameRegistered(gameId)) {
            this.games[gameId].stats = {
                ...this.games[gameId].stats,
                ...stats
            };
        }
    },
    
    /**
     * 获取游戏统计数据
     * @param {string} gameId
     */
    getGameStats(gameId) {
        return this.isGameRegistered(gameId) ? this.games[gameId].stats : null;
    },
    
    /**
     * 注册新游戏（供未来扩展使用）
     * @param {Object} gameInfo - 游戏信息对象
     */
    registerGame(gameInfo) {
        if (!gameInfo.id) {
            console.error('Game ID is required for registration');
            return false;
        }
        
        this.games[gameInfo.id] = {
            id: gameInfo.id,
            name: gameInfo.name || { en: 'Unnamed Game', zh: '未命名游戏' },
            version: gameInfo.version || '1.0.0',
            category: gameInfo.category || 'other',
            icon: gameInfo.icon || '🎮',
            description: gameInfo.description || { en: '', zh: '' },
            stats: {
                totalPlays: 0,
                totalPlayTime: 0,
                highScore: 0,
                achievements: []
            }
        };
        
        return true;
    },
    
    /**
     * 获取游戏存档key前缀
     * @param {string} gameId
     */
    getSavePrefix(gameId = this.currentGameId) {
        return `seagullWorld_save_${gameId}_`;
    },
    
    /**
     * 获取游戏数据key前缀
     * @param {string} gameId
     */
    getDataPrefix(gameId = this.currentGameId) {
        return `seagullWorld_data_${gameId}_`;
    }
};

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.SeagullWorldGameRegistry = SeagullWorldGameRegistry;
}
