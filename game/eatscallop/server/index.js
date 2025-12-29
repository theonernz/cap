// ==================== Multiplayer Server ====================
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const GameServer = require('./GameServer');
const config = require('./config');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Disable caching for development - force browsers to reload files
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve game directory as root (for game files)
app.use(express.static(path.join(__dirname, '..')));

// Also serve the general directory for shared resources (auth, config, etc.)
// This allows ../../general/js/config.js to work when accessed from game directory
app.use('/general', express.static(path.join(__dirname, '..', '..', '..', 'general')));

console.log('🚀 Server starting with NO CACHE headers for development...');
console.log('📁 Serving game directory:', path.join(__dirname, '..'));
console.log('📁 Serving general directory:', path.join(__dirname, '..', '..', '..', 'general'));

// Create game server instance
const gameServer = new GameServer();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    const playerId = uuidv4();
    console.log(`New connection: ${playerId}`);
    
    // Send player ID to client
    ws.send(JSON.stringify({
        type: 'connection',
        playerId: playerId
    }));
    
    // Handle messages from client
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleClientMessage(ws, playerId, data);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        gameServer.removePlayer(playerId);
        
        // Broadcast player removal to all clients
        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle client messages
function handleClientMessage(ws, playerId, data) {
    switch (data.type) {
        case 'join':
            gameServer.addPlayer(playerId, data.name, data.color, ws);
            
            // Send initial game state to the new player
            ws.send(JSON.stringify({
                type: 'initialState',
                state: gameServer.getGameState(),
                playerId: playerId
            }));
            
            // Broadcast new player to all other clients
            broadcast({
                type: 'playerJoined',
                player: gameServer.getPlayer(playerId)
            }, ws);
            break;
              case 'input':
            gameServer.handlePlayerInput(playerId, data.input);
            break;
            
        case 'playerDied':
            // Handle player death (for save/load system)
            const dyingPlayer = gameServer.getPlayer(playerId);
            if (dyingPlayer) {
                dyingPlayer.isDead = true;
                dyingPlayer.power = 0;
                console.log(`💀 Player ${dyingPlayer.name} died (save/load)`);
            }
            break;        case 'playerRespawn':
            console.log(`📥 Received playerRespawn for player ${playerId}`);
            
            // Handle player respawn with restored data (for save/load system)
            const respawnPlayer = gameServer.getPlayer(playerId);
            if (respawnPlayer && data.playerData) {
                console.log(`✨ Before respawn - Player ${respawnPlayer.name}: power=${respawnPlayer.power}, size=${respawnPlayer.size}`);
                console.log(`📦 Received data: power=${data.playerData.power}, size=${data.playerData.size}`);
                
                respawnPlayer.x = data.playerData.x;
                respawnPlayer.y = data.playerData.y;
                respawnPlayer.power = data.playerData.power;
                respawnPlayer.size = data.playerData.size;
                respawnPlayer.isDead = false;
                
                console.log(`✨ After respawn - Player ${respawnPlayer.name}: power=${respawnPlayer.power}, size=${respawnPlayer.size} at (${Math.floor(respawnPlayer.x)}, ${Math.floor(respawnPlayer.y)})`);
                
                // Send confirmation back to client immediately
                ws.send(JSON.stringify({
                    type: 'respawnConfirmed',
                    playerData: {
                        x: respawnPlayer.x,
                        y: respawnPlayer.y,
                        power: respawnPlayer.power,
                        size: respawnPlayer.size
                    }
                }));
                console.log(`📤 Sent respawnConfirmed to client with power=${respawnPlayer.power}`);
                
                // Verify the update stuck - check multiple times
                setTimeout(() => {
                    console.log(`🔍 1 second later - Player ${respawnPlayer.name}: power=${respawnPlayer.power}, size=${respawnPlayer.size}`);
                }, 1000);
                
                setTimeout(() => {
                    console.log(`🔍 3 seconds later - Player ${respawnPlayer.name}: power=${respawnPlayer.power}, size=${respawnPlayer.size}`);
                }, 3000);
                
                setTimeout(() => {
                    console.log(`🔍 6 seconds later (after ignore period) - Player ${respawnPlayer.name}: power=${respawnPlayer.power}, size=${respawnPlayer.size}`);
                }, 6000);
            } else {
                console.error(`❌ playerRespawn failed: player=${!!respawnPlayer}, data=${!!data.playerData}`);
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

// Start game loop
gameServer.start((gameState) => {
    // Broadcast game state to all clients
    broadcast({
        type: 'gameState',
        state: gameState
    });
});

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
