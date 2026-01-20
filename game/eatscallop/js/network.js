// ==================== Network Client ====================
const NetworkClient = {
    ws: null,
    connected: false,
    clientId: null,  // WebSocket connection ID
    playerId: null,  // Game player ID
    roomId: null,    // Current room ID
    inRoom: false,   // Whether successfully joined a room
    
    // 使用配置文件中的服务器地址
    get serverUrl() {
        if (typeof SERVER_CONFIG !== 'undefined') {
            return SERVER_CONFIG.getCurrentServerUrl();
        }
        // Auto-detect protocol: wss for https, ws for http
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}`;
    },
    
    // Network state
    latency: 0,
    lastPingTime: 0,
    
    // Callbacks
    onConnected: null,
    onDisconnected: null,
    onGameState: null,
    onPlayerJoined: null,
    onPlayerLeft: null,
    onRoomJoined: null,
    // Join a room (called after receiving clientId)
    joinRoom() {
        // Check if user selected a specific room
        const selectedRoomId = sessionStorage.getItem('selectedRoomId');
        
        if (selectedRoomId && selectedRoomId !== 'null') {
            console.log(`Joining selected room: ${selectedRoomId}`);
            this.send({
                type: 'joinRoom',
                roomId: selectedRoomId
            });
            // Clear the selection
            sessionStorage.removeItem('selectedRoomId');
        } else {
            // Join default room
            console.log('Joining default room');
            this.send({
                type: 'joinRoom',
                roomId: 'default'
            });
        }
    },
    
    // Connect to server
    connect(playerName, playerColor) {
        // Store player info for later use
        this.pendingPlayerName = playerName;
        this.pendingPlayerColor = playerColor;
        
        return new Promise((resolve, reject) => {
            try {
                console.log(`Attempting to connect to ${this.serverUrl}...`);
                
                // Set connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (!this.connected) {
                        console.error('Connection timeout after 5 seconds');
                        if (this.ws) {
                            this.ws.close();
                        }
                        reject(new Error('Connection timeout. Please check if the server is running.'));
                    }
                }, 5000);
                
                this.ws = new WebSocket(this.serverUrl);
                
                this.ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('✓ Connected to server successfully');
                    this.connected = true;
                    
                    // Wait for clientId from server, then join room
                    // Don't send join message yet - must join room first
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleMessage(data);
                        
                        // Resolve on initial state
                        if (data.type === 'initialState') {
                            clearTimeout(connectionTimeout);
                            console.log('✓ Received initial game state');
                            resolve(data);
                        }
                    } catch (error) {
                        console.error('Error parsing server message:', error);
                    }
                };
                
                this.ws.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('✗ WebSocket error:', error);
                    console.error('Server URL:', this.serverUrl);
                    console.error('Please check server configuration and WebSocket proxy settings');
                    reject(new Error('Failed to connect to server. Please ensure the server is running.'));
                };
                
                this.ws.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    console.log('Disconnected from server', event.code, event.reason);
                    this.connected = false;
                    if (this.onDisconnected) {
                        this.onDisconnected();
                    }
                };
            } catch (error) {
                console.error('Exception during connection:', error);
                reject(error);
            }
        });
    },
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
            this.clientId = null;
            this.playerId = null;
            this.roomId = null;
            this.inRoom = false;
        }
    },
    
    // Check if connected to server
    isConnected() {
        return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
    },
    
    handleMessage(data) {
        switch (data.type) {
            case 'connection':
                // Server sends clientId (not playerId yet)
                this.clientId = data.clientId;
                console.log(`✓ Received client ID: ${this.clientId}`);
                
                // Now join a room
                this.joinRoom();
                break;
            
            case 'roomJoined':
                this.roomId = data.roomId;
                this.inRoom = true;
                
                // Extract room name from room info object
                const getDefaultLobbyName = () => {
                    const currentLang = localStorage.getItem('language') || 'zh';
                    return window.SeagullWorldUI?.translations?.[currentLang]?.['defaultLobby'] || '默认大厅';
                };
                const roomName = data.room?.name || data.roomName || getDefaultLobbyName();
                console.log(`✓ Joined room: ${roomName} (${this.roomId})`);
                console.log('📦 Room data:', data.room);
                
                // Update room info in UI
                this.updateRoomInfo(roomName);
                
                // Now send join message to spawn player
                this.send({
                    type: 'join',
                    name: this.pendingPlayerName,
                    color: this.pendingPlayerColor
                });
                
                if (this.onRoomJoined) {
                    this.onRoomJoined(data);
                }
                break;
                
            case 'initialState':
                console.log('Received initial game state');
                if (this.onConnected) {
                    this.onConnected(data.state, data.playerId);
                }
                break;
                
            case 'gameState':
                if (this.onGameState) {
                    this.onGameState(data.state);
                }
                break;
                
            case 'playerJoined':
                console.log(`Player joined: ${data.player.name}`);
                if (this.onPlayerJoined) {
                    this.onPlayerJoined(data.player);
                }
                break;
                  case 'playerLeft':
                console.log(`Player left: ${data.playerId}`);
                if (this.onPlayerLeft) {
                    this.onPlayerLeft(data.playerId);
                }
                break;
                
            case 'respawnConfirmed':
                console.log('📨 Received respawnConfirmed from server:', data.playerData);
                if (this.onRespawnConfirmed) {
                    this.onRespawnConfirmed(data.playerData);
                }
                break;
                
            case 'pong':
                this.latency = Date.now() - data.timestamp;
                break;
                
            case 'error':
                console.error('Server error:', data.message);
                alert(`Server error: ${data.message}`);
                break;
                
            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    },
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('Cannot send message: not connected');
        }
    },
    
    // Send player input to server
    sendInput(action, data = {}) {
        this.send({
            type: 'input',
            input: {
                action,
                ...data
            }
        });
    },
    
    // Send player movement with current position for better collision detection
    sendMove(targetX, targetY, currentX = null, currentY = null) {
        const data = { targetX, targetY };
        if (currentX !== null && currentY !== null) {
            data.clientX = currentX;
            data.clientY = currentY;
        }
        this.sendInput('move', data);
    },
    
    // Send stop command
    sendStop(x, y) {
        // 发送停止命令时附带精确位置
        if (x !== undefined && y !== undefined) {
            this.sendInput('stop', { x, y });
        } else {
            this.sendInput('stop');
        }
    },
    
    // Send quick stop with exact position
    sendQuickStop(x, y) {
        if (x !== undefined && y !== undefined) {
            this.sendInput('quickStop', { x, y });
        } else {
            this.sendInput('quickStop');
        }
    },
    
    // Send boost command
    sendBoost(speed) {
        this.sendInput('boost', { speed });
    },
    
    // Send stop boost
    sendStopBoost() {
        this.sendInput('stopBoost');
    },
    
    // Ping server for latency measurement
    ping() {
        this.lastPingTime = Date.now();
        this.send({
            type: 'ping',
            timestamp: this.lastPingTime
        });
    },
    
    // Start periodic ping
    startPing(interval = 1000) {
        this.pingInterval = setInterval(() => {
            this.ping();
        }, interval);
    },
    
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    },
    
    // Update room info in UI
    updateRoomInfo(roomName) {
        const roomNameEl = document.getElementById('currentRoomName');
        const userRoom = document.getElementById('userRoom');
        
        const getDefaultLobbyName = () => {
            const currentLang = localStorage.getItem('language') || 'zh';
            return window.SeagullWorldUI?.translations?.[currentLang]?.['defaultLobby'] || '默认大厅';
        };
        
        if (roomNameEl) {
            roomNameEl.textContent = roomName || getDefaultLobbyName();
        }
        
        // Show room info in integrated panel
        if (userRoom) {
            userRoom.style.display = 'inline-block';
        }
    }
};
