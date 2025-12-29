// ==================== 主程序入口 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化海鸥世界统一平台系统
    if (typeof SeagullWorldAuth !== 'undefined') {
        SeagullWorldAuth.init();
    }
    if (typeof SeagullWorldUI !== 'undefined') {
        SeagullWorldUI.init();
    }
    
    // 初始化绘制系统
    DrawingSystem.init('gameCanvas');
    
    // 初始化保存/加载系统
    SaveLoadSystem.init();
    
    // 初始化玩家名称显示（使用海鸥名）
    const seagullName = PlayerIdentity.getSeagullName();
    document.getElementById('playerName').textContent = seagullName;
    console.log(`🦅 Seagull name: ${seagullName}`);
    console.log(`💾 Save file username: ${PlayerIdentity.getUsername()}`);
    
    // 初始化整合用户面板
    initIntegratedUserPanel();
    
    // 应用初始语言设置
    UISystem.applyLanguage();
    
    // 设置初始地图大小显示
    document.getElementById('mapSize').textContent = `${CONFIG.worldWidth}x${CONFIG.worldHeight}`;
    document.getElementById('aiPlayerCount').textContent = CONFIG.aiPlayerCount;
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化游戏尺寸
    game.initGameSize();
    
    // 检查 URL 参数，自动启动指定模式
    checkAutoStartMode();
});

// 设置事件监听器
function setupEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    
    // 鼠标点击事件（优化版控制系统）
    canvas.addEventListener('mousedown', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const now = Date.now();
        
        if (e.button === 0) {
            // 左键点击
            e.preventDefault();
            
            // 转换为世界坐标
            const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
            if (!mainPlayer) return;
            
            const cameraOffsetX = mainPlayer.velocityX * 10;
            const cameraOffsetY = mainPlayer.velocityY * 10;
            const maxOffset = 150;
            const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
            const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
            
            const viewportOriginX = mainPlayer.x - actualOffsetX - (canvas.width / 2) / game.zoomLevel;
            const viewportOriginY = mainPlayer.y - actualOffsetY - (canvas.height / 2) / game.zoomLevel;
            
            game.targetX = viewportOriginX + mouseX / game.zoomLevel;
            game.targetY = viewportOriginY + mouseY / game.zoomLevel;
            
            // 优化双击检测 - 缩短检测窗口
            const doubleClickWindow = 250; // 从300ms降低到250ms
            if (now - game.lastLeftClickTime < doubleClickWindow) {
                // 双击左键 - 急刹车
                game.isMoving = false;
                game.isAccelerating = false;
                mainPlayer.velocityX = 0;
                mainPlayer.velocityY = 0;
                mainPlayer.speed = 0;
                game.lastLeftClickTime = 0; // 重置，避免三连击误判
                
                // Send quick stop to server in multiplayer
                if (MultiplayerGame.enabled) {
                    MultiplayerGame.sendQuickStopCommand();
                }
            } else {
                // 单击左键 - 立即开始移动（不再切换）
                game.isMoving = true;
                game.lastLeftClickTime = now;
                
                // Send move command to server in multiplayer
                if (MultiplayerGame.enabled) {
                    MultiplayerGame.sendMoveCommand(game.targetX, game.targetY);
                }
            }
            
            UISystem.hideControlHint();
        }
        
        if (e.button === 2) {
            // 右键点击 - 只在移动时有效
            e.preventDefault();
            
            if (game.isMoving) {
                const doubleClickWindow = 250;
                // 检测双击
                if (now - game.lastRightClickTime < doubleClickWindow) {
                    // 双击右键 - 最大加速
                    game.moveSpeed = 2.0;
                    game.isAccelerating = true;
                    game.lastRightClickTime = 0;
                    
                    // Send boost to server in multiplayer
                    if (MultiplayerGame.enabled) {
                        MultiplayerGame.sendBoostCommand(2.0);
                    }
                } else {
                    // 单击右键 - 普通加速
                    game.moveSpeed = 1.5;
                    game.isAccelerating = true;
                    game.lastRightClickTime = now;
                    
                    // Send boost to server in multiplayer
                    if (MultiplayerGame.enabled) {
                        MultiplayerGame.sendBoostCommand(1.5);
                    }
                }
            }
        }
    });
    
    // 鼠标移动事件 - 实时跟随优化
    canvas.addEventListener('mousemove', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (!mainPlayer || !game.isMoving) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 转换为世界坐标
        const cameraOffsetX = mainPlayer.velocityX * 10;
        const cameraOffsetY = mainPlayer.velocityY * 10;
        const maxOffset = 150;
        const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
        const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
        
        const viewportOriginX = mainPlayer.x - actualOffsetX - (canvas.width / 2) / game.zoomLevel;
        const viewportOriginY = mainPlayer.y - actualOffsetY - (canvas.height / 2) / game.zoomLevel;
        
        // 快速更新目标位置（弱化平滑，提升响应）
        const newTargetX = viewportOriginX + mouseX / game.zoomLevel;
        const newTargetY = viewportOriginY + mouseY / game.zoomLevel;
        
        // 大幅提升插值速度，几乎实时跟随
        const smoothFactor = 0.8; // 从0.3提升到0.8
        game.targetX += (newTargetX - game.targetX) * smoothFactor;
        game.targetY += (newTargetY - game.targetY) * smoothFactor;
        
        // Send updated target to server in multiplayer (throttled)
        if (MultiplayerGame.enabled) {
            if (!this.lastMouseMoveTime || Date.now() - this.lastMouseMoveTime > 50) {
                MultiplayerGame.sendMoveCommand(game.targetX, game.targetY);
                this.lastMouseMoveTime = Date.now();
            }
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        if (e.button === 2) {
            // 右键释放 - 停止加速
            if (game.moveSpeed > 1.0) {
                game.moveSpeed = 1.0;
            }
            // 保持isAccelerating状态，让海鸥继续以当前速度移动
            
            // Send stop boost to server in multiplayer
            if (MultiplayerGame.enabled) {
                MultiplayerGame.sendStopBoostCommand();
            }
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        // 不做任何操作，让海鸥继续移动
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!game.running || game.paused || game.gameOver) return;
        
        if (e.deltaY < 0) game.zoomIn();
        else game.zoomOut();
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // Save/Load shortcuts work anytime
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            SaveLoadSystem.saveGame();
            return;
        }
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            SaveLoadSystem.loadGame();
            return;
        }
        
        if (!game.running || game.paused || game.gameOver) return;
        
        switch(e.key) {
            case ' ': game.quickStop(); break;
            case '+': case '=': game.zoomIn(); break;
            case '-': case '_': game.zoomOut(); break;
            case '1': game.setZoomLevel(0); break; // 1.0x zoom
            case '2': game.setZoomLevel(1); break; // 1.5x zoom
            case '3': game.setZoomLevel(2); break; // 2.0x zoom
            case 'r': case 'R': game.resetZoom(); break; // Reset zoom to 1.0x
            case 'm': case 'M': MiniMapSystem.toggleMiniMap(); break;
        }
    });
    
    // 缩放按钮
    document.getElementById('zoomInBtn').addEventListener('click', () => game.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => game.zoomOut());
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        if (game.running) game.initGameSize();
    });
}

// 初始化整合用户面板
function initIntegratedUserPanel() {
    const integratedPanel = document.getElementById('integratedUserPanel');
    if (!integratedPanel) return;
    
    // 检查是否已登录
    const isLoggedIn = typeof SeagullWorldAuth !== 'undefined' && SeagullWorldAuth.isLoggedIn();
    
    if (isLoggedIn) {
        // 已登录用户 - updateDashboardUI 会处理
        integratedPanel.style.display = 'flex';
    } else {
        // 游客模式 - 显示游客信息
        const seagullName = PlayerIdentity.getSeagullName();
        document.getElementById('userName').textContent = seagullName;
        document.getElementById('userAvatar').textContent = '🦅';
        document.getElementById('userLevel').textContent = 'Lv.1';
        document.getElementById('userCoins').textContent = '💰 0';
        
        // 初始化时不显示模式（等游戏开始）
        const userMode = document.getElementById('userMode');
        if (userMode) {
            userMode.style.display = 'none';
        }
        
        // 游客也显示面板
        integratedPanel.style.display = 'flex';
    }
    
    // 检查是否有选择的房间并显示房间信息
    checkAndDisplayRoomInfo();
}

// 检查并显示房间信息
async function checkAndDisplayRoomInfo() {
    const selectedRoomId = sessionStorage.getItem('selectedRoomId');
    const userRoom = document.getElementById('userRoom');
    const currentRoomName = document.getElementById('currentRoomName');
    
    if (!userRoom || !currentRoomName) return;
    
    // 获取翻译文本的辅助函数
    const getTranslation = (key) => {
        const currentLang = localStorage.getItem('language') || 'zh';
        return window.SeagullWorldUI?.translations?.[currentLang]?.[key] || key;
    };
    
    if (selectedRoomId && selectedRoomId !== 'null' && selectedRoomId !== 'default') {
        // 用户选择了特定房间，从服务器获取房间信息
        try {
            const response = await fetch(`/api/rooms/${selectedRoomId}`);
            const data = await response.json();
            
            if (data.success && data.room) {
                currentRoomName.textContent = data.room.name;
                userRoom.style.display = 'inline-block';
                console.log(`📍 Displaying room info: ${data.room.name}`);
            } else {
                // 房间不存在，显示默认
                currentRoomName.textContent = getTranslation('defaultLobby');
                userRoom.style.display = 'inline-block';
            }
        } catch (error) {
            console.error('Failed to fetch room info:', error);
            currentRoomName.textContent = getTranslation('defaultLobby');
            userRoom.style.display = 'inline-block';
        }
    } else {
        // 默认房间
        currentRoomName.textContent = getTranslation('defaultLobby');
        userRoom.style.display = 'inline-block';
    }
}

// 检查 URL 参数，自动启动游戏模式
function checkAutoStartMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const autostart = urlParams.get('autostart');
    
    if (mode === 'multiplayer') {
        console.log('🌐 Auto-starting multiplayer mode from URL parameter...');
        // 延迟一下，确保页面完全加载
        setTimeout(() => {
            game.startMultiplayer();
        }, 500);
    } else if (mode === 'singleplayer' || mode === 'single' || autostart === 'single') {
        console.log('🎮 Auto-starting single player mode from URL parameter...');
        setTimeout(() => {
            game.startGame();
        }, 500);
    }
    // 如果没有参数，不自动启动，等待用户点击按钮
}