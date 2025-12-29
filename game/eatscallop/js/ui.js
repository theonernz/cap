// ==================== 用户界面控制 ====================
const UISystem = {
    // 更新游戏状态显示
    updateStats(playerPower, playerSize, scallopsEaten, gameTime, playerCount) {
        document.getElementById('power').textContent = playerPower;
        document.getElementById('size').textContent = playerSize.toFixed(1);
        document.getElementById('scallopsEaten').textContent = scallopsEaten;
        document.getElementById('gameTime').textContent = Math.floor(gameTime) + 's';
        document.getElementById('playerCount').textContent = playerCount;
    },
    
    // 更新排行榜
    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const allEntities = EntityManager.getAllAliveEntities();
        
        allEntities.sort((a, b) => b.power - a.power);
        const topEntities = allEntities.slice(0, CONFIG.leaderboardSize);
        
        let leaderboardHTML = '';
        topEntities.forEach((entity, index) => {
            const isCurrentPlayer = entity.isControllable;
            const rankClass = index < 3 ? ['first', 'second', 'third'][index] : '';
            
            leaderboardHTML += `
                <div class="leaderboard-item ${isCurrentPlayer ? 'current-player' : ''} ${rankClass}">
                    <span class="leaderboard-rank">${index + 1}</span>
                    <span class="leaderboard-name">${entity.name}</span>
                    <span class="leaderboard-power">${entity.power}</span>
                </div>
            `;
        });
        
        leaderboardList.innerHTML = leaderboardHTML;
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        document.getElementById('leaderboardUpdateTime').textContent = 
            `${this.getText('lastUpdate')} ${timeString}`;
    },
    
    // 更新坐标显示
    updateCoordinates(mainPlayer) {
        if (mainPlayer && !mainPlayer.isDead) {
            document.getElementById('worldCoordinates').textContent = 
                `(${Math.floor(mainPlayer.x)}, ${Math.floor(mainPlayer.y)})`;
        }
    },
    
    // 更新速度显示
    updateSpeed(mainPlayer) {
        if (mainPlayer && !mainPlayer.isDead) {
            const speed = mainPlayer.speed !== undefined ? mainPlayer.speed : 0;
            document.getElementById('speedValue').textContent = speed.toFixed(1);
        }
    },
    
    // 更新缩放显示
    updateZoomValue(zoomLevel) {
        document.getElementById('zoomValue').textContent = zoomLevel.toFixed(1) + 'x';
    },
    
    // 更改玩家名称
    changeName() {
        const currentName = document.getElementById('playerName').textContent;
        const promptText = this.getText('promptNewName');
        const newName = prompt(promptText, currentName);
        if (newName && newName.trim() !== '') {
            const trimmedName = newName.trim();
            
            // 更新海鸥名（保存到本地存储）
            PlayerIdentity.setSeagullName(trimmedName);
            
            // 更新游戏中的玩家名
            const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
            if (mainPlayer) mainPlayer.name = trimmedName;
            
            // 更新UI显示
            document.getElementById('playerName').textContent = trimmedName;
            this.updateLeaderboard();
            
            // 提示用户存档文件名不变
            const username = PlayerIdentity.getUsername();
            console.log(`🦅 Seagull name changed to: ${trimmedName}`);
            console.log(`💾 Save file will still use username: ${username}`);
        }
    },
    
    // 切换语言
    toggleLanguage() {
        CONFIG.language = CONFIG.language === 'zh' ? 'en' : 'zh';
        this.applyLanguage();
        
        MiniMapSystem.updateLanguage(CONFIG.language);
    },
    
    // 应用语言设置
    applyLanguage() {
        document.title = this.getText('gameTitle');
        document.getElementById('gameTitle').textContent = this.getText('gameTitle');
        document.getElementById('gameSubtitle').textContent = this.getText('gameSubtitle');
        
        // 更新玩家名称（如果还是默认名称）
        const currentPlayerName = document.getElementById('playerName').textContent;
        const enDefaultName = TRANSLATIONS['en'].defaultPlayerName;
        const zhDefaultName = TRANSLATIONS['zh'].defaultPlayerName;
        
        // 如果当前是默认名称之一，则更新为新语言的默认名称
        if (currentPlayerName === enDefaultName || currentPlayerName === zhDefaultName) {
            document.getElementById('playerName').textContent = this.getText('defaultPlayerName');
            // 同时更新主玩家对象的名称
            const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
            if (mainPlayer) {
                mainPlayer.name = this.getText('defaultPlayerName');
            }
        }
        
        document.querySelector('.leaderboard-name').textContent = this.getText('statValue');
        document.getElementById('playerNameLabel').textContent = this.getText('playerNameLabel');
        document.getElementById('powerLabel').textContent = this.getText('powerLabel');
        document.getElementById('sizeLabel').textContent = this.getText('sizeLabel');
        document.getElementById('scallopsEatenLabel').textContent = this.getText('scallopsEatenLabel');
        document.getElementById('gameTimeLabel').textContent = this.getText('gameTimeLabel');
        document.getElementById('playerCountLabel').textContent = this.getText('playerCountLabel');
        document.getElementById('leaderboardSizeLabel').textContent = this.getText('leaderboardSizeLabel');
        document.getElementById('strongTransferLabel').textContent = this.getText('strongTransferLabel');
        document.getElementById('weakTransferLabel').textContent = this.getText('weakTransferLabel');
        document.getElementById('aiCountLabel').textContent = this.getText('aiCountLabel');
        document.getElementById('aiPlayerCountLabel').textContent = this.getText('aiPlayerCountLabel');
        document.getElementById('scallopDensityLabel').textContent = this.getText('scallopDensityLabel');
        document.getElementById('growthSpeedLabel').textContent = this.getText('growthSpeedLabel');
        document.getElementById('startButton').textContent = this.getText('startButton');
        document.getElementById('pauseButton').textContent = this.getText('pauseButton');
        document.getElementById('restartButton').textContent = this.getText('restartButton');
        document.getElementById('changeNameButton').textContent = this.getText('changeNameButton');
        document.getElementById('saveButton').textContent = this.getText('saveButton');
        document.getElementById('loadButton').textContent = this.getText('loadButton');
        document.getElementById('minimapBtn').textContent = this.getText('minimapBtn');
        
        // 更新语言按钮内的文本
        const langText = document.getElementById('langText');
        if (langText) {
            langText.textContent = CONFIG.language === 'zh' ? 'EN' : '中文';
        }
        
        // 更新按钮文本
        document.getElementById('startButton').textContent = this.getText('singlePlayerButton');
        document.getElementById('multiplayerButton').textContent = this.getText('multiplayerButton');
        // ...existing button translations...
        document.getElementById('pauseButton').textContent = this.getText('pauseButton');
        document.getElementById('restartButton').textContent = this.getText('restartButton');
        document.getElementById('changeNameButton').textContent = this.getText('changeNameButton');
        document.getElementById('saveButton').textContent = this.getText('saveButton');
        document.getElementById('loadButton').textContent = this.getText('loadButton');
        document.getElementById('minimapBtn').textContent = this.getText('minimapBtn');
        
        // 更新返回大厅按钮
        const backToLobbyBtn = document.querySelector('.back-to-lobby-btn');
        if (backToLobbyBtn) {
            backToLobbyBtn.textContent = this.getText('backToLobbyBtn');
        }
        
        // 更新页面顶部标签
        const worldPlatform = document.querySelector('.world-platform');
        if (worldPlatform) {
            worldPlatform.textContent = this.getText('worldPlatform');
        }
        const gameBadge = document.querySelector('.game-badge');
        if (gameBadge) {
            gameBadge.textContent = this.getText('gameBadge');
        }
        
        // 更新面板标题 (按照HTML中的实际顺序: 状态、排行榜、说明、设置)
        const panelTitles = document.querySelectorAll('.panel-title');
        if (panelTitles[0]) panelTitles[0].textContent = this.getText('gameStatusTitle');
        if (panelTitles[1]) panelTitles[1].textContent = this.getText('leaderboardTitle');
        if (panelTitles[2]) panelTitles[2].querySelector('span').textContent = this.getText('instructionsPanelTitle');
        if (panelTitles[3]) panelTitles[3].querySelector('span').textContent = this.getText('settingsPanelTitle');
        
        // 更新游戏说明
        const instructions = document.querySelectorAll('.instructions-list li');
        for (let i = 0; i < instructions.length && i < 9; i++) {
            instructions[i].textContent = this.getText(`instruction${i + 1}`);
        }
        
        // 更新游戏结束界面
        if (document.getElementById('gameOverTitle')) {
            document.getElementById('gameOverTitle').textContent = this.getText('gameOverTitle');
        }
        if (document.getElementById('finalPowerLabel')) {
            document.getElementById('finalPowerLabel').textContent = this.getText('finalPowerLabel');
        }
        if (document.getElementById('gameOverRestartBtn')) {
            document.getElementById('gameOverRestartBtn').textContent = this.getText('restartButton');
        }
        
        // 更新其他静态文本
        const aiPlayerCountLabel = document.querySelector('.stat-item .stat-label:not([id])');
        if (aiPlayerCountLabel && aiPlayerCountLabel.textContent.includes('AI')) {
            aiPlayerCountLabel.textContent = this.getText('aiPlayerCountStatic');
        }
        
        // 更新用户面板模式显示
        this.updateUserPanelMode();
        
        // 更新控制提示面板
        const controlHint = document.getElementById('controlHint');
        if (controlHint) {
            const controlHintTitle = controlHint.querySelector('h3');
            if (controlHintTitle) controlHintTitle.textContent = this.getText('controlHintTitle');
            
            const controlHintParagraphs = controlHint.querySelectorAll('p');
            if (controlHintParagraphs[0]) controlHintParagraphs[0].textContent = this.getText('controlHintText');
            if (controlHintParagraphs[1]) controlHintParagraphs[1].textContent = this.getText('controlHintStart');
            
            // 更新控制提示列表项
            const controlHintItems = controlHint.querySelectorAll('li');
            if (controlHintItems[0]) {
                controlHintItems[0].innerHTML = `<strong>${this.getText('controlHintLeftClick')}</strong> - ${this.getText('controlHintLeftClickDesc')}`;
            }
            if (controlHintItems[1]) {
                controlHintItems[1].innerHTML = `<strong>${this.getText('controlHintRightClick')}</strong> - ${this.getText('controlHintRightClickDesc')}`;
            }
            if (controlHintItems[2]) {
                controlHintItems[2].innerHTML = `<strong>${this.getText('controlHintDragFar')}</strong> - ${this.getText('controlHintDragFarDesc')}`;
            }
            if (controlHintItems[3]) {
                controlHintItems[3].innerHTML = `<strong>${this.getText('controlHintSpace')}</strong> - ${this.getText('controlHintSpaceDesc')}`;
            }
            if (controlHintItems[4]) {
                controlHintItems[4].innerHTML = `<strong>${this.getText('controlHintWheel')}</strong> - ${this.getText('controlHintWheelDesc')}`;
            }
            if (controlHintItems[5]) {
                controlHintItems[5].innerHTML = `<strong>${this.getText('controlHintMinimap')}</strong> - ${this.getText('controlHintMinimapDesc')}`;
            }
        }
        
        // 更新小地图切换按钮
        const toggleMinimapBtn = document.querySelector('.toggle-minimap-btn');
        if (toggleMinimapBtn) {
            toggleMinimapBtn.textContent = this.getText('toggleMinimapBtn');
        }
        
        // 更新游戏覆盖层标签
        const overlayItems = document.querySelectorAll('.overlay-item span:first-child');
        if (overlayItems[0]) overlayItems[0].textContent = this.getText('overlayCoord');
        if (overlayItems[1]) overlayItems[1].textContent = this.getText('overlayMap');
        if (overlayItems[2]) overlayItems[2].textContent = this.getText('overlaySpeed');
        if (overlayItems[3]) overlayItems[3].textContent = this.getText('overlayZoom');
        
        // 更新暂停覆盖层
        const pausedTitle = document.getElementById('pausedTitle');
        const pauseResume = document.getElementById('pauseResume');
        const pauseWarning = document.getElementById('pauseWarning');
        if (pausedTitle) pausedTitle.textContent = this.getText('pausedTitle');
        if (pauseResume) pauseResume.textContent = this.getText('pauseResume');
        if (pauseWarning) pauseWarning.textContent = this.getText('pauseWarning');
    },
    
    // 获取翻译文本
    getText(key) {
        return TRANSLATIONS[CONFIG.language][key] || key;
    },
    
    // 更新排行榜大小
    updateLeaderboardSize() {
        this.updateConfigFromUI();
        this.updateLeaderboard();
    },
    
    // 从UI更新配置
    updateConfigFromUI() {
        CONFIG.leaderboardSize = parseInt(document.getElementById('leaderboardSize').value) || 10;
        CONFIG.strongTransferRate = parseInt(document.getElementById('strongTransferRate').value) || 40;
        CONFIG.weakTransferRate = parseInt(document.getElementById('weakTransferRate').value) || 5;
        CONFIG.aiSeagullCount = parseInt(document.getElementById('aiSeagullCount').value) || 20;
        CONFIG.aiPlayerCount = parseInt(document.getElementById('aiPlayerCountInput').value) || 3;
        CONFIG.scallopDensity = parseInt(document.getElementById('scallopDensity').value) || 150;
        CONFIG.scallopCount = CONFIG.scallopDensity;  // 同步扇贝数量
        CONFIG.scallopGrowth.growthSpeed = parseFloat(document.getElementById('growthSpeed').value) || 1.0;
        document.getElementById('aiPlayerCount').textContent = CONFIG.aiPlayerCount;
    },
    
    // 显示游戏结束画面
    showGameOver(finalScore) {
        document.getElementById('finalScore').textContent = finalScore;
        document.getElementById('gameOverScreen').style.display = 'flex';
        document.getElementById('startButton').disabled = false;
    },
    
    // 隐藏游戏结束画面
    hideGameOver() {
        document.getElementById('gameOverScreen').style.display = 'none';
    },
    
    // 隐藏控制提示
    hideControlHint() {
        document.getElementById('controlHint').style.display = 'none';
    },
    
    // 更新用户面板模式显示
    updateUserPanelMode() {
        const currentMode = document.getElementById('currentMode');
        if (!currentMode) return;
        
        // 检测当前模式
        const isMultiplayer = typeof MultiplayerGame !== 'undefined' && 
                              MultiplayerGame.enabled && 
                              MultiplayerGame.isConnected && 
                              MultiplayerGame.isConnected();
        
        // 根据语言和模式设置文本
        if (isMultiplayer) {
            currentMode.textContent = CONFIG.language === 'zh' ? '多人' : 'Multi';
        } else if (typeof game !== 'undefined' && game.running) {
            currentMode.textContent = CONFIG.language === 'zh' ? '单人' : 'Single';
        } else {
            // 游戏未运行时不显示
            currentMode.textContent = CONFIG.language === 'zh' ? '单人' : 'Single';
        }
    }
};

// 导出UI系统
window.UISystem = UISystem;
window.ui = UISystem;  // 添加别名以匹配 HTML 中的引用