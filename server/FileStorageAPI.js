// ==================== File-Based Storage API ====================
/**
 * Server-side API for managing JSON file storage
 * Handles both user registry and game saves
 */

const fs = require('fs').promises;
const path = require('path');

class FileStorageAPI {
    constructor() {
        this.usersPath = path.join(__dirname, '../data/users.json');
        this.savesPath = path.join(__dirname, '../game/eatscallop/data/savedgames.json');
        
        // Ensure data directories exist
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(path.join(__dirname, '../data'), { recursive: true });
            await fs.mkdir(path.join(__dirname, '../game/eatscallop/data'), { recursive: true });
        } catch (error) {
            console.error('Failed to create directories:', error);
        }
    }

    // ==================== User Registry Methods ====================

    /**
     * Get all users
     */
    async getUsers() {
        try {
            const data = await fs.readFile(this.usersPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, create it
            if (error.code === 'ENOENT') {
                const initialData = {
                    version: '1.0.0',
                    users: {},
                    metadata: {
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                        totalUsers: 0
                    }
                };
                await this.saveUsers(initialData);
                return initialData;
            }
            throw error;
        }
    }

    /**
     * Save users to file
     */
    async saveUsers(usersData) {
        usersData.metadata.lastModified = new Date().toISOString();
        usersData.metadata.totalUsers = Object.keys(usersData.users).length;
        console.log(`💾 Saving users to: ${this.usersPath}`);
        console.log(`📊 Total users: ${usersData.metadata.totalUsers}`);
        console.log(`👥 User list: ${Object.keys(usersData.users).join(', ')}`);
        await fs.writeFile(this.usersPath, JSON.stringify(usersData, null, 2));
        console.log(`✅ Users saved successfully`);
    }

    /**
     * Register new user
     */
    async registerUser(userData) {
        console.log(`📝 Registering user: ${userData.username} (${userData.userId})`);
        const data = await this.getUsers();
        console.log(`📖 Current users in memory: ${Object.keys(data.users).length}`);
        
        // Check if username already exists
        const existingUser = Object.values(data.users).find(u => u.username === userData.username);
        if (existingUser) {
            console.log(`❌ Username ${userData.username} already exists`);
            throw new Error('Username already exists');
        }

        data.users[userData.userId] = userData;
        console.log(`➕ Added user to data object, now ${Object.keys(data.users).length} users`);
        await this.saveUsers(data);
        console.log(`✅ User ${userData.username} registered successfully`);
        
        return { success: true, user: userData };
    }

    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        const data = await this.getUsers();
        return Object.values(data.users).find(u => u.username === username);
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const data = await this.getUsers();
        return data.users[userId];
    }

    /**
     * Update user
     */
    async updateUser(userId, updates) {
        const data = await this.getUsers();
        
        if (!data.users[userId]) {
            throw new Error('User not found');
        }

        data.users[userId] = { ...data.users[userId], ...updates };
        await this.saveUsers(data);
        
        return { success: true, user: data.users[userId] };
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        const data = await this.getUsers();
        delete data.users[userId];
        await this.saveUsers(data);
        
        return { success: true };
    }

    // ==================== Saved Games Methods ====================

    /**
     * Get all saves
     */
    async getSaves() {
        try {
            const data = await fs.readFile(this.savesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                const initialData = {
                    version: '1.0.0',
                    saves: {},
                    metadata: {
                        created: new Date().toISOString(),
                        lastModified: new Date().toISOString(),
                        totalSaves: 0
                    }
                };
                await this.saveSaves(initialData);
                return initialData;
            }
            throw error;
        }
    }

    /**
     * Save to file
     */
    async saveSaves(savesData) {
        savesData.metadata.lastModified = new Date().toISOString();
        savesData.metadata.totalSaves = Object.keys(savesData.saves).length;
        console.log(`💾 Saving game saves to: ${this.savesPath}`);
        console.log(`📊 Total saves: ${savesData.metadata.totalSaves}`);
        await fs.writeFile(this.savesPath, JSON.stringify(savesData, null, 2));
        console.log(`✅ Game saves saved successfully`);
    }

    /**
     * Create new save
     */
    async createSave(saveData) {
        console.log(`🎮 Creating save for user: ${saveData.owner?.username || 'unknown'}`);
        const data = await this.getSaves();
        console.log(`📖 Current saves in memory: ${Object.keys(data.saves).length}`);
        
        // Generate ID if not provided
        if (!saveData.id) {
            saveData.id = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`🔑 Generated save ID: ${saveData.id}`);
        }
        
        // Check user's save count (max 3 per mode per user)
        const userSaves = Object.values(data.saves).filter(s => 
            s.owner.username === saveData.owner.username &&
            s.isMultiplayer === (saveData.isMultiplayer || false)
        );

        console.log(`📊 User ${saveData.owner.username} has ${userSaves.length} ${saveData.isMultiplayer ? 'multiplayer' : 'single-player'} saves`);
        
        if (userSaves.length >= 3) {
            console.log(`❌ Cannot save: Maximum 3 saves per mode reached`);
            throw new Error('Maximum 3 saves per mode. Please delete old saves.');
        }

        data.saves[saveData.id] = saveData;
        console.log(`➕ Added save ${saveData.id} to data`);
        await this.saveSaves(data);
        console.log(`✅ Save created successfully`);
        
        return { success: true, save: saveData };
    }

    /**
     * Get saves by user
     */
    async getSavesByUser(username, isMultiplayer = false) {
        const data = await this.getSaves();
        return Object.values(data.saves).filter(s => 
            s.owner.username === username &&
            s.isMultiplayer === isMultiplayer
        ).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get save by ID
     */
    async getSaveById(saveId) {
        const data = await this.getSaves();
        return data.saves[saveId];
    }

    /**
     * Delete save
     */
    async deleteSave(saveId) {
        const data = await this.getSaves();
        delete data.saves[saveId];
        await this.saveSaves(data);
        
        return { success: true };
    }

    /**
     * Delete all saves for a user
     */
    async deleteAllUserSaves(username) {
        const data = await this.getSaves();
        
        // Filter out user's saves
        Object.keys(data.saves).forEach(id => {
            if (data.saves[id].owner.username === username) {
                delete data.saves[id];
            }
        });
        
        await this.saveSaves(data);
        return { success: true };
    }

    // ==================== Backup Methods ====================

    /**
     * Create backup of users file
     */
    async backupUsers() {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(__dirname, `../../data/users.backup.${timestamp}.json`);
        await fs.copyFile(this.usersPath, backupPath);
        return backupPath;
    }

    /**
     * Create backup of saves file
     */
    async backupSaves() {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupPath = path.join(__dirname, `../game/eatscallop/data/savedgames.backup.${timestamp}.json`);
        await fs.copyFile(this.savesPath, backupPath);
        return backupPath;
    }
}

module.exports = new FileStorageAPI();
