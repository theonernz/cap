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
                    <span class="leaderboard-size">${entity.size.toFixed(1)}</span>
                </div>
            `;
        });
        
        leaderboardList.innerHTML = leaderboardHTML;
        
        const now = new Date();
        document.getElementById('leaderboardUpdateTime').textContent = 
            `最后更新: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
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
            document.getElementById('speedValue').textContent = mainPlayer.speed.toFixed(1);
        }
    },
    
    // 更新缩放显示
    updateZoomValue(zoomLevel) {
        document.getElementById('zoomValue').textContent = zoomLevel.toFixed(1) + 'x';
    },
    
    // 更改玩家名称
    changeName() {
        const currentName = document.getElementById('playerName').textContent;
        const promptText = CONFIG.language === 'zh' ? '请输入新的玩家名称:' : 'Enter new player name:';
        const newName = prompt(promptText, currentName);
        if (newName && newName.trim() !== '') {
            const mainPlayer = EntityManager.players[0];
            if (mainPlayer) mainPlayer.name = newName.trim();
            document.getElementById('playerName').textContent = newName.trim();
            this.updateLeaderboard();
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
        document.querySelector('.subtitle').textContent = this.getText('gameSubtitle');
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
        document.getElementById('languageBtn').textContent = this.getText('languageBtn');
        document.getElementById('minimapBtn').textContent = this.getText('minimapBtn');
        
        // 更新面板标题
        const panelTitles = document.querySelectorAll('.panel-title');
        if (panelTitles[0]) panelTitles[0].textContent = this.getText('gameStatusTitle');
        if (panelTitles[1]) panelTitles[1].textContent = this.getText('gameSettingsTitle');
        if (panelTitles[2]) panelTitles[2].textContent = this.getText('instructionsTitle');
        if (panelTitles[3]) panelTitles[3].textContent = this.getText('leaderboardTitle');
        
        // 更新游戏说明
        const instructions = document.querySelectorAll('.instructions-list li');
        for (let i = 0; i < instructions.length && i < 8; i++) {
            instructions[i].textContent = this.getText(`instruction${i + 1}`);
        }
        
        // 更新游戏结束界面
        const gameOverTitle = document.querySelector('#gameOverScreen h2');
        if (gameOverTitle) gameOverTitle.textContent = this.getText('gameOverTitle');
        
        const finalScoreLabel = document.querySelector('#gameOverScreen .final-score');
        if (finalScoreLabel) {
            const finalScore = document.getElementById('finalScore').textContent;
            finalScoreLabel.innerHTML = `${this.getText('finalPowerLabel')} <span id="finalScore">${finalScore}</span>`;
        }
        
        // 更新其他静态文本
        const aiPlayerCountLabel = document.querySelector('.stat-item .stat-label:not([id])');
        if (aiPlayerCountLabel && aiPlayerCountLabel.textContent.includes('AI')) {
            aiPlayerCountLabel.textContent = this.getText('aiPlayerCountStatic');
        }
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
    }
};

// 导出UI系统
window.UISystem = UISystem;
window.ui = UISystem;  // 添加别名以匹配 HTML 中的引用