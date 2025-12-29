// ==================== 游戏核心逻辑 ====================
const Game = {
    // 游戏状态
    running: false,
    paused: false,
    gameOver: false,
    animationId: null,
    
    // 游戏数据
    playerPower: CONFIG.initialPlayerPower,
    playerSize: 1.0,
    scallopsEaten: 0,
    aiDefeated: 0,  // 击败的AI海鸥数量
    gameTime: 0,
    lastTime: 0,
    leaderboardUpdateTimer: 0,
    zoomLevel: 1.0,
    zoomLevels: [1.0, 1.5, 2.0], // 3 discrete zoom levels
    currentZoomIndex: 0, // Start at 1.0x zoom
      // 拖拽控制
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragCurrentX: 0,
    dragCurrentY: 0,
    isRightMouseDown: false,
    dragVectorX: 0,
    dragVectorY: 0,
    dragForce: 0,
    
    // 移动控制（优化版）
    isMoving: false,
    isAccelerating: false,
    targetX: 0,
    targetY: 0,
    moveSpeed: 1.0,
    lastLeftClickTime: 0,
    lastRightClickTime: 0,
    
    // AI增强器
    aiEnhancer: null,    // 初始化游戏
    init() {
        UISystem.updateConfigFromUI();
        EntityManager.resetAll();
        
        // 获取海鸥名（不是用户名）
        const seagullName = PlayerIdentity.getSeagullName();
        const isAnonymous = PlayerIdentity.isAnonymousMode();
        
        console.log(`🎮 Game init - Anonymous mode: ${isAnonymous}, Seagull name: ${seagullName}`);
        
        // 在匿名模式下，不创建独立的玩家海鸥
        if (!isAnonymous) {
            // 创建真实玩家（单人模式下完全可控）
            const mainPlayer = EntityManager.createPlayer(
                CONFIG.worldWidth / 2, 
                CONFIG.worldHeight / 2, 
                this.playerSize, 
                CONFIG.initialPlayerPower, 
                seagullName,  // 使用海鸥名
                '#FFD700', 
                true
            );
            EntityManager.players.push(mainPlayer);
            console.log(`✅ Created main player: ${mainPlayer.name}`);
        }
        
        // 创建AI玩家
        for (let i = 0; i < CONFIG.aiPlayerCount; i++) {
            const size = Math.random() * 0.5 + 0.8;
            const power = Math.floor(Math.random() * 50) + 50;
            const name = CONFIG.language === 'zh' ? `AI玩家${i+1}` : `AIPlayer${i+1}`;
            const color = this.getRandomPlayerColor();
            
            const aiPlayer = EntityManager.createPlayer(
                Math.random() * CONFIG.worldWidth,
                Math.random() * CONFIG.worldHeight,
                size,
                power,
                name,
                color,
                false
            );
            
            EntityManager.players.push(aiPlayer);
        }
        
        console.log(`✅ Created ${CONFIG.aiPlayerCount} AI players. Total players: ${EntityManager.players.length}`);
        
        // 初始化扇贝
        for (let i = 0; i < CONFIG.scallopCount; i++) {
            EntityManager.scallops.push(EntityManager.createScallop(
                Math.random() * (CONFIG.worldWidth - 30) + 15,
                Math.random() * (CONFIG.worldHeight - 30) + 15
            ));
        }
        
        console.log(`✅ Created ${CONFIG.scallopCount} scallops. Total: ${EntityManager.scallops.length}`);
        
        // 初始化AI海鸥
        for (let i = 0; i < CONFIG.aiSeagullCount; i++) {
            const size = Math.random() * 0.8 + 0.5;
            const power = Math.floor(Math.random() * 30) + 30;
            
            EntityManager.aiSeagulls.push(EntityManager.createAISeagull(
                Math.random() * CONFIG.worldWidth,
                Math.random() * CONFIG.worldHeight,
                size,
                power
            ));
        }
        
        console.log(`✅ Created ${CONFIG.aiSeagullCount} AI seagulls. Total: ${EntityManager.aiSeagulls.length}`);
        
        // 在匿名模式下，随机选择一个AI海鸥作为玩家控制
        if (isAnonymous) {
            if (EntityManager.aiSeagulls.length > 0) {
                const randomIndex = Math.floor(Math.random() * EntityManager.aiSeagulls.length);
                const selectedSeagull = EntityManager.aiSeagulls[randomIndex];
                
                console.log(`🎲 Selecting AI seagull #${randomIndex} for anonymous player...`);
                
                // 将选中的AI海鸥转换为可控制的玩家
                selectedSeagull.isControllable = true;
                selectedSeagull.isPlayer = true;
                selectedSeagull.name = seagullName;  // 使用匿名玩家名
                selectedSeagull.color = '#FFD700';  // 使用金色表示玩家
                selectedSeagull.aiState = null;  // 清除AI状态
                
                // 添加玩家必需的属性（如果AI海鸥没有）
                if (selectedSeagull.speed === undefined) {
                    selectedSeagull.speed = 0;
                }
                if (selectedSeagull.velocityX === undefined) {
                    selectedSeagull.velocityX = 0;
                }
                if (selectedSeagull.velocityY === undefined) {
                    selectedSeagull.velocityY = 0;
                }
                if (selectedSeagull.acceleration === undefined) {
                    selectedSeagull.acceleration = 0.3;
                }
                if (selectedSeagull.deceleration === undefined) {
                    selectedSeagull.deceleration = 0.15;
                }
                if (selectedSeagull.maxSpeed === undefined) {
                    selectedSeagull.maxSpeed = 5;
                }
                if (selectedSeagull.wingFlapSpeed === undefined) {
                    selectedSeagull.wingFlapSpeed = 0;
                }
                
                // 添加到玩家列表
                EntityManager.players.push(selectedSeagull);
                // 从AI海鸥列表中移除
                EntityManager.aiSeagulls.splice(randomIndex, 1);
                
                // 更新游戏状态以反映选中海鸥的属性（匿名模式）
                this.playerPower = selectedSeagull.power;
                this.playerSize = selectedSeagull.size;
                
                console.log(`✅ Anonymous mode: Assigned control to AI seagull (Power: ${selectedSeagull.power}, Size: ${selectedSeagull.size.toFixed(2)})`);
                console.log(`📊 Final counts - Players: ${EntityManager.players.length}, AI Seagulls: ${EntityManager.aiSeagulls.length}`);
            } else {
                console.error('❌ No AI seagulls available for anonymous mode!');
            }
        }
        
        if (!isAnonymous) {
            // 重置游戏状态（仅非匿名模式）
            this.playerPower = CONFIG.initialPlayerPower;
            this.playerSize = 1.0;
        }
        this.scallopsEaten = 0;
        this.aiDefeated = 0;  // 重置AI击败计数
        this.gameTime = 0;
        
        this.isDragging = false;
        this.dragForce = 0;
        this.zoomLevel = 1.0;
        
        // 初始化小地图
        if (CONFIG.enableMiniMap) {
            MiniMapSystem.init(CONFIG, EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops);
        }
        
        // 初始化AI增强器
        if (CONFIG.enableEnhancedAI) {
            this.aiEnhancer = new AIEnhancer(CONFIG);
        }        
        UISystem.updateStats(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime, EntityManager.getPlayerCount());
        UISystem.updateLeaderboard();
        const localPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (localPlayer) {
            UISystem.updateCoordinates(localPlayer);
            UISystem.updateSpeed(localPlayer);
            console.log(`✅ Local player found:`, localPlayer.name, `at (${localPlayer.x.toFixed(0)}, ${localPlayer.y.toFixed(0)})`);
        } else {
            console.error('❌ No local player found!');
        }
        UISystem.updateZoomValue(this.zoomLevel);
        
        // 最终统计信息
        console.log(`📊 Init complete:`, {
            players: EntityManager.players.length,
            aiSeagulls: EntityManager.aiSeagulls.length,
            scallops: EntityManager.scallops.length,
            isAnonymous: isAnonymous,
            playerPower: this.playerPower,
            playerSize: this.playerSize
        });
    },    // 开始游戏
    startGame() {
        // 如果游戏已经在运行
        if (this.running) {
            // 检查是否在多人模式（使用可靠的检测方法）
            const isMultiplayerMode = MultiplayerGame && MultiplayerGame.isConnected();
            
            if (isMultiplayerMode) {
                const confirmMsg = CONFIG.language === 'zh' 
                    ? '当前正在多人游戏中，切换到单人模式将重新加载页面。\n确定要切换吗？' 
                    : 'Currently in multiplayer mode. Switching to single player will reload the page.\nAre you sure?';
                
                if (!confirm(confirmMsg)) {
                    return;
                }
                
                console.log('🔄 Reloading page to start single player mode...');
                // 刷新页面，带上自动启动参数
                window.location.href = window.location.pathname + '?autostart=single';
                return;
            } else {
                // 单人模式下已经在运行，不做任何操作
                console.log('⚠️ Single player mode already running');
                return;
            }
        }
        
        this.running = true;
        this.paused = false;
        this.gameOver = false;
        UISystem.hideGameOver();
        
        // Update mode display
        const currentMode = document.getElementById('currentMode');
        const userMode = document.getElementById('userMode');
        const userRoom = document.getElementById('userRoom');
        
        if (currentMode) {
            currentMode.textContent = CONFIG.language === 'zh' ? '单人' : 'Single';
        }
        // Show mode when game starts
        if (userMode) {
            userMode.style.display = 'inline-block';
        }
        
        // Always show room info
        if (userRoom) {
            userRoom.style.display = 'inline-block';
        }
        
        this.initGameSize();
        this.init(); // 这会创建新的可控制玩家
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
        
        document.getElementById('startButton').disabled = true;
        document.getElementById('multiplayerButton').disabled = false;
        
        // 确保保存/载入按钮在单人模式下的状态正确
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        const isAnonymous = PlayerIdentity.isAnonymousMode();
        
        if (saveButton) {
            if (isAnonymous) {
                // 匿名模式下禁用保存按钮
                saveButton.disabled = true;
                saveButton.style.opacity = '0.5';
                saveButton.style.cursor = 'not-allowed';
                saveButton.title = CONFIG.language === 'zh' 
                    ? '匿名模式下无法保存' 
                    : 'Cannot save in anonymous mode';
            } else {
                // 正常模式下启用保存按钮
                saveButton.disabled = false;
                saveButton.style.opacity = '1';
                saveButton.style.cursor = 'pointer';
                saveButton.title = '';
            }
        }
        
        // 加载按钮需要检查是否有单人存档
        if (loadButton && typeof SaveLoadSystem !== 'undefined') {
            SaveLoadSystem.updateLoadButtonForCurrentMode(false); // false = single player
        }
          UISystem.hideControlHint();
        
        UISystem.updateLeaderboard();
        
        console.log('✅ Single player mode started successfully');
        
        // Update mode badge
        if (typeof GameVersion !== 'undefined') {
            GameVersion.updateModeBadge();
        }
    },// 开始多人游戏
    async startMultiplayer() {
        // Check if multiplayer is available in this version
        if (typeof GameVersion !== 'undefined' && !GameVersion.hasFeature('multiplayer')) {
            alert('Multiplayer is not available in standalone version.\n\n多人模式在单机版中不可用。');
            console.warn('🚫 Multiplayer blocked: Running in standalone version');
            return;
        }
        
        // 如果游戏已经在运行
        if (this.running) {
            // 检查是否在单人模式（使用可靠的检测方法）
            const isMultiplayerMode = MultiplayerGame && MultiplayerGame.isConnected();
            
            if (!isMultiplayerMode) {
                // 单人模式，提示切换确认
                const confirmMsg = CONFIG.language === 'zh' 
                    ? '当前正在单人游戏中，切换到多人模式将重新加载页面。\n确定要切换吗？' 
                    : 'Currently in single player mode. Switching to multiplayer will reload the page.\nAre you sure?';
                
                if (!confirm(confirmMsg)) {
                    return;
                }
                
                console.log('🔄 Reloading page to start multiplayer mode...');
                // 刷新页面，带上 multiplayer 参数
                window.location.href = window.location.pathname + '?mode=multiplayer';
                return;
            } else {
                // 多人模式下已经在运行，不做任何操作
                console.log('⚠️ Multiplayer mode already running');
                return;
            }
        }
        
        // 获取海鸥名和颜色
        const seagullName = PlayerIdentity.getSeagullName();
        const playerColor = '#FFD700'; // 金色
        
        console.log('Starting multiplayer game...');
        console.log('Player:', seagullName);
        console.log('Attempting to connect to ws://localhost:3000');          try {
            // 初始化多人游戏模式
            await MultiplayerGame.init(seagullName, playerColor);
            
            // 初始化游戏
            this.running = true;
            this.paused = false;
            this.gameOver = false;
            UISystem.hideGameOver();
            
            // Update mode display to multiplayer
            const currentMode = document.getElementById('currentMode');
            const userMode = document.getElementById('userMode');
            const userRoom = document.getElementById('userRoom');
            
            if (currentMode) {
                currentMode.textContent = CONFIG.language === 'zh' ? '多人' : 'Multi';
            }
            // Show mode when game starts
            if (userMode) {
                userMode.style.display = 'inline-block';
            }
            // Always show room info
            if (userRoom) {
                userRoom.style.display = 'inline-block';
            }
            
            this.initGameSize();
            
            // 初始化小地图（多人模式也需要）
            if (CONFIG.enableMiniMap) {
                MiniMapSystem.init(CONFIG, EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops);
            }
            
            // 初始化AI增强器（如果需要）
            if (CONFIG.enableEnhancedAI && !this.aiEnhancer) {
                this.aiEnhancer = new AIEnhancer(CONFIG);
            }
            
            // 不需要调用 init()，因为 MultiplayerGame.init 已经处理了实体
              this.lastTime = performance.now();
            this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
            
            // 禁用多人按钮，启用单人按钮（允许切换）
            document.getElementById('startButton').disabled = false;
            document.getElementById('multiplayerButton').disabled = true;
              // 多人模式下启用保存/载入（仅保存玩家属性）
            const saveButton = document.getElementById('saveButton');
            const loadButton = document.getElementById('loadButton');
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.style.opacity = '1';
                saveButton.style.cursor = 'pointer';
                saveButton.title = CONFIG.language === 'zh' 
                    ? '保存玩家属性（仅在多人模式下）' 
                    : 'Save player attributes (multiplayer mode)';
            }
            // 加载按钮需要检查是否有多人存档
            if (loadButton && typeof SaveLoadSystem !== 'undefined') {
                SaveLoadSystem.updateLoadButtonForCurrentMode(true); // true = multiplayer
            }
            
            // 显示延迟信息
            document.getElementById('latencyDisplay').style.display = 'flex';
            
            // 启动延迟更新
            this.latencyUpdateInterval = setInterval(() => {
                const latency = MultiplayerGame.getLatency();
                document.getElementById('latency').textContent = `${latency}ms`;
            }, 1000);
              UISystem.hideControlHint();
            UISystem.updateLeaderboard();
            
            console.log('✓ Multiplayer game started successfully!');
            
            // Update mode badge
            if (typeof GameVersion !== 'undefined') {
                GameVersion.updateModeBadge();
            }
            
        } catch (error) {
            console.error('✗ Failed to start multiplayer:', error);
            
            // 详细的错误信息
            let errorMessage = '无法连接到多人游戏服务器\nFailed to connect to multiplayer server\n\n';
            errorMessage += '请检查 / Please check:\n';
            errorMessage += '1. 服务器是否正在运行 / Server is running\n';
            errorMessage += '   命令 / Command: npm start\n\n';
            errorMessage += '2. 服务器地址 / Server URL: ws://localhost:3000\n\n';
            errorMessage += '3. 浏览器控制台查看详细错误 / Check browser console for details\n\n';
            errorMessage += `错误信息 / Error: ${error.message}`;
            
            alert(errorMessage);
            
            // 重新启用按钮
            document.getElementById('startButton').disabled = false;
            document.getElementById('multiplayerButton').disabled = false;
        }
    },
    
    // 停止游戏
    stop() {
        this.running = false;
        this.paused = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.latencyUpdateInterval) {
            clearInterval(this.latencyUpdateInterval);
            this.latencyUpdateInterval = null;
        }
          // Shutdown multiplayer if active
        if (MultiplayerGame.enabled) {
            MultiplayerGame.shutdown();
            document.getElementById('latencyDisplay').style.display = 'none';
        }
        
        document.getElementById('startButton').disabled = false;
        document.getElementById('multiplayerButton').disabled = false;
        
        // 停止游戏时禁用保存/加载按钮
        const saveButton = document.getElementById('saveButton');
        const loadButton = document.getElementById('loadButton');
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.style.opacity = '0.5';
            saveButton.style.cursor = 'not-allowed';
            saveButton.title = CONFIG.language === 'zh' 
                ? '请先启动游戏' 
                : 'Please start game first';
        }
        if (loadButton) {
            loadButton.disabled = true;
            loadButton.style.opacity = '0.5';
            loadButton.style.cursor = 'not-allowed';
            loadButton.title = CONFIG.language === 'zh' 
                ? '请先启动游戏' 
                : 'Please start game first';
        }
        
        // Update mode badge
        if (typeof GameVersion !== 'undefined') {
            GameVersion.updateModeBadge();
        }
    },
      // 暂停/继续游戏
    pauseGame() {
        if (!this.running || this.gameOver) return;
        
        this.paused = !this.paused;
        
        // Don't stop animation frame - keep rendering (Observer Mode)
        if (!this.paused) {
            this.lastTime = performance.now();
        }
        
        // Show/hide pause overlay
        this.showPauseOverlay(this.paused);
    },
    
    // 显示/隐藏暂停覆盖层
    showPauseOverlay(show) {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },    // 重新开始游戏（在相同模式下重启）
    restartGame() {
        // 检测当前是否为多人模式（使用可靠的检测方法）
        const isMultiplayerMode = MultiplayerGame && MultiplayerGame.isConnected();
        
        console.log(`🔄 Restarting game... Mode: ${isMultiplayerMode ? 'Multiplayer' : 'Single Player'}`);
        
        this.running = false;
        this.paused = false;
        this.gameOver = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        UISystem.hideGameOver();
        
        // 根据当前模式重启游戏
        if (isMultiplayerMode) {
            console.log('♻️ Restarting in multiplayer mode...');
            // 刷新页面并自动启动多人模式
            window.location.href = window.location.pathname + '?mode=multiplayer';
        } else {
            console.log('♻️ Restarting in single player mode...');
            // 刷新页面并自动启动单人模式
            window.location.href = window.location.pathname + '?autostart=single';
        }
    },
    
    // 结束游戏
    endGame() {
        this.gameOver = true;
        this.running = false;
        
        // 计算游戏统计数据
        const gameStats = {
            survivalTime: Math.floor(this.gameTime / 1000), // 转换为秒
            finalPower: Math.floor(this.playerPower),
            scallopsEaten: this.scallopsEaten,
            aiDefeated: this.aiDefeated,  // 使用真实的AI击败数
            leaderboardRank: null // 可以从排行榜获取
        };
        
        // 如果已登录，更新用户统计数据
        if (typeof RewardSystem !== 'undefined' && window.SeagullWorldAuth?.currentUser) {
            RewardSystem.updateUserStats(gameStats);
        }
        
        UISystem.showGameOver(this.playerPower);
    },
    
    // 初始化游戏尺寸
    initGameSize() {
        const gameArea = document.querySelector('.game-area-container');
        const width = gameArea.clientWidth - 20;
        const height = gameArea.clientHeight - 20;
        DrawingSystem.setSize(width, height);
    },
      // 游戏主循环 (Observer Mode: Always render, conditionally update)
    updateGame(timestamp) {
        if (!this.running || this.gameOver) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Only update game state if not paused
        if (!this.paused) {
            this.gameTime += deltaTime / 1000;
            
            this.leaderboardUpdateTimer += deltaTime;
            if (this.leaderboardUpdateTimer > 1000) {
                UISystem.updateLeaderboard();
                this.leaderboardUpdateTimer = 0;
            }
            
            this.updatePowerTransferEffects(deltaTime);
            this.updatePlayers(deltaTime);
            
            // Only update AI seagulls locally in single-player mode
            // In multiplayer mode, the server is authoritative
            if (!MultiplayerGame.enabled) {
                this.updateAISeagulls(deltaTime);
                // Only update scallop growth in single-player mode
                // In multiplayer, server manages scallop states
                this.updateScallopGrowth(deltaTime);
            }
            
            // Only handle collisions locally in single-player mode
            // In multiplayer mode, the server is authoritative for all collisions
            if (!MultiplayerGame.enabled) {
                this.handleCollisions();
                this.removeDeadEntities();
            }
        }
        
        // Always update UI and minimap (even when paused)
        const localPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (localPlayer) {
            UISystem.updateSpeed(localPlayer);
            UISystem.updateCoordinates(localPlayer);
        }
        
        // Always update minimap (even when paused)
        if (CONFIG.enableMiniMap && localPlayer) {
            MiniMapSystem.update(EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops, localPlayer);
        }
        
        // Always draw (even when paused) - Observer Mode
        this.drawGame();
        
        // Always continue animation frame
        this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
    },// 更新玩家
    updatePlayers(deltaTime) {
        // Find the local controllable player (important for multiplayer)
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        
        // 多人模式：远程玩家位置由服务器直接设置，渲染层做平滑
        // 不需要客户端物理更新
        
        if (mainPlayer && mainPlayer.isControllable) {
            this.updateControllablePlayer(mainPlayer);
        }
          EntityManager.players.forEach(player => {
            // 检查能力值，如果<=0则标记为死亡
            if (!player.isDead && player.power <= 0) {
                player.isDead = true;
                console.log(`💀 Player ${player.name} died (power: ${player.power})`);
                if (player.isControllable) {
                    this.endGame();
                }
            }
            
            // 在多人模式下，远程玩家不使用AI逻辑，只使用服务器同步的位置
            if (!player.isControllable && !player.isDead) {
                // 检查是否是多人游戏中的远程玩家
                const isRemotePlayer = MultiplayerGame.enabled && 
                                       MultiplayerGame.remotePlayers && 
                                       MultiplayerGame.remotePlayers.has(player.id);
                
                if (!isRemotePlayer) {
                    // 只对非远程玩家应用AI逻辑
                    if (this.aiEnhancer && CONFIG.enableEnhancedAI) {
                        this.aiEnhancer.enhanceAIPlayer(player, deltaTime, EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops);
                    } else {
                        this.updateAIPlayer(player, deltaTime);
                    }
                }
            }
              // 更新物理和动画
            if (!player.isDead) {
                const isRemotePlayer = MultiplayerGame.enabled && 
                                       MultiplayerGame.remotePlayers && 
                                       MultiplayerGame.remotePlayers.has(player.id);
                
                if (!isRemotePlayer) {
                    // 只对本地玩家和AI应用边界检查
                    CollisionSystem.keepInBounds(player, CONFIG.worldWidth, CONFIG.worldHeight);
                }
                
                // 所有玩家更新翅膀动画
                const speed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
                player.wingFlapSpeed += 0.1 * (speed + 1);
            }
        });
          if (mainPlayer && mainPlayer.isControllable) {
            this.playerPower = mainPlayer.power;
            this.playerSize = mainPlayer.size;
            this.scallopsEaten = mainPlayer.scallopsEaten || 0;
            UISystem.updateStats(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime, EntityManager.getPlayerCount());
        }
    },    // 更新可控玩家
    updateControllablePlayer(player) {
        // 新的点击移动系统
        if (this.isMoving) {
            const dx = this.targetX - player.x;
            const dy = this.targetY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 计算当前速度
            const currentSpeed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
            
            // 只有当距离很近且速度较慢时才停止
            // 如果速度还很快，说明玩家刚吃完扇贝，应该继续移动
            if (distance < 10 && currentSpeed < 2) {
                this.isMoving = false;
                this.isAccelerating = false;
                player.velocityX = 0;
                player.velocityY = 0;
                
                // Send stop command with exact position to server
                if (MultiplayerGame.enabled) {
                    MultiplayerGame.sendStopCommand();
                }
                
                return;
            }
            
            // 计算方向
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // 应用加速度 - 使用CONFIG中的参数与服务器完全一致
            const baseAccel = CONFIG.playerAcceleration || player.acceleration || 0.25;
            const accel = baseAccel * 2.5 * this.moveSpeed;
            if (this.isAccelerating) {
                player.isBoosting = true;
            } else {
                player.isBoosting = false;
            }
            
            // 加速向目标移动
            player.velocityX += dirX * accel;
            player.velocityY += dirY * accel;
        }
        // 兼容旧的拖拽系统
        else if (this.isDragging) {
            const dragLength = Math.sqrt(this.dragVectorX * this.dragVectorX + this.dragVectorY * this.dragVectorY);
            const dragAngle = Math.atan2(this.dragVectorY, this.dragVectorX);
            const maxDragLength = 150;
            this.dragForce = Math.min(1, dragLength / maxDragLength);
            
            // 计算目标速度
            const baseAccel = CONFIG.playerAcceleration || player.acceleration || 0.25;
            let targetAcceleration = baseAccel * this.dragForce;
            player.isBoosting = this.isRightMouseDown;
            if (this.isRightMouseDown) targetAcceleration *= player.boostMultiplier;
            
            if (dragLength > 10) {
                // 直接加速 - 更快速的响应
                player.velocityX += Math.cos(dragAngle) * targetAcceleration;
                player.velocityY += Math.sin(dragAngle) * targetAcceleration;
            }
        }
        
        // 使用CONFIG中的最大速度参数
        const baseMaxSpeed = CONFIG.playerMaxSpeed || player.maxSpeed || 6;
        const maxSpeed = player.isBoosting ? baseMaxSpeed * (player.boostMultiplier || 1.5) : baseMaxSpeed;
        const currentSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
        
        if (currentSpeed > maxSpeed) {
            player.velocityX = (player.velocityX / currentSpeed) * maxSpeed;
            player.velocityY = (player.velocityY / currentSpeed) * maxSpeed;
        }          player.x += player.velocityX;
        player.y += player.velocityY;
        
        // 更新方向向量（用于绘制）
        const speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
        if (speed > 0.1) {
            player.directionX = player.velocityX / speed;
            player.directionY = player.velocityY / speed;
        }
        // 如果几乎静止，保持当前方向
        
        // 减速逻辑 - 使用与服务器相同的参数确保预测准确
        if (!this.isDragging && !this.isMoving) {
            // 使用与服务器相同的减速率
            const deceleration = player.deceleration || CONFIG.playerDeceleration || 0.15;
            player.velocityX *= (1 - deceleration);
            player.velocityY *= (1 - deceleration);
            
            // 与服务器相同的停止阈值
            if (Math.abs(player.velocityX) < 0.01) player.velocityX = 0;
            if (Math.abs(player.velocityY) < 0.01) player.velocityY = 0;
            player.isBoosting = false;
        }
        
        player.speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
    },
    
    // 更新AI玩家
    updateAIPlayer(player, deltaTime) {
        this.updateAIBehavior(player, deltaTime, true);
        
        const speed = player.baseSpeed * (1 - player.size * 0.1);
        player.x += player.directionX * speed;
        player.y += player.directionY * speed;
    },
    
    // 更新AI海鸥
    updateAISeagulls(deltaTime) {
        EntityManager.aiSeagulls.forEach(seagull => {
            if (seagull.isDead) return;
            
            // 检查能力值，如果<=0则标记为死亡
            if (seagull.power <= 0) {
                seagull.isDead = true;
                console.log(`💀 AI Seagull ${seagull.name} died (power: ${seagull.power})`);
                return;
            }
            
            if (this.aiEnhancer && CONFIG.enableEnhancedAI) {
                this.aiEnhancer.enhanceBasicAI(seagull, deltaTime, EntityManager.players, EntityManager.scallops);
            } else {
                this.updateAIBehavior(seagull, deltaTime, false);
            }
            
            seagull.x += seagull.directionX * seagull.baseSpeed;
            seagull.y += seagull.directionY * seagull.baseSpeed;
            CollisionSystem.keepInBounds(seagull, CONFIG.worldWidth, CONFIG.worldHeight);
        });
    },
    
    // 更新AI行为
    updateAIBehavior(entity, deltaTime, isPlayer) {
        entity.aiTimer += deltaTime / 1000;
        
        if (entity.aiTimer > 2 + Math.random() * 3) {
            entity.aiTimer = 0;
            const rand = Math.random();
            if (rand < 0.4) entity.aiState = 'wandering';
            else if (rand < 0.7) entity.aiState = 'seekingFood';
            else entity.aiState = 'hunting';
        }
        
        entity.avoidanceVectorX = 0;
        entity.avoidanceVectorY = 0;
        entity.foodSeekingVectorX = 0;
        entity.foodSeekingVectorY = 0;
        entity.randomMovementVectorX = 0;
        entity.randomMovementVectorY = 0;
        
        // 避险检测
        let nearestDanger = null;
        let nearestDangerDistance = Infinity;
        let totalDangerX = 0, totalDangerY = 0;
        let dangerCount = 0;
        
        EntityManager.players.forEach(other => {
            if (other !== entity && !other.isDead && other.power > entity.power * 1.2) {
                const dx = other.x - entity.x;
                const dy = other.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 400) {
                    if (distance < nearestDangerDistance) {
                        nearestDangerDistance = distance;
                        nearestDanger = other;
                    }
                    
                    totalDangerX += dx;
                    totalDangerY += dy;
                    dangerCount++;
                }
            }
        });
        
        if (!isPlayer) {
            EntityManager.aiSeagulls.forEach(other => {
                if (other !== entity && !other.isDead && other.power > entity.power * 1.2) {
                    const dx = other.x - entity.x;
                    const dy = other.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 300) {
                        if (distance < nearestDangerDistance) {
                            nearestDangerDistance = distance;
                            nearestDanger = other;
                        }
                        
                        totalDangerX += dx;
                        totalDangerY += dy;
                        dangerCount++;
                    }
                }
            });
        }
        
        if (dangerCount > 0 || nearestDanger) {
            entity.aiState = 'avoiding';
            entity.fearLevel = Math.min(1, 300 / (nearestDangerDistance || 300));
            
            if (totalDangerX !== 0 || totalDangerY !== 0) {
                entity.avoidanceVectorX = -totalDangerX / dangerCount;
                entity.avoidanceVectorY = -totalDangerY / dangerCount;
                
                const length = Math.sqrt(entity.avoidanceVectorX * entity.avoidanceVectorX + 
                                        entity.avoidanceVectorY * entity.avoidanceVectorY);
                if (length > 0) {
                    entity.avoidanceVectorX /= length;
                    entity.avoidanceVectorY /= length;
                }
            }
            
            if (nearestDangerDistance < 100) entity.fearLevel = 1.5;
        } else {
            entity.fearLevel = Math.max(0, entity.fearLevel - 0.01);
            
            if (entity.aiState === 'seekingFood') {
                let nearestFood = null;
                let nearestFoodDistance = Infinity;
                let totalFoodX = 0, totalFoodY = 0;
                let foodCount = 0;
                
                EntityManager.scallops.forEach(scallop => {
                    const dx = scallop.x - entity.x;
                    const dy = scallop.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 500) {
                        if (distance < nearestFoodDistance) {
                            nearestFoodDistance = distance;
                            nearestFood = scallop;
                        }
                        
                        totalFoodX += dx;
                        totalFoodY += dy;
                        foodCount++;
                    }
                });
                
                if (foodCount > 0) {
                    entity.foodSeekingVectorX = totalFoodX / foodCount;
                    entity.foodSeekingVectorY = totalFoodY / foodCount;
                    
                    const length = Math.sqrt(entity.foodSeekingVectorX * entity.foodSeekingVectorX + 
                                            entity.foodSeekingVectorY * entity.foodSeekingVectorY);
                    if (length > 0) {
                        entity.foodSeekingVectorX /= length;
                        entity.foodSeekingVectorY /= length;
                    }
                }
            } else if (entity.aiState === 'hunting') {
                let nearestWeakTarget = null;
                let nearestWeakDistance = Infinity;
                
                EntityManager.players.forEach(other => {
                    if (other !== entity && !other.isDead && other.power < entity.power * 0.8) {
                        const dx = other.x - entity.x;
                        const dy = other.y - entity.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 400 && distance < nearestWeakDistance) {
                            nearestWeakDistance = distance;
                            nearestWeakTarget = other;
                        }
                    }
                });
                
                if (!isPlayer) {
                    EntityManager.aiSeagulls.forEach(other => {
                        if (other !== entity && !other.isDead && other.power < entity.power * 0.8) {
                            const dx = other.x - entity.x;
                            const dy = other.y - entity.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < 400 && distance < nearestWeakDistance) {
                                nearestWeakDistance = distance;
                                nearestWeakTarget = other;
                            }
                        }
                    });
                }
                
                if (nearestWeakTarget) {
                    const dx = nearestWeakTarget.x - entity.x;
                    const dy = nearestWeakTarget.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        entity.foodSeekingVectorX = dx / distance;
                        entity.foodSeekingVectorY = dy / distance;
                    }
                }
            }
            
            entity.randomMovementVectorX = (Math.random() - 0.5) * 2;
            entity.randomMovementVectorY = (Math.random() - 0.5) * 2;
        }
        
        const totalVectorX = 
            entity.avoidanceVectorX * (2.0 + entity.fearLevel) + 
            entity.foodSeekingVectorX * 1.5 + 
            entity.randomMovementVectorX * 0.5;
        
        const totalVectorY = 
            entity.avoidanceVectorY * (2.0 + entity.fearLevel) +
            entity.foodSeekingVectorY * 1.5 +
            entity.randomMovementVectorY * 0.5;
        
        const totalLength = Math.sqrt(totalVectorX * totalVectorX + totalVectorY * totalVectorY);
        
        if (totalLength > 0) {
            entity.directionX = totalVectorX / totalLength;
            entity.directionY = totalVectorY / totalLength;
        }
    },
    
    // 处理碰撞
    handleCollisions() {
        // 玩家与扇贝碰撞
        CollisionSystem.handlePlayerScallopCollisions(
            EntityManager.players,
            EntityManager.scallops,
            (player, scallop, index) => {
                this.onScallopEaten(player, scallop, index);
            }
        );
        
        // AI海鸥与扇贝碰撞
        CollisionSystem.handleAISeagullScallopCollisions(
            EntityManager.aiSeagulls,
            EntityManager.scallops,
            (seagull, scallop, index) => {
                this.onScallopEaten(seagull, scallop, index);
            }
        );
        
        // 玩家间能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.players,
            EntityManager.players,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
        
        // 玩家与AI海鸥能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.players,
            EntityManager.aiSeagulls,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
        
        // AI海鸥间能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.aiSeagulls,
            EntityManager.aiSeagulls,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
    },
      // 扇贝被吃掉
    onScallopEaten(entity, scallop, index) {
        entity.power += scallop.powerValue;
        entity.size += CONFIG.scallopSizeIncrease * (entity.isPlayer ? 1 : 0.5);
        // 限制海鸥最大和最小显示大小，防止负数或过小
        entity.size = Math.max(0.1, Math.min(CONFIG.maxSeagullSize, entity.size));
        entity.lastScallopEaten = Date.now();
        
        if (entity.isControllable) this.scallopsEaten++;
        
        // 移除被吃的扇贝
        EntityManager.scallops.splice(index, 1);
        
        // 只在单机模式下创建新扇贝（多人模式由服务器管理）
        if (!MultiplayerGame.enabled) {
            EntityManager.scallops.push(EntityManager.createScallop(
                Math.random() * (CONFIG.worldWidth - 30) + 15,
                Math.random() * (CONFIG.worldHeight - 30) + 15
            ));
        }
        
        if (CONFIG.showPowerTransfers && entity.isControllable) {
            // 使用新的效果创建函数
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    scallop.x,
                    scallop.y,
                    `+${scallop.powerValue}`,
                    '#4CAF50'
                )
            );
        }
    },
    
    // 能力值转移
    onPowerTransfer(stronger, weaker) {
        // 计算转移量：
        // - 强者获得：弱者能力值的 strongTransferRate%
        // - 弱者损失：自己能力值的 weakTransferRate%
        const gainAmount = Math.floor(weaker.power * (CONFIG.strongTransferRate / 100));
        const lossAmount = Math.floor(weaker.power * (CONFIG.weakTransferRate / 100));
        
        // 确保损失量不超过弱者的实际能力值
        const actualLoss = Math.min(lossAmount, weaker.power);
        const actualGain = Math.min(gainAmount, weaker.power);        // 应用转移（移除maxPower限制，允许无限成长）
        stronger.power = Math.max(0, stronger.power + actualGain); // 确保不会因为bug变成负数
        weaker.power = Math.max(0, weaker.power - actualLoss);

        // 只在涉及可控玩家时显示效果，减少屏幕混乱
        if (CONFIG.showPowerTransfers && (stronger.isControllable || weaker.isControllable)) {
            const effectX = (stronger.x + weaker.x) / 2;
            const effectY = (stronger.y + weaker.y) / 2;

            // 显示正向增益
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    effectX,
                    effectY,
                    `+${actualGain}`,
                    '#4CAF50'
                )
            );

            // 显示弱者损失
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    effectX,
                    effectY + 15,
                    `-${actualLoss}`,
                    '#F44336'
                )
            );
        }        // 根据能力值更新大小（限制最大值和最小值，防止负数或过大）
        // 确保size至少为0.1，防止Canvas绘图错误
        stronger.size = Math.min(CONFIG.maxSeagullSize, Math.max(0.1, 0.5 + (stronger.power / 200)));
        weaker.size = Math.min(CONFIG.maxSeagullSize, Math.max(0.1, 0.5 + (weaker.power / 200)));

        if (weaker.power <= 0) {
            weaker.isDead = true;
            if (weaker.isControllable) {
                this.endGame();
            } else if (stronger.isControllable && !weaker.isControllable) {
                // 玩家击败了AI海鸥
                this.aiDefeated++;
                console.log(`🎯 AI defeated: ${this.aiDefeated}`);
            }
        }
    },
    
    // 移除死亡实体
    removeDeadEntities() {
        // 移除死亡的AI玩家
        for (let i = EntityManager.players.length - 1; i >= 0; i--) {
            if (EntityManager.players[i].isDead && !EntityManager.players[i].isControllable) {
                EntityManager.players.splice(i, 1);
            }
        }
        
        // 移除死亡的AI海鸥并补充
        for (let i = EntityManager.aiSeagulls.length - 1; i >= 0; i--) {
            if (EntityManager.aiSeagulls[i].isDead) {
                EntityManager.aiSeagulls.splice(i, 1);
                
                if (EntityManager.aiSeagulls.length < CONFIG.aiSeagullCount) {
                    const size = Math.random() * 0.8 + 0.5;
                    const power = Math.floor(Math.random() * 30) + 30;
                    EntityManager.aiSeagulls.push(EntityManager.createAISeagull(
                        Math.random() * CONFIG.worldWidth,
                        Math.random() * CONFIG.worldHeight,
                        size,
                        power
                    ));
                }
            }
        }
    },
    
    // 更新能力值转移效果
    updatePowerTransferEffects(deltaTime) {
        const effects = EntityManager.powerTransferEffects;
        
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            
            // 更新生命值（加快消失速度）
            effect.life -= deltaTime / 1000;
            
            // 更快向上移动
            effect.y -= deltaTime / 20;  // 从 /30 改为 /20，移动更快
            
            // 更快缩小
            effect.scale = Math.max(0.3, effect.scale - deltaTime / 1000);  // 从 /2000 改为 /1000
            
            // 根据生命值调整透明度（更快淡出）
            effect.alpha = Math.min(1, effect.life * 1.5);  // 从 *2 改为 *1.5，更快淡出
        }
        
        // 清理过期效果
        EntityManager.cleanupEffects();
    },
    
    // 更新扇贝成长
    updateScallopGrowth(deltaTime) {
        if (!CONFIG.scallopGrowth.enabled) return;
        
        const now = Date.now();
        const growthSpeed = CONFIG.scallopGrowth.growthSpeed;
        
        // 获取当前最高海鸥能力值
        const topSeagullPower = this.getTopSeagullPower();
        
        // 清理过期的变质扇贝（生命周期结束）
        if (CONFIG.spoiledScallop.enabled && CONFIG.spoiledScallop.lifetime > 0) {
            for (let i = EntityManager.scallops.length - 1; i >= 0; i--) {
                const scallop = EntityManager.scallops[i];
                if (scallop.isSpoiled && scallop.spawnTime) {
                    const age = now - scallop.spawnTime;
                    if (age >= CONFIG.spoiledScallop.lifetime) {
                        // 创建腐烂特效
                        if (CONFIG.scallopGrowth.showGrowthEffect) {
                            EntityManager.powerTransferEffects.push(
                                EntityManager.createPowerTransferEffect(
                                    scallop.x,
                                    scallop.y,
                                    '💨',
                                    '#696969'
                                )
                            );
                        }
                        EntityManager.scallops.splice(i, 1);
                        // 补充一个新的普通扇贝
                        const newScallop = EntityManager.createScallop(
                            Math.random() * CONFIG.worldWidth,
                            Math.random() * CONFIG.worldHeight
                        );
                        EntityManager.scallops.push(newScallop);
                    }
                }
            }
        }
        
        EntityManager.scallops.forEach(scallop => {
            // 处理扇贝王候选的成长
            if (scallop.isKingCandidate && !scallop.isKing) {
                const kingAge = now - scallop.kingGrowthStartTime;
                if (kingAge >= CONFIG.scallopKing.growthTime / growthSpeed) {
                    EntityManager.promoteToScallopKing(scallop, topSeagullPower);
                    // 创建升级特效
                    if (CONFIG.scallopGrowth.showGrowthEffect) {
                        EntityManager.powerTransferEffects.push(
                            EntityManager.createPowerTransferEffect(
                                scallop.x,
                                scallop.y - 30,
                                '👑 KING!',
                                CONFIG.scallopKing.colors.glow
                            )
                        );
                    }
                }
            }
            
            // 跳过变质扇贝和扇贝王的普通成长
            if (scallop.isSpoiled || scallop.isKing || scallop.isKingCandidate) return;
            
            const age = now - scallop.birthTime;
            
            // 检查是否可以成长
            if (scallop.growthStage === 'small' && age >= CONFIG.scallopGrowth.smallToMediumTime / growthSpeed) {
                this.growScallop(scallop, 'medium');
            } else if (scallop.growthStage === 'medium' && age >= (CONFIG.scallopGrowth.smallToMediumTime + CONFIG.scallopGrowth.mediumToLargeTime) / growthSpeed) {
                this.growScallop(scallop, 'large');
            }
            
            // 更新成长动画
            if (scallop.isGrowing) {
                scallop.growthProgress += deltaTime / 1000;  // 1秒的成长动画
                
                if (scallop.growthProgress >= 1) {
                    scallop.isGrowing = false;
                    scallop.growthProgress = 0;
                    scallop.currentSize = scallop.targetSize;
                } else {
                    // 平滑过渡大小
                    const oldSize = CONFIG.scallopTypes[scallop.type === 'medium' ? 'small' : 'medium'].size;
                    scallop.currentSize = oldSize + (scallop.targetSize - oldSize) * scallop.growthProgress;
                }
            }
        });
    },
    
    // 获取最高海鸥能力值
    getTopSeagullPower() {
        let maxPower = 100;  // 默认最低值
        
        // 检查所有玩家
        EntityManager.players.forEach(player => {
            if (!player.isDead && player.power > maxPower) {
                maxPower = player.power;
            }
        });
        
        // 检查所有AI海鸥
        EntityManager.aiSeagulls.forEach(seagull => {
            if (!seagull.isDead && seagull.power > maxPower) {
                maxPower = seagull.power;
            }
        });
        
        return maxPower;
    },
    
    // 扇贝成长到下一阶段
    growScallop(scallop, newStage) {
        scallop.growthStage = newStage;
        scallop.type = newStage;
        
        const typeConfig = CONFIG.scallopTypes[newStage];
        scallop.targetSize = typeConfig.size;
        scallop.powerValue = typeConfig.powerValue;
        scallop.color = typeConfig.colors.outer;
        scallop.innerColor = typeConfig.colors.inner;
        
        // 启动成长动画
        scallop.isGrowing = true;
        scallop.growthProgress = 0;
        
        // 创建成长特效
        if (CONFIG.scallopGrowth.showGrowthEffect) {
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    scallop.x,
                    scallop.y - 20,
                    newStage === 'medium' ? '↑' : '↑↑',
                    '#4CAF50'
                )
            );
        }
    },    
    // 绘制游戏
    drawGame() {
        // Find the local controllable player (important for multiplayer)
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        
        // 调试：第一次绘制时输出信息
        if (!this._firstDrawDone) {
            console.log(`🎨 First draw - mainPlayer:`, mainPlayer ? mainPlayer.name : 'null');
            if (mainPlayer) {
                console.log(`🎨 MainPlayer details:`, {
                    name: mainPlayer.name,
                    isControllable: mainPlayer.isControllable,
                    isDead: mainPlayer.isDead,
                    x: mainPlayer.x,
                    y: mainPlayer.y,
                    size: mainPlayer.size,
                    power: mainPlayer.power
                });
            } else {
                console.error(`❌ No mainPlayer found! Players array:`, EntityManager.players.map(p => ({
                    name: p.name,
                    isControllable: p.isControllable,
                    isDead: p.isDead
                })));
            }
            console.log(`🎨 Drawing entities:`, {
                players: EntityManager.players.length,
                aiSeagulls: EntityManager.aiSeagulls.length,
                scallops: EntityManager.scallops.length
            });
            this._firstDrawDone = true;
        }
        
        DrawingSystem.drawFrame(
            mainPlayer,
            EntityManager.players,
            EntityManager.aiSeagulls,
            EntityManager.scallops,
            EntityManager.powerTransferEffects,
            this.zoomLevel
        );
        
        // 注释掉重复的游戏信息显示，因为左侧面板已经显示了这些信息
        // DrawingSystem.drawGameInfo(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime);
    },
    // 快速停止
    quickStop() {
        // Find the local controllable player (important for multiplayer)
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (mainPlayer && mainPlayer.isControllable) {
            mainPlayer.velocityX = 0;
            mainPlayer.velocityY = 0;
            mainPlayer.speed = 0;
            UISystem.updateSpeed(mainPlayer);
        }
    },
      // 放大 (切换到下一个缩放级别)
    zoomIn() {
        if (this.currentZoomIndex < this.zoomLevels.length - 1) {
            this.currentZoomIndex++;
            this.zoomLevel = this.zoomLevels[this.currentZoomIndex];
            UISystem.updateZoomValue(this.zoomLevel);
            console.log(`🔍 Zoomed in to ${this.zoomLevel}x (Level ${this.currentZoomIndex + 1}/${this.zoomLevels.length})`);
        } else {
            console.log(`🔍 Already at maximum zoom (${this.zoomLevel}x)`);
        }
    },
    
    // 缩小 (切换到上一个缩放级别)
    zoomOut() {
        if (this.currentZoomIndex > 0) {
            this.currentZoomIndex--;
            this.zoomLevel = this.zoomLevels[this.currentZoomIndex];
            UISystem.updateZoomValue(this.zoomLevel);
            console.log(`🔍 Zoomed out to ${this.zoomLevel}x (Level ${this.currentZoomIndex + 1}/${this.zoomLevels.length})`);
        } else {
            console.log(`🔍 Already at minimum zoom (${this.zoomLevel}x)`);
        }
    },
    
    // 重置缩放到默认级别
    resetZoom() {
        this.currentZoomIndex = 0;
        this.zoomLevel = this.zoomLevels[0];
        UISystem.updateZoomValue(this.zoomLevel);
        console.log(`🔍 Reset zoom to ${this.zoomLevel}x`);
    },
    
    // 设置特定缩放级别 (0, 1, 或 2)
    setZoomLevel(index) {
        if (index >= 0 && index < this.zoomLevels.length) {
            this.currentZoomIndex = index;
            this.zoomLevel = this.zoomLevels[index];
            UISystem.updateZoomValue(this.zoomLevel);
            console.log(`🔍 Set zoom to ${this.zoomLevel}x (Level ${index + 1}/${this.zoomLevels.length})`);
        }
    },
    
    // 获取随机玩家颜色
    getRandomPlayerColor() {
        const colors = ['#FF5252', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// 导出游戏对象
window.game = Game;