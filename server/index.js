// ==================== Multiplayer Server ====================
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameServer = require('./GameServer');
const { RoomManager } = require('./RoomManager');
const config = require('./config');
const fileStorageAPI = require('./FileStorageAPI');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with 50MB limit for game saves
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Disable caching for development - force browsers to reload files
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

console.log('🚀 Server starting with NO CACHE headers for development...');

// ==================== Initialize Room Manager ====================

// Create room manager instance
const roomManager = new RoomManager();

// 异步初始化房间管理器
(async () => {
    try {
        // 从文件加载保存的房间
        await roomManager.loadRooms();
        
        // 如果没有默认大厅，创建一个
        const hasDefaultRoom = Array.from(roomManager.rooms.values()).some(room => room.isDefault);
        if (!hasDefaultRoom) {
            const defaultRoom = roomManager.createRoom('默认大厅', 16, null, false, null, true);
            console.log('✓ Created default lobby room');
        } else {
            console.log('✓ Default lobby already exists');
        }
        
        console.log('✓ Room Manager initialization complete');
    } catch (error) {
        console.error('❌ Room Manager initialization failed:', error);
        // 创建默认大厅作为后备方案
        const defaultRoom = roomManager.createRoom('默认大厅', 16, null, false, null, true);
        console.log('✓ Created fallback default lobby');
    }
})();

// ==================== REST API Endpoints ====================

// User Registry API
app.get('/api/users', async (req, res) => {
    try {
        const data = await fileStorageAPI.getUsers();
        res.json({ success: true, users: data.users, metadata: data.metadata });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/users/register', async (req, res) => {
    try {
        const result = await fileStorageAPI.registerUser(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await fileStorageAPI.getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users/:userId', async (req, res) => {
    try {
        const user = await fileStorageAPI.getUserById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/users/:userId', async (req, res) => {
    try {
        const result = await fileStorageAPI.updateUser(req.params.userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 用户统计数据更新（奖励系统专用）
app.post('/api/user/update', async (req, res) => {
    try {
        const { userId, experience, seagullCoins, worldLevel } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        
        // 获取当前用户
        const user = await fileStorageAPI.getUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // 更新world数据
        const updates = {
            world: {
                ...user.world,
                experience: experience !== undefined ? experience : (user.world.experience || 0),
                seagullCoins: seagullCoins !== undefined ? seagullCoins : (user.world.seagullCoins || 0),
                worldLevel: worldLevel !== undefined ? worldLevel : (user.world.worldLevel || 1)
            }
        };
        
        const result = await fileStorageAPI.updateUser(userId, updates);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/users/:userId', async (req, res) => {
    try {
        const result = await fileStorageAPI.deleteUser(req.params.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Game Saves API
app.post('/api/saves', async (req, res) => {
    try {
        const result = await fileStorageAPI.createSave(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/saves/:username', async (req, res) => {
    try {
        const isMultiplayer = req.query.multiplayer === 'true';
        const saves = await fileStorageAPI.getSavesByUser(req.params.username, isMultiplayer);
        res.json({ success: true, saves });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/saves/id/:saveId', async (req, res) => {
    try {
        const save = await fileStorageAPI.getSaveById(req.params.saveId);
        
        if (!save) {
            return res.status(404).json({ success: false, error: 'Save not found' });
        }
        
        res.json({ success: true, save });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/saves/:saveId', async (req, res) => {
    try {
        const result = await fileStorageAPI.deleteSave(req.params.saveId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/saves/user/:username', async (req, res) => {
    try {
        const result = await fileStorageAPI.deleteAllUserSaves(req.params.username);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Backup API
app.post('/api/backup/users', async (req, res) => {
    try {
        const backupPath = await fileStorageAPI.backupUsers();
        res.json({ success: true, backupPath });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/backup/saves', async (req, res) => {
    try {
        const backupPath = await fileStorageAPI.backupSaves();
        res.json({ success: true, backupPath });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Stats API - 获取在线人数等统计信息
app.get('/api/stats/online', (req, res) => {
    try {
        const onlineCount = wss.clients.size;
        res.json({ 
            success: true, 
            count: onlineCount,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Room API ====================

// 获取所有可用房间列表
app.get('/api/rooms', (req, res) => {
    try {
        const rooms = roomManager.getAvailableRooms();
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取所有房间（包括私密和已满）
app.get('/api/rooms/all', (req, res) => {
    try {
        const rooms = roomManager.getAllRooms();
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取单个房间信息
app.get('/api/rooms/:roomId', (req, res) => {
    try {
        const room = roomManager.getRoom(req.params.roomId);
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }
        res.json({ success: true, room: room.getInfo() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建新房间
app.post('/api/rooms/create', (req, res) => {
    try {
        const { name, maxPlayers = 8, creatorId, isPrivate = false, password } = req.body;
        
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Room name is required' });
        }
        
        if (maxPlayers < 2 || maxPlayers > 50) {
            return res.status(400).json({ success: false, error: 'Max players must be between 2 and 50' });
        }
        
        const room = roomManager.createRoom(name.trim(), maxPlayers, creatorId, isPrivate, password);
        res.json({ success: true, room: room.getInfo() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== WebSocket Server ====================

// Track client to room mapping
const clientRooms = new Map(); // clientId -> roomId

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    console.log(`New connection: ${clientId}`);
    
    // Send client ID to client
    ws.send(JSON.stringify({
        type: 'connection',
        clientId: clientId
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(ws, clientId, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        
        // Find and leave the room
        const roomId = clientRooms.get(clientId);
        if (roomId) {
            const room = roomManager.getRoom(roomId);
            if (room) {
                // Get player ID before removal
                let playerId = null;
                for (const [pid, player] of room.gameServer.players) {
                    if (player.clientId === clientId) {
                        playerId = pid;
                        break;
                    }
                }
                
                if (playerId) {
                    room.gameServer.removePlayer(playerId);
                    
                    // Broadcast player removal to room
                    room.broadcast({
                        type: 'playerLeft',
                        playerId: playerId
                    });
                }
                
                room.removeClient(clientId);
                clientRooms.delete(clientId);
                
                // Don't delete room immediately when empty
                // Let RoomManager.cleanupEmptyRooms() handle it (24h grace period)
                console.log(`👋 Player left room: ${room.name} (${room.getPlayerCount()} players remaining)`);
            }
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle client messages
function handleClientMessage(ws, clientId, data) {
    switch (data.type) {
        case 'getRoomList':
            // 发送房间列表
            ws.send(JSON.stringify({
                type: 'roomList',
                rooms: roomManager.getAvailableRooms()
            }));
            break;
            
        case 'createRoom':
            {
                const { name, maxPlayers, isPrivate, password } = data;
                const room = roomManager.createRoom(name, maxPlayers, clientId, isPrivate, password);
                
                ws.send(JSON.stringify({
                    type: 'roomCreated',
                    room: room.getInfo()
                }));
            }
            break;
            
        case 'joinRoom':
            {
                let { roomId, password } = data;
                
                // 处理默认房间别名
                if (roomId === 'default') {
                    // 查找第一个默认房间
                    const defaultRoom = Array.from(roomManager.rooms.values()).find(r => r.isDefault);
                    if (defaultRoom) {
                        roomId = defaultRoom.id;
                        console.log(`✓ Resolved 'default' to room: ${defaultRoom.name} (${roomId})`);
                    } else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: '默认房间不存在 / Default room not found'
                        }));
                        return;
                    }
                }
                
                const room = roomManager.getRoom(roomId);
                
                if (!room) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '房间不存在 / Room not found'
                    }));
                    return;
                }
                
                if (room.isFull()) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '房间已满 / Room is full'
                    }));
                    return;
                }
                
                if (!room.checkPassword(password)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '密码错误 / Incorrect password'
                    }));
                    return;
                }
                
                // Join the room
                room.addClient(clientId, ws);
                clientRooms.set(clientId, roomId);
                
                // Start game loop if not started
                if (!room.gameServer.updateInterval) {
                    room.gameServer.start((gameState) => {
                        room.broadcast({
                            type: 'gameState',
                            state: gameState
                        });
                    });
                }
                
                ws.send(JSON.stringify({
                    type: 'roomJoined',
                    roomId: roomId,
                    room: room.getInfo()
                }));
            }
            break;
            
        case 'join':
            {
                const roomId = clientRooms.get(clientId);
                if (!roomId) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '未加入房间 / Not in a room'
                    }));
                    return;
                }
                
                const room = roomManager.getRoom(roomId);
                if (!room) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: '房间不存在 / Room not found'
                    }));
                    return;
                }
                
                const playerId = uuidv4();
                room.gameServer.addPlayer(playerId, data.name, data.color, ws, clientId);
                
                // Send initial game state to the new player
                ws.send(JSON.stringify({
                    type: 'initialState',
                    state: room.gameServer.getGameState(),
                    playerId: playerId
                }));
                
                // Broadcast new player to all other clients in the room
                room.broadcast({
                    type: 'playerJoined',
                    player: room.gameServer.getPlayer(playerId)
                });
            }
            break;
              
        case 'input':
            {
                const roomId = clientRooms.get(clientId);
                if (!roomId) return;
                
                const room = roomManager.getRoom(roomId);
                if (!room) return;
                
                // Find player ID by client ID
                let playerId = null;
                for (const [pid, player] of room.gameServer.players) {
                    if (player.clientId === clientId) {
                        playerId = pid;
                        break;
                    }
                }
                
                if (playerId) {
                    room.gameServer.handlePlayerInput(playerId, data.input);
                }
            }
            break;
            
        case 'playerDied':
            {
                const roomId = clientRooms.get(clientId);
                if (!roomId) return;
                
                const room = roomManager.getRoom(roomId);
                if (!room) return;
                
                // Find player by client ID
                for (const [playerId, player] of room.gameServer.players) {
                    if (player.clientId === clientId) {
                        player.isDead = true;
                        player.power = 0;
                        console.log(`💀 Player ${player.name} died in room ${room.name}`);
                        break;
                    }
                }
            }
            break;
            
        case 'playerRespawn':
            {
                const roomId = clientRooms.get(clientId);
                if (!roomId) return;
                
                const room = roomManager.getRoom(roomId);
                if (!room) return;
                
                // Find player by client ID
                for (const [playerId, player] of room.gameServer.players) {
                    if (player.clientId === clientId && data.playerData) {
                        player.x = data.playerData.x;
                        player.y = data.playerData.y;
                        player.power = data.playerData.power;
                        player.size = data.playerData.size;
                        player.isDead = false;
                        
                        ws.send(JSON.stringify({
                            type: 'respawnConfirmed',
                            playerData: {
                                x: player.x,
                                y: player.y,
                                power: player.power,
                                size: player.size
                            }
                        }));
                        break;
                    }
                }
            }
            break;
            
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
            break;
            
        default:
            console.warn(`Unknown message type: ${data.type}`);
    }
}

// Broadcast message to all connected clients
function broadcast(data, excludeWs = null) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// 定期清理空房间
setInterval(() => {
    roomManager.cleanupEmptyRooms();
}, 5 * 60 * 1000); // 每5分钟清理一次

// Start HTTP server
const PORT = process.env.PORT || config.serverPort;
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    console.log(`Seagull Multiplayer Server running on port ${PORT}`);
    console.log(`\n🌐 Server accessible at:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    
    // Find and display all network IP addresses
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   Network:  http://${iface.address}:${PORT}`);
            }
        });
    });
    
    console.log(`\n💡 Client machines should connect to the Network URL above`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    gameServer.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
