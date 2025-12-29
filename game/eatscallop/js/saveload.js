// ==================== Player Identity System ====================
// 集成海鸥世界统一认证系统
const PlayerIdentity = {
    PLAYER_ID_KEY: 'seagullGame_playerId',
    USERNAME_KEY: 'seagullGame_username',
    SEAGULL_NAME_KEY: 'seagullGame_seagullName',
    
    // 检查是否为匿名模式
    isAnonymousMode() {
        return sessionStorage.getItem('anonymousMode') === 'true';
    },
    
    // 获取或创建玩家ID（首次访问时自动生成UUID）
    // 如果已登录海鸥世界，优先使用统一账号
    getOrCreatePlayerId() {
        // 匿名模式：生成临时ID
        if (this.isAnonymousMode()) {
            return 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        }
        
        // 优先使用海鸥世界账号
        if (typeof SeagullWorldAuth !== 'undefined') {
            const session = SeagullWorldAuth.getCurrentSession();
            if (session) {
                return session.userId;  // 使用统一账号ID
            }
        }
        
        // 回退到旧的本地ID（向后兼容）
        let playerId = localStorage.getItem(this.PLAYER_ID_KEY);
        
        if (!playerId) {
            // 生成唯一的玩家ID：player_时间戳_随机字符串
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem(this.PLAYER_ID_KEY, playerId);
            console.log('🆔 Created new player ID:', playerId);
        }
        
        return playerId;
    },
    
    // 获取用户名（用于存档文件名）
    getUsername() {
        // 匿名模式：返回临时用户名
        if (this.isAnonymousMode()) {
            return 'Anonymous_' + Date.now().toString(36).substring(2, 8).toUpperCase();
        }
        
        // 优先使用海鸥世界账号名
        if (typeof SeagullWorldAuth !== 'undefined') {
            const session = SeagullWorldAuth.getCurrentSession();
            if (session && session.username) {
                return session.username;
            }
        }
        
        // 回退到本地存储的用户名
        let username = localStorage.getItem(this.USERNAME_KEY);
        if (!username) {
            // 生成默认用户名
            username = 'Player_' + Date.now().toString(36).substring(2, 8).toUpperCase();
            this.setUsername(username);
        }
        
        return username;
    },
    
    // 设置用户名
    setUsername(username) {
        localStorage.setItem(this.USERNAME_KEY, username);
    },
    
    // 获取海鸥名（用于游戏内显示）
    getSeagullName() {
        // 匿名模式：使用sessionStorage中的匿名玩家名
        if (this.isAnonymousMode()) {
            const anonymousName = sessionStorage.getItem('anonymousPlayerName');
            if (anonymousName) {
                return anonymousName;
            }
            return 'Anonymous Seagull ' + Math.floor(Math.random() * 1000);
        }
        
        // 检查是否用户特别设置过海鸥名
        let seagullName = localStorage.getItem(this.SEAGULL_NAME_KEY);
        if (seagullName) {
            return seagullName;
        }
        
        // 如果没有设置过，使用用户名作为初始海鸥名
        return this.getUsername();
    },
    
    // 设置海鸥名（用户修改时调用）
    setSeagullName(name) {
        localStorage.setItem(this.SEAGULL_NAME_KEY, name);
        console.log('🦅 Seagull name updated:', name);
    },
    
    // 检查海鸥名是否被用户修改过
    hasCustomSeagullName() {
        return localStorage.getItem(this.SEAGULL_NAME_KEY) !== null;
    },    
    // 获取当前玩家身份信息
    getCurrentIdentity() {
        // 优先使用海鸥世界账号信息
        if (typeof SeagullWorldAuth !== 'undefined') {
            const ownerInfo = SeagullWorldAuth.getCurrentOwnerInfo();
            if (ownerInfo) {
                return ownerInfo;  // 返回完整的海鸥世界用户信息
            }
        }
        
        // 回退到旧的本地身份（向后兼容）
        return {
            playerId: this.getOrCreatePlayerId(),
            username: this.getUsername(),
            playerName: this.getSeagullName(),
            createdAt: Date.now()
        };
    },
    
    // 检查当前玩家是否是存档的所有者
    isOwner(saveData) {
        // 优先使用海鸥世界认证系统
        if (typeof SeagullWorldAuth !== 'undefined' && saveData.owner && saveData.owner.userId) {
            return SeagullWorldAuth.isOwner(saveData);
        }
        
        // 回退到旧的PlayerIdentity验证（向后兼容）
        // 旧版存档没有owner信息，为了向后兼容，允许访问
        if (!saveData.owner) {
            console.warn('⚠️ Save has no owner info (old version), allowing access');
            return true;
        }
        
        const currentPlayerId = this.getOrCreatePlayerId();
        const isOwner = saveData.owner.playerId === currentPlayerId;
        
        if (!isOwner) {
            console.log('🚫 Access denied: current player', currentPlayerId, 'vs owner', saveData.owner.playerId);
        }
        
        return isOwner;
    },
    
    // 显示玩家ID（用于调试）
    showCurrentPlayerId() {
        const playerId = this.getOrCreatePlayerId();
        console.log('🆔 Your Player ID:', playerId);
        return playerId;
    }
};

// ==================== Save/Load System ====================
const SaveLoadSystem = {
    SAVE_KEY_PREFIX: 'seagullGame_save_',  // 存档键前缀，后面加用户名
    AUTO_SAVE_INTERVAL: 30000, // Auto-save every 30 seconds
    autoSaveTimer: null,
      // 获取当前用户的存档键
    getCurrentSaveKey() {
        const username = PlayerIdentity.getUsername();
        return this.SAVE_KEY_PREFIX + username;
    },
    
    // 获取当前用户的自动存档键
    getCurrentAutoSaveKey() {
        return this.getCurrentSaveKey() + '_auto';
    },
      // 获取所有单人存档（类似多人模式的3个存档系统）
    async getSinglePlayerSaves() {
        try {
            const username = PlayerIdentity.getUsername();
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.getSavesByUser(username, false);
            // Extract saves array from response
            const saves = result.success ? result.saves : [];
            
            // Filter and sort saves
            const validSaves = saves.filter(save => 
                !save.isMultiplayer && save.owner && save.owner.username === username
            );
            
            // 按时间排序（最新的在前）
            validSaves.sort((a, b) => b.timestamp - a.timestamp);
            return validSaves;
        } catch (error) {
            console.error('Failed to load single player saves:', error);
            return [];
        }
    },
    
    // Initialize auto-save
    init() {
        this.startAutoSave();
        this.updateLoadButtonState();
        
        // Don't auto-prompt to load game on startup - user can click Load button if they want
        // Removed: showLoadPrompt() call
    },
      // Check if user is logged in
    isUserLoggedIn() {
        // Check if SeagullWorld authentication is available and user is logged in
        if (typeof SeagullWorldAuth !== 'undefined' && SeagullWorldAuth.isLoggedIn()) {
            return true;
        }
        return false;
    },
      // Update load button state based on whether save exists and login status
    async updateLoadButtonState() {
        const loadButton = document.getElementById('loadButton');
        const saveButton = document.getElementById('saveButton');
        
        // Check anonymous mode
        const isAnonymous = PlayerIdentity.isAnonymousMode();
        
        // Check login status
        const isLoggedIn = this.isUserLoggedIn();
        
        // 初始化时禁用按钮，只有游戏启动后才由 game.js 启用
        if (loadButton) {
            loadButton.disabled = true;
            loadButton.style.opacity = '0.5';
            loadButton.style.cursor = 'not-allowed';
            if (isAnonymous) {
                loadButton.title = CONFIG.language === 'zh' 
                    ? '匿名模式下无法加载' 
                    : 'Cannot load in anonymous mode';
            } else if (!isLoggedIn) {
                loadButton.title = CONFIG.language === 'zh' 
                    ? '请先登录' 
                    : 'Please login first';
            } else {
                loadButton.title = CONFIG.language === 'zh' 
                    ? '请先启动游戏' 
                    : 'Please start game first';
            }
        }
        
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.style.opacity = '0.5';
            saveButton.style.cursor = 'not-allowed';
            if (isAnonymous) {
                saveButton.title = CONFIG.language === 'zh' 
                    ? '匿名模式下无法保存' 
                    : 'Cannot save in anonymous mode';
            } else if (!isLoggedIn) {
                saveButton.title = CONFIG.language === 'zh' 
                    ? '请先登录' 
                    : 'Please login first';
            } else {
                saveButton.title = CONFIG.language === 'zh' 
                    ? '请先启动游戏' 
                    : 'Please start game first';
            }
        }
    },
    
    // Update load button for current game mode (called when game starts)
    async updateLoadButtonForCurrentMode(isMultiplayer) {
        const loadButton = document.getElementById('loadButton');
        if (!loadButton) return;
        
        // Check if in anonymous mode
        const isAnonymous = PlayerIdentity.isAnonymousMode();
        if (isAnonymous) {
            loadButton.disabled = true;
            loadButton.style.opacity = '0.5';
            loadButton.style.cursor = 'not-allowed';
            loadButton.title = CONFIG.language === 'zh' 
                ? '匿名模式下无法加载' 
                : 'Cannot load in anonymous mode';
            return;
        }
        
        try {
            const username = PlayerIdentity.getUsername();
            const result = await FileStorageService.getSavesByUser(username, isMultiplayer);
            const saves = result.success ? result.saves : [];
            const hasSaves = saves && saves.length > 0;
            
            if (hasSaves) {
                loadButton.disabled = false;
                loadButton.style.opacity = '1';
                loadButton.style.cursor = 'pointer';
                loadButton.title = isMultiplayer 
                    ? (CONFIG.language === 'zh' ? '载入玩家属性' : 'Load player attributes')
                    : (CONFIG.language === 'zh' ? '载入游戏' : 'Load game');
            } else {
                loadButton.disabled = true;
                loadButton.style.opacity = '0.5';
                loadButton.style.cursor = 'not-allowed';
                loadButton.title = CONFIG.language === 'zh' 
                    ? '暂无存档' 
                    : 'No saves available';
            }
        } catch (error) {
            console.error('Failed to check saves:', error);
            loadButton.disabled = true;
            loadButton.style.opacity = '0.5';
            loadButton.style.cursor = 'not-allowed';
        }
    },
    
    // Start auto-save timer
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (window.game && window.game.running && !window.game.paused) {
                this.autoSave();
            }
        }, this.AUTO_SAVE_INTERVAL);
    },
    
    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    },
      // Auto-save (silent, no notification)
    autoSave() {
        if (!window.game || !window.game.running) return;
        
        // 多人模式下禁用自动保存（游戏状态由服务器管理）
        if (window.game.isMultiplayer) {
            return;
        }
        
        try {
            const saveData = this.createSaveData();
            saveData.isAutoSave = true;
            localStorage.setItem(this.getCurrentAutoSaveKey(), JSON.stringify(saveData));
        } catch (error) {
            console.error('💾 Auto-save failed:', error.message);
        }
    },    // Manual save game - now supports 3 saves like multiplayer
    saveGame() {
        // 多人模式下禁用保存
        if (window.game && window.game.isMultiplayer) {
            const message = CONFIG.language === 'zh'
                ? '⚠️ 多人游戏模式下无法保存\n\n游戏状态由服务器管理，退出后自动清除。'
                : '⚠️ Cannot save in multiplayer mode\n\nGame state is managed by server and cleared after exit.';
            this.showNotification(message, 'error', 5000);
            return;
        }
        
        // Check if in anonymous mode
        if (PlayerIdentity.isAnonymousMode()) {
            const message = CONFIG.language === 'zh'
                ? '⚠️ 匿名试玩模式下无法保存游戏\n\n请注册或登录以使用完整功能。'
                : '⚠️ Cannot save game in anonymous mode\n\nPlease register or login for full features.';
            this.showNotification(message, 'error', 5000);
            return;
        }
        
        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
            const message = CONFIG.language === 'zh'
                ? '⚠️ 请先登录以使用保存功能\n\n登录后，您的游戏进度将与账号绑定，可在任何设备上恢复。'
                : '⚠️ Please login to use save features\n\nAfter login, your game progress will be linked to your account and can be restored on any device.';
            this.showNotification(message, 'error', 5000);
            return;
        }
        
        if (!window.game || !window.game.running) {
            this.showNotification(
                TRANSLATIONS[CONFIG.language].notifGameNotStarted,
                'error'
            );
            return;
        }
        
        // 在多人模式下，显示保存对话框
        if (typeof MultiplayerGame !== 'undefined' && MultiplayerGame.enabled) {
            this.showMultiplayerSaveDialog();
            return;
        }
        
        // 单人模式：显示保存对话框（支持3个存档）
        this.showSinglePlayerSaveDialog();
    },
    
    // 单人模式保存对话框（新增）
    showSinglePlayerSaveDialog() {
        const lang = CONFIG.language === 'zh';
        const dialog = document.createElement('div');
        dialog.className = 'mp-save-dialog';
        
        dialog.innerHTML = `
            <div class="mp-save-content">
                <h3>${lang ? '💾 保存游戏' : '💾 Save Game'}</h3>
                <p class="mp-save-hint">${lang ? '保存完整游戏状态，最多3个存档' : 'Save complete game state, max 3 saves'}</p>
                <input type="text" id="spSaveName" placeholder="${lang ? '输入存档名称...' : 'Enter save name...'}" maxlength="30">
                <div class="mp-save-buttons">
                    <button id="spSaveConfirm" class="mp-btn mp-btn-primary">${lang ? '保存' : 'Save'}</button>
                    <button id="spSaveCancel" class="mp-btn mp-btn-secondary">${lang ? '取消' : 'Cancel'}</button>
                </div>
                <div class="mp-save-list">
                    <h4>${lang ? '现有存档' : 'Existing Saves'}</h4>
                    <div id="spSaveListItems"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 显示现有存档
        this.updateSinglePlayerSaveList();
        
        // 自动聚焦输入框，默认使用用户名
        const input = document.getElementById('spSaveName');
        input.focus();
        const username = PlayerIdentity.getUsername();
        const seagullName = PlayerIdentity.getSeagullName();
        input.value = `${seagullName} - ${new Date().toLocaleDateString()}`;
        input.select();
        
        // 确认保存
        document.getElementById('spSaveConfirm').onclick = () => {
            const saveName = input.value.trim() || `${username} - ${Date.now()}`;
            this.saveSinglePlayerGame(saveName);
            document.body.removeChild(dialog);
        };
        
        // 取消
        document.getElementById('spSaveCancel').onclick = () => {
            document.body.removeChild(dialog);
        };
        
        // Enter键保存
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('spSaveConfirm').click();
            }
        };
    },
      // 更新单人存档列表显示
    async updateSinglePlayerSaveList() {
        const saves = await this.getSinglePlayerSaves();
        const container = document.getElementById('spSaveListItems');
        const lang = CONFIG.language === 'zh';
        
        if (saves.length === 0) {
            container.innerHTML = `<p class="mp-no-saves">${lang ? '暂无存档（最多3个）' : 'No saves yet (max 3)'}</p>`;
            return;
        }
        
        container.innerHTML = saves.map((save, index) => {
            const power = Math.floor(save.player.power || 0);
            const x = Math.floor(save.player.x || 0);
            const y = Math.floor(save.player.y || 0);
            
            return `
            <div class="mp-save-item">
                <div class="mp-save-info">
                    <strong>${save.name}</strong>
                    <span class="mp-save-meta">${lang ? '能力' : 'Power'}: ${power} | ${lang ? '位置' : 'Position'}: (${x}, ${y})</span>
                    <span class="mp-save-time">${save.dateString}</span>
                </div>
                <button 
                    class="mp-btn mp-btn-small mp-btn-danger" 
                    onclick="SaveLoadSystem.deleteSinglePlayerSave('${save.id}')"
                >${lang ? '删除' : 'Delete'}</button>
            </div>
        `;
        }).join('');
        
        // 显示存档数量提示
        const saveCount = document.createElement('p');
        saveCount.className = 'mp-save-count';
        saveCount.innerHTML = `${lang ? '已有' : ''} ${saves.length}/3 ${lang ? '个存档' : 'saves'}`;
        container.insertBefore(saveCount, container.firstChild);
    },
      // 保存单人游戏（新增）
    async saveSinglePlayerGame(saveName) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // 检查存档数量限制（最多3个）
            const existingSaves = await this.getSinglePlayerSaves();
            if (existingSaves.length >= 3) {
                this.showNotification(
                    lang ? '❌ 最多只能保存3个存档，请先删除旧存档' : '❌ Maximum 3 saves allowed, please delete old saves first',
                    'error'
                );
                return;
            }
            
            const username = PlayerIdentity.getUsername();
            const saveData = this.createSaveData();
            saveData.id = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            saveData.name = saveName;
            saveData.isAutoSave = false;
            saveData.isMultiplayer = false;
            
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.createSave(saveData);
            
            // Update load button state for single player mode
            await this.updateLoadButtonForCurrentMode(false);
            
            this.showNotification(
                `✅ ${lang ? '已保存' : 'Saved'}: ${saveName} (${lang ? '存档' : 'Slot'} ${existingSaves.length + 1}/3)`,
                'success'
            );
            
            console.log('💾 Single player save created:', result);
        } catch (error) {
            console.error('Single player save failed:', error);
            this.showNotification(
                `❌ ${lang ? '保存失败' : 'Save failed'}`,
                'error'
            );
        }
    },
      // 删除单人存档（新增）
    async deleteSinglePlayerSave(saveId) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // Use FileStorageService instead of localStorage
            await FileStorageService.deleteSave(saveId);
            
            // 更新列表显示
            await this.updateSinglePlayerSaveList();
            
            // Update load button state for single player mode
            await this.updateLoadButtonForCurrentMode(false);
            
            this.showNotification(
                `🗑️ ${lang ? '已删除存档' : 'Save deleted'}`,
                'info'
            );
        } catch (error) {
            console.error('Failed to delete save:', error);
            this.showNotification(
                `❌ ${lang ? '删除失败' : 'Delete failed'}`,
                'error'
            );
        }
    },// Create save data object
    createSaveData() {
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        
        // 计算AI玩家统计数据
        const aiPlayers = EntityManager.players.slice(1).filter(p => !p.isDead);
        const aiPlayerStats = {
            count: aiPlayers.length,
            avgPower: aiPlayers.length > 0 ? aiPlayers.reduce((sum, p) => sum + p.power, 0) / aiPlayers.length : 0,
            maxPower: aiPlayers.length > 0 ? Math.max(...aiPlayers.map(p => p.power)) : 0,
            minPower: aiPlayers.length > 0 ? Math.min(...aiPlayers.map(p => p.power)) : 0
        };
        
        // 计算AI海鸥统计数据
        const aiSeagulls = EntityManager.aiSeagulls.filter(s => !s.isDead);
        const aiSeagullStats = {
            count: aiSeagulls.length,
            avgPower: aiSeagulls.length > 0 ? aiSeagulls.reduce((sum, s) => sum + s.power, 0) / aiSeagulls.length : 0,
            maxPower: aiSeagulls.length > 0 ? Math.max(...aiSeagulls.map(s => s.power)) : 0
        };
        
        // 计算扇贝统计数据
        const scallops = EntityManager.scallops;
        const scallopStats = {
            count: scallops.length,
            avgSize: scallops.length > 0 ? scallops.reduce((sum, s) => sum + s.size, 0) / scallops.length : 0,
            avgPower: scallops.length > 0 ? scallops.reduce((sum, s) => sum + s.powerValue, 0) / scallops.length : 0,
            kingCount: scallops.filter(s => s.isKing).length,
            spoiledCount: scallops.filter(s => s.isSpoiled).length
        };
        
        return {
            version: '1.0.1', // 新版本格式
            timestamp: Date.now(),
            dateString: new Date().toLocaleString(CONFIG.language === 'zh' ? 'zh-CN' : 'en-US'),
            
            // 所有者信息
            owner: PlayerIdentity.getCurrentIdentity(),
            
            // 主玩家数据（完整保存）
            player: {
                name: mainPlayer.name,
                x: mainPlayer.x,
                y: mainPlayer.y,
                power: mainPlayer.power,
                size: mainPlayer.size,
                directionX: mainPlayer.directionX,
                directionY: mainPlayer.directionY,
                velocityX: mainPlayer.velocityX,
                velocityY: mainPlayer.velocityY,
                color: mainPlayer.color
            },
            
            // 游戏统计数据
            gameStats: {
                scallopsEaten: window.game.scallopsEaten,
                gameTime: window.game.gameTime,
                zoomLevel: window.game.zoomLevel
            },
            
            // AI玩家统计数据（仅保存统计信息）
            aiPlayerStats: aiPlayerStats,
            
            // AI海鸥统计数据（仅保存统计信息）
            aiSeagullStats: aiSeagullStats,
            
            // 扇贝统计数据（仅保存统计信息）
            scallopStats: scallopStats,
            
            // 配置
            config: {
                language: CONFIG.language,
                leaderboardSize: CONFIG.leaderboardSize,
                strongTransferRate: CONFIG.strongTransferRate,
                weakTransferRate: CONFIG.weakTransferRate
            }
        };
    },    // Load game
    loadGame() {
        // Check if in anonymous mode
        if (PlayerIdentity.isAnonymousMode()) {
            const message = CONFIG.language === 'zh'
                ? '⚠️ 匿名试玩模式下无法加载存档\n\n请注册或登录以使用完整功能。'
                : '⚠️ Cannot load game in anonymous mode\n\nPlease register or login for full features.';
            this.showNotification(message, 'error', 5000);
            return;
        }
        
        // Check if user is logged in
        if (!this.isUserLoggedIn()) {
            const message = CONFIG.language === 'zh'
                ? '⚠️ 请先登录以使用加载功能\n\n登录后，您可以恢复之前保存的游戏进度。'
                : '⚠️ Please login to use load features\n\nAfter login, you can restore your previously saved game progress.';
            this.showNotification(message, 'error', 5000);
            return;
        }
        
        // 在多人模式下，显示载入对话框
        if (typeof MultiplayerGame !== 'undefined' && MultiplayerGame.enabled) {
            this.showMultiplayerLoadDialog();
            return;
        }
        
        // 单人模式：显示载入对话框
        this.showSinglePlayerLoadDialog();
    },
      // 单人模式载入对话框（新增）
    async showSinglePlayerLoadDialog() {
        const lang = CONFIG.language === 'zh';
        const saves = await this.getSinglePlayerSaves();
        
        if (saves.length === 0) {
            this.showNotification(
                lang ? '📂 暂无存档可载入' : '📂 No saves available',
                'info'
            );
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'mp-save-dialog';
        
        dialog.innerHTML = `
            <div class="mp-save-content">
                <h3>${lang ? '📂 载入存档' : '📂 Load Save'}</h3>
                <p class="mp-save-hint">${lang ? '选择一个存档载入' : 'Select a save to load'}</p>
                <div class="mp-load-list">
                    ${saves.map((save, index) => {
                        const power = Math.floor(save.player.power || 0);
                        const x = Math.floor(save.player.x || 0);
                        const y = Math.floor(save.player.y || 0);
                        
                        return `
                        <div class="mp-save-item mp-save-clickable" onclick="SaveLoadSystem.loadSinglePlayerGame('${save.id}')">
                            <div class="mp-save-info">
                                <strong>${save.name}</strong>
                                <span class="mp-save-meta">${lang ? '能力' : 'Power'}: ${power} | ${lang ? '位置' : 'Pos'}: (${x}, ${y})</span>
                                <span class="mp-save-time">${save.dateString}</span>
                            </div>
                            <span class="mp-load-arrow">→</span>
                        </div>
                    `;
                    }).join('')}
                </div>
                <div class="mp-save-buttons">
                    <button id="spLoadCancel" class="mp-btn mp-btn-secondary">${lang ? '取消' : 'Cancel'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 取消按钮
        document.getElementById('spLoadCancel').onclick = () => {
            document.body.removeChild(dialog);
        };
        
        // 存储对话框引用以便关闭
        this.currentLoadDialog = dialog;
    },
      // 载入单人游戏（新增）
    async loadSinglePlayerGame(saveId) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.getSaveById(saveId);
            console.log('Load result:', result);
            
            if (!result.success || !result.save) {
                throw new Error(result.error || 'Invalid save data');
            }
            
            const saveData = result.save;
            this.restoreSaveData(saveData);
            
            // 关闭对话框
            if (this.currentLoadDialog) {
                document.body.removeChild(this.currentLoadDialog);
                this.currentLoadDialog = null;
            }
            
            const username = PlayerIdentity.getUsername();
            this.showNotification(
                `✅ ${lang ? '已载入' : 'Loaded'}: ${saveData.name} [${username}]`,
                'success'
            );
        } catch (error) {
            console.error('Single player load failed:', error);
            this.showNotification(
                `❌ ${lang ? '载入失败' : 'Load failed'}: ${error.message}`,
                'error'
            );
        }
    },    
    // Restore save data
    restoreSaveData(saveData) {
        try {
            console.log('Starting restore process...', saveData);
            
            // Stop current game if running
            if (window.game && window.game.running) {
                window.game.running = false;
                window.game.paused = false;
            }
            
            // Restore config
            if (saveData.config) {
                CONFIG.leaderboardSize = saveData.config.leaderboardSize;
                CONFIG.strongTransferRate = saveData.config.strongTransferRate;
                CONFIG.weakTransferRate = saveData.config.weakTransferRate;
            }
            
            console.log('Resetting entities...');
            // Reset entities
            EntityManager.resetAll();
              console.log('Creating main player...');
            // Restore main player
            const mainPlayer = EntityManager.createPlayer(
                saveData.player.x,
                saveData.player.y,
                saveData.player.size,
                saveData.player.power,
                saveData.player.name,
                saveData.player.color,
                true
            );
            // Reset movement to prevent fast movement after load
            mainPlayer.directionX = 0;
            mainPlayer.directionY = 0;
            mainPlayer.velocityX = 0;
            mainPlayer.velocityY = 0;
            mainPlayer.speed = 0;
            mainPlayer.isBoosting = false;
            EntityManager.players.push(mainPlayer);
            console.log('Main player created:', mainPlayer);
            
            // 检查是否为新格式存档（仅保存统计数据）
            const isNewFormat = saveData.version === '1.0.1' && saveData.aiPlayerStats;
            
            if (isNewFormat) {
                console.log('💾 Loading optimized save format (stats-based)...');
                
                // 根据统计数据重新生成AI玩家
                if (saveData.aiPlayerStats && saveData.aiPlayerStats.count > 0) {
                    const stats = saveData.aiPlayerStats;
                    console.log(`🤖 Regenerating ${stats.count} AI players (avg power: ${stats.avgPower.toFixed(1)})...`);
                    
                    for (let i = 0; i < stats.count; i++) {
                        // 在玩家周围随机位置生成
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 200 + Math.random() * 400;
                        const x = mainPlayer.x + Math.cos(angle) * distance;
                        const y = mainPlayer.y + Math.sin(angle) * distance;
                        
                        // 根据统计数据生成随机能力值（正态分布）
                        const powerRange = stats.maxPower - stats.minPower;
                        const randomFactor = (Math.random() + Math.random() + Math.random()) / 3; // 近似正态分布
                        const power = stats.minPower + powerRange * randomFactor;
                        const size = Math.sqrt(power) * 3;
                        
                        const aiPlayer = EntityManager.createPlayer(
                            x, y, size, power,
                            `AI Player ${i + 1}`, 
                            `hsl(${Math.random() * 360}, 70%, 60%)`, 
                            false
                        );
                        EntityManager.players.push(aiPlayer);
                    }
                }
                
                // 根据统计数据重新生成AI海鸥
                if (saveData.aiSeagullStats && saveData.aiSeagullStats.count > 0) {
                    const stats = saveData.aiSeagullStats;
                    console.log(`🦅 Regenerating ${stats.count} AI seagulls (avg power: ${stats.avgPower.toFixed(1)})...`);
                    
                    for (let i = 0; i < stats.count; i++) {
                        const x = Math.random() * window.game.worldWidth;
                        const y = Math.random() * window.game.worldHeight;
                        
                        // 根据统计数据生成随机能力值
                        const powerRange = stats.maxPower - stats.avgPower * 0.5;
                        const randomFactor = (Math.random() + Math.random()) / 2;
                        const power = stats.avgPower * 0.5 + powerRange * randomFactor;
                        const size = Math.sqrt(power) * 3;
                        
                        const seagull = EntityManager.createAISeagull(x, y, size, power);
                        EntityManager.aiSeagulls.push(seagull);
                    }
                }
                
                // 根据统计数据重新生成扇贝
                if (saveData.scallopStats && saveData.scallopStats.count > 0) {
                    const stats = saveData.scallopStats;
                    console.log(`🦪 Regenerating ${stats.count} scallops (${stats.kingCount} kings, ${stats.spoiledCount} spoiled)...`);
                    
                    // 重新生成普通扇贝
                    const normalCount = stats.count - stats.kingCount - stats.spoiledCount;
                    for (let i = 0; i < normalCount; i++) {
                        const x = Math.random() * window.game.worldWidth;
                        const y = Math.random() * window.game.worldHeight;
                        const scallop = EntityManager.createScallop(x, y);
                        EntityManager.scallops.push(scallop);
                    }
                    
                    // 重新生成扇贝王
                    for (let i = 0; i < stats.kingCount; i++) {
                        const x = Math.random() * window.game.worldWidth;
                        const y = Math.random() * window.game.worldHeight;
                        const scallop = EntityManager.createScallop(x, y);
                        scallop.isKing = true;
                        scallop.powerValue *= 3;
                        scallop.size *= 1.5;
                        scallop.color = '#FFD700';
                        EntityManager.scallops.push(scallop);
                    }
                    
                    // 重新生成变质扇贝
                    for (let i = 0; i < stats.spoiledCount; i++) {
                        const x = Math.random() * window.game.worldWidth;
                        const y = Math.random() * window.game.worldHeight;
                        const scallop = EntityManager.createScallop(x, y);
                        scallop.isSpoiled = true;
                        scallop.powerValue = -Math.abs(scallop.powerValue);
                        scallop.color = '#8B4513';
                        EntityManager.scallops.push(scallop);
                    }
                }
                
                console.log(`✅ Regenerated: ${EntityManager.players.length - 1} AI players, ${EntityManager.aiSeagulls.length} seagulls, ${EntityManager.scallops.length} scallops`);
                
            } else {
                // 旧格式：直接恢复保存的实体
                console.log('💾 Loading legacy save format (full entities)...');
                
                console.log('Restoring AI players...');
                // Restore AI players
                if (saveData.aiPlayers) {
                    saveData.aiPlayers.forEach(data => {
                        const aiPlayer = EntityManager.createPlayer(
                            data.x, data.y, data.size, data.power,
                            data.name, data.color, false
                        );
                        // Keep AI direction but reset velocity and speed for smooth restart
                        aiPlayer.directionX = data.directionX;
                        aiPlayer.directionY = data.directionY;
                        aiPlayer.velocityX = 0;
                        aiPlayer.velocityY = 0;
                        aiPlayer.speed = aiPlayer.baseSpeed || 3;
                        EntityManager.players.push(aiPlayer);
                    });
                }
                console.log(`Restored ${EntityManager.players.length - 1} AI players`);
                  console.log('Restoring AI seagulls...');
                // Restore AI seagulls
                if (saveData.aiSeagulls) {
                    saveData.aiSeagulls.forEach(data => {
                        const seagull = EntityManager.createAISeagull(
                            data.x, data.y, data.size, data.power
                        );
                        // Keep direction but reset speed for smooth restart
                        seagull.directionX = data.directionX;
                        seagull.directionY = data.directionY;
                        seagull.speed = seagull.baseSpeed || 2;
                        seagull.velocityX = 0;
                        seagull.velocityY = 0;
                        EntityManager.aiSeagulls.push(seagull);
                    });
                }
                console.log(`Restored ${EntityManager.aiSeagulls.length} AI seagulls`);
                
                console.log('Restoring scallops...');
                // Restore scallops
                if (saveData.scallops) {
                    saveData.scallops.forEach(data => {
                        const scallop = {
                            x: data.x,
                            y: data.y,
                            size: data.size,
                            powerValue: data.powerValue,
                            color: data.color,
                            innerColor: data.innerColor,
                            type: data.type || 'medium',
                            isKing: data.isKing || false,
                            isSpoiled: data.isSpoiled || false,
                            creationTime: data.creationTime || Date.now(),
                            isGrowing: data.isGrowing || false,
                            growthProgress: data.growthProgress || 0,
                            currentSize: data.size
                        };
                        EntityManager.scallops.push(scallop);
                    });
                }
                console.log(`Restored ${EntityManager.scallops.length} scallops`);
            }
            
            console.log('Restoring game stats...');
            // Restore game stats
            window.game.scallopsEaten = saveData.gameStats.scallopsEaten || 0;
            window.game.gameTime = saveData.gameStats.gameTime || 0;
            window.game.zoomLevel = saveData.gameStats.zoomLevel || 1.0;
            window.game.playerPower = saveData.player.power;
            window.game.playerSize = saveData.player.size;
            
            console.log('Re-initializing AI enhancer...');
            // Re-initialize AI enhancer
            if (CONFIG.enableEnhancedAI && window.AIEnhancer) {
                window.game.aiEnhancer = new AIEnhancer(CONFIG);
            }            console.log('Starting game...');
            // Start the game
            window.game.running = true;
            window.game.paused = false;
            window.game.gameOver = false;
            window.game.lastTime = performance.now();
            
            // Reset drag/control state to prevent unwanted movement
            window.game.isDragging = false;
            window.game.isRightMouseDown = false;
            window.game.dragVectorX = 0;
            window.game.dragVectorY = 0;
            window.game.dragForce = 0;
            
            // Update UI
            document.getElementById('playerName').textContent = saveData.player.name;
            UISystem.updateStats(
                saveData.player.power,
                saveData.player.size,
                saveData.gameStats.scallopsEaten || 0,
                saveData.gameStats.gameTime || 0,
                EntityManager.players.length
            );
            UISystem.updateLeaderboard();
            UISystem.updateZoomValue(window.game.zoomLevel);
            UISystem.hideGameOver();
            
            // Start game loop with the correct function name
            window.game.animationId = requestAnimationFrame((timestamp) => window.game.updateGame(timestamp));
            
            console.log('Restore complete!');
        } catch (error) {
            console.error('Error in restoreSaveData:', error);
            console.error('Stack trace:', error.stack);
            throw error; // Re-throw to be caught by loadGame
        }
    },    
    // Check if saved game exists
    async hasSavedGame() {
        // 检查单人模式存档
        const singlePlayerSaves = await this.getSinglePlayerSaves();
        if (singlePlayerSaves.length > 0) {
            return true;
        }
        
        // 检查多人模式存档
        const multiplayerSaves = await this.getMultiplayerSaves();
        if (multiplayerSaves.length > 0) {
            return true;
        }
        
        return false;
    },
      // Show load prompt on startup
    showLoadPrompt() {
        setTimeout(() => {
            const message = TRANSLATIONS[CONFIG.language].notifLoadPrompt;
            
            this.showNotification(message, 'info', 5000);
        }, 1000);
    },
    
    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.save-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `save-notification save-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            font-weight: bold;
            animation: slideInDown 0.3s ease-out;
            max-width: 90%;
            text-align: center;
            white-space: pre-line;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    // ==================== Multiplayer Save/Load ====================
    
    // 多人模式保存对话框
    showMultiplayerSaveDialog() {
        const lang = CONFIG.language === 'zh';
        const dialog = document.createElement('div');
        dialog.className = 'mp-save-dialog';        dialog.innerHTML = `
            <div class="mp-save-content">
                <h3>${lang ? '💾 保存玩家数据' : '💾 Save Player Data'}</h3>
                <p class="mp-save-hint">${lang ? '保存所有玩家静态数据（位置、能力、属性等），最多3个存档' : 'Save all player static data (position, power, attributes, etc.), max 3 saves'}</p>
                <input type="text" id="mpSaveName" placeholder="${lang ? '输入存档名称...' : 'Enter save name...'}" maxlength="30">
                <div class="mp-save-buttons">
                    <button id="mpSaveConfirm" class="mp-btn mp-btn-primary">${lang ? '保存' : 'Save'}</button>
                    <button id="mpSaveCancel" class="mp-btn mp-btn-secondary">${lang ? '取消' : 'Cancel'}</button>
                </div>
                <div class="mp-save-list">
                    <h4>${lang ? '现有存档' : 'Existing Saves'}</h4>
                    <div id="mpSaveListItems"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 显示现有存档
        this.updateMultiplayerSaveList();
          // 自动聚焦输入框
        const input = document.getElementById('mpSaveName');
        input.focus();
        const username = PlayerIdentity.getUsername();
        const seagullName = PlayerIdentity.getSeagullName();
        input.value = `${seagullName} - ${new Date().toLocaleDateString()}`;
        input.select();
        
        // 确认保存
        document.getElementById('mpSaveConfirm').onclick = () => {
            const saveName = input.value.trim() || `${lang ? '未命名' : 'Untitled'} ${Date.now()}`;
            this.saveMultiplayerGame(saveName);
            document.body.removeChild(dialog);
        };
        
        // 取消
        document.getElementById('mpSaveCancel').onclick = () => {
            document.body.removeChild(dialog);
        };
        
        // Enter键保存
        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('mpSaveConfirm').click();
            }
        };
    },    // 更新存档列表显示
    async updateMultiplayerSaveList() {
        const saves = await this.getMultiplayerSaves();
        const container = document.getElementById('mpSaveListItems');
        const lang = CONFIG.language === 'zh';
        
        if (saves.length === 0) {
            container.innerHTML = `<p class="mp-no-saves">${lang ? '暂无存档（最多3个）' : 'No saves yet (max 3)'}</p>`;
            return;
        }
          container.innerHTML = saves.map((save, index) => {
            const data = save.playerData || save.playerAttributes || {};
            const power = Math.floor(data.power || 0);
            const x = Math.floor(data.x || 0);
            const y = Math.floor(data.y || 0);
            
            // 检查是否是所有者
            const isOwner = PlayerIdentity.isOwner(save);
            const ownerBadge = isOwner 
                ? `<span class="mp-owner-badge">${lang ? '✓ 我的' : '✓ Mine'}</span>`
                : `<span class="mp-other-badge">${lang ? '🔒 他人' : '🔒 Other'}</span>`;
            
            return `
            <div class="mp-save-item ${isOwner ? '' : 'mp-save-disabled'}">
                <div class="mp-save-info">
                    <strong>${save.name} ${ownerBadge}</strong>
                    <span class="mp-save-meta">${lang ? '能力' : 'Power'}: ${power} | ${lang ? '位置' : 'Position'}: (${x}, ${y})</span>
                    <span class="mp-save-time">${save.dateString}</span>
                    ${!isOwner && save.owner ? `<span class="mp-owner-name">${lang ? '所有者' : 'Owner'}: ${save.owner.playerName}</span>` : ''}
                </div>
                <button 
                    class="mp-btn mp-btn-small mp-btn-danger" 
                    onclick="SaveLoadSystem.deleteMultiplayerSave('${save.id}')"
                    ${!isOwner ? 'disabled title="' + (lang ? '无权删除他人存档' : 'Cannot delete others\' saves') + '"' : ''}
                >${lang ? '删除' : 'Delete'}</button>
            </div>
        `;
        }).join('');
        
        // 显示存档数量提示
        const saveCount = document.createElement('p');
        saveCount.className = 'mp-save-count';
        saveCount.innerHTML = `${lang ? '已有' : ''} ${saves.length}/3 ${lang ? '个存档' : 'saves'}`;
        container.insertBefore(saveCount, container.firstChild);
    },    // 保存多人游戏玩家属性
    async saveMultiplayerGame(saveName) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // 获取当前玩家
            const mainPlayer = EntityManager.players.find(p => p.isControllable);
            if (!mainPlayer) {
                this.showNotification(lang ? '❌ 未找到玩家' : '❌ Player not found', 'error');
                return;
            }
            
            // 检查存档数量限制（最多3个）
            const existingSaves = await this.getMultiplayerSaves();
            if (existingSaves.length >= 3) {
                this.showNotification(
                    lang ? '❌ 最多只能保存3个存档，请先删除旧存档' : '❌ Maximum 3 saves allowed, please delete old saves first',
                    'error'
                );
                return;
            }

            // 创建保存数据（包含所有静态数据）
            // 获取用户身份信息
            const ownerInfo = PlayerIdentity.getCurrentIdentity();
            const userName = mainPlayer.name || 'Player';
            
            const saveData = {
                id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: saveName,
                version: '1.0.8-multiplayer',
                timestamp: Date.now(),
                dateString: new Date().toLocaleString(lang ? 'zh-CN' : 'en-US'),
                isMultiplayer: true,
                
                // 新增：所有者信息（用于权限控制）
                owner: ownerInfo,
                
                // 保存所有玩家静态数据（包括位置）
                playerData: {
                    // 基本信息
                    name: mainPlayer.name,
                    color: mainPlayer.color,
                    
                    // 位置和移动
                    x: mainPlayer.x,
                    y: mainPlayer.y,
                    vx: mainPlayer.vx || mainPlayer.velocityX || 0,
                    vy: mainPlayer.vy || mainPlayer.velocityY || 0,
                    directionX: mainPlayer.directionX || 0,
                    directionY: mainPlayer.directionY || 0,
                    
                    // 能力和属性
                    power: mainPlayer.power,
                    size: mainPlayer.size,
                    maxSpeed: mainPlayer.maxSpeed,
                    baseSpeed: mainPlayer.baseSpeed,
                    boostSpeed: mainPlayer.boostSpeed,
                    acceleration: mainPlayer.acceleration,
                    
                    // 状态
                    isBoosting: mainPlayer.isBoosting || false,
                    speed: mainPlayer.speed || 0,
                    
                    // 其他静态数据
                    isControllable: mainPlayer.isControllable,
                    lastPowerTransferTime: mainPlayer.lastPowerTransferTime || 0
                }
            };
            
            console.log('💾 Saving player data...');
            console.log('💾 mainPlayer.power:', mainPlayer.power, 'type:', typeof mainPlayer.power);
            console.log('💾 saveData.playerData.power:', saveData.playerData.power, 'type:', typeof saveData.playerData.power);
            console.log('💾 Full saveData:', saveData);
            
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.createSave(saveData);
            
            // Update load button state for multiplayer mode
            await this.updateLoadButtonForCurrentMode(true);
            
            this.showNotification(
                `✅ ${lang ? '已保存' : 'Saved'}: ${saveName} (${lang ? '存档' : 'Slot'} ${existingSaves.length + 1}/3)`,
                'success'
            );
            
            console.log('💾 Multiplayer save created:', result);
        } catch (error) {
            console.error('Multiplayer save failed:', error);
            // Show specific error message if available
            const errorMsg = error.message || error.toString();
            if (errorMsg.includes('Maximum 3 saves')) {
                this.showNotification(
                    lang ? '❌ 最多只能保存3个存档，请先删除旧存档' : '❌ Maximum 3 saves per mode. Please delete old saves first.',
                    'error'
                );
            } else {
                this.showNotification(
                    `❌ ${lang ? '保存失败' : 'Save failed'}: ${errorMsg}`,
                    'error'
                );
            }
        }
    },    // 获取所有多人模式存档（只显示当前用户的）
    async getMultiplayerSaves() {
        try {
            const username = PlayerIdentity.getUsername();
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.getSavesByUser(username, true);
            // Extract saves array from response
            const saves = result.success ? result.saves : [];
            
            // Filter and sort saves
            const validSaves = saves.filter(save => 
                save.isMultiplayer && save.owner && save.owner.username === username
            );
            
            // 按时间排序（最新的在前）
            validSaves.sort((a, b) => b.timestamp - a.timestamp);
            return validSaves;
        } catch (error) {
            console.error('Failed to load multiplayer saves:', error);
            return [];
        }
    },    // 删除多人模式存档
    async deleteMultiplayerSave(saveId) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.getSaveById(saveId);
            if (!result.success || !result.save) {
                throw new Error('Save not found');
            }
            
            const saveData = result.save;
            if (!PlayerIdentity.isOwner(saveData)) {
                this.showNotification(
                    lang ? '🚫 无权删除此存档（不是所有者）' : '🚫 Cannot delete (not the owner)',
                    'error'
                );
                return;
            }
            
            // Delete save via API
            await FileStorageService.deleteSave(saveId);
            
            // 更新列表显示
            await this.updateMultiplayerSaveList();
            
            // Update load button state for multiplayer mode
            await this.updateLoadButtonForCurrentMode(true);
            
            this.showNotification(
                `🗑️ ${lang ? '已删除存档' : 'Save deleted'}`,
                'info'
            );
        } catch (error) {
            console.error('Failed to delete save:', error);
            this.showNotification(
                `❌ ${lang ? '删除失败' : 'Delete failed'}`,
                'error'
            );
        }
    },    // 多人模式载入对话框
    async showMultiplayerLoadDialog() {
        const lang = CONFIG.language === 'zh';
        const saves = await this.getMultiplayerSaves();
        
        if (saves.length === 0) {
            this.showNotification(
                lang ? '📂 暂无存档可载入' : '📂 No saves available',
                'info'
            );
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.className = 'mp-save-dialog';dialog.innerHTML = `
            <div class="mp-save-content">
                <h3>${lang ? '📂 载入存档' : '📂 Load Save'}</h3>
                <p class="mp-save-hint">${lang ? '载入将先让玩家死亡，然后恢复所有保存的数据（包含位置）' : 'Loading will kill player first, then restore all saved data (includes position)'}</p>
                <div class="mp-load-list">
                    ${saves.map((save, index) => {
                        const data = save.playerData || save.playerAttributes || {};
                        const power = Math.floor(data.power || 0);
                        const x = Math.floor(data.x || 0);
                        const y = Math.floor(data.y || 0);
                        
                        return `
                        <div class="mp-save-item mp-save-clickable" onclick="SaveLoadSystem.loadMultiplayerGame('${save.id}')">
                            <div class="mp-save-info">
                                <strong>${save.name}</strong>
                                <span class="mp-save-meta">${lang ? '能力' : 'Power'}: ${power} | ${lang ? '位置' : 'Pos'}: (${x}, ${y})</span>
                                <span class="mp-save-time">${save.dateString}</span>
                            </div>
                            <span class="mp-load-arrow">→</span>
                        </div>
                    `;
                    }).join('')}
                </div>
                <div class="mp-save-buttons">
                    <button id="mpLoadCancel" class="mp-btn mp-btn-secondary">${lang ? '取消' : 'Cancel'}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 取消按钮
        document.getElementById('mpLoadCancel').onclick = () => {
            document.body.removeChild(dialog);
        };
        
        // 存储对话框引用以便关闭
        this.currentLoadDialog = dialog;
    },    // 载入多人游戏玩家属性
    async loadMultiplayerGame(saveId) {
        const lang = CONFIG.language === 'zh';
        
        try {
            // Use FileStorageService instead of localStorage
            const result = await FileStorageService.getSaveById(saveId);
            console.log('Load MP result:', result);
            
            if (!result.success || !result.save) {
                throw new Error(result.error || 'Invalid save data');
            }
            
            const saveData = result.save;
            if (!saveData.isMultiplayer) {
                throw new Error('Not a multiplayer save');
            }
            
            // 新增：检查权限 - 只有所有者才能加载
            if (!PlayerIdentity.isOwner(saveData)) {
                this.showNotification(
                    lang ? '🚫 无权访问此存档（不是所有者）' : '🚫 Access denied (not the owner)',
                    'error'
                );
                return;
            }
            
            // 获取当前玩家
            let mainPlayer = EntityManager.players.find(p => p.isControllable);
            if (!mainPlayer) {
                this.showNotification(lang ? '❌ 未找到玩家' : '❌ Player not found', 'error');
                return;
            }const data = saveData.playerData || saveData.playerAttributes || {};
            
            console.log('� Killing player before load...');
            console.log('📊 Full saveData:', saveData);
            console.log('📊 Extracted data object:', data);
            console.log('📊 Saved power value:', data.power, 'type:', typeof data.power);
            console.log('📊 Current power before kill:', mainPlayer.power);
            
            // 先保存所有需要恢复的数据（在修改mainPlayer之前）
            const savedAttributes = {
                name: data.name,
                color: data.color,
                x: data.x,
                y: data.y,
                power: data.power,  // 关键：先保存能力值
                size: data.size,
                maxSpeed: data.maxSpeed,
                baseSpeed: data.baseSpeed,
                boostSpeed: data.boostSpeed,
                acceleration: data.acceleration
            };
            
            console.log('📦 Saved attributes for restore:', savedAttributes);
            console.log('🔍 savedAttributes.power =', savedAttributes.power, 'type:', typeof savedAttributes.power);
            
            // 步骤1: 让玩家死亡（清除当前状态）
            mainPlayer.isDead = true;
            mainPlayer.power = 0;
              // 如果在多人模式，通知服务器玩家死亡
            if (typeof MultiplayerGame !== 'undefined' && MultiplayerGame.enabled) {
                NetworkClient.send({
                    type: 'playerDied',
                    playerId: mainPlayer.id
                });
                console.log('💀 Notified server of player death');
            }

            // 等待一小段时间（模拟死亡效果）
            setTimeout(() => {
                console.log('🔄 Restoring player data...');
                console.log('📦 Restoring from saved attributes:', savedAttributes);
                console.log('🔍 About to restore power:', savedAttributes.power, 'type:', typeof savedAttributes.power);
                
                // 基本信息
                mainPlayer.name = savedAttributes.name || mainPlayer.name;
                mainPlayer.color = savedAttributes.color || mainPlayer.color;
                
                // 位置和移动（恢复保存的位置）
                mainPlayer.x = savedAttributes.x || mainPlayer.x;
                mainPlayer.y = savedAttributes.y || mainPlayer.y;
                mainPlayer.vx = 0;  // 速度重置为0
                mainPlayer.vy = 0;
                mainPlayer.velocityX = 0;
                mainPlayer.velocityY = 0;
                mainPlayer.directionX = 0;
                mainPlayer.directionY = 0;
                
                // 能力和属性（✅ 修复：使用 savedAttributes 对象）
                console.log('⚡ Setting power from savedAttributes.power:', savedAttributes.power);
                mainPlayer.power = savedAttributes.power !== undefined ? savedAttributes.power : 100;
                console.log('⚡ mainPlayer.power after assignment:', mainPlayer.power);
                
                mainPlayer.size = savedAttributes.size !== undefined ? savedAttributes.size : 20;
                mainPlayer.maxSpeed = savedAttributes.maxSpeed || mainPlayer.maxSpeed;
                mainPlayer.baseSpeed = savedAttributes.baseSpeed || mainPlayer.baseSpeed;
                mainPlayer.boostSpeed = savedAttributes.boostSpeed || mainPlayer.boostSpeed;
                mainPlayer.acceleration = savedAttributes.acceleration || mainPlayer.acceleration;
                
                console.log('✅ Power restored to:', mainPlayer.power);
                console.log('✅ Full player after restore:', {
                    power: mainPlayer.power,
                    size: mainPlayer.size,
                    x: mainPlayer.x,
                    y: mainPlayer.y
                });
                
                // 状态
                mainPlayer.isBoosting = false;
                mainPlayer.speed = 0;
                mainPlayer.isDead = false;  // 复活
                mainPlayer.isControllable = true;
                mainPlayer.lastPowerTransferTime = Date.now();                // 如果在多人模式，通知服务器玩家复活
                if (typeof MultiplayerGame !== 'undefined' && MultiplayerGame.enabled) {
                    // Set flag to ignore server updates for 5 seconds (increased from 2)
                    MultiplayerGame.ignoreServerUpdatesUntil = Date.now() + 5000;
                    console.log('🛡️ Blocking server updates for 5 seconds to preserve loaded data');
                    
                    NetworkClient.send({
                        type: 'playerRespawn',
                        playerId: mainPlayer.id,
                        playerData: {
                            x: mainPlayer.x,
                            y: mainPlayer.y,
                            power: mainPlayer.power,
                            size: mainPlayer.size
                        }
                    });
                    console.log('🔄 Notified server of player respawn:', {
                        power: mainPlayer.power,
                        size: mainPlayer.size,
                        position: { x: Math.floor(mainPlayer.x), y: Math.floor(mainPlayer.y) }
                    });
                    
                    // Force update UI immediately
                    UISystem.updateStats(mainPlayer.power, mainPlayer.size, 0, 0, EntityManager.players.length);
                    
                    // Set up a delayed check to verify the power is still correct
                    setTimeout(() => {
                        console.log('🔍 Delayed check - Current power:', mainPlayer.power);
                        if (mainPlayer.power !== savedAttributes.power) {
                            console.warn('⚠️ Power was overwritten by server! Restoring again...');
                            mainPlayer.power = savedAttributes.power;
                            mainPlayer.size = savedAttributes.size;
                            UISystem.updateStats(mainPlayer.power, mainPlayer.size, 0, 0, EntityManager.players.length);
                        }
                    }, 1000);
                }
                
                // 更新UI
                if (typeof UISystem !== 'undefined') {
                    UISystem.updateStats(mainPlayer.power, mainPlayer.size, 0, 0, EntityManager.players.length);
                }
                
                // 关闭对话框
                if (this.currentLoadDialog) {
                    document.body.removeChild(this.currentLoadDialog);
                    this.currentLoadDialog = null;
                }
                
                this.showNotification(
                    `✅ ${lang ? '已载入' : 'Loaded'}: ${saveData.name}`,
                    'success'
                );
                  console.log('✅ Player data restored:', {
                    name: mainPlayer.name,
                    power: mainPlayer.power,
                    position: { x: mainPlayer.x, y: mainPlayer.y }
                });
            }, 500);  // 500ms延迟模拟死亡效果
            
        } catch (error) {
            console.error('Multiplayer load failed:', error);
            this.showNotification(
                `❌ ${lang ? '载入失败' : 'Load failed'}`,
                'error'
            );
        }
    }
};

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }

    /* Multiplayer Save/Load Dialog Styles */
    .mp-save-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
    }
    
    .mp-save-content {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: slideIn 0.3s ease;
    }
    
    .mp-save-content h3 {
        margin: 0 0 10px 0;
        color: white;
        font-size: 24px;
        text-align: center;
    }
    
    .mp-save-hint {
        color: #b3d1ff;
        font-size: 14px;
        text-align: center;
        margin-bottom: 20px;
    }
    
    .mp-save-content input[type="text"] {
        width: 100%;
        padding: 12px;
        border: 2px solid #4a7bc8;
        border-radius: 8px;
        font-size: 16px;
        margin-bottom: 20px;
        box-sizing: border-box;
        background: white;
        color: #333;
    }
    
    .mp-save-content input[type="text"]:focus {
        outline: none;
        border-color: #5a9fff;
        box-shadow: 0 0 8px rgba(90, 159, 255, 0.3);
    }
    
    .mp-save-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
    }
    
    .mp-btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .mp-btn-primary {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
    }
    
    .mp-btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    }
    
    .mp-btn-secondary {
        background: #546e7a;
        color: white;
    }
    
    .mp-btn-secondary:hover {
        background: #455a64;
    }
    
    .mp-btn-danger {
        background: #f44336;
        color: white;
        padding: 6px 12px;
        font-size: 14px;
    }
    
    .mp-btn-danger:hover {
        background: #d32f2f;
    }
    
    .mp-btn-small {
        flex: none;
        padding: 6px 12px;
        font-size: 14px;
    }
    
    .mp-save-list, .mp-load-list {
        margin-top: 20px;
    }
    
    .mp-save-list h4 {
        color: white;
        font-size: 18px;
        margin-bottom: 10px;
    }
    
    .mp-save-item {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
    }
    
    .mp-save-clickable {
        cursor: pointer;
    }
    
    .mp-save-clickable:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateX(5px);
    }
    
    .mp-save-info {
        flex: 1;
    }
    
    .mp-save-info strong {
        color: white;
        font-size: 16px;
        display: block;
        margin-bottom: 4px;
    }
      .mp-save-meta {
        color: #b3d1ff;
        font-size: 13px;
        display: block;
        margin-bottom: 2px;
    }
    
    .mp-save-time {
        color: #90caf9;
        font-size: 12px;
        display: block;
    }
    
    .mp-save-count {
        color: #ffd54f;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        margin: 10px 0;
        padding: 8px;
        background: rgba(255, 213, 79, 0.1);
        border-radius: 4px;
    }
    
    .mp-load-arrow {
        color: #4CAF50;
        font-size: 24px;
        font-weight: bold;
    }
    
    .mp-no-saves {
        color: #b3d1ff;
        text-align: center;
        padding: 20px;
        font-style: italic;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Export
window.SaveLoadSystem = SaveLoadSystem;
