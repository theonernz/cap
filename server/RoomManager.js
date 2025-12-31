// ==================== 房间管理器 Room Manager ====================
const GameServer = require('./GameServer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class Room {
    constructor(id, nameEn, nameZh, maxPlayers = 8, creatorId = null, isPrivate = false, password = null, isDefault = false, logger = null, configParser = null) {
        this.id = id;
        this.nameEn = nameEn || nameZh || 'Room';  // 英文名称
        this.nameZh = nameZh || nameEn || '房间';  // 中文名称
        this.name = nameEn;  // 保留name字段以兼容旧代码
        this.maxPlayers = maxPlayers;
        this.creatorId = creatorId;
        this.isPrivate = isPrivate;
        this.password = password;
        this.isDefault = isDefault;  // Mark default room to prevent deletion
        this.createdAt = Date.now();
        this.logger = logger;
        
        // 创建独立的游戏服务器实例（传入logger和configParser）
        this.gameServer = new GameServer(logger, configParser);
        this.clients = new Map(); // clientId -> ws connection
        
        // 启动游戏循环（即使没有玩家，AI也需要移动和吃扇贝）
        this.gameServer.start((state) => {
            // 广播游戏状态给所有客户端
            this.broadcast({
                type: 'gameState',
                state: state
            });
        });
        
        if (logger) {
            logger.info('Room created', { 
                nameEn: this.nameEn,
                nameZh: this.nameZh,
                id: this.id, 
                maxPlayers: this.maxPlayers,
                isDefault: this.isDefault
            });
        } else {
            console.log(`✅ Room created: ${this.name} (${this.id}) - Max players: ${this.maxPlayers}`);
        }
    }
    
    // 获取当前玩家数
    getPlayerCount() {
        return this.gameServer.players.size;
    }
    
    // 检查是否已满
    isFull() {
        return this.getPlayerCount() >= this.maxPlayers;
    }
    
    // 检查密码
    checkPassword(password) {
        if (!this.isPrivate) return true;
        return this.password === password;
    }
    
    // 添加客户端
    addClient(clientId, ws) {
        this.clients.set(clientId, ws);
    }
    
    // 移除客户端
    removeClient(clientId) {
        this.clients.delete(clientId);
    }
    
    // 广播消息给房间内所有客户端
    broadcast(message) {
        const data = JSON.stringify(message);
        for (const [clientId, ws] of this.clients) {
            if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(data);
            }
        }
    }
    
    // 获取房间信息（用于房间列表）
    getInfo() {
        return {
            id: this.id,
            nameEn: this.nameEn,
            nameZh: this.nameZh,
            name: this.name,  // 兼容旧代码
            maxPlayers: this.maxPlayers,
            currentPlayers: this.getPlayerCount(),
            isFull: this.isFull(),
            isPrivate: this.isPrivate,
            isDefault: this.isDefault,
            createdAt: this.createdAt
        };
    }
}

class RoomManager {
    constructor(logger = null, configParser = null) {
        this.logger = logger;
        this.configParser = configParser;
        this.rooms = new Map(); // roomId -> Room
        this.dataPath = path.join(__dirname, '../data/rooms.json');
        this.maxRooms = 50; // 最多保留50个房间
        
        if (logger) {
            logger.info('Room Manager initialized', {});
        } else {
            console.log('🏠 Room Manager initialized');
        }
    }
    
    // 创建新房间
    createRoom(nameEn, nameZh, maxPlayers = 8, creatorId = null, isPrivate = false, password = null, isDefault = false) {
        // 检查房间数量限制
        if (this.rooms.size >= this.maxRooms && !isDefault) {
            if (this.logger) {
                this.logger.warn('Room limit reached', { maxRooms: this.maxRooms });
            } else {
                console.warn(`⚠️ Room limit reached (${this.maxRooms}). Cannot create new room.`);
            }
            return null;
        }
        
        const roomId = uuidv4();
        const room = new Room(roomId, nameEn, nameZh, maxPlayers, creatorId, isPrivate, password, isDefault, this.logger, this.configParser);
        this.rooms.set(roomId, room);
        
        if (this.logger) {
            this.logger.info('Total rooms', { count: this.rooms.size });
        } else {
            console.log(`📊 Total rooms: ${this.rooms.size}`);
        }
        
        // 保存房间数据
        this.saveRooms().catch(err => {
            if (this.logger) {
                this.logger.error('Failed to save rooms', { error: err.message });
            } else {
                console.error('Failed to save rooms:', err);
            }
        });
        
        return room;
    }
    
    // 获取房间
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    
    // 删除房间（当房间为空时）
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room) {
            // 保护默认房间不被删除
            if (room.isDefault) {
                console.log(`🚫 Cannot delete default room: ${room.name}`);
                return;
            }
            
            // 停止房间的游戏循环
            if (room.gameServer.updateInterval) {
                clearInterval(room.gameServer.updateInterval);
            }
            if (room.gameServer.stateInterval) {
                clearInterval(room.gameServer.stateInterval);
            }
            
            this.rooms.delete(roomId);
            console.log(`🗑️ Room deleted: ${room.name} (${roomId})`);
            console.log(`📊 Total rooms: ${this.rooms.size}`);
            
            // 保存房间数据
            this.saveRooms().catch(err => console.error('Failed to save rooms:', err));
        }
    }
    
    // 获取所有可用房间列表（不包括私密或已满的）
    getAvailableRooms() {
        const rooms = [];
        for (const [roomId, room] of this.rooms) {
            if (!room.isPrivate && !room.isFull()) {
                rooms.push(room.getInfo());
            }
        }
        return rooms;
    }
    
    // 获取所有房间列表（包括私密和已满的，用于管理界面）
    getAllRooms() {
        const rooms = [];
        for (const [roomId, room] of this.rooms) {
            rooms.push(room.getInfo());
        }
        return rooms;
    }
    
    // 自动清理空房间
    cleanupEmptyRooms() {
        const emptyRooms = [];
        for (const [roomId, room] of this.rooms) {
            // 保护默认房间不被清理
            if (room.isDefault) {
                continue;
            }
            
            if (room.getPlayerCount() === 0) {
                // 保留用户创建的房间至少24小时，即使为空
                const age = Date.now() - room.createdAt;
                if (age > 24 * 60 * 60 * 1000) { // 24小时
                    emptyRooms.push(roomId);
                }
            }
        }
        
        for (const roomId of emptyRooms) {
            this.deleteRoom(roomId);
        }
        
        if (emptyRooms.length > 0) {
            console.log(`🧹 Cleaned up ${emptyRooms.length} empty rooms`);
        }
    }
    
    // 查找玩家所在的房间
    findPlayerRoom(playerId) {
        for (const [roomId, room] of this.rooms) {
            if (room.gameServer.players.has(playerId)) {
                return room;
            }
        }
        return null;
    }
    
    // 保存房间数据到文件
    async saveRooms() {
        try {
            const roomsData = [];
            for (const [roomId, room] of this.rooms) {
                roomsData.push({
                    id: room.id,
                    nameEn: room.nameEn,
                    nameZh: room.nameZh,
                    name: room.name,  // 兼容旧数据
                    maxPlayers: room.maxPlayers,
                    creatorId: room.creatorId,
                    isPrivate: room.isPrivate,
                    password: room.password,
                    isDefault: room.isDefault,
                    createdAt: room.createdAt
                });
            }
            
            // 确保数据目录存在
            const dataDir = path.dirname(this.dataPath);
            await fs.mkdir(dataDir, { recursive: true });
            
            // 保存到文件
            await fs.writeFile(this.dataPath, JSON.stringify({ rooms: roomsData }, null, 2));
            console.log(`💾 Saved ${roomsData.length} rooms to disk`);
        } catch (error) {
            console.error('❌ Failed to save rooms:', error);
        }
    }
    
    // 从文件加载房间数据
    async loadRooms() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf8');
            const { rooms } = JSON.parse(data);
            
            console.log(`📂 Loading ${rooms.length} rooms from disk...`);
            
            for (const roomData of rooms) {
                // 重新创建房间对象
                // 兼容旧数据：如果没有nameEn/nameZh，使用name字段
                const room = new Room(
                    roomData.id,
                    roomData.nameEn || roomData.name || 'Room',
                    roomData.nameZh || roomData.name || '房间',
                    roomData.maxPlayers,
                    roomData.creatorId,
                    roomData.isPrivate,
                    roomData.password,
                    roomData.isDefault,
                    this.logger,  // 传递logger给房间
                    this.configParser  // 传递configParser
                );
                room.createdAt = roomData.createdAt;
                this.rooms.set(room.id, room);
            }
            
            console.log(`✅ Loaded ${this.rooms.size} rooms successfully`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('ℹ️ No saved rooms file found, starting fresh');
            } else {
                console.error('❌ Failed to load rooms:', error);
            }
        }
    }
}

module.exports = { RoomManager, Room };
