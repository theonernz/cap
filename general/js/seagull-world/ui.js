// ==================== 海鸥世界UI管理系统 ====================
/**
 * Seagull World UI Manager
 * 管理登录/注册对话框、用户菜单等UI组件
 */

const SeagullWorldUI = {
    // 当前语言
    currentLanguage: localStorage.getItem('seagullWorld_language') || 'zh',
    
    // 翻译字典
    translations: {
        zh: {
            // 导航栏
            'standalone': 'Standalone',
            'login': '登录',
            'register': '注册',
            'logout': '退出',
            
            // 欢迎横幅
            'welcomeTitle': '欢迎来到海鸥世界！',
            'welcomeBack': '欢迎回来，{name}！',
            'continueAdventure': '继续你的冒险之旅',
            'chooseGame': '选择你喜欢的游戏开始冒险',
            'welcomeSubtitle': '探索精彩的海鸥游戏系列',
            'enterGameHall': '进入游戏大厅',
            
            // 游戏卡片
            'hot': '热门',
            'online': '在线',
            'rating': '评分',
            'startGame': '开始游戏',
            'anonymousTry': '匿名试玩',
            'comingSoon': '即将推出',
            'inDevelopment': '开发中',
            'stayTuned': '敬请期待',
            
            // 认证对话框
            'loginTitle': '登录海鸥世界',
            'registerTitle': '注册海鸥世界账号',
            'username': '用户名',
            'password': '密码',
            'confirmPassword': '确认密码',
            'displayName': '显示名称（可选）',
            'rememberMe': '记住我 (30天)',
            'loginButton': '登录',
            'registerButton': '注册并开始游戏',
            'noAccount': '还没有账号？',
            'hasAccount': '已有账号？',
            'registerNow': '立即注册',
            'loginNow': '立即登录',
            'welcomeBack': '欢迎回到海鸥世界',
            'joinUs': '加入海鸥世界',
            'usernamePlaceholder': '请输入用户名',
            'passwordPlaceholder': '请输入密码',
            'usernameHint': '3-20个字符',
            'passwordHint': '至少6个字符',
            'confirmPasswordPlaceholder': '再次输入密码',
            'displayNamePlaceholder': '游戏中显示的名字',
            'supportChars': '支持字母、数字、下划线、中文',
            
            // 用户统计
            'myStats': '我的统计',
            'seagullCoins': '海鸥币',
            'playTime': '游戏时长',
            'achievements': '成就',
            'level': '等级',
            
            // 通知消息
            'pleaseLogin': '⚠️ 请先登录再进入游戏',
            'sessionExpiring': '⚠️ 会话即将过期，请保存游戏进度',
            'sessionExpired': '⏰ 会话已过期，请重新登录',
            
            // 页脚
            'aboutUs': '关于我们',
            'privacy': '隐私政策',
            'terms': '服务条款',
            'contact': '联系我们',
            'copyright': '© 2025 海鸥世界 v1.1 版权所有',
            
            // 游戏大厅
            'backToHome': '返回主页',
            'gameHall': '游戏大厅',
            'gameHallSubtitle': '选择你喜欢的游戏，开始冒险！',
            'playNow': '立即开始',
            'guestMode': '游客试玩',
            'inDev': '开发中...',
            'expected': '预计',
            'preorder': '预约',
            
            // 游戏页面 - 海鸥吃扇贝
            'seagullEatScallops': '海鸥吃扇贝',
            'seagullWorld': '🦅 海鸥世界',
            'gameLabel': '游戏',
            'startGameSingle': '开始游戏 (单人模式)',
            'startMultiplayer': '开始多人模式',
            'pause': '暂停/继续',
            'restart': '重新开始',
            'changeName': '更改名字',
            'saveGame': '保存游戏',
            'loadGame': '读取存档',
            'toggleMinimap': '切换小地图',
            'backToLobby': '返回游戏大厅',
            
            // 游戏状态面板
            'gameStatus': '游戏状态',
            'playerName': '玩家名称',
            'power': '能量',
            'size': '体型',
            'scallopsEaten': '吃掉的扇贝',
            'gameTime': '游戏时间',
            'playerCount': '玩家数量',
            'aiPlayerCount': 'AI玩家数量',
            'networkLatency': '网络延迟',
            
            // 排行榜
            'leaderboard': '排行榜',
            'lastUpdate': '最后更新',
            
            // 游戏说明
            'instructions': '游戏说明',
            'inst1': '左键拖动控制海鸥',
            'inst2': '右键拖动加速',
            'inst3': '吃扇贝增加能量和体型',
            'inst4': '强者从弱者获得能量',
            'inst5': '能量为零时海鸥死亡',
            'inst6': '鼠标滚轮或+/-按钮缩放',
            'inst7': '点击小地图快速移动',
            'inst8': 'AI玩家有智能觅食和躲避',
            'inst9': 'Ctrl+S快速保存，Ctrl+L快速读取',
            
            // 游戏设置
            'gameSettings': '游戏设置',
            'leaderboardSize': '排行榜大小',
            'strongGain': '强者获得比例',
            'weakLose': '弱者失去比例',
            'aiSeagulls': 'AI海鸥数量',
            'aiPlayers': 'AI玩家数量',
            'scallopDensity': '扇贝密度',
            'growthSpeed': '成长速度',
            
            // 游戏叠加层
            'coord': '坐标',
            'map': '地图',
            'speed': '速度',
            'zoom': '缩放',
            
            // 游戏控制提示
            'gameControls': '游戏控制',
            'controlHint1': '使用鼠标控制海鸥移动：',
            'controlHint2': '左键点击',
            'controlHint3': '移动到位置（按住跟随鼠标）',
            'controlHint4': '双击左键',
            'controlHint5': '紧急刹车（立即停止）',
            'controlHint6': '移动时右键',
            'controlHint7': '加速（1.5倍）',
            'controlHint8': '双击右键',
            'controlHint9': '最大加速（2.0倍）',
            'controlHint10': '空格键',
            'controlHint11': '快速停止',
            'controlHint12': '鼠标滚轮',
            'controlHint13': '缩放地图',
            'controlHint14': '点击小地图',
            'controlHint15': '跳转位置',
            'controlHint16': '点击任意处开始游戏',
            
            // 游戏结束
            'gameOver': '游戏结束！',
            'finalPower': '最终能量',
            'restartBtn': '重新开始',
            'backToHallBtn': '返回大厅',
            
            // Pause
            'pauseResume': '按暂停/继续键继续',
            'pauseWarning': '⚠️ 多人模式下游戏世界继续运行！',
            
            // Game titles
            'seagullRacing': '海鸥竞速',
            'seagullAdventure': '海鸥冒险',
            
            // New translations
            'platformTagline': '海鸥的自在天地',
            'scallopsDescription': '在海洋中自由翱翔，捕食扇贝成长为最强海鸥！支持单人和多人模式。',
            'racingDescription': '与其他海鸥展开激烈的空中竞速比赛，穿越各种障碍挑战极限！',
            'adventureDescription': '探索神秘的海岛世界，解锁新技能，收集宝藏，成为传奇海鸥！',
            'racing': '竞速',
            'openWorld': '开放世界',
            'adventure': '冒险',
            'availableRooms': '可用房间',
            'createNewRoom': '创建新房间',
            'roomName': '房间名称',
            'roomNameEn': '房间名称（英文）',
            'roomNameZh': '房间名称（中文）',
            'maxPlayers': '最大玩家数',
            'cancel': '取消',
            'create': '创建',
            'defaultLobby': '默认大厅',
            'loadingRooms': '加载房间列表中...',
            'roomNamePlaceholder': '输入房间名称...',
            'roomAvailable': '可加入',
            'roomFull': '已满',
            'roomStatus': '状态',
            'doubleClickJoin': '双击加入',
            'noRoomsAvailable': '暂无可用房间',
            'loadRoomsFailed': '无法加载房间列表',
            'retry': '重试',
            'seagullIsland': '海鸥岛屿冒险',
            'islandDescription': '探索神秘岛屿，收集资源，建造基地，与其他海鸥一起生存！',
            'seagullBattle': '海鸥大乱斗',
            'battleDescription': '实时对战，技能组合，团队协作，成为最强海鸥战士！',
            'funGaming': '© 2025 海鸥世界 v1.1 - 让游戏更有趣'
        },
        en: {
            // Navigation
            'standalone': 'Standalone',
            'login': 'Login',
            'register': 'Register',
            'logout': 'Logout',
            
            // Welcome banner
            'welcomeTitle': 'Welcome to Seagull World!',
            'welcomeBack': 'Welcome back, {name}!',
            'continueAdventure': 'Continue your adventure',
            'chooseGame': 'Choose your favorite game to start',
            'welcomeSubtitle': 'Explore the exciting Seagull game series',
            'enterGameHall': 'Enter Game Hall',
            
            // Game cards
            'hot': 'Hot',
            'online': 'Online',
            'rating': 'Rating',
            'startGame': 'Start Game',
            'anonymousTry': 'Try Anonymously',
            'comingSoon': 'Coming Soon',
            'inDevelopment': 'In Development',
            'stayTuned': 'Stay Tuned',
            
            // Auth dialog
            'loginTitle': 'Login to Seagull World',
            'registerTitle': 'Register for Seagull World',
            'username': 'Username',
            'password': 'Password',
            'confirmPassword': 'Confirm Password',
            'displayName': 'Display Name (Optional)',
            'rememberMe': 'Remember me (30 days)',
            'loginButton': 'Login',
            'registerButton': 'Register and Start',
            'noAccount': 'No account yet?',
            'hasAccount': 'Already have an account?',
            'registerNow': 'Register Now',
            'loginNow': 'Login Now',
            'welcomeBack': 'Welcome back to Seagull World',
            'joinUs': 'Join Seagull World',
            'usernamePlaceholder': 'Enter username',
            'passwordPlaceholder': 'Enter password',
            'usernameHint': '3-20 characters',
            'passwordHint': 'At least 6 characters',
            'confirmPasswordPlaceholder': 'Enter password again',
            'displayNamePlaceholder': 'Display name in game',
            'supportChars': 'Supports letters, numbers, underscores, Chinese',
            
            // User stats
            'myStats': 'My Statistics',
            'seagullCoins': 'Seagull Coins',
            'playTime': 'Play Time',
            'achievements': 'Achievements',
            'level': 'Level',
            
            // Notifications
            'pleaseLogin': '⚠️ Please login first',
            'sessionExpiring': '⚠️ Session expiring soon, please save your progress',
            'sessionExpired': '⏰ Session expired, please login again',
            
            // Footer
            'aboutUs': 'About Us',
            'privacy': 'Privacy Policy',
            'terms': 'Terms of Service',
            'contact': 'Contact Us',
            'copyright': '© 2025 Seagull World. All rights reserved.',
            
            // Game Hall
            'backToHome': 'Back to Home',
            'gameHall': 'Game Hall',
            'gameHallSubtitle': 'Choose your favorite game and start your adventure!',
            'playNow': 'Play Now',
            'guestMode': 'Guest Mode',
            'inDev': 'In Development...',
            'expected': 'Expected',
            'preorder': 'Pre-orders',
            
            // Game Page - Seagull Eat Scallops
            'seagullEatScallops': 'Seagull Eat Scallops',
            'seagullWorld': '🦅 Seagull World',
            'gameLabel': 'Game',
            'startGameSingle': 'Start Game (Single Player)',
            'startMultiplayer': 'Start Multiplayer',
            'pause': 'Pause/Resume',
            'restart': 'Restart',
            'changeName': 'Change Name',
            'saveGame': 'Save Game',
            'loadGame': 'Load Game',
            'toggleMinimap': 'Toggle Mini Map',
            'backToLobby': 'Back to Lobby',
            
            // Game Status Panel
            'gameStatus': 'Game Status',
            'playerName': 'Player Name',
            'power': 'Power',
            'size': 'Size',
            'scallopsEaten': 'Scallops Eaten',
            'gameTime': 'Game Time',
            'playerCount': 'Player Count',
            'aiPlayerCount': 'AI Player Count',
            'networkLatency': 'Network Latency',
            
            // Leaderboard
            'leaderboard': 'Leaderboard',
            'lastUpdate': 'Last Update',
            
            // Instructions
            'instructions': 'Instructions',
            'inst1': 'Left-click and drag to control seagull',
            'inst2': 'Hold right-click while dragging to boost',
            'inst3': 'Eat scallops to increase power and size',
            'inst4': 'Stronger seagulls transfer power from weaker ones',
            'inst5': 'Seagull dies when power reaches zero',
            'inst6': 'Use mouse wheel or +/- buttons to zoom',
            'inst7': 'Click mini map to jump to location',
            'inst8': 'AI players have intelligent foraging and evasion',
            'inst9': 'Ctrl+S to quick save, Ctrl+L to quick load',
            
            // Game Settings
            'gameSettings': 'Game Settings',
            'leaderboardSize': 'Leaderboard Size',
            'strongGain': 'Strong Gain %',
            'weakLose': 'Weak Lose %',
            'aiSeagulls': 'AI Seagulls',
            'aiPlayers': 'AI Players',
            'scallopDensity': 'Scallop Density',
            'growthSpeed': 'Growth Speed',
            
            // Game Overlay
            'coord': 'Coord',
            'map': 'Map',
            'speed': 'Speed',
            'zoom': 'Zoom',
            
            // Game Controls
            'gameControls': 'Game Controls',
            'controlHint1': 'Use mouse to control seagull movement:',
            'controlHint2': 'Left-click',
            'controlHint3': 'Move toward location (hold to follow mouse)',
            'controlHint4': 'Double left-click',
            'controlHint5': 'Emergency brake (instant stop)',
            'controlHint6': 'Right-click while moving',
            'controlHint7': 'Speed boost (1.5x)',
            'controlHint8': 'Double right-click',
            'controlHint9': 'Max boost (2.0x)',
            'controlHint10': 'Space key',
            'controlHint11': 'Quick stop',
            'controlHint12': 'Mouse wheel',
            'controlHint13': 'Zoom map',
            'controlHint14': 'Click mini map',
            'controlHint15': 'Jump to location',
            'controlHint16': 'Click anywhere to start game',
            
            // Game Over
            'gameOver': 'Game Over!',
            'finalPower': 'Final Power',
            'restartBtn': 'Restart',
            'backToHallBtn': 'Back to Hall',
            
            // Pause
            'pauseResume': 'Press Pause/Resume to continue',
            'pauseWarning': '⚠️ Game world continues in multiplayer!',
            
            // Game titles
            'seagullRacing': 'Seagull Racing',
            'seagullAdventure': 'Seagull Adventure',
            
            // New translations
            'platformTagline': 'Where Seagulls Soar Free',
            'scallopsDescription': 'Soar freely in the ocean, hunt scallops and grow into the strongest seagull! Supports single and multiplayer modes.',
            'racingDescription': 'Compete in thrilling aerial races with other seagulls, navigate obstacles and challenge your limits!',
            'adventureDescription': 'Explore mysterious island worlds, unlock new skills, collect treasures, and become a legendary seagull!',
            'racing': 'Racing',
            'openWorld': 'Open World',
            'adventure': 'Adventure',
            'availableRooms': 'Available Rooms',
            'createNewRoom': 'Create New Room',
            'roomName': 'Room Name',
            'roomNameEn': 'Room Name (English)',
            'roomNameZh': 'Room Name (Chinese)',
            'maxPlayers': 'Max Players',
            'cancel': 'Cancel',
            'create': 'Create',
            'defaultLobby': 'Default Lobby',
            'loadingRooms': 'Loading rooms...',
            'roomNamePlaceholder': 'Enter room name...',
            'roomAvailable': 'Available',
            'roomFull': 'Full',
            'roomStatus': 'Status',
            'doubleClickJoin': 'D-Click to Join',
            'noRoomsAvailable': 'No rooms available',
            'loadRoomsFailed': 'Failed to load room list',
            'retry': 'Retry',
            'seagullIsland': 'Seagull Island Adventure',
            'islandDescription': 'Explore mysterious islands, gather resources, build bases, and survive with other seagulls!',
            'seagullBattle': 'Seagull Battle Royale',
            'battleDescription': 'Real-time combat, skill combinations, team cooperation, become the strongest seagull warrior!',
            'funGaming': '© 2025 Seagull World v1.1 - Fun Gaming'
        }
    },
    
    // 获取翻译文本
    t(key) {
        return this.translations[this.currentLanguage][key] || key;
    },
    
    // 切换语言
    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh';
        localStorage.setItem('seagullWorld_language', this.currentLanguage);
        this.updateAllTranslations();
        
        // 更新语言按钮文本
        const langText = document.getElementById('langText');
        if (langText) {
            langText.textContent = this.currentLanguage === 'zh' ? 'EN' : '中文';
        }
        
        // 如果在游戏大厅页面，重新渲染房间列表
        if (typeof window.currentRooms !== 'undefined' && typeof window.renderRoomList === 'function') {
            window.renderRoomList(window.currentRooms);
        }
    },
    
    // 更新所有翻译文本
    updateAllTranslations() {
        // 更新所有带 data-lang-key 属性的元素
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            
            // 优先使用 data-lang-zh 和 data-lang-en 属性（用于动态内容）
            const zhText = element.getAttribute('data-lang-zh');
            const enText = element.getAttribute('data-lang-en');
            
            if (zhText && enText) {
                // 使用动态翻译
                element.textContent = this.currentLanguage === 'zh' ? zhText : enText;
            } else {
                // 使用翻译字典
                element.textContent = this.t(key);
            }
        });
        
        // 更新特殊元素
        this.updateSpecialElements();
        
        // 重新渲染房间列表（如果存在）
        if (typeof renderRoomList === 'function' && window.currentRooms) {
            renderRoomList(window.currentRooms);
        }
    },
    
    // 更新特殊元素（按钮、标题等）
    updateSpecialElements() {
        const lang = this.currentLanguage;
        
        // 更新页面标题
        const welcomeTitle = document.getElementById('welcomeTitle');
        if (welcomeTitle && !SeagullWorldAuth.isLoggedIn()) {
            welcomeTitle.textContent = this.t('welcomeTitle');
        }
        
        // 更新对话框标题
        const authDialogTitle = document.getElementById('authDialogTitle');
        if (authDialogTitle) {
            const isLoginForm = document.getElementById('loginForm')?.style.display !== 'none';
            authDialogTitle.textContent = isLoginForm ? this.t('loginTitle') : this.t('registerTitle');
        }
    },
    
    // 初始化UI
    async init() {
        console.log('[Seagull World UI] Initializing UI...');
        
        // 验证服务器端 token（如果已登录）
        const session = SeagullWorldAuth.getCurrentSession();
        if (session && session.token) {
            console.log('[Seagull World UI] Verifying token with server...');
            const isValid = await SeagullWorldAuth.verifyToken();
            
            if (!isValid) {
                console.log('[Seagull World UI] ⚠️ Token invalid, logging out...');
                this.showNotification('⚠️ 会话已失效，请重新登录', 'warning');
            }
        }
        
        // 加载保存的语言设置
        this.currentLanguage = localStorage.getItem('seagullWorld_language') || 'zh';
        
        // 更新语言按钮显示
        const langText = document.getElementById('langText');
        if (langText) {
            langText.textContent = this.currentLanguage === 'zh' ? 'EN' : '中文';
        }
        
        // 更新所有翻译
        this.updateAllTranslations();
        
        // 更新用户界面
        await this.updateUserInterface();
        
        // 监听键盘事件（Enter键提交表单）
        this.setupKeyboardListeners();
    },
    
    // 更新用户界面
    async updateUserInterface() {
        const session = SeagullWorldAuth.getCurrentSession();
        const user = await SeagullWorldAuth.getCurrentUser();
        const userMenu = document.getElementById('userMenu');
        const guestActions = document.getElementById('guestActions');
        
        console.log('[UI] updateUserInterface - session:', session ? 'exists' : 'null');
        console.log('[UI] updateUserInterface - user:', user);
        
        // 如果页面没有这些元素，直接返回（例如房间选择页面）
        if (!userMenu && !guestActions) {
            return;
        }
        
        // getCurrentUser已经处理了session清理，这里重新获取session状态
        const currentSession = SeagullWorldAuth.getCurrentSession();
        
        // 检查是否有有效的用户数据（user必须是有效对象且有userId）
        const hasValidUserData = currentSession && user && user.userId;
        console.log('[UI] hasValidUserData:', hasValidUserData);
        
        if (hasValidUserData) {
            // 已登录且有完整用户数据：显示用户菜单
            if (userMenu) {
                userMenu.style.display = 'flex';
                const userAvatar = document.getElementById('userAvatar');
                const userName = document.getElementById('userName');
                const userLevel = document.getElementById('userLevel');
                const userCoins = document.getElementById('userCoins');
                
                // 使用从服务器获取的最新用户数据
                console.log('[UI] User data:', user);
                console.log('[UI] Display name from profile:', user.profile?.displayName);
                console.log('[UI] Username:', user.username);
                
                const displayName = user.profile?.displayName || user.username || session.username;
                console.log('[UI] Final display name:', displayName);
                
                if (userAvatar) userAvatar.textContent = user.profile?.avatar || session.avatar || '🦅';
                if (userName) userName.textContent = displayName;
                
                // 显示级别和金币（如果有world数据）
                if (user.world) {
                    if (userLevel) {
                        userLevel.style.display = 'inline-block';
                        userLevel.textContent = `Lv.${user.world.worldLevel || 1}`;
                    }
                    if (userCoins) {
                        userCoins.style.display = 'inline-block';
                        userCoins.textContent = `💰 ${user.world.seagullCoins || 0}`;
                    }
                } else {
                    // 没有world数据时隐藏级别和金币
                    if (userLevel) userLevel.style.display = 'none';
                    if (userCoins) userCoins.style.display = 'none';
                }
            }
            
            if (guestActions) {
                guestActions.style.display = 'none';
            }
            
            // 清除匿名模式设置
            this.clearAnonymousMode();
            
            // 禁用所有匿名试玩按钮
            this.updateAnonymousButtons(false);
        } else {
            // 未登录：显示游客提示，隐藏用户信息
            if (userMenu) {
                userMenu.style.display = 'none';
                // 确保级别和金币也被隐藏
                const userLevel = document.getElementById('userLevel');
                const userCoins = document.getElementById('userCoins');
                if (userLevel) userLevel.style.display = 'none';
                if (userCoins) userCoins.style.display = 'none';
            }
            
            if (guestActions) {
                guestActions.style.display = 'flex';
            }
            
            // 启用匿名试玩按钮
            this.updateAnonymousButtons(true);
        }
    },
    
    // 清除匿名模式设置
    clearAnonymousMode() {
        sessionStorage.removeItem('anonymousMode');
        sessionStorage.removeItem('anonymousPlayerName');
        console.log('🧹 Cleared anonymous mode settings');
    },
    
    // 更新匿名试玩按钮状态
    updateAnonymousButtons(enabled) {
        // 查找所有匿名试玩按钮（通过onclick属性识别）
        const buttons = document.querySelectorAll('button[onclick*="enterGameAnonymous"]');
        buttons.forEach(button => {
            if (enabled) {
                button.disabled = false;
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                button.title = '';
            } else {
                button.disabled = true;
                button.classList.add('disabled');
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
                const lang = this.currentLanguage;
                button.title = lang === 'zh' 
                    ? '您已登录，无需使用匿名模式' 
                    : 'You are logged in, anonymous mode not needed';
            }
        });
        console.log(`🎮 Anonymous buttons ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    // 显示认证对话框
    showAuthDialog(mode = 'login') {
        const overlay = document.getElementById('authDialogOverlay');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        if (!overlay) return;
        
        overlay.style.display = 'flex';
        
        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            title.textContent = '登录海鸥世界';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            title.textContent = '注册海鸥世界账号';
        }
        
        this.clearAuthError();
        this.clearFormInputs();
    },
    
    // 关闭认证对话框
    closeAuthDialog() {
        const overlay = document.getElementById('authDialogOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.clearAuthError();
        this.clearFormInputs();
    },
    
    // 切换到登录表单
    switchToLogin() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = '登录海鸥世界';
        this.clearAuthError();
    },
    
    // 切换到注册表单
    switchToRegister() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = '注册海鸥世界账号';
        this.clearAuthError();
    },
    
    // 处理登录
    async handleLogin() {        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!username || !password) {
            this.showAuthError('请输入用户名和密码');
            return;
        }
        
        // 显示加载状态
        const submitBtn = document.querySelector('#loginForm .auth-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        try {
            const result = await SeagullWorldAuth.login(username, password, rememberMe);
            
            if (result.success) {
                console.log('[Seagull World UI] Login successful:', result.user.username);
                this.closeAuthDialog();
                
                // 等待一小段时间确保 localStorage 完全更新
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 更新UI
                await this.updateUserInterface();
                this.showNotification('✅ 登录成功！欢迎回到海鸥世界', 'success');
                
                // 如果在游戏大厅，刷新房间列表和权限检查
                if (typeof checkCreateRoomPermission === 'function') {
                    await checkCreateRoomPermission();
                }
                if (typeof loadRoomList === 'function') {
                    await loadRoomList();
                }
            } else {
                this.showAuthError(result.error || '登录失败');
            }
        } catch (error) {
            console.error('[Seagull World UI] Login error:', error);
            this.showAuthError('登录时发生错误，请重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },
      // 处理注册
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const displayName = document.getElementById('registerDisplayName').value.trim();
        
        if (!username || !password) {
            this.showAuthError('请输入用户名和密码');
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showAuthError('两次输入的密码不一致');
            return;
        }
        
        // 显示加载状态
        const submitBtn = document.querySelector('#registerForm .auth-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        try {
            const result = await SeagullWorldAuth.register(username, password, {
                displayName: displayName || username,
                avatar: '🦅',
                language: (typeof CONFIG !== 'undefined' ? CONFIG.language : null) || 'en'
            });
            
            if (result.success) {
                console.log('[Seagull World UI] Registration successful:', result.user.username);
                this.closeAuthDialog();
                
                // 等待一小段时间确保 localStorage 完全更新
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 更新UI
                await this.updateUserInterface();
                this.showNotification('🎉 注册成功！欢迎加入海鸥世界', 'success');
                
                // 如果在游戏大厅，刷新房间列表和权限检查
                if (typeof checkCreateRoomPermission === 'function') {
                    await checkCreateRoomPermission();
                }
                if (typeof loadRoomList === 'function') {
                    await loadRoomList();
                }
            } else {
                this.showAuthError(result.error || '注册失败');
            }
        } catch (error) {
            console.error('[Seagull World UI] Registration error:', error);
            this.showAuthError('注册时发生错误，请重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },
    
    // 登出
    async logout() {
        if (confirm('确定要退出登录吗？')) {
            await SeagullWorldAuth.logout();
            await this.updateUserInterface();
            this.showNotification('👋 已退出登录', 'info');
            
            // 如果在游戏中，可以选择刷新页面
            if (typeof game !== 'undefined' && game.running) {
                if (confirm('退出登录后需要重新加载页面，是否继续？')) {
                    location.reload();
                }
            }
        }
    },
    
    // 显示认证错误
    showAuthError(message) {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },
    
    // 清除认证错误
    clearAuthError() {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    },
    
    // 清除表单输入
    clearFormInputs() {
        const inputs = [
            'loginUsername', 'loginPassword', 'rememberMe',
            'registerUsername', 'registerPassword', 'registerPasswordConfirm', 'registerDisplayName'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = false;
                } else {
                    element.value = '';
                }
            }
        });
    },
    
    // 显示通知（使用现有的SaveLoadSystem通知系统）
    showNotification(message, type = 'info') {
        if (typeof SaveLoadSystem !== 'undefined' && SaveLoadSystem.showNotification) {
            SaveLoadSystem.showNotification(message, type);
        } else {
            alert(message);
        }
    },
    
    // 设置键盘监听
    setupKeyboardListeners() {
        // 登录表单回车提交
        const loginInputs = ['loginUsername', 'loginPassword'];
        loginInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        });
        
        // 注册表单回车提交
        const registerInputs = ['registerUsername', 'registerPassword', 'registerPasswordConfirm', 'registerDisplayName'];
        registerInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleRegister();
                    }
                });
            }
        });
        
        // ESC键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('authDialogOverlay');
                if (overlay && overlay.style.display === 'flex') {
                    this.closeAuthDialog();
                }
            }
        });
        
        // 点击遮罩层关闭对话框
        const overlay = document.getElementById('authDialogOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAuthDialog();
                }
            });
        }
    }
};

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.SeagullWorldUI = SeagullWorldUI;
}
