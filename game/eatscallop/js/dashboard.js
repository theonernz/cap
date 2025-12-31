// ==================== 海鸥世界Dashboard逻辑 ====================

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
        window.location.href = 'game-eatscallop.html';
    }
}

// 匿名进入游戏（无需登录，但不能存档）
function enterGameAnonymous(gameId) {
    if (gameId === 'scallopsIO') {
        // 设置匿名标记
        sessionStorage.setItem('anonymousMode', 'true');
        window.location.href = 'game-eatscallop.html';
    }
}

// 初始化Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Dashboard] Initializing...');
    
    // 初始化海鸥世界系统
    if (typeof SeagullWorldAuth !== 'undefined') {
        SeagullWorldAuth.init();
    }
    if (typeof SeagullWorldUI !== 'undefined') {
        SeagullWorldUI.init();
    }
    
    // 更新用户界面
    await updateDashboardUI();
});

// 更新Dashboard用户界面
async function updateDashboardUI() {
    const session = SeagullWorldAuth.getCurrentSession();
    const user = await SeagullWorldAuth.getCurrentUser();
    
    const integratedUserPanel = document.getElementById('integratedUserPanel');
    const guestActions = document.getElementById('guestActions');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const userStatsSection = document.getElementById('userStatsSection');
    
    if (session && user) {
        // 已登录状态 - 显示整合的用户面板
        if (integratedUserPanel) integratedUserPanel.style.display = 'flex';
        if (guestActions) guestActions.style.display = 'none';
        
        // 更新欢迎信息
        if (welcomeTitle) {
            welcomeTitle.textContent = `欢迎回来，${user.profile.displayName || user.username}！`;
        }
        if (welcomeSubtitle) {
            welcomeSubtitle.textContent = '继续你的冒险之旅';
        }
        
        // 更新用户菜单
        document.getElementById('userAvatar').textContent = user.profile.avatar || '🦅';
        document.getElementById('userName').textContent = user.profile.displayName || user.username;
        
        // 更新等级和经验显示
        const userLevel = user.world.worldLevel || 1;
        const experience = user.world.experience || 0;
        const levelElement = document.getElementById('userLevel');
        
        // 如果有 RewardSystem，显示经验进度
        if (typeof RewardSystem !== 'undefined') {
            const levelInfo = RewardSystem.levelConfig.calculateLevel(experience);
            const expForCurrent = RewardSystem.levelConfig.getRequiredExp(levelInfo.level);
            const expForNext = RewardSystem.levelConfig.getRequiredExp(levelInfo.level + 1);
            const expInLevel = experience - expForCurrent;
            const expNeeded = expForNext - expForCurrent;
            
            levelElement.textContent = `Lv.${levelInfo.level}`;
            levelElement.title = `经验: ${expInLevel}/${expNeeded} (总经验: ${experience})`;
        } else {
            levelElement.textContent = `Lv.${userLevel}`;
            levelElement.title = `等级 ${userLevel}`;
        }
        
        document.getElementById('userCoins').textContent = `💰 ${user.world.seagullCoins || 0}`;
        
        // 显示用户统计
        if (userStatsSection) {
            userStatsSection.style.display = 'block';
            
            // 计算总游戏时间
            const totalHours = Math.floor((user.world.totalPlayTime || 0) / (1000 * 60 * 60));
            document.getElementById('totalPlayTime').textContent = totalHours > 0 ? `${totalHours}小时` : '< 1小时';
            document.getElementById('totalGamesPlayed').textContent = user.world.totalGamesPlayed || 0;
            document.getElementById('totalCoins').textContent = user.world.seagullCoins || 0;
            document.getElementById('achievements').textContent = user.achievements ? user.achievements.length : 0;
        }
    } else {
        // 游客状态 - 隐藏整合的用户面板
        if (integratedUserPanel) integratedUserPanel.style.display = 'none';
        if (guestActions) guestActions.style.display = 'flex';
        
        // 默认欢迎信息
        if (welcomeTitle) {
            welcomeTitle.textContent = '欢迎来到海鸥世界！';
        }
        if (welcomeSubtitle) {
            welcomeSubtitle.textContent = '选择你喜欢的游戏开始冒险';
        }
        
        // 隐藏用户统计
        if (userStatsSection) {
            userStatsSection.style.display = 'none';
        }
    }
}
