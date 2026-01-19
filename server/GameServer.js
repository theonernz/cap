// ==================== Game Server Logic ====================
const { loadConfigFromINI } = require('./configLoader');

class GameServer {
    constructor(logger = null, configParser = null) {
        this.logger = logger;
        
        // Load configuration from INI or use defaults
        this.config = configParser ? loadConfigFromINI(configParser) : this.getDefaultConfig();
        
        // Log loaded config
        this.log('info', '🎮 Server configuration loaded', { 
            mode: configParser ? 'INI-based' : 'default',
            worldSize: `${this.config.worldWidth}x${this.config.worldHeight}`,
            maxPlayers: this.config.maxPlayers,
            aiCount: this.config.aiSeagullCount,
            scallops: this.config.initialScallopCount
        });
        
        // Game state
        this.players = new Map(); // playerId -> player object
        
        // Game state
        this.players = new Map(); // playerId -> player object
        this.aiSeagulls = [];
        this.scallops = [];
        this.gameTime = 0;
        this.powerChangeEvents = []; // Track power changes for visual effects
        
        // Timing
        this.lastUpdateTime = Date.now();
        this.updateInterval = null;
        this.stateInterval = null;
        
        // Initialize game world
        this.initializeWorld();
    }
    
    // Get default configuration if no INI parser provided
    getDefaultConfig() {
        return {
            serverPort: 80,
            maxPlayers: 20,
            worldWidth: 5000,
            worldHeight: 5000,
            tickRate: 60,
            stateUpdateRate: 60,
            collisionDetectionRange: 200,
            initialPlayerPower: 100,
            playerBaseSpeed: 4,
            playerMaxSpeed: 6,
            playerAcceleration: 0.25,
            playerDeceleration: 0.15,
            playerSpawnRadius: 200,
            aiSeagullCount: 20,
            aiPlayerCount: 5,
            initialScallopCount: 800,
            minScallopCount: 400,
            scallopSpawnRate: 0.5,
            scallopGrowth: {
                enabled: true,
                smallToMediumTime: 20000,
                mediumToLargeTime: 40000,
                growthSpeed: 1.0,
                smallToMediumChance: 0.95,
                mediumToLargeChance: 0.50
            },
            scallopKing: {
                enabled: true,
                maxKingScallops: 1,
                kingCandidateChance: 0.15,
                largeToKingCandidateTime: 45000,
                growthTime: 60000,
                minPowerValue: 50,
                powerPercentOfTopSeagull: 0.5
            },
            spoiledScallop: {
                enabled: true,
                probability: 0.02,
                maxPercentage: 0.025,
                lifetime: 40000,
                powerMultiplier: -10,
                colors: {
                    outer: '#696969',
                    inner: '#2F4F2F'
                },
                warningDistance: 80,
                gradualSpoilingEnabled: true
            },
            enableServerSidePrediction: true,
            interpolationDelay: 100,
            logLevel: 'info'
        };
    }
    
    log(level, message, data) {
        if (this.logger) {
            this.logger[level](message, data);
        } else {
            console.log(`[${level.toUpperCase()}] ${message}`, data || '');
        }
    }
      initializeWorld() {
        // Create initial scallops - keep them away from edges
        const edgeMargin = 80; // Keep scallops away from edges
        for (let i = 0; i < this.config.initialScallopCount; i++) {
            this.scallops.push(this.createScallop(
                edgeMargin + Math.random() * (this.config.worldWidth - edgeMargin * 2),
                edgeMargin + Math.random() * (this.config.worldHeight - edgeMargin * 2)
            ));
        }
        
        // Create AI seagulls
        for (let i = 0; i < this.config.aiSeagullCount; i++) {
            this.aiSeagulls.push(this.createAISeagull(
                Math.random() * this.config.worldWidth,
                Math.random() * this.config.worldHeight
            ));
        }
        
        this.log('info', 'World initialized', { 
            scallops: this.scallops.length, 
            aiSeagulls: this.aiSeagulls.length 
        });
        if (this.scallops.length > 0) {
            this.log('debug', 'First scallop created', { scallop: this.scallops[0] });
        }
    }    createScallop(x, y) {
        // 新扇贝不直接变质，而是随时间渐进变质
        const types = [
            { size: 6, powerValue: 5, type: 'small', color: '#FFFACD', innerColor: '#FFE4B5', weight: 80 },
            { size: 10, powerValue: 10, type: 'medium', color: '#FFFFFF', innerColor: '#FFB74D', weight: 15 },
            { size: 15, powerValue: 20, type: 'large', color: '#FFD700', innerColor: '#FF8C00', weight: 5 }
        ];
        
        // Weighted random selection: 80% small, 15% medium, 5% large
        const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
        let random = Math.random() * totalWeight;
        let typeData = types[0];
        
        for (const type of types) {
            random -= type.weight;
            if (random <= 0) {
                typeData = type;
                break;
            }
        }
        
        const birthTime = Date.now();
        
        const scallop = {
            id: `scallop_${birthTime}_${Math.random()}`,
            x, y,
            size: typeData.size,
            powerValue: typeData.powerValue,
            type: typeData.type,
            color: typeData.color,
            innerColor: typeData.innerColor,
            birthTime: birthTime,
            // Explicitly set to prevent client-side growth effects
            currentSize: typeData.size,
            targetSize: typeData.size,
            isGrowing: false,
            growthProgress: 0,
            growthStage: typeData.type,
            isSpoiled: false,
            spoiledTime: null,
            spoilCheckTime: null, // 记录上次变质检查时间
            isKingCandidate: false,
            isKing: false
        };
        
        return scallop;
    }
    
    createAISeagull(x, y) {
        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
        const size = Math.random() * 0.8 + 0.5;
        const power = Math.floor(Math.random() * 50) + 50; // Increased from 30+30 to 50+50
        
        return {
            id: `ai_${Date.now()}_${Math.random()}`,
            x, y,
            size, power,
            maxPower: 999999,
            velocityX: 0,
            velocityY: 0,
            directionX: Math.random() > 0.5 ? 1 : -1,
            directionY: Math.random() > 0.5 ? 1 : -1,
            color: colors[Math.floor(Math.random() * colors.length)],
            name: `AI-${Math.floor(Math.random() * 1000)}`,
            baseSpeed: Math.random() * 2 + 3, // Increased from +2 to +3 for faster movement
            aiState: 'wandering',
            aiTimer: Math.random() * 3
        };
    }
    
    addPlayer(playerId, name, color, ws, clientId = null) {
        if (this.players.size >= this.config.maxPlayers) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Server is full'
            }));
            return false;
        }
          // Spawn players near the center for easier multiplayer interaction
        const spawnRadius = 200; // Players spawn within 200 units of center
        const centerX = this.config.worldWidth / 2;
        const centerY = this.config.worldHeight / 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnRadius;
        
        const player = {
            id: playerId,
            clientId: clientId, // 用于关联客户端连接
            name: name || `Player-${this.players.size + 1}`,
            color: color || this.getRandomColor(),
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            size: 1.0,
            power: this.config.initialPlayerPower,
            maxPower: 999999,
            velocityX: 0,
            velocityY: 0,
            directionX: 1,
            directionY: 0,
            accelDirectionX: 1,
            accelDirectionY: 0,
            speed: 0,
            baseSpeed: this.config.playerBaseSpeed,
            maxSpeed: this.config.playerMaxSpeed,
            acceleration: this.config.playerAcceleration,
            deceleration: this.config.playerDeceleration,
            isMoving: false,
            targetX: 0,
            targetY: 0,
            moveSpeed: 1.0,
            isAccelerating: false,
            scallopsEaten: 0,
            ws: ws
        };
        
        this.players.set(playerId, player);
        this.log('info', 'Player joined', { name: name, playerId: playerId });
        return true;
    }
    
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            this.log('info', 'Player left', { name: player.name, playerId: playerId });
            this.players.delete(playerId);
        }
    }
    
    getPlayer(playerId) {
        return this.players.get(playerId);
    }
    
    handlePlayerInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player) return;
          switch (input.action) {
            case 'move':
                player.isMoving = true;
                player.targetX = input.targetX;
                player.targetY = input.targetY;
                
                // Use client-reported position for more accurate collision detection
                // This helps compensate for network latency in multiplayer
                if (input.clientX !== undefined && input.clientY !== undefined) {
                    player.clientX = input.clientX;
                    player.clientY = input.clientY;
                    player.lastClientUpdate = Date.now();
                }
                break;            case 'stop':
                player.isMoving = false;
                player.velocityX = 0;
                player.velocityY = 0;
                // 接受客户端停止时的精确位置
                if (input.x !== undefined && input.y !== undefined) {
                    player.x = input.x;
                    player.y = input.y;
                }
                break;
                
            case 'quickStop':
                player.velocityX = 0;
                player.velocityY = 0;
                player.isMoving = false;
                // 接受客户端急刹车时的精确位置
                if (input.x !== undefined && input.y !== undefined) {
                    player.x = input.x;
                    player.y = input.y;
                }
                break;
                
            case 'boost':
                player.isAccelerating = true;
                player.moveSpeed = input.speed || 1.5;
                break;
                
            case 'stopBoost':
                player.isAccelerating = false;
                player.moveSpeed = 1.0;
                break;
        }
    }
    
    getGameState() {        
        const timestamp = Date.now();
        const players = Array.from(this.players.values()).map(p => ({
            id: p.id,
            name: p.name,
            color: p.color,
            x: p.x,
            y: p.y,
            size: p.size,
            power: p.power,
            velocityX: p.velocityX,
            velocityY: p.velocityY,
            directionX: p.directionX,
            directionY: p.directionY,
            isMoving: p.isMoving,
            scallopsEaten: p.scallopsEaten,
            timestamp: timestamp
        }));
        
        const state = {
            worldWidth: this.config.worldWidth,
            worldHeight: this.config.worldHeight,
            players,
            aiSeagulls: this.aiSeagulls.map(ai => ({
                id: ai.id,
                x: ai.x,
                y: ai.y,
                size: ai.size,
                power: ai.power,
                velocityX: ai.velocityX,
                velocityY: ai.velocityY,
                directionX: ai.directionX,
                directionY: ai.directionY,
                color: ai.color,
                name: ai.name,
                baseSpeed: ai.baseSpeed,
                aiState: ai.aiState,
                aiTimer: ai.aiTimer
            })),
            scallops: this.scallops,
            powerChangeEvents: this.powerChangeEvents, // Include power change events
            gameTime: this.gameTime
        };
        
        // Clear power change events after sending (they're one-time events)
        this.powerChangeEvents = [];
        
        // Log scallop count periodically
        if (Math.random() < 0.01) {
            this.log('debug', 'Game state', { 
                scallops: this.scallops.length, 
                aiSeagulls: this.aiSeagulls.length, 
                players: this.players.size 
            });
        }
        
        return state;
    }
    
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // Update all players
        for (const [playerId, player] of this.players) {
            this.updatePlayer(player, deltaTime);
        }
        
        // Update AI seagulls
        for (const ai of this.aiSeagulls) {
            this.updateAISeagull(ai, deltaTime);
        }
          // Check collisions
        this.checkCollisions();
        
        // Update scallop growth (King/Spoiled system)
        this.updateScallopGrowth(deltaTime);
        
        // Clean up expired spoiled scallops (30 second lifetime)
        this.cleanupSpoiledScallops();
        
        // Spawn new scallops if needed
        this.spawnScallops();
        
        // Remove dead entities
        this.cleanupDeadEntities();
    }
      updatePlayer(player, deltaTime) {
        if (!player.isMoving) {
            // Apply deceleration
            const currentSpeed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
            if (currentSpeed > 0.1) {
                player.velocityX *= (1 - player.deceleration);
                player.velocityY *= (1 - player.deceleration);
                
                // Double-check: if speed is now very small, snap to zero
                const newSpeed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
                if (newSpeed < 0.01) {
                    player.velocityX = 0;
                    player.velocityY = 0;
                }
            } else {
                player.velocityX = 0;
                player.velocityY = 0;
            }
        } else {
            // Calculate direction to target
            const dx = player.targetX - player.x;
            const dy = player.targetY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const targetDirX = dx / distance;
                const targetDirY = dy / distance;
                
                // Smooth turning
                const turnSpeed = 0.5;
                player.accelDirectionX += (targetDirX - player.accelDirectionX) * turnSpeed;
                player.accelDirectionY += (targetDirY - player.accelDirectionY) * turnSpeed;
                
                // Normalize acceleration direction
                const accelMag = Math.sqrt(player.accelDirectionX ** 2 + player.accelDirectionY ** 2);
                if (accelMag > 0) {
                    player.accelDirectionX /= accelMag;
                    player.accelDirectionY /= accelMag;
                }
                
                // Apply acceleration
                const accel = player.acceleration * 2.5 * player.moveSpeed;
                player.velocityX += player.accelDirectionX * accel;
                player.velocityY += player.accelDirectionY * accel;
                
                // Cap speed
                const currentSpeed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
                const maxSpeed = player.maxSpeed * player.moveSpeed;
                if (currentSpeed > maxSpeed) {
                    player.velocityX = (player.velocityX / currentSpeed) * maxSpeed;
                    player.velocityY = (player.velocityY / currentSpeed) * maxSpeed;
                }
                
                // Update visual direction based on velocity
                if (currentSpeed > 0.5) {
                    player.directionX = player.velocityX / currentSpeed;
                    player.directionY = player.velocityY / currentSpeed;
                }
            }
        }
        
        // Update position
        player.x += player.velocityX;
        player.y += player.velocityY;
        player.speed = Math.sqrt(player.velocityX ** 2 + player.velocityY ** 2);
        
        // Boundary check with velocity damping
        const oldX = player.x;
        const oldY = player.y;
        player.x = Math.max(50, Math.min(this.config.worldWidth - 50, player.x));
        player.y = Math.max(50, Math.min(this.config.worldHeight - 50, player.y));
        
        // If position was clamped, stop velocity in that direction
        if (player.x !== oldX) {
            player.velocityX = 0;
        }
        if (player.y !== oldY) {
            player.velocityY = 0;
        }
    }
    
    updateAISeagull(ai, deltaTime) {
        // 智能觅食AI：优先寻找大扇贝
        const searchRadius = 300; // 搜索半径
        let targetScallop = null;
        let bestValue = 0;
        
        // 寻找视野内价值最高的扇贝（优先大扇贝）
        for (const scallop of this.scallops) {
            if (scallop.isKing || scallop.isSpoiled) continue; // 跳过King和变质扇贝
            
            const dx = scallop.x - ai.x;
            const dy = scallop.y - ai.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < searchRadius) {
                // 价值评估：能力值 / 距离（距离越近、能力值越高，优先级越高）
                const value = scallop.powerValue / Math.max(distance, 1);
                if (value > bestValue) {
                    bestValue = value;
                    targetScallop = scallop;
                }
            }
        }
        
        // 如果找到目标扇贝，追逐它
        if (targetScallop) {
            const dx = targetScallop.x - ai.x;
            const dy = targetScallop.y - ai.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                ai.directionX = dx / distance;
                ai.directionY = dy / distance;
                ai.aiState = 'chasing';
                ai.aiTimer = 1; // 持续追逐1秒
            }
        } else {
            // 没有目标时随机游走
            ai.aiTimer -= deltaTime;
            
            if (ai.aiTimer <= 0) {
                ai.directionX = (Math.random() - 0.5) * 2;
                ai.directionY = (Math.random() - 0.5) * 2;
                
                const mag = Math.sqrt(ai.directionX ** 2 + ai.directionY ** 2);
                if (mag > 0) {
                    ai.directionX /= mag;
                    ai.directionY /= mag;
                }
                
                ai.aiState = 'wandering';
                ai.aiTimer = Math.random() * 3 + 1;
            }
        }
        
        // Update velocity and position
        ai.velocityX = ai.directionX * ai.baseSpeed;
        ai.velocityY = ai.directionY * ai.baseSpeed;
        ai.x += ai.velocityX;
        ai.y += ai.velocityY;
        
        // Boundary bounce - better collision detection
        const margin = ai.size * 15;
        let directionChanged = false;
        
        if (ai.x < margin) {
            ai.directionX = Math.abs(ai.directionX);
            ai.x = margin;
            directionChanged = true;
        } else if (ai.x > this.config.worldWidth - margin) {
            ai.directionX = -Math.abs(ai.directionX);
            ai.x = this.config.worldWidth - margin;
            directionChanged = true;
        }
        
        if (ai.y < margin) {
            ai.directionY = Math.abs(ai.directionY);
            ai.y = margin;
            directionChanged = true;
        } else if (ai.y > this.config.worldHeight - margin) {
            ai.directionY = -Math.abs(ai.directionY);
            ai.y = this.config.worldHeight - margin;
            directionChanged = true;
        }
        
        // Recalculate velocity if direction changed due to boundary bounce
        if (directionChanged) {
            ai.velocityX = ai.directionX * ai.baseSpeed;
            ai.velocityY = ai.directionY * ai.baseSpeed;
        }
    }
      checkCollisions() {
        // Players eating scallops
        for (const [playerId, player] of this.players) {            for (let i = this.scallops.length - 1; i >= 0; i--) {
                const scallop = this.scallops[i];
                
                // Use client-reported position if available and recent (within 200ms)
                // This significantly improves collision accuracy in multiplayer
                let playerX = player.x;
                let playerY = player.y;
                if (player.clientX !== undefined && player.lastClientUpdate && 
                    (Date.now() - player.lastClientUpdate) < 200) {
                    playerX = player.clientX;
                    playerY = player.clientY;
                }
                
                const dx = playerX - scallop.x;
                const dy = playerY - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Collision detection with generous radius for network play
                const seagullRadius = player.size * 15;
                const visualSize = scallop.currentSize || scallop.size;
                const speedBuffer = player.speed * 2;
                const collisionRadius = seagullRadius + visualSize + speedBuffer;
                
                if (distance < collisionRadius) {
                    const oldPower = player.power;
                    player.power += scallop.powerValue;
                    player.scallopsEaten++;
                    player.size = Math.pow(player.power / 100, 0.3);
                    
                    // Create power change event for visual effect
                    this.powerChangeEvents.push({
                        entityId: player.id,
                        x: scallop.x,
                        y: scallop.y,
                        text: `+${scallop.powerValue}`,
                        color: '#4CAF50' // Green for positive
                    });
                    
                    this.log('info', 'Player ate scallop', {
                        playerName: player.name,
                        oldPower: oldPower,
                        newPower: player.power,
                        powerGain: scallop.powerValue,
                        scallopsEaten: player.scallopsEaten,
                        remainingScallops: this.scallops.length - 1
                    });
                    this.scallops.splice(i, 1);
                }
            }
        }
        
        // AI seagulls eating scallops
        for (const ai of this.aiSeagulls) {
            for (let i = this.scallops.length - 1; i >= 0; i--) {
                const scallop = this.scallops[i];
                
                // Skip spoiled and King scallops for AI
                if (scallop.isSpoiled || scallop.isKing) continue;
                
                const dx = ai.x - scallop.x;
                const dy = ai.y - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Use same expanded collision logic as player seagulls
                const seagullRadius = ai.size * 15; // 从 *10 增加到 *15
                const visualSize = scallop.currentSize || scallop.size;
                const collisionRadius = seagullRadius + visualSize; // 从 *0.5 改为 *1.0
                  
                if (distance < collisionRadius) {
                    const oldPower = ai.power;
                    ai.power += scallop.powerValue;
                    ai.size = Math.pow(ai.power / 100, 0.3);
                    
                    // Create power change event for AI
                    this.powerChangeEvents.push({
                        entityId: ai.id,
                        x: scallop.x,
                        y: scallop.y,
                        text: `+${scallop.powerValue}`,
                        color: '#4CAF50' // Green for positive
                    });
                    
                    this.scallops.splice(i, 1);
                    break;
                }
            }
        }
        
        // Power transfer between entities (players vs players)
        const allPlayers = Array.from(this.players.values());
        for (let i = 0; i < allPlayers.length; i++) {
            for (let j = i + 1; j < allPlayers.length; j++) {
                this.checkPowerTransfer(allPlayers[i], allPlayers[j]);
            }
        }
        
        // Power transfer between players and AI seagulls
        for (const player of allPlayers) {
            for (const ai of this.aiSeagulls) {
                this.checkPowerTransfer(player, ai);
            }
        }
        
        // Power transfer between AI seagulls
        for (let i = 0; i < this.aiSeagulls.length; i++) {
            for (let j = i + 1; j < this.aiSeagulls.length; j++) {
                this.checkPowerTransfer(this.aiSeagulls[i], this.aiSeagulls[j]);
            }
        }
    }
    
    checkPowerTransfer(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (entity1.size + entity2.size) * 10;
        
        if (distance < minDistance) {
            // Check if power difference is significant (at least 20%)
            const powerDiff = Math.abs(entity1.power - entity2.power);
            const minPowerDiff = Math.max(entity1.power, entity2.power) * 0.2;
            
            if (powerDiff < minPowerDiff) return;
            
            // Add cooldown check
            const now = Date.now();
            if (!entity1.lastPowerTransfer) entity1.lastPowerTransfer = 0;
            if (!entity2.lastPowerTransfer) entity2.lastPowerTransfer = 0;
            
            if (now - entity1.lastPowerTransfer < 500 || now - entity2.lastPowerTransfer < 500) {
                return;
            }
            
            entity1.lastPowerTransfer = now;
            entity2.lastPowerTransfer = now;
            
            let stronger, weaker;
            if (entity1.power > entity2.power) {
                stronger = entity1;
                weaker = entity2;
            } else {
                stronger = entity2;
                weaker = entity1;
            }
              // Transfer power: strong gains 8%, weak loses 10%
            const gainAmount = Math.floor(weaker.power * 0.08);
            const lossAmount = Math.floor(weaker.power * 0.10);
            
            const actualLoss = Math.min(lossAmount, weaker.power);
            const actualGain = Math.min(gainAmount, weaker.power);
            
            stronger.power += actualGain;
            weaker.power = Math.max(0, weaker.power - actualLoss);
            
            // Create power change events for both entities
            const midX = (stronger.x + weaker.x) / 2;
            const midY = (stronger.y + weaker.y) / 2;
            
            this.powerChangeEvents.push({
                entityId: stronger.id,
                x: midX,
                y: midY,
                text: `+${actualGain}`,
                color: '#4CAF50' // Green for gain
            });
            
            this.powerChangeEvents.push({
                entityId: weaker.id,
                x: midX,
                y: midY + 15,
                text: `-${actualLoss}`,
                color: '#F44336' // Red for loss
            });
            
            // Update sizes
            stronger.size = Math.pow(stronger.power / 100, 0.3);
            weaker.size = Math.pow(weaker.power / 100, 0.3);
        }
    }
      spawnScallops() {
        // Spawn new scallops to maintain minimum count
        const spawnCount = Math.max(0, this.config.minScallopCount - this.scallops.length);
        if (spawnCount > 0) {
            const edgeMargin = 80; // Keep scallops away from edges where players can't reach
            for (let i = 0; i < spawnCount; i++) {
                this.scallops.push(this.createScallop(
                    Math.random() * (this.config.worldWidth - 2 * edgeMargin) + edgeMargin,
                    Math.random() * (this.config.worldHeight - 2 * edgeMargin) + edgeMargin
                ));
            }
        }
    }
    
    cleanupSpoiledScallops() {
        if (!this.config.spoiledScallop || !this.config.spoiledScallop.enabled) return;
        
        const now = Date.now();
        const lifetime = this.config.spoiledScallop.lifetime || 40000;
        const maxPercentage = this.config.spoiledScallop.maxPercentage || 0.025;
        let removedCount = 0;
        let newlySpoiledCount = 0;
        
        // 渐进式变质检查：扇贝存活15-30秒后开始有变质风险
        const minAgeForSpoiling = 15000;  // 15秒
        const maxAgeForSpoiling = 30000;  // 30秒
        const spoilCheckInterval = 5000;  // 每5秒检查一次
        
        // Remove expired spoiled scallops
        for (let i = this.scallops.length - 1; i >= 0; i--) {
            const scallop = this.scallops[i];
            
            // 清理过期的变质扇贝
            if (scallop.isSpoiled && scallop.spoiledTime) {
                const age = now - scallop.spoiledTime;
                if (age >= lifetime) {
                    this.scallops.splice(i, 1);
                    removedCount++;
                    // Spawn a new scallop to replace it
                    const edgeMargin = 80;
                    this.scallops.push(this.createScallop(
                        Math.random() * (this.config.worldWidth - 2 * edgeMargin) + edgeMargin,
                        Math.random() * (this.config.worldHeight - 2 * edgeMargin) + edgeMargin
                    ));
                    continue;
                }
            }
            
            // 渐进式变质：检查正常扇贝是否应该变质
            if (!scallop.isSpoiled && !scallop.isKing && !scallop.isKingCandidate) {
                const age = now - scallop.birthTime;
                const timeSinceLastCheck = scallop.spoilCheckTime ? (now - scallop.spoilCheckTime) : spoilCheckInterval + 1;
                
                // 扇贝年龄在15-30秒之间，且距离上次检查超过5秒
                if (age >= minAgeForSpoiling && age <= maxAgeForSpoiling && timeSinceLastCheck >= spoilCheckInterval) {
                    scallop.spoilCheckTime = now;
                    
                    // 每次检查有0.5%的概率变质（5秒检查一次，15秒内约有1.5%概率变质）
                    if (Math.random() < 0.005) {
                        this.makeSpoiled(scallop);
                        newlySpoiledCount++;
                    }
                }
            }
        }
        
        if (removedCount > 0) {
            this.log('debug', 'Removed decayed spoiled scallops', { 
                count: removedCount, 
                lifetimeSeconds: lifetime/1000 
            });
        }
        
        if (newlySpoiledCount > 0) {
            this.log('debug', 'Scallops spoiled naturally', { count: newlySpoiledCount });
        }
        
        // Enforce maximum spoiled scallop percentage
        const totalScallops = this.scallops.length;
        const spoiledScallops = this.scallops.filter(s => s.isSpoiled);
        const maxSpoiled = Math.floor(totalScallops * maxPercentage);
        
        if (spoiledScallops.length > maxSpoiled) {
            // Sort by age (oldest first) and remove excess
            spoiledScallops.sort((a, b) => (a.spoiledTime || 0) - (b.spoiledTime || 0));
            const excessCount = spoiledScallops.length - maxSpoiled;
            
            for (let i = 0; i < excessCount; i++) {
                const index = this.scallops.indexOf(spoiledScallops[i]);
                if (index !== -1) {
                    this.scallops.splice(index, 1);
                }
            }
            
            this.log('warn', 'Removed excess spoiled scallops', { 
                removed: excessCount, 
                max: maxSpoiled, 
                total: totalScallops 
            });
        }
        
        // Log spoiled scallop statistics periodically (every 100 cleanups)
        if (!this._cleanupCount) this._cleanupCount = 0;
        this._cleanupCount++;
        if (this._cleanupCount % 100 === 0) {
            const currentSpoiled = this.scallops.filter(s => s.isSpoiled).length;
            const percentage = (currentSpoiled / this.scallops.length * 100).toFixed(1);
            this.log('debug', 'Spoiled scallops statistics', {
                spoiled: currentSpoiled,
                total: this.scallops.length,
                percentage: percentage,
                maxPercentage: (maxPercentage*100).toFixed(1)
            });
        }
        
        if (removedCount > 0) {
            this.log('debug', 'Cleaned up expired spoiled scallops', { count: removedCount });
        }
    }
    
    makeSpoiled(scallop) {
        const spoiledConfig = this.config.spoiledScallop;
        if (!spoiledConfig || scallop.isSpoiled) return;
        
        scallop.isSpoiled = true;
        scallop.spoiledTime = Date.now();
        scallop.color = spoiledConfig.colors?.outer || '#696969';
        scallop.innerColor = spoiledConfig.colors?.inner || '#2F4F2F';
        
        // 调整能力值为负数
        const powerMultiplier = spoiledConfig.powerMultiplier || -10;
        scallop.powerValue = Math.abs(scallop.powerValue) * powerMultiplier;
    }
    
    cleanupDeadEntities() {
        // Remove dead players and AI seagulls (power <= 0)
        for (const [playerId, player] of this.players) {
            if (player.power <= 0) {
                this.log('info', 'Player died', { name: player.name, power: player.power });
                player.isDead = true;
                // Note: Actual removal will be handled by disconnect logic
            }
        }
        
        // Remove dead AI seagulls (power <= 0)
        const initialCount = this.aiSeagulls.length;
        this.aiSeagulls = this.aiSeagulls.filter(ai => {
            if (ai.power <= 0) {
                this.log('debug', 'AI Seagull died', { name: ai.name, power: ai.power });
                return false;
            }
            return true;
        });
        
        // Respawn AI seagulls if needed
        const deadCount = initialCount - this.aiSeagulls.length;
        if (deadCount > 0) {
            for (let i = 0; i < deadCount; i++) {
                this.aiSeagulls.push(this.createAISeagull(
                    Math.random() * this.config.worldWidth,
                    Math.random() * this.config.worldHeight
                ));
            }
            this.log('debug', 'Respawned AI seagulls', { count: deadCount });
        }
    }
    
    getRandomColor() {
        const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF1493', '#00CED1'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    start(onUpdate) {
        const tickInterval = 1000 / this.config.tickRate;
        const stateInterval = 1000 / this.config.stateUpdateRate;
        
        // Game update loop
        this.updateInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = now;
            
            this.update(deltaTime);
        }, tickInterval);
        
        // State broadcast loop
        this.stateInterval = setInterval(() => {
            if (onUpdate) {
                onUpdate(this.getGameState());
            }
        }, stateInterval);
        
        this.log('info', 'Game server started', { 
            tickRate: this.config.tickRate, 
            stateUpdateRate: this.config.stateUpdateRate 
        });
    }
    
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.stateInterval) {
            clearInterval(this.stateInterval);
            this.stateInterval = null;
        }
        this.log('info', 'Game server stopped', {});
    }    updateScallopGrowth(deltaTime) {
        if (!this.config.scallopGrowth || !this.config.scallopGrowth.enabled) return;
        
        const now = Date.now();
        const growthSpeed = this.config.scallopGrowth.growthSpeed || 1.0;
        const growthAnimationDuration = 5000; // 5 seconds for visual growth animation (increased from 2s for better visibility)
        
        // Get top seagull power for King scallop calculation
        const topSeagullPower = this.getTopSeagullPower();
        
        this.scallops.forEach(scallop => {
            // Handle King candidate promotion
            if (scallop.isKingCandidate && !scallop.isKing) {
                const kingAge = now - scallop.kingGrowthStartTime;
                if (kingAge >= this.config.scallopKing.growthTime / growthSpeed) {
                    this.promoteToScallopKing(scallop, topSeagullPower);
                }
            }
            
            // Update growth animation for ALL growing scallops
            if (scallop.isGrowing && scallop.growthStartTime) {
                const growthAge = now - scallop.growthStartTime;
                
                if (scallop.isKingCandidate) {
                    // King candidate: grow from 15 to 20 over King growth time
                    const growthDuration = this.config.scallopKing.growthTime / growthSpeed;
                    scallop.growthProgress = Math.min(1, growthAge / growthDuration);
                    scallop.currentSize = 15 + (5 * scallop.growthProgress);
                } else {
                    // Regular growth: animate from previous size to target size
                    scallop.growthProgress = Math.min(1, growthAge / growthAnimationDuration);
                    const startSize = scallop.previousSize || scallop.size;
                    const targetSize = scallop.targetSize || scallop.size;
                    scallop.currentSize = startSize + ((targetSize - startSize) * scallop.growthProgress);
                    
                    // Complete growth animation
                    if (scallop.growthProgress >= 1) {
                        scallop.isGrowing = false;
                        scallop.currentSize = scallop.targetSize;
                        scallop.size = scallop.targetSize;
                        delete scallop.previousSize;
                        delete scallop.growthStartTime;
                    }
                }
            }
            
            // Skip stage transition checks for special scallops
            if (scallop.isSpoiled || scallop.isKing || scallop.isKingCandidate) return;
            
            const age = now - scallop.birthTime;
              // Check for growth stage transitions
            if (scallop.growthStage === 'small' && age >= this.config.scallopGrowth.smallToMediumTime / growthSpeed) {
                // Check if scallop hasn't been checked for small->medium growth
                if (!scallop.smallToMediumChecked) {
                    scallop.smallToMediumChecked = true;
                    const growthChance = this.config.scallopGrowth.smallToMediumChance || 0.95;
                    
                    if (Math.random() < growthChance) {
                        this.growScallop(scallop, 'medium', 6, 10); // From size 6 to 10
                        // console.log(`🌱 Small scallop growing to medium (${Math.floor(growthChance * 100)}% chance)`);
                    } else {
                        // console.log(`🐚 Small scallop stayed small (no growth)`);
                    }
                }
            } else if (scallop.growthStage === 'medium') {
                const totalGrowthTime = this.config.scallopGrowth.smallToMediumTime + this.config.scallopGrowth.mediumToLargeTime;
                if (age >= totalGrowthTime / growthSpeed) {
                    // Check if scallop hasn't been checked for medium->large growth
                    if (!scallop.mediumToLargeChecked) {
                        scallop.mediumToLargeChecked = true;
                        const growthChance = this.config.scallopGrowth.mediumToLargeChance || 0.50;
                          if (Math.random() < growthChance) {
                            this.growScallop(scallop, 'large', 10, 15); // From size 10 to 15
                            // console.log(`🌱 Medium scallop growing to large (${Math.floor(growthChance * 100)}% chance)`);
                        } else {
                            // console.log(`🐚 Medium scallop stayed medium (no growth)`);
                        }
                    }
                }            }// Check if large scallop should become King candidate
            if (scallop.growthStage === 'large' && !scallop.isKingCandidate && this.config.scallopKing.enabled) {
                // Only check for King candidate eligibility if not already checked
                if (!scallop.kingEligibilityChecked) {
                    const largeAge = age - (this.config.scallopGrowth.smallToMediumTime + this.config.scallopGrowth.mediumToLargeTime) / growthSpeed;
                    const eligibleTime = this.config.scallopKing.largeToKingCandidateTime || 45000;
                    
                    if (largeAge >= eligibleTime / growthSpeed) {
                        scallop.kingEligibilityChecked = true;
                        
                        // Count existing Kings and King candidates
                        const currentKingCount = this.scallops.filter(s => s.isKing).length;
                        const currentKingCandidateCount = this.scallops.filter(s => s.isKingCandidate && !s.isKing).length;
                        const totalKingSlots = currentKingCount + currentKingCandidateCount;
                        const maxKings = this.config.scallopKing.maxKingScallops || 1;
                        
                        // Only allow new King candidates if under the limit
                        if (totalKingSlots < maxKings) {
                            // Random chance to become King candidate (default 15%)
                            const kingChance = this.config.scallopKing.kingCandidateChance || 0.15;
                            if (Math.random() < kingChance) {
                                scallop.isKingCandidate = true;
                                scallop.kingGrowthStartTime = now;
                                scallop.growthStartTime = now;
                                scallop.type = 'king-candidate';
                                scallop.previousSize = 15;
                                scallop.targetSize = 20;
                                scallop.isGrowing = true;
                                scallop.growthProgress = 0;
                                
                                console.log(`👑 Scallop became King candidate! (${Math.floor(kingChance * 100)}% chance) [${totalKingSlots + 1}/${maxKings}]`);
                            } else {
                                console.log(`🐚 Large scallop stayed large (no King promotion)`);
                            }
                        } else {
                            console.log(`👑 Max King limit reached (${maxKings}), large scallop stays large`);
                        }
                    }
                }
            }
        });
    }
      growScallop(scallop, newStage, fromSize, toSize) {
        const scallopTypes = {
            small: { size: 6, powerValue: 5 },
            medium: { size: 10, powerValue: 10 },
            large: { size: 15, powerValue: 20 }
        };
        
        const typeData = scallopTypes[newStage];
        const previousSize = scallop.currentSize || scallop.size;
        
        scallop.growthStage = newStage;
        scallop.type = newStage;
        scallop.size = typeData.size;
        scallop.targetSize = typeData.size;
        scallop.powerValue = typeData.powerValue;
        
        // Setup growth animation
        scallop.previousSize = fromSize || previousSize;
        scallop.growthStartTime = Date.now();
        scallop.isGrowing = true;        scallop.growthProgress = 0;
        scallop.currentSize = scallop.previousSize; // Start from old size
        
        // console.log(`🌱 Scallop growing from ${scallop.previousSize} to ${typeData.size} (${scallop.growthStage})`);
    }promoteToScallopKing(scallop, topSeagullPower) {
        scallop.isKing = true;
        scallop.isKingCandidate = false;
        scallop.size = 20; // King size
        scallop.currentSize = 20;
        scallop.targetSize = 20;
        scallop.powerValue = Math.max(
            this.config.scallopKing.minPowerValue,
            Math.floor(topSeagullPower * this.config.scallopKing.powerPercentOfTopSeagull)
        );
        scallop.type = 'king';
        scallop.color = '#FF0000'; // Bright red color for King
        scallop.innerColor = '#CC0000'; // Lighter red inner
        // NO growth animation for King scallops
        scallop.isGrowing = false;
        scallop.growthProgress = 0;
        console.log(`🔴 King Scallop promoted! Power: ${scallop.powerValue}`);
    }
    
    getTopSeagullPower() {
        let maxPower = 100; // Default minimum
        
        // Check all players
        for (const [playerId, player] of this.players) {
            if (player.power > maxPower) {
                maxPower = player.power;
            }
        }
        
        // Check AI seagulls
        for (const ai of this.aiSeagulls) {
            if (ai.power > maxPower) {
                maxPower = ai.power;
            }
        }
        
        return maxPower;
    }
}

module.exports = GameServer;
