// ==================== Multiplayer Game Mode ====================
// All multiplayer synchronization bugs fixed (Rounds 16-18)
const MultiplayerGame = {
    enabled: false,
    localPlayerId: null,
    remotePlayers: new Map(), // playerId -> player object
    aiSeagullMap: new Map(), // aiId -> AI object
    
    // Initialize multiplayer mode
    async init(playerName, playerColor) {
        try {
            console.log('Connecting to multiplayer server...');
            
            // Setup network callbacks
            NetworkClient.onConnected = (state, playerId) => {
                this.handleInitialState(state, playerId);
            };
            
            NetworkClient.onGameState = (state) => {
                this.handleGameStateUpdate(state);
            };
            
            NetworkClient.onPlayerJoined = (player) => {
                this.handlePlayerJoined(player);
            };
              NetworkClient.onPlayerLeft = (playerId) => {
                this.handlePlayerLeft(playerId);
            };
            
            NetworkClient.onRespawnConfirmed = (playerData) => {
                this.handleRespawnConfirmed(playerData);
            };
            
            NetworkClient.onDisconnected = () => {
                this.handleDisconnected();
            };
            
            // Connect to server
            await NetworkClient.connect(playerName, playerColor);
            
            // Start ping
            NetworkClient.startPing();
            
            this.enabled = true;
            console.log('Multiplayer mode enabled');
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            alert('Failed to connect to multiplayer server. Playing offline.');
            this.enabled = false;
        }
    },
      handleInitialState(state, playerId) {
        this.localPlayerId = playerId;
        console.log(`Local player ID: ${playerId}`);
        console.log(`Initial state: ${state.scallops.length} scallops, ${state.players.length} players, ${state.aiSeagulls.length} AI seagulls`);
        
        // Update world dimensions from server
        if (state.worldWidth && state.worldHeight) {
            CONFIG.worldWidth = state.worldWidth;
            CONFIG.worldHeight = state.worldHeight;
            console.log(`World dimensions set to: ${CONFIG.worldWidth}x${CONFIG.worldHeight}`);
        }
        
        // Clear existing entities
        EntityManager.players = [];
        EntityManager.scallops = [];
        EntityManager.aiSeagulls = [];// Load scallops from server with normalized data
        EntityManager.scallops = state.scallops.map(scallop => ({
            ...scallop,
            currentSize: scallop.currentSize || scallop.size,
            type: scallop.type || 'medium',
            isGrowing: scallop.isGrowing || false,
            growthProgress: scallop.growthProgress || 0,
            // 保留特殊扇贝属性
            isKing: scallop.isKing || false,
            isKingCandidate: scallop.isKingCandidate || false,
            isSpoiled: scallop.isSpoiled || false,
            spoiledTime: scallop.spoiledTime || 0,
            // 确保扇贝没有方向属性（它们是静止的）
            directionX: undefined,
            directionY: undefined
        }));
        console.log(`Loaded ${EntityManager.scallops.length} scallops`);
        
        // Load players from server
        state.players.forEach(serverPlayer => {
            if (serverPlayer.id === playerId) {
                // This is the local player
                console.log(`👤 Creating local player: ${serverPlayer.name}`);
                const player = this.createPlayerFromServerData(serverPlayer, true);
                EntityManager.players.push(player);
                
                // Update game state
                Game.playerPower = player.power;
                Game.playerSize = player.size;
            } else {
                // Remote player
                console.log(`👥 Creating remote player: ${serverPlayer.name} (${serverPlayer.id})`);
                const player = this.createPlayerFromServerData(serverPlayer, false);
                EntityManager.players.push(player);
                this.remotePlayers.set(serverPlayer.id, player);
            }
        });
        
        console.log(`✅ Initial players loaded: ${EntityManager.players.length} total (${this.remotePlayers.size} remote)`);
        console.log(`Player list:`, EntityManager.players.map(p => `${p.name}(${p.isControllable ? 'local' : 'remote'})`));
        
        // Load AI seagulls from server
        state.aiSeagulls.forEach(aiData => {
            const ai = this.createAIFromServerData(aiData);
            EntityManager.aiSeagulls.push(ai);
            this.aiSeagullMap.set(aiData.id, ai);
        });
          console.log(`Game state loaded: ${EntityManager.players.length} players, ${EntityManager.scallops.length} scallops`);
    },
    
    handleGameStateUpdate(state) {
        // 诊断：检测更新频率
        const now = Date.now();
        if (!this._lastUpdateTime) this._lastUpdateTime = now;
        const updateInterval = now - this._lastUpdateTime;
        this._lastUpdateTime = now;
        
        if (!this._updateIntervals) this._updateIntervals = [];
        this._updateIntervals.push(updateInterval);
        if (this._updateIntervals.length > 60) this._updateIntervals.shift();
        
        // 每3秒打印一次统计
        if (!this._lastStatsTime || now - this._lastStatsTime > 3000) {
            const avg = this._updateIntervals.reduce((a, b) => a + b, 0) / this._updateIntervals.length;
            const min = Math.min(...this._updateIntervals);
            const max = Math.max(...this._updateIntervals);
            console.log(`📊 Server update stats: Avg=${avg.toFixed(1)}ms (${(1000/avg).toFixed(1)}Hz), Min=${min}ms, Max=${max}ms`);
            this._lastStatsTime = now;
        }
        
        // Update world dimensions from server if provided
        if (state.worldWidth && state.worldHeight) {
            CONFIG.worldWidth = state.worldWidth;
            CONFIG.worldHeight = state.worldHeight;
        }

        // Smooth scallop updates to prevent flickering from network lag
        // Keep track of scallops by ID for smooth removal
        if (!this.scallopMap) {
            this.scallopMap = new Map();
        }

        // Build a set of current server scallop IDs
        const serverScallopIds = new Set(state.scallops.map(s => s.id));
        
        // Remove scallops that no longer exist on server
        EntityManager.scallops = EntityManager.scallops.filter(clientScallop => {
            if (!serverScallopIds.has(clientScallop.id)) {
                this.scallopMap.delete(clientScallop.id);
                return false; // Remove from client
            }
            return true; // Keep
        });
        
        // Update or add scallops from server
        state.scallops.forEach(serverScallop => {
            const existingIndex = EntityManager.scallops.findIndex(s => s.id === serverScallop.id);
            
            // Calculate client-side growth progress for smooth animation
            let clientGrowthProgress = serverScallop.growthProgress || 0;
            if (serverScallop.isGrowing && serverScallop.growthStartTime) {
                const now = Date.now();
                const age = now - serverScallop.growthStartTime;
                  if (serverScallop.isKingCandidate) {
                    // King candidate: 60 second growth
                    const kingGrowthTime = 60000;
                    clientGrowthProgress = Math.min(1, age / kingGrowthTime);
                } else {
                    // Regular growth: 5 second animation (increased from 2s for better visibility)
                    const regularGrowthTime = 5000;
                    clientGrowthProgress = Math.min(1, age / regularGrowthTime);
                }
            }
            
            const scallopData = {
                ...serverScallop,
                currentSize: serverScallop.currentSize || serverScallop.size,
                type: serverScallop.type || 'medium',
                isGrowing: serverScallop.isGrowing || false,
                growthProgress: clientGrowthProgress, // Use client-calculated progress
                growthStartTime: serverScallop.growthStartTime || 0,
                previousSize: serverScallop.previousSize,
                targetSize: serverScallop.targetSize,
                isKing: serverScallop.isKing || false,
                isKingCandidate: serverScallop.isKingCandidate || false,
                isSpoiled: serverScallop.isSpoiled || false,
                spoiledTime: serverScallop.spoiledTime || 0,
                directionX: undefined,
                directionY: undefined
            };
            
            if (existingIndex !== -1) {
                // Update existing scallop
                EntityManager.scallops[existingIndex] = scallopData;
            } else {
                // Add new scallop
                EntityManager.scallops.push(scallopData);
            }
            
            this.scallopMap.set(serverScallop.id, scallopData);
        });
        
        if (EntityManager.scallops.length === 0 && state.scallops.length > 0) {
            console.warn('Scallops received from server but failed to populate:', state.scallops);
        }
        
        // Don't update player/AI positions if game is paused
        if (Game.paused) {
            return;
        }
        
        // Update players
        state.players.forEach(serverPlayer => {
            const localPlayer = EntityManager.players.find(p => p.id === serverPlayer.id);
              if (localPlayer) {
                // Update player data from server (but not position for local player)
                if (serverPlayer.id === this.localPlayerId) {
                    // 本地玩家：完全信任客户端预测
                    const now = Date.now();
                    if (this.ignoreServerUpdatesUntil && now < this.ignoreServerUpdatesUntil) {
                        console.log('⏸️ Ignoring server update for local player (save/load in progress)');
                    } else {
                        // 更新状态数据
                        localPlayer.power = serverPlayer.power;
                        localPlayer.size = serverPlayer.size;
                        localPlayer.scallopsEaten = serverPlayer.scallopsEaten;
                        
                        // 位置：完全信任客户端，只做安全性校验和静止同步
                        const dx = serverPlayer.x - localPlayer.x;
                        const dy = serverPlayer.y - localPlayer.y;
                        const drift = Math.sqrt(dx * dx + dy * dy);
                        
                        const serverSpeed = Math.sqrt(
                            (serverPlayer.velocityX || 0) ** 2 + 
                            (serverPlayer.velocityY || 0) ** 2
                        );
                        const clientSpeed = Math.sqrt(
                            (localPlayer.velocityX || 0) ** 2 + 
                            (localPlayer.velocityY || 0) ** 2
                        );
                        
                        // 检测玩家是否真正静止
                        const isStationary = serverSpeed < 0.1 && clientSpeed < 0.1;
                        
                        // 初始化静止计时器
                        if (!localPlayer._stationaryStartTime) {
                            localPlayer._stationaryStartTime = 0;
                        }
                        
                        if (isStationary) {
                            if (localPlayer._stationaryStartTime === 0) {
                                localPlayer._stationaryStartTime = now;
                            }
                            
                            // 静止超过500ms后，温和对齐位置
                            const stationaryDuration = now - localPlayer._stationaryStartTime;
                            if (stationaryDuration > 500 && drift > 1) {
                                // 温和对齐，避免突然跳跃
                                const alignFactor = Math.min(0.3, stationaryDuration / 2000);
                                localPlayer.x += dx * alignFactor;
                                localPlayer.y += dy * alignFactor;
                            } else if (drift <= 1) {
                                // 已经很接近了，直接对齐
                                localPlayer.x = serverPlayer.x;
                                localPlayer.y = serverPlayer.y;
                            }
                        } else {
                            // 移动中：重置计时器，完全不校正位置
                            localPlayer._stationaryStartTime = 0;
                            
                            // 只在异常大的偏差时才校正（防作弊/传送等）
                            if (drift > 300) {
                                console.warn(`⚠️ 检测到异常大的位置偏差: ${drift.toFixed(1)}px，强制同步`);
                                localPlayer.x = serverPlayer.x;
                                localPlayer.y = serverPlayer.y;
                            }
                        }
                    }
                } else {
                    // For remote players, always update position and stats
                    // NOTE: This runs regardless of local player's state (moving or stationary)
                    // Server continuously broadcasts all player states at 20Hz
                    const wasMoving = localPlayer._lastServerSpeed && localPlayer._lastServerSpeed > 0.1;
                    const serverSpeed = Math.sqrt((serverPlayer.velocityX || 0) ** 2 + (serverPlayer.velocityY || 0) ** 2);
                    const isStopped = serverSpeed < 0.1;
                    
                    if (wasMoving && isStopped) {
                        // Just stopped - force immediate sync to final position for pixel-perfect accuracy
                        localPlayer.x = serverPlayer.x;
                        localPlayer.y = serverPlayer.y;
                        localPlayer.velocityX = 0;
                        localPlayer.velocityY = 0;
                    } else {
                        // Always interpolate (even when stationary, to catch up any drift)
                        this.interpolatePlayer(localPlayer, serverPlayer);
                    }
                    
                    // Always update power, size, and stats from server (authoritative)
                    localPlayer.power = serverPlayer.power;
                    localPlayer.size = serverPlayer.size;
                    localPlayer.scallopsEaten = serverPlayer.scallopsEaten || 0;
                    
                    // CRITICAL: Ensure remote player velocity is always zero
                    localPlayer.velocityX = 0;
                    localPlayer.velocityY = 0;
                    
                    // Store current speed for next frame comparison
                    localPlayer._lastServerSpeed = serverSpeed;
                }
            } else {
                // New player joined - create remote player entity
                console.log(`👤 Creating remote player: ${serverPlayer.name} (${serverPlayer.id})`);
                const player = this.createPlayerFromServerData(serverPlayer, false);
                EntityManager.players.push(player);
                if (serverPlayer.id !== this.localPlayerId) {
                    this.remotePlayers.set(serverPlayer.id, player);
                    console.log(`✅ Remote player added to map: ${serverPlayer.name}, Total remote: ${this.remotePlayers.size}`);
                }
            }
        });
        
        // Remove players that are no longer in server state
        const serverPlayerIds = new Set(state.players.map(p => p.id));
        EntityManager.players = EntityManager.players.filter(player => {
            if (!serverPlayerIds.has(player.id)) {
                this.remotePlayers.delete(player.id);
                return false;
            }
            return true;
        });
        
        // Update AI seagulls
        if (!this.aiSeagullMap) {
            this.aiSeagullMap = new Map();
        }        EntityManager.aiSeagulls = state.aiSeagulls.map(aiData => {
            // Check if we already have this AI seagull
            if (this.aiSeagullMap.has(aiData.id)) {
                const existing = this.aiSeagullMap.get(aiData.id);
                
                // Calculate if AI is moving
                const aiSpeed = Math.sqrt((aiData.velocityX || 0) ** 2 + (aiData.velocityY || 0) ** 2);
                
                // Update position only
                if (aiSpeed < 0.1) {
                    // Stationary - snap
                    existing.x = aiData.x;
                    existing.y = aiData.y;
                } else {
                    // Moving - interpolate
                    const dx = aiData.x - existing.x;
                    const dy = aiData.y - existing.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 100) {
                        existing.x = aiData.x;
                        existing.y = aiData.y;
                    } else if (distance > 2) {
                        existing.x += dx * 0.3;
                        existing.y += dy * 0.3;
                    } else {
                        existing.x = aiData.x;
                        existing.y = aiData.y;
                    }
                }
                
                // CRITICAL: Set velocity to ZERO to prevent client-side movement
                existing.velocityX = 0;
                existing.velocityY = 0;
                
                // Store direction for rendering only
                existing.directionX = aiData.directionX || existing.directionX;
                existing.directionY = aiData.directionY || existing.directionY;
                
                // Update other properties
                existing.size = aiData.size;
                existing.power = aiData.power;
                existing.aiState = aiData.aiState;
                return existing;
            } else {
                const newAI = this.createAIFromServerData(aiData);
                this.aiSeagullMap.set(aiData.id, newAI);
                return newAI;
            }
        });
          // Clean up AI map for removed seagulls
        const activeIds = new Set(state.aiSeagulls.map(ai => ai.id));
        for (const [id, ai] of this.aiSeagullMap) {
            if (!activeIds.has(id)) {
                this.aiSeagullMap.delete(id);
            }
        }
        
        // Handle power change events from server
        if (state.powerChangeEvents && state.powerChangeEvents.length > 0) {
            state.powerChangeEvents.forEach(event => {
                // Create visual power transfer effect
                EntityManager.powerTransferEffects.push(
                    EntityManager.createPowerTransferEffect(
                        event.x,
                        event.y,
                        event.text,
                        event.color
                    )
                );
            });
        }
        
        // Update game time
        Game.gameTime = state.gameTime;
    },
    
    handlePlayerJoined(player) {
        // Check if player already exists
        const existing = EntityManager.players.find(p => p.id === player.id);
        if (!existing) {
            const newPlayer = this.createPlayerFromServerData(player, false);
            EntityManager.players.push(newPlayer);
            this.remotePlayers.set(player.id, newPlayer);
            console.log(`Player joined: ${player.name}`);
        }
    },
    
    handlePlayerLeft(playerId) {
        const index = EntityManager.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            const player = EntityManager.players[index];
            console.log(`Player left: ${player.name}`);
            EntityManager.players.splice(index, 1);
            this.remotePlayers.delete(playerId);
        }
    },
    
    handleRespawnConfirmed(playerData) {
        console.log('📨 Respawn confirmed by server:', playerData);
        
        // Force update the local player with server-confirmed data
        const localPlayer = EntityManager.players.find(p => p.id === this.localPlayerId);
        if (localPlayer) {
            console.log(`🔧 Force updating local player: power ${localPlayer.power} -> ${playerData.power}`);
            localPlayer.x = playerData.x;
            localPlayer.y = playerData.y;
            localPlayer.power = playerData.power;
            localPlayer.size = playerData.size;
            
            // Update UI immediately
            if (typeof UISystem !== 'undefined') {
                UISystem.updateStats(localPlayer.power, localPlayer.size, 0, 0, EntityManager.players.length);
            }
            
            console.log('✅ Force update complete - new power:', localPlayer.power);
        }
    },
    
    handleDisconnected() {
        console.log('Disconnected from server');
        alert('Disconnected from server. Returning to menu.');
        Game.stop();
        document.getElementById('menu').style.display = 'flex';
        document.getElementById('gameCanvas').style.display = 'none';
    },
      createPlayerFromServerData(serverPlayer, isControllable) {
        const finalVelX = isControllable ? (serverPlayer.velocityX || 0) : 0;
        const finalVelY = isControllable ? (serverPlayer.velocityY || 0) : 0;
        
        return {
            id: serverPlayer.id,
            x: serverPlayer.x,
            y: serverPlayer.y,
            size: serverPlayer.size,
            power: serverPlayer.power,
            maxPower: 999999,
            name: serverPlayer.name,
            color: serverPlayer.color,
            isControllable: isControllable,
            isPlayer: isControllable,
            baseSpeed: 5,
            speed: 0,
            velocityX: finalVelX,
            velocityY: finalVelY,
            maxSpeed: 8,
            acceleration: 0.3,
            deceleration: 0.15,
            directionX: serverPlayer.directionX || 1,
            directionY: serverPlayer.directionY || 0,
            accelDirectionX: serverPlayer.accelDirectionX || (serverPlayer.directionX || 1),
            accelDirectionY: serverPlayer.accelDirectionY || (serverPlayer.directionY || 0),
            wingFlapSpeed: 0,
            isBoosting: false,
            boostMultiplier: 1.5,
            scallopsEaten: serverPlayer.scallopsEaten || 0,
            isDead: false,
            // Interpolation
            targetX: serverPlayer.x,
            targetY: serverPlayer.y,
            isMoving: serverPlayer.isMoving || false,
            moveSpeed: serverPlayer.moveSpeed || 1.0,
            isAccelerating: serverPlayer.isAccelerating || false,
            // Mark remote players
            _isRemotePlayer: !isControllable
        };
    },
    
    createAIFromServerData(aiData) {
        return {
            id: aiData.id,
            x: aiData.x,
            y: aiData.y,
            size: aiData.size,
            power: aiData.power,
            maxPower: 999999,
            name: aiData.name,
            color: aiData.color,
            isPlayer: false,
            baseSpeed: aiData.baseSpeed,
            directionX: aiData.directionX || 1,
            directionY: aiData.directionY || 0,
            velocityX: aiData.velocityX || 0,
            velocityY: aiData.velocityY || 0,
            aiState: aiData.aiState,
            aiTimer: aiData.aiTimer,
            isDead: false,
            wingFlapSpeed: 0
        };    },
    
    interpolatePlayer(localPlayer, serverPlayer) {
        // 新策略：逻辑层直接更新，渲染层做平滑（在drawing.js中）
        
        // 初始化
        if (!localPlayer._initialized) {
            localPlayer.x = serverPlayer.x;
            localPlayer.y = serverPlayer.y;
            localPlayer._initialized = true;
        }
        
        const dx = serverPlayer.x - localPlayer.x;
        const dy = serverPlayer.y - localPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const serverSpeed = Math.sqrt(
            (serverPlayer.velocityX || 0) ** 2 + 
            (serverPlayer.velocityY || 0) ** 2
        );
        
        // 传送场景
        if (distance > 100) {
            localPlayer.x = serverPlayer.x;
            localPlayer.y = serverPlayer.y;
            // 强制渲染位置同步
            if (localPlayer._renderX !== undefined) {
                localPlayer._renderX = serverPlayer.x;
                localPlayer._renderY = serverPlayer.y;
            }
        }
        // 正常更新：直接设置服务器位置，渲染层会平滑
        else {
            localPlayer.x = serverPlayer.x;
            localPlayer.y = serverPlayer.y;
        }
        
        // 更新速度和方向
        localPlayer.velocityX = serverPlayer.velocityX || 0;
        localPlayer.velocityY = serverPlayer.velocityY || 0;
        localPlayer.directionX = serverPlayer.directionX || 1;
        localPlayer.directionY = 0;
        
        // Update other attributes
        localPlayer.power = serverPlayer.power;
        localPlayer.size = serverPlayer.size;
        localPlayer.scallopsEaten = serverPlayer.scallopsEaten;
        localPlayer.isMoving = serverPlayer.isMoving || false;
        
        // Mark as remote player
        localPlayer._isRemotePlayer = true;
    },
    
    // Send local player input to server with current position
    sendMoveCommand(targetX, targetY) {
        if (this.enabled) {
            // Send current client position for accurate collision detection
            const localPlayer = EntityManager.players.find(p => p.id === this.localPlayerId);
            if (localPlayer) {
                NetworkClient.sendMove(targetX, targetY, localPlayer.x, localPlayer.y);
            } else {
                NetworkClient.sendMove(targetX, targetY);
            }
        }
    },
    
    sendStopCommand() {
        if (this.enabled) {
            // 发送停止命令时附带当前精确位置
            const player = EntityManager.players.find(p => p.isControllable);
            if (player) {
                NetworkClient.sendStop(player.x, player.y);
            } else {
                NetworkClient.sendStop();
            }
        }
    },
    
    sendQuickStopCommand(x, y) {
        if (this.enabled) {
            // 急刹车时发送精确位置
            NetworkClient.sendQuickStop(x, y);
        }
    },
    
    sendBoostCommand(speed) {
        if (this.enabled) {
            NetworkClient.sendBoost(speed);
        }
    },
    
    sendStopBoostCommand() {
        if (this.enabled) {
            NetworkClient.sendStopBoost();
        }
    },
    
    // Get latency
    getLatency() {
        return NetworkClient.latency;
    },
    
    // Check if connected to server
    isConnected() {
        return this.enabled && NetworkClient.isConnected();
    },
    
    // Disconnect from multiplayer
    disconnect() {
        if (this.enabled) {
            console.log('🔌 Disconnecting from multiplayer...');
            NetworkClient.stopPing();
            NetworkClient.disconnect();
            this.enabled = false;
            this.localPlayerId = null;
            this.remotePlayers.clear();
            this.aiSeagullMap.clear();
            console.log('✓ Disconnected from multiplayer');
        }
    },
    
    // Shutdown
    shutdown() {
        this.disconnect();
    }
};
