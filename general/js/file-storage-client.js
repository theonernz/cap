// ==================== File Storage Client Service ====================
/**
 * Client-side service for interacting with JSON file storage API
 * Replaces localStorage with server-side persistence
 */

const FileStorageService = {
    API_BASE: window.location.origin,
    
    /**
     * 获取当前会话的 token
     */
    getAuthToken() {
        try {
            const sessionData = localStorage.getItem('seagullWorld_currentSession');
            if (!sessionData) return null;
            
            const session = JSON.parse(sessionData);
            return session.token || null;
        } catch (error) {
            console.error('[FileStorage] Failed to get auth token:', error);
            return null;
        }
    },
    
    /**
     * 创建带认证的请求头
     */
    getAuthHeaders() {
        const token = this.getAuthToken();
        const headers = { 'Content-Type': 'application/json' };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },
    
    // ==================== User Methods ====================
      /**
     * Register new user
     */
    async registerUser(userData) {
        try {
            console.log('[FileStorage] Registering user:', userData.username);
            const response = await fetch(`${this.API_BASE}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            console.log('[FileStorage] Registration response:', result);
            
            if (!response.ok) {
                console.error('[FileStorage] Registration failed with status:', response.status);
                return { success: false, error: result.error || 'Registration failed' };
            }
            
            return result;
        } catch (error) {
            console.error('[FileStorage] Registration error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Login user (get user data)
     */
    async loginUser(username, passwordHash) {
        try {
            const response = await fetch(`${this.API_BASE}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, passwordHash })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/users/${userId}`, {
                headers: this.getAuthHeaders()
            });
            
            // Check for authentication errors
            if (response.status === 401) {
                return { success: false, error: 'Invalid or expired token' };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get user failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Update user
     */
    async updateUser(userId, updates) {
        try {
            const response = await fetch(`${this.API_BASE}/api/users/${userId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Update user failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/users/${userId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            return await response.json();
        } catch (error) {
            console.error('Delete user failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ==================== Save Game Methods ====================
    
    /**
     * Create new save
     */
    async createSave(saveData) {
        try {
            const response = await fetch(`${this.API_BASE}/api/saves`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(saveData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Create save failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get saves by username
     */
    async getSavesByUser(username, isMultiplayer = false) {
        try {
            const response = await fetch(`${this.API_BASE}/api/saves/${username}?multiplayer=${isMultiplayer}`, {
                headers: this.getAuthHeaders()
            });
            
            // Check for authentication errors
            if (response.status === 401) {
                return { success: false, error: 'Invalid or expired token', saves: [] };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get saves failed:', error);
            return { success: false, error: error.message, saves: [] };
        }
    },
    
    /**
     * Get save by ID
     */
    async getSaveById(saveId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/saves/id/${saveId}`);
            return await response.json();
        } catch (error) {
            console.error('Get save failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Delete save
     */
    async deleteSave(saveId) {
        try {
            const response = await fetch(`${this.API_BASE}/api/saves/${saveId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            return await response.json();
        } catch (error) {
            console.error('Delete save failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Delete all saves for a user
     */
    async deleteAllUserSaves(username) {
        try {
            const response = await fetch(`${this.API_BASE}/api/saves/user/${username}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            return await response.json();
        } catch (error) {
            console.error('Delete all saves failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ==================== Backup Methods ====================
    
    /**
     * Create backup of users
     */
    async backupUsers() {
        try {
            const response = await fetch(`${this.API_BASE}/api/backup/users`, {
                method: 'POST'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Backup users failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Create backup of saves
     */
    async backupSaves() {
        try {
            const response = await fetch(`${this.API_BASE}/api/backup/saves`, {
                method: 'POST'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Backup saves failed:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ==================== Migration Utilities ====================
    
    /**
     * Migrate data from localStorage to JSON files
     */
    async migrateFromLocalStorage() {
        console.log('🔄 Starting migration from localStorage to JSON files...');
        
        const results = {
            users: { success: 0, failed: 0 },
            saves: { success: 0, failed: 0 }
        };
        
        try {
            // Migrate users
            const usersKey = 'seagullWorld_users';
            const usersData = localStorage.getItem(usersKey);
            
            if (usersData) {
                const users = JSON.parse(usersData);
                
                for (const [userId, userData] of Object.entries(users)) {
                    const result = await this.registerUser(userData);
                    
                    if (result.success) {
                        results.users.success++;
                    } else {
                        results.users.failed++;
                        console.warn('Failed to migrate user:', userId, result.error);
                    }
                }
            }
            
            // Migrate saves
            const saveKeys = [
                'seagullGame_singlePlayerSaves',
                'seagullGame_multiplayerSaves'
            ];
            
            for (const key of saveKeys) {
                const saveIdsData = localStorage.getItem(key);
                
                if (saveIdsData) {
                    const saveIds = JSON.parse(saveIdsData);
                    
                    for (const saveId of saveIds) {
                        const saveData = localStorage.getItem(saveId);
                        
                        if (saveData) {
                            const save = JSON.parse(saveData);
                            const result = await this.createSave(save);
                            
                            if (result.success) {
                                results.saves.success++;
                            } else {
                                results.saves.failed++;
                                console.warn('Failed to migrate save:', saveId, result.error);
                            }
                        }
                    }
                }
            }
            
            console.log('✅ Migration complete:', results);
            return { success: true, results };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { success: false, error: error.message, results };
        }
    }
};

// Make available globally
window.FileStorageService = FileStorageService;
