// ==================== 服务器端会话管理 ====================
/**
 * Session Manager - 服务器端会话管理
 * 功能：
 * 1. 生成和验证 session tokens
 * 2. 维护活动会话列表（内存存储）
 * 3. 自动清理过期会话
 * 4. 服务器重启时清空所有会话（强制重新登录）
 */

const crypto = require('crypto');

class SessionManager {
    constructor(logger = null) {
        this.logger = logger;
        this.sessions = new Map(); // token -> session data
        this.userSessions = new Map(); // userId -> Set of tokens
        
        // 会话配置
        this.config = {
            tokenLength: 32,
            defaultDuration: 4 * 60 * 60 * 1000,      // 4小时
            rememberMeDuration: 30 * 24 * 60 * 60 * 1000,  // 30天
            cleanupInterval: 60 * 60 * 1000  // 每小时清理一次过期会话
        };
        
        // 启动自动清理
        this.startCleanup();
        
        this.log('info', '✅ Session Manager initialized');
    }
    
    log(level, message, data) {
        if (this.logger) {
            this.logger[level](message, data);
        } else {
            console.log(`[${level.toUpperCase()}] ${message}`, data || '');
        }
    }
    
    /**
     * 生成安全的 session token
     */
    generateToken() {
        return crypto.randomBytes(this.config.tokenLength).toString('hex');
    }
    
    /**
     * 创建新会话
     * @param {string} userId - 用户ID
     * @param {string} username - 用户名
     * @param {boolean} rememberMe - 是否长期保持登录
     * @returns {Object} - { token, expiresAt }
     */
    createSession(userId, username, rememberMe = false) {
        const token = this.generateToken();
        const now = Date.now();
        const duration = rememberMe ? this.config.rememberMeDuration : this.config.defaultDuration;
        const expiresAt = now + duration;
        
        const session = {
            token,
            userId,
            username,
            createdAt: now,
            expiresAt,
            lastActivity: now,
            rememberMe
        };
        
        // 保存会话
        this.sessions.set(token, session);
        
        // 记录用户的所有会话
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, new Set());
        }
        this.userSessions.get(userId).add(token);
        
        this.log('info', '✅ Session created', { 
            userId, 
            username, 
            rememberMe,
            expiresIn: Math.round(duration / 1000 / 60) + ' minutes'
        });
        
        return { token, expiresAt };
    }
    
    /**
     * 验证 session token
     * @param {string} token - Session token
     * @returns {Object|null} - 会话数据或null
     */
    validateToken(token) {
        if (!token) {
            return null;
        }
        
        const session = this.sessions.get(token);
        
        if (!session) {
            this.log('warn', '⚠️ Invalid token: session not found');
            return null;
        }
        
        // 检查是否过期
        if (Date.now() > session.expiresAt) {
            this.log('warn', '⚠️ Session expired', { userId: session.userId });
            this.destroySession(token);
            return null;
        }
        
        // 更新最后活动时间
        session.lastActivity = Date.now();
        
        return {
            userId: session.userId,
            username: session.username
        };
    }
    
    /**
     * 刷新会话（延长过期时间）
     * @param {string} token - Session token
     * @returns {boolean} - 是否成功
     */
    refreshSession(token) {
        const session = this.sessions.get(token);
        
        if (!session) {
            return false;
        }
        
        // 检查是否已过期
        if (Date.now() > session.expiresAt) {
            this.destroySession(token);
            return false;
        }
        
        // 延长会话时间
        const duration = session.rememberMe 
            ? this.config.rememberMeDuration 
            : this.config.defaultDuration;
        session.expiresAt = Date.now() + duration;
        session.lastActivity = Date.now();
        
        this.log('debug', '🔄 Session refreshed', { userId: session.userId });
        
        return true;
    }
    
    /**
     * 销毁会话
     * @param {string} token - Session token
     */
    destroySession(token) {
        const session = this.sessions.get(token);
        
        if (session) {
            // 从用户会话列表中移除
            const userTokens = this.userSessions.get(session.userId);
            if (userTokens) {
                userTokens.delete(token);
                if (userTokens.size === 0) {
                    this.userSessions.delete(session.userId);
                }
            }
            
            this.sessions.delete(token);
            this.log('info', '🗑️ Session destroyed', { userId: session.userId });
        }
    }
    
    /**
     * 销毁用户的所有会话（强制登出）
     * @param {string} userId - 用户ID
     */
    destroyUserSessions(userId) {
        const userTokens = this.userSessions.get(userId);
        
        if (userTokens) {
            userTokens.forEach(token => {
                this.sessions.delete(token);
            });
            this.userSessions.delete(userId);
            
            this.log('info', '🗑️ All user sessions destroyed', { 
                userId, 
                count: userTokens.size 
            });
        }
    }
    
    /**
     * 获取活动会话统计
     */
    getStats() {
        return {
            totalSessions: this.sessions.size,
            totalUsers: this.userSessions.size,
            sessions: Array.from(this.sessions.values()).map(s => ({
                userId: s.userId,
                username: s.username,
                createdAt: new Date(s.createdAt).toISOString(),
                expiresAt: new Date(s.expiresAt).toISOString(),
                rememberMe: s.rememberMe
            }))
        };
    }
    
    /**
     * 清理过期会话
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [token, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.destroySession(token);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            this.log('info', '🧹 Cleaned expired sessions', { count: cleaned });
        }
        
        return cleaned;
    }
    
    /**
     * 启动自动清理定时任务
     */
    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
        
        this.log('info', '⏰ Auto-cleanup started', { 
            interval: Math.round(this.config.cleanupInterval / 1000 / 60) + ' minutes' 
        });
    }
    
    /**
     * 清空所有会话（服务器重启时使用）
     */
    clearAll() {
        const count = this.sessions.size;
        this.sessions.clear();
        this.userSessions.clear();
        this.log('info', '🧹 All sessions cleared', { count });
    }
}

module.exports = SessionManager;
