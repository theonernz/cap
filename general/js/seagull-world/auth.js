// ==================== 海鸥世界统一认证系统 ====================
/**
 * Seagull World Unified Authentication System
 * 海鸥世界平台统一账号系统
 * 支持注册、登录、会话管理、用户资料
 */

const SeagullWorldAuth = {
    // ==================== 存储键 ====================
    STORAGE_PREFIX: 'seagullWorld_',
    USERS_KEY: 'seagullWorld_users',
    CURRENT_SESSION_KEY: 'seagullWorld_currentSession',
    
    // ==================== 配置参数 ====================
    config: {
        minUsernameLength: 3,
        maxUsernameLength: 20,
        minPasswordLength: 6,
        sessionDuration: {
            default: 4 * 60 * 60 * 1000,      // 4小时
            rememberMe: 30 * 24 * 60 * 60 * 1000  // 30天
        },
        passwordHashIterations: 1000  // SHA-256 迭代次数
    },
    
    // ==================== 用户数据结构 ====================
    /**
     * 用户对象结构：
     * {
     *   userId: "user_1234567890_abc",
     *   username: "seagull_player",
     *   passwordHash: "sha256...",
     *   profile: {
     *     displayName: "海鸥玩家",
     *     avatar: "🦅",
     *     bio: "我是海鸥世界的新手！",
     *     motto: "飞向更高的天空！",
     *     createdAt: 1234567890,
     *     lastLogin: 1234567890
     *   },
     *   world: {
     *     seagullCoins: 100,
     *     worldLevel: 1,
     *     totalPlayTime: 0,
     *     totalGamesPlayed: 0
     *   },
     *   games: {
     *     scallopsIO: {
     *       stats: { highScore, totalScallops, totalDeaths },
     *       achievements: [],
     *       saves: []
     *     }
     *   },
     *   achievements: [],
     *   friends: [],
     *   preferences: {
     *     language: 'en',
     *     theme: 'light'
     *   }
     * }
     */
    
    // ==================== 工具函数 ====================
      /**
     * 密码哈希（兼容HTTP环境）
     * @param {string} password - 原始密码
     */
    async hashPassword(password) {
        const saltedPassword = password + 'seagullWorldSalt2024';
        
        // 检查是否支持 Web Crypto API (需要 HTTPS 或 localhost)
        if (window.crypto && window.crypto.subtle) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(saltedPassword);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            } catch (e) {
                console.warn('[Seagull World Auth] Web Crypto API failed, using fallback hash');
            }
        }
        
        // 降级方案：简单字符串哈希（HTTP环境）
        let hash = 0;
        for (let i = 0; i < saltedPassword.length; i++) {
            const char = saltedPassword.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(16, '0');
    },
    
    /**
     * 生成唯一用户ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    },
      /**
     * 获取所有用户（从服务器）
     */
    async getAllUsers() {
        try {
            // 使用 FileStorageService API 从 users.json 获取用户
            const response = await fetch('/api/users');
            if (!response.ok) {
                console.error('[Auth] Failed to fetch users:', response.statusText);
                return {};
            }
            const data = await response.json();
            
            // 转换数组为对象（以 userId 为键）
            const usersObj = {};
            if (data.users && Array.isArray(data.users)) {
                data.users.forEach(user => {
                    usersObj[user.userId] = user;
                });
            }
            return usersObj;
        } catch (error) {
            console.error('[Auth] Failed to get users:', error);
            return {};
        }
    },
    
    /**
     * 保存用户（到服务器）- 已废弃，使用 registerUser 或 updateUser
     */
    async saveAllUsers(users) {
        console.warn('[Auth] saveAllUsers is deprecated. Use registerUser or updateUser instead.');
    },
    
    /**
     * 验证用户名格式
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: '用户名不能为空' };
        }
        
        if (username.length < this.config.minUsernameLength) {
            return { 
                valid: false, 
                error: `用户名至少需要${this.config.minUsernameLength}个字符` 
            };
        }
        
        if (username.length > this.config.maxUsernameLength) {
            return { 
                valid: false, 
                error: `用户名最多${this.config.maxUsernameLength}个字符` 
            };
        }
        
        // 允许字母、数字、下划线、中文
        if (!/^[\w\u4e00-\u9fa5]+$/.test(username)) {
            return { 
                valid: false, 
                error: '用户名只能包含字母、数字、下划线和中文' 
            };
        }
        
        return { valid: true };
    },
    
    /**
     * 验证密码格式
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: '密码不能为空' };
        }
        
        if (password.length < this.config.minPasswordLength) {
            return { 
                valid: false, 
                error: `密码至少需要${this.config.minPasswordLength}个字符` 
            };
        }
        
        return { valid: true };
    },
    
    // ==================== 用户注册 ====================
      /**
     * 注册新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {Object} options - 可选参数 { displayName, avatar, language }
     */
    async register(username, password, options = {}) {
        // 验证用户名
        const usernameValidation = this.validateUsername(username);
        if (!usernameValidation.valid) {
            return { 
                success: false, 
                error: usernameValidation.error 
            };
        }
        
        // 验证密码
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            return { 
                success: false, 
                error: passwordValidation.error 
            };
        }
        
        // 检查用户名是否已存在（通过服务器）
        const users = await this.getAllUsers();
        if (Object.values(users).some(u => u.username === username)) {
            return { 
                success: false, 
                error: '用户名已存在' 
            };
        }
        
        // 创建新用户
        const userId = this.generateUserId();
        const passwordHash = await this.hashPassword(password);
        const now = Date.now();
        
        const newUser = {
            userId,
            username,
            passwordHash,
            profile: {
                displayName: options.displayName || username,
                avatar: options.avatar || '🦅',
                bio: '',
                motto: '',
                createdAt: now,
                lastLogin: now
            },
            world: {
                seagullCoins: 100,  // 初始海鸥币
                worldLevel: 1,
                totalPlayTime: 0,
                totalGamesPlayed: 0
            },
            games: {},
            achievements: [],
            friends: [],
            preferences: {
                language: options.language || 'en',
                theme: 'light'
            }
        };
          try {
            // 检查 FileStorageService 是否可用
            if (typeof FileStorageService === 'undefined') {
                console.error('[Auth] FileStorageService not loaded');
                return {
                    success: false,
                    error: '系统未就绪，请刷新页面重试'
                };
            }
            
            // 使用 FileStorageService API 注册用户
            console.log('[Auth] Registering user:', username);
            const result = await FileStorageService.registerUser(newUser);
            
            console.log('[Auth] Registration result:', result);
            
            // 检查结果
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || '注册失败，请稍后重试'
                };
            }
            
            // 自动登录
            this.createSession(result.user, false);
            
            // 清除匿名模式设置
            this.clearAnonymousMode();
            
            console.log('[Auth] Registration successful');
            return { 
                success: true, 
                user: this.sanitizeUser(result.user) 
            };
        } catch (error) {
            console.error('[Auth] Registration failed:', error);
            return {
                success: false,
                error: error.message || '注册失败，请稍后重试'
            };
        }
    },
    
    // ==================== 用户登录 ====================
      /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {boolean} rememberMe - 是否记住登录状态
     */
    async login(username, password, rememberMe = false) {
        try {
            // 调用服务器登录API
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, rememberMe })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                return { 
                    success: false, 
                    error: result.error || '登录失败' 
                };
            }
            
            // 保存 session token 和用户信息
            const session = {
                userId: result.user.userId,
                username: result.user.username,
                displayName: result.user.profile.displayName,
                avatar: result.user.profile.avatar,
                token: result.token,  // 服务器返回的 session token
                expiresAt: result.expiresAt,
                createdAt: Date.now()
            };
            
            localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(session));
            
            console.log('[Auth] ✅ Login successful with server token');
            
            // 清除匿名模式设置
            this.clearAnonymousMode();
            
            return { 
                success: true, 
                user: this.sanitizeUser(result.user) 
            };
        } catch (error) {
            console.error('[Auth] Login failed:', error);
            return {
                success: false,
                error: '登录失败，请检查网络连接'
            };
        }
    },
    
    // ==================== 会话管理 ====================
    
    /**
     * 创建会话
     * @param {Object} user - 用户对象
     * @param {boolean} rememberMe - 是否长期保持登录
     */
    createSession(user, rememberMe = false) {
        const session = {
            userId: user.userId,
            username: user.username,
            displayName: user.profile.displayName,
            avatar: user.profile.avatar,
            createdAt: Date.now(),
            expiresAt: Date.now() + (
                rememberMe 
                    ? this.config.sessionDuration.rememberMe 
                    : this.config.sessionDuration.default
            )
        };
        
        localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(session));
    },
    
    /**
     * 获取当前会话
     */
    getCurrentSession() {
        const sessionData = localStorage.getItem(this.CURRENT_SESSION_KEY);
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        
        // 检查会话是否过期（客户端时间检查）
        if (Date.now() > session.expiresAt) {
            console.log('[Auth] ⚠️ Session expired (client-side check)');
            this.logout();
            return null;
        }
        
        return session;
    },
    
    /**
     * 验证 token 有效性（服务器端验证）
     * 在页面加载或重要操作前调用
     */
    async verifyToken() {
        const session = this.getCurrentSession();
        if (!session || !session.token) {
            return false;
        }
        
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (!result.success) {
                console.log('[Auth] ⚠️ Token verification failed:', result.error);
                // 清除本地会话状态
                await this.logout();
                // 触发UI更新（如果UI已加载）
                if (window.SeagullWorldUI && typeof window.SeagullWorldUI.updateUserInterface === 'function') {
                    await window.SeagullWorldUI.updateUserInterface();
                }
                return false;
            }
            
            console.log('[Auth] ✅ Token verified successfully');
            return true;
        } catch (error) {
            console.error('[Auth] Token verification error:', error);
            // 服务器无响应可能是重启了，清除本地token
            if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                console.log('[Auth] ⚠️ Server unreachable, clearing local session');
                await this.logout();
                if (window.SeagullWorldUI && typeof window.SeagullWorldUI.updateUserInterface === 'function') {
                    await window.SeagullWorldUI.updateUserInterface();
                }
            }
            return false;
        }
    },
    
    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!this.getCurrentSession();
    },
    
    /**
     * 检查并刷新会话超时时间
     * 用户活动时延长会话时间
     */
    refreshSession() {
        const session = this.getCurrentSession();
        if (!session) return;
        
        // 延长会话时间
        session.expiresAt = Date.now() + this.config.sessionDuration.default;
        localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(session));
    },
    
    /**
     * 启动会话监控
     * 定期检查会话是否过期，并提醒用户
     */
    startSessionMonitoring() {
        // 每分钟检查一次会话状态
        setInterval(() => {
            const session = this.getCurrentSession();
            if (!session) return;
            
            const timeLeft = session.expiresAt - Date.now();
            const minutesLeft = Math.floor(timeLeft / (60 * 1000));
            
            // 会话即将过期时提醒（剩余10分钟）
            if (minutesLeft === 10 && !this._sessionWarningShown) {
                this._sessionWarningShown = true;
                if (typeof SeagullWorldUI !== 'undefined') {
                    SeagullWorldUI.showNotification('⚠️ 会话即将过期，请保存游戏进度', 'warning');
                }
            }
            
            // 会话过期
            if (timeLeft <= 0) {
                this.logout();
                if (typeof SeagullWorldUI !== 'undefined') {
                    SeagullWorldUI.showNotification('⏰ 会话已过期，请重新登录', 'error');
                    SeagullWorldUI.updateUserInterface();
                }
            }
        }, 60000); // 每分钟检查
        
        // 用户活动时刷新会话
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isLoggedIn()) {
                    this.refreshSession();
                    this._sessionWarningShown = false; // 重置警告标志
                }
            }, { passive: true });
        });
    },
      /**
     * 获取当前登录用户
     */
    async getCurrentUser() {
        const session = this.getCurrentSession();
        if (!session) return null;
        
        try {
            // 从服务器获取最新用户信息
            const result = await FileStorageService.getUserById(session.userId);
            
            // 检查是否成功
            if (!result || result.success === false) {
                console.warn('[Auth] Failed to get user data:', result?.error || 'Unknown error');
                // 如果是认证错误（401 Unauthorized），清除无效的session
                if (result?.error && (result.error.includes('token') || result.error.includes('Authentication') || result.error.includes('Unauthorized'))) {
                    console.log('[Auth] Invalid or expired token, clearing session...');
                    await this.logout();
                }
                return null;
            }
            
            // result 是 { success: true, user: {...} }，需要返回 user 对象
            return result.user ? this.sanitizeUser(result.user) : null;
        } catch (error) {
            console.error('[Auth] Failed to get current user:', error);
            return null;
        }
    },
    
    /**
     * 登出
     */
    async logout() {
        const session = this.getCurrentSession();
        
        // 如果有token，通知服务器销毁会话
        if (session && session.token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('[Auth] 🚪 Logged out from server');
            } catch (error) {
                console.error('[Auth] Logout error:', error);
            }
        }
        
        // 清除本地会话
        localStorage.removeItem(this.CURRENT_SESSION_KEY);
        console.log('[Auth] 🚪 Local session cleared');
    },
    
    /**
     * 清除匿名模式设置
     */
    clearAnonymousMode() {
        sessionStorage.removeItem('anonymousMode');
        sessionStorage.removeItem('anonymousPlayerName');
        console.log('[Auth] 🧹 Cleared anonymous mode settings');
    },
    
    /**
     * 清理用户对象（移除敏感信息）
     */
    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    },
    
    // ==================== 用户资料管理 ====================
      /**
     * 更新用户资料
     * @param {string} userId
     * @param {Object} profileUpdate - { displayName, avatar, bio, motto }
     */
    async updateProfile(userId, profileUpdate) {
        try {
            // 从服务器获取用户
            const user = await FileStorageService.getUserById(userId);
            
            if (!user) {
                return { success: false, error: '用户不存在' };
            }
            
            user.profile = {
                ...user.profile,
                ...profileUpdate
            };
            
            // 更新到服务器
            await FileStorageService.updateUser(userId, user);
            
            return { success: true, user: this.sanitizeUser(user) };
        } catch (error) {
            console.error('[Auth] Failed to update profile:', error);
            return { success: false, error: '更新失败' };
        }
    },
    
    /**
     * 更新世界数据
     * @param {string} userId
     * @param {Object} worldUpdate - { seagullCoins, worldLevel, totalPlayTime }
     */
    async updateWorldData(userId, worldUpdate) {
        try {
            const user = await FileStorageService.getUserById(userId);
            
            if (!user) {
                return { success: false, error: '用户不存在' };
            }
            
            user.world = {
                ...user.world,
                ...worldUpdate
            };
            
            await FileStorageService.updateUser(userId, user);
            
            return { success: true };
        } catch (error) {
            console.error('[Auth] Failed to update world data:', error);
            return { success: false, error: '更新失败' };
        }
    },
    
    /**
     * 更新游戏数据
     * @param {string} userId
     * @param {string} gameId
     * @param {Object} gameUpdate - { stats, achievements, saves }
     */
    async updateGameData(userId, gameId, gameUpdate) {
        try {
            const user = await FileStorageService.getUserById(userId);
            
            if (!user) {
                return { success: false, error: '用户不存在' };
            }
            
            if (!user.games[gameId]) {
                user.games[gameId] = {
                    stats: {},
                    achievements: [],
                    saves: []
                };
            }
            
            user.games[gameId] = {
                ...user.games[gameId],
                ...gameUpdate
            };
            
            await FileStorageService.updateUser(userId, user);
            
            return { success: true };
        } catch (error) {
            console.error('[Auth] Failed to update game data:', error);
            return { success: false, error: '更新失败' };
        }
    },
    
    /**
     * 增加海鸥币
     * @param {string} userId
     * @param {number} amount
     */
    async addSeagullCoins(userId, amount) {
        try {
            const user = await FileStorageService.getUserById(userId);
            
            if (!user) return { success: false };
            
            user.world.seagullCoins = (user.world.seagullCoins || 0) + amount;
            await FileStorageService.updateUser(userId, user);
            
            return { success: true, coins: user.world.seagullCoins };
        } catch (error) {
            console.error('[Auth] Failed to add seagull coins:', error);
            return { success: false };
        }
    },
      /**
     * 增加游戏时间
     * @param {string} userId
     * @param {number} timeMs - 毫秒
     */
    async addPlayTime(userId, timeMs) {
        try {
            const user = await FileStorageService.getUserById(userId);
            
            if (!user) return { success: false };
            
            user.world.totalPlayTime = (user.world.totalPlayTime || 0) + timeMs;
            await FileStorageService.updateUser(userId, user);
            
            return { success: true };
        } catch (error) {
            console.error('[Auth] Failed to add play time:', error);
            return { success: false };
        }
    },
    
    // ==================== 存档所有权验证 ====================
    
    /**
     * 检查当前用户是否拥有存档
     * @param {Object} saveData - 存档数据
     */
    isOwner(saveData) {
        const session = this.getCurrentSession();
        if (!session) return false;
        
        // 检查新格式（Seagull World）
        if (saveData.owner && saveData.owner.userId) {
            return saveData.owner.userId === session.userId;
        }
        
        // 兼容旧格式（PlayerIdentity）
        if (saveData.owner && saveData.owner.playerId) {
            // 如果是旧存档，允许所有用户访问（迁移策略）
            return true;
        }
        
        // 没有所有者信息的旧存档，允许访问
        return true;
    },
    
    /**
     * 获取当前用户的所有者信息（用于存档）
     */
    getCurrentOwnerInfo() {
        const session = this.getCurrentSession();
        if (!session) return null;
        
        return {
            userId: session.userId,
            username: session.username,
            displayName: session.displayName,
            avatar: session.avatar
        };
    },
    
    // ==================== 初始化 ====================
    
    /**
     * 初始化认证系统
     */
    init() {
        console.log('[Seagull World Auth] Initializing authentication system...');
        
        // 检查会话是否有效
        const session = this.getCurrentSession();
        if (session) {
            console.log(`[Seagull World Auth] User logged in: ${session.username}`);
        } else {
            console.log('[Seagull World Auth] No active session');
        }
        
        // 启动会话监控
        this.startSessionMonitoring();
    }
};

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.SeagullWorldAuth = SeagullWorldAuth;
}
