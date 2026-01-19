// ==================== Multiplayer Server ====================
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameServer = require('./GameServer');
const { RoomManager } = require('./RoomManager');
const fileStorageAPI = require('./FileStorageAPI');
const ConfigParser = require('./ConfigParser');
const Logger = require('./Logger');
const SessionManager = require('./SessionManager');

// ==================== Initialize Configuration ====================
// 加载配置：server.ini 继承自 game.ini
const gameConfigPath = path.join(__dirname, '../game/eatscallop/config/game.ini');
const serverConfigPath = path.join(__dirname, '../game/eatscallop/config/server.ini');
const configParser = new ConfigParser(serverConfigPath, gameConfigPath);

// 启用配置热重载
configParser.watchConfig();

// ==================== Initialize Logger ====================
const logConfig = configParser.getSection('log');

// 构建日志文件路径
const logDirectory = logConfig.logDirectory || 'game/eatscallop/data';
const logFilePath = path.join(__dirname, '..', logDirectory, 'server.0.log');

const logger = new Logger({
    level: logConfig.level || 'INFO',
    maxFileSize: logConfig.maxFileSize || 50,
    maxFiles: logConfig.maxFiles || 5,
    consoleOutput: logConfig.consoleOutput !== false,
    timestampFormat: logConfig.timestampFormat || 'full',
    logFilePath: logFilePath
});

// ==================== Initialize Session Manager ====================
const sessionManager = new SessionManager(logger);

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with 50MB limit for game saves
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS middleware - 允许跨域访问
app.use((req, res, next) => {
    const allowedOrigins = configParser.get('server', 'allowedOrigins', '*');
    
    if (allowedOrigins === '*') {
        res.header('Access-Control-Allow-Origin', '*');
    } else {
        const origins = allowedOrigins.split(',').map(o => o.trim());
        const origin = req.headers.origin;
        if (origins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Disable caching for development - force browsers to reload files
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// NOTE: Static file middleware will be added AFTER all API routes

// Debug middleware - log all API requests
app.use('/api', (req, res, next) => {
    logger.debug(`API Request: ${req.method} ${req.path}`);
    next();
});

logger.info('Server starting with NO CACHE headers for development');

// ==================== API Routes - Define FIRST for priority ====================
// All /api/* routes must be defined before HTML routes and static middleware

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 游戏大厅路由
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../game/game-index.html'));
});

// 游戏路由 - 隐藏 .html 后缀
app.get('/game/:gameName', (req, res) => {
    const { gameName } = req.params;
    const gamePath = path.join(__dirname, `../game/${gameName}/${gameName}-index.html`);
    
    // 检查文件是否存在
    const fs = require('fs');
    if (fs.existsSync(gamePath)) {
        res.sendFile(gamePath);
    } else {
        res.status(404).send('Game not found');
    }
});

// 测试页面路由
app.get('/test/:testName', (req, res) => {
    const { testName } = req.params;
    const testPath = path.join(__dirname, `../test-${testName}.html`);
    
    const fs = require('fs');
    if (fs.existsSync(testPath)) {
        res.sendFile(testPath);
    } else {
        res.status(404).send('Test page not found');
    }
});

// ==================== Initialize Room Manager ====================

// Create room manager instance with logger and configParser
const roomManager = new RoomManager(logger, configParser);

// 异步初始化房间管理器
(async () => {
    try {
        // 从文件加载保存的房间
        await roomManager.loadRooms();
        
        // 从配置文件读取默认房间设置
        const defaultRoomCount = configParser.get('rooms', 'defaultRoomCount', 5);
        const defaultRooms = [];
        
        // 读取配置中的默认房间
        for (let i = 1; i <= defaultRoomCount; i++) {
            const roomConfig = configParser.get('rooms', `defaultRoom${i}`, null);
            if (roomConfig) {
                // 解析格式：name_en|name_zh|maxPlayers
                const parts = roomConfig.split('|');
                if (parts.length >= 3) {
                    defaultRooms.push({
                        nameEn: parts[0].trim(),
                        nameZh: parts[1].trim(),
                        maxPlayers: parseInt(parts[2]) || 16
                    });
                }
            }
        }
        
        // 如果配置中没有房间，使用默认配置
        if (defaultRooms.length === 0) {
            defaultRooms.push(
                { nameEn: 'Default Room', nameZh: '默认房间', maxPlayers: 16 },
                { nameEn: 'Muriwai Beach', nameZh: '穆里怀', maxPlayers: 16 },
                { nameEn: 'Sanya Island', nameZh: '三亚岛', maxPlayers: 16 },
                { nameEn: 'Kulangsu', nameZh: '鼓浪屿', maxPlayers: 16 },
                { nameEn: 'Red Beach', nameZh: '红海滩', maxPlayers: 16 }
            );
        }
        
        // 检查并创建缺失的默认房间
        const existingDefaultRooms = Array.from(roomManager.rooms.values()).filter(room => room.isDefault);
        const existingRoomIds = new Set(existingDefaultRooms.map(room => `${room.nameEn}|${room.nameZh}`));
        
        let createdCount = 0;
        for (const roomConfig of defaultRooms) {
            const roomId = `${roomConfig.nameEn}|${roomConfig.nameZh}`;
            if (!existingRoomIds.has(roomId)) {
                const room = roomManager.createRoom(
                    roomConfig.nameEn,
                    roomConfig.nameZh,
                    roomConfig.maxPlayers, 
                    null,  // creatorId
                    false, // isPrivate
                    null,  // password
                    true   // isDefault - 标记为默认房间，永久保留
                );
                logger.info('Created default room', { 
                    nameEn: roomConfig.nameEn,
                    nameZh: roomConfig.nameZh,
                    roomId: room.id 
                });
                createdCount++;
            }
        }
        
        if (createdCount === 0) {
            logger.debug('All default rooms already exist');
        } else {
            logger.info('Default rooms initialization complete', { 
                created: createdCount, 
                total: defaultRooms.length 
            });
        }
        
        logger.info('Room Manager initialization complete', { roomCount: roomManager.rooms.size });
    } catch (error) {
        logger.error('Room Manager initialization failed', { error: error.message });
        // 创建基础默认房间作为后备方案
        const defaultRoom = roomManager.createRoom('Default Room', '默认房间', 16, null, false, null, true);
        logger.info('Created fallback default room', { roomId: defaultRoom.id });
    }
})();

// ==================== REST API Endpoints ====================

// Games List API - Returns configured games from games.ini
app.get('/api/games', async (req, res) => {
    try {
        const gamesConfigPath = path.join(__dirname, '../game/config/games.ini');
        const gamesParser = new ConfigParser(gamesConfigPath);
        const gamesSection = gamesParser.getSection('games');
        
        if (!gamesSection || !gamesSection.list) {
            return res.json({ success: true, games: [] });
        }
        
        // Parse game list
        const gameIds = gamesSection.list.split(',').map(id => id.trim());
        const games = [];
        
        // Load each game's manifest
        for (const gameId of gameIds) {
            try {
                const gameConfig = gamesParser.getSection(gameId);
                if (!gameConfig) continue;
                
                // Load manifest.json
                const manifestPath = path.join(__dirname, '..', gameConfig.path, 'manifest.json');
                const fs = require('fs').promises;
                const manifestData = await fs.readFile(manifestPath, 'utf8');
                const manifest = JSON.parse(manifestData);
                
                // Check if game is enabled in config
                if (gameConfig.enabled !== false) {
                    games.push(manifest);
                } else if (gameConfig.comingSoon === true) {
                    // Include coming soon games
                    games.push(manifest);
                }
            } catch (error) {
                logger.warn('Failed to load game manifest', { gameId, error: error.message });
            }
        }
        
        res.json({ success: true, games });
    } catch (error) {
        logger.error('Failed to load games list', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});

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
        const { username, rememberMe } = req.body;
        const user = await fileStorageAPI.getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // 创建服务器端会话并生成 token
        const { token, expiresAt } = sessionManager.createSession(
            user.userId, 
            user.username, 
            rememberMe || false
        );
        
        logger.info('User logged in', { username, userId: user.userId });
        
        res.json({ 
            success: true, 
            user,
            token,  // 返回 session token
            expiresAt
        });
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 验证 token API
app.post('/api/auth/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        
        const session = sessionManager.validateToken(token);
        
        if (!session) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        
        res.json({ 
            success: true, 
            userId: session.userId,
            username: session.username
        });
    } catch (error) {
        logger.error('Token verification error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 登出 API
app.post('/api/auth/logout', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            sessionManager.destroySession(token);
            logger.info('User logged out');
        }
        
        res.json({ success: true });
    } catch (error) {
        logger.error('Logout error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 刷新会话 API
app.post('/api/auth/refresh', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        
        const refreshed = sessionManager.refreshSession(token);
        
        if (!refreshed) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }
        
        res.json({ success: true });
    } catch (error) {
        logger.error('Token refresh error', { error: error.message });
        res.status(500).json({ success: false, error: error.message });
    }
});

// 认证中间件 - 保护需要登录的API
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    const session = sessionManager.validateToken(token);
    
    if (!session) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    
    // 将用户信息附加到请求对象
    req.user = session;
    next();
};

app.get('/api/users/:userId', requireAuth, async (req, res) => {
    try {
        const user = await fileStorageAPI.getUserById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        // 只允许用户获取自己的信息
        if (user.userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/users/:userId', requireAuth, async (req, res) => {
    try {
        // 只允许用户更新自己的信息
        if (req.params.userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        const result = await fileStorageAPI.updateUser(req.params.userId, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 用户统计数据更新（奖励系统专用）
app.post('/api/user/update', requireAuth, async (req, res) => {
    try {
        const { userId, experience, seagullCoins, worldLevel } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }
        
        // 只允许用户更新自己的数据
        if (userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
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

app.delete('/api/users/:userId', requireAuth, async (req, res) => {
    try {
        // 只允许用户删除自己的账号
        if (req.params.userId !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
        // 删除用户的所有会话
        sessionManager.destroyUserSessions(req.params.userId);
        
        const result = await fileStorageAPI.deleteUser(req.params.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Game Saves API
app.post('/api/saves', requireAuth, async (req, res) => {
    try {
        const result = await fileStorageAPI.createSave(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/saves/:username', requireAuth, async (req, res) => {
    try {
        // 只允许用户访问自己的存档
        if (req.params.username !== req.user.username) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
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

app.delete('/api/saves/:saveId', requireAuth, async (req, res) => {
    try {
        const result = await fileStorageAPI.deleteSave(req.params.saveId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/saves/user/:username', requireAuth, async (req, res) => {
    try {
        // 只允许用户删除自己的存档
        if (req.params.username !== req.user.username) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        
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
        const { name, nameEn, nameZh, maxPlayers = 8, creatorId, isPrivate = false, password } = req.body;
        
        // 支持两种格式：
        // 1. 新格式：nameEn + nameZh（推荐）
        // 2. 旧格式：name（兼容性，自动复制到 nameEn 和 nameZh）
        let roomNameEn = nameEn;
        let roomNameZh = nameZh;
        
        if (!roomNameEn && !roomNameZh && name) {
            // 旧格式兼容：如果只提供了name，同时用于中英文
            roomNameEn = name.trim();
            roomNameZh = name.trim();
        } else if (!roomNameEn || !roomNameZh) {
            // 如果只提供了一种语言，自动填充另一种
            roomNameEn = roomNameEn || roomNameZh;
            roomNameZh = roomNameZh || roomNameEn;
        }
        
        if (!roomNameEn || roomNameEn.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Room name is required' });
        }
        
        if (maxPlayers < 2 || maxPlayers > 50) {
            return res.status(400).json({ success: false, error: 'Max players must be between 2 and 50' });
        }
        
        const room = roomManager.createRoom(
            roomNameEn.trim(), 
            roomNameZh.trim(), 
            maxPlayers, 
            creatorId, 
            isPrivate, 
            password
        );
        
        if (!room) {
            return res.status(500).json({ success: false, error: 'Failed to create room (room limit reached)' });
        }
        
        res.json({ success: true, room: room.getInfo() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== Serve Static Files ====================
// Place AFTER all API routes so API routes take priority
app.use(express.static(path.join(__dirname, '..')));

// ==================== WebSocket Server ====================

// Track client to room mapping
const clientRooms = new Map(); // clientId -> roomId

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    logger.debug('New WebSocket connection', { clientId });
    
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
                logger.info('Player left room', { 
                    roomName: room.name, 
                    roomId: room.id,
                    playerId: playerId,
                    remainingPlayers: room.getPlayerCount() 
                });
            }
        }
    });
    
    ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message, stack: error.stack });
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
const PORT = process.env.PORT || configParser.get('server', 'port', 80);
const HOST = '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    logger.info('Seagull Multiplayer Server running', { port: PORT, host: HOST });
    logger.info('Server accessible at:', { local: `http://localhost:${PORT}` });
    
    // Find and display all network IP addresses
    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(iface => {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                logger.info('Network address available', { 
                    interface: interfaceName,
                    url: `http://${iface.address}:${PORT}` 
                });
            }
        });
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing server...');
    logger.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
