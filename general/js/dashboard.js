// ==================== 海鸥世界Dashboard逻辑 ====================

// 在线人数更新功能
let onlinePlayersCount = 0;

// 更新在线人数显示
function updateOnlinePlayersDisplay() {
    const onlineNumber = document.getElementById('onlineNumber');
    if (onlineNumber) {
        onlineNumber.textContent = onlinePlayersCount;
    }
}

// 从服务器获取在线人数（模拟）
async function fetchOnlinePlayersCount() {
    try {
        // 尝试从WebSocket连接数获取（如果服务器支持）
        // 这里先使用模拟数据，实际应该从服务器API获取
        const response = await fetch('/api/stats/online').catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            onlinePlayersCount = data.count || 0;
        } else {
            // 模拟在线人数（80-150之间随机）
            onlinePlayersCount = Math.floor(Math.random() * 70) + 80;
        }
        
        updateOnlinePlayersDisplay();
    } catch (error) {
        console.warn('[Dashboard] Failed to fetch online players count:', error);
        // 使用模拟数据
        onlinePlayersCount = Math.floor(Math.random() * 70) + 80;
        updateOnlinePlayersDisplay();
    }
}

// 启动在线人数定期更新
function startOnlinePlayersUpdates() {
    // 立即获取一次
    fetchOnlinePlayersCount();
    
    // 每30秒更新一次
    setInterval(fetchOnlinePlayersCount, 30000);
}

// 进入游戏（需要登录）
function enterGame(gameId) {
    // 检查是否已登录
    if (!SeagullWorldAuth.isLoggedIn()) {
        SeagullWorldUI.showNotification('⚠️ 请先登录再进入游戏', 'warning');
        SeagullWorldUI.showAuthDialog('login');
        return;
    }
    
    // 跳转到游戏页面
    if (gameId === 'scallopsIO') {
        // 检测当前页面位置，使用正确的相对路径
        const currentPath = window.location.pathname;
        if (currentPath.includes('/game/game-index.html')) {
            // 从游戏大厅进入
            window.location.href = 'eatscallop/eatscallop-index.html';
        } else {
            // 从主页进入
            window.location.href = 'game/eatscallop/eatscallop-index.html';
        }
    }
}

// 匿名进入游戏（无需登录，但不能存档）
function enterGameAnonymous(gameId) {
    // 检查是否已登录
    if (SeagullWorldAuth.isLoggedIn()) {
        const language = localStorage.getItem('seagullWorldLanguage') || 'zh';
        const message = language === 'zh' 
            ? '⚠️ 您已登录，无需使用匿名模式\n\n请直接点击"开始游戏"按钮进入游戏。' 
            : '⚠️ You are already logged in\n\nPlease use "Start Game" button instead.';
        
        if (typeof SeagullWorldUI !== 'undefined') {
            SeagullWorldUI.showNotification(message, 'warning');
        } else {
            alert(message);
        }
        return;
    }
    
    if (gameId === 'scallopsIO') {
        // 设置匿名模式标记
        sessionStorage.setItem('anonymousMode', 'true');
        
        // 获取当前语言
        const language = localStorage.getItem('seagullWorldLanguage') || 'zh';
        
        // 生成双语随机匿名玩家名
        const anonymousNamesZh = [
            '匿名海鸥', '访客海鸥', '游客海鸥', '神秘海鸥', 
            '流浪海鸥', '旅行者海鸥', '随机海鸥', '飞翔海鸥', '海洋海鸥'
        ];
        const anonymousNamesEn = [
            'Anonymous Seagull', 'Guest Seagull', 'Visitor Seagull',
            'Unknown Seagull', 'Wanderer Seagull', 'Traveler Seagull',
            'Mystery Seagull', 'Random Seagull', 'Flying Seagull',
            'Ocean Seagull'
        ];
        
        const nameList = language === 'zh' ? anonymousNamesZh : anonymousNamesEn;
        const randomName = nameList[Math.floor(Math.random() * nameList.length)] + ' ' + Math.floor(Math.random() * 1000);
        sessionStorage.setItem('anonymousPlayerName', randomName);
        
        // 显示双语提示信息
        const message = language === 'zh' 
            ? '🎮 进入匿名模式 - 无法保存游戏进度' 
            : '🎮 Entering anonymous mode - Cannot save game progress';
        
        if (typeof SeagullWorldUI !== 'undefined') {
            SeagullWorldUI.showNotification(message, 'info');
        }
        
        // 延迟跳转，让用户看到提示
        setTimeout(() => {
            // 检测当前页面位置，使用正确的相对路径
            const currentPath = window.location.pathname;
            if (currentPath.includes('/game/game-index.html')) {
                // 从游戏大厅进入
                window.location.href = 'eatscallop/eatscallop-index.html';
            } else {
                // 从主页进入
                window.location.href = 'game/eatscallop/eatscallop-index.html';
            }
        }, 500);
    }
}

// 初始化Dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Dashboard] Initializing...');
    
    // 初始化海鸥世界系统
    if (typeof SeagullWorldAuth !== 'undefined') {
        SeagullWorldAuth.init();
    }
    if (typeof SeagullWorldUI !== 'undefined') {
        SeagullWorldUI.init();
    }
    
    // 更新用户界面
    updateDashboardUI();
    
    // 启动在线人数更新
    startOnlinePlayersUpdates();
});

// 更新Dashboard用户界面
async function updateDashboardUI() {
    const session = SeagullWorldAuth.getCurrentSession();
    let user = SeagullWorldAuth.getCurrentUser();
    
    // getCurrentUser may return a Promise, await it
    if (user && typeof user.then === 'function') {
        const result = await user;
        user = result?.user || result;
    }
    
    const userMenu = document.getElementById('userMenu');
    const guestActions = document.getElementById('guestActions');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const userStatsSection = document.getElementById('userStatsSection');
    
    if (session && user) {
        // 已登录状态
        if (userMenu) userMenu.style.display = 'flex';
        if (guestActions) guestActions.style.display = 'none';
        
        // 更新欢迎信息（安全访问 profile）
        const displayName = user.profile?.displayName || user.username || '玩家';
        if (welcomeTitle && window.SeagullWorldUI) {
            const welcomeText = window.SeagullWorldUI.t('welcomeBack').replace('{name}', displayName);
            welcomeTitle.textContent = welcomeText;
        }
        if (welcomeSubtitle && window.SeagullWorldUI) {
            welcomeSubtitle.textContent = window.SeagullWorldUI.t('continueAdventure');
        }
        
        // 更新用户菜单
        const userAvatarEl = document.getElementById('userAvatar');
        const userNameEl = document.getElementById('userName');
        const userLevelEl = document.getElementById('userLevel');
        const userCoinsEl = document.getElementById('userCoins');
        
        if (userAvatarEl) userAvatarEl.textContent = user.profile?.avatar || '🦅';
        if (userNameEl) userNameEl.textContent = user.profile?.displayName || user.username;
        if (userLevelEl) userLevelEl.textContent = `Lv.${user.world?.worldLevel || 1}`;
        if (userCoinsEl) userCoinsEl.textContent = `💰 ${user.world?.seagullCoins || 0}`;
        
        // 显示用户统计
        if (userStatsSection) {
            userStatsSection.style.display = 'block';
            
            // 计算总游戏时间
            const totalHours = Math.floor((user.world?.totalPlayTime || 0) / (1000 * 60 * 60));
            const totalPlayTimeEl = document.getElementById('totalPlayTime');
            const totalGamesPlayedEl = document.getElementById('totalGamesPlayed');
            
            if (totalPlayTimeEl) totalPlayTimeEl.textContent = totalHours > 0 ? `${totalHours}小时` : '< 1小时';
            if (totalGamesPlayedEl) totalGamesPlayedEl.textContent = user.world?.totalGamesPlayed || 0;
            
            const totalCoinsEl = document.getElementById('totalCoins');
            const achievementsEl = document.getElementById('achievements');
            if (totalCoinsEl) totalCoinsEl.textContent = user.world?.seagullCoins || 0;
            if (achievementsEl) achievementsEl.textContent = user.achievements ? user.achievements.length : 0;
        }
    } else {
        // 游客状态
        if (userMenu) userMenu.style.display = 'none';
        if (guestActions) guestActions.style.display = 'flex';
        
        // 默认欢迎信息
        if (welcomeTitle && window.SeagullWorldUI) {
            welcomeTitle.textContent = window.SeagullWorldUI.t('welcomeTitle');
        }
        if (welcomeSubtitle && window.SeagullWorldUI) {
            welcomeSubtitle.textContent = window.SeagullWorldUI.t('chooseGame');
        }
        
        // 隐藏用户统计
        if (userStatsSection) {
            userStatsSection.style.display = 'none';
        }
    }
}
