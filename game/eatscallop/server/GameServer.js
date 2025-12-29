// ==================== Game Server Logic ====================
const config = require('./config');

class GameServer {    constructor() {
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
      initializeWorld() {
        // Create initial scallops - keep them away from edges
        const edgeMargin = 80; // Keep scallops away from edges
        for (let i = 0; i < config.initialScallopCount; i++) {
            this.scallops.push(this.createScallop(
                edgeMargin + Math.random() * (config.worldWidth - edgeMargin * 2),
                edgeMargin + Math.random() * (config.worldHeight - edgeMargin * 2)
            ));
        }
        
        // Create AI seagulls
        for (let i = 0; i < config.aiSeagullCount; i++) {
            this.aiSeagulls.push(this.createAISeagull(
                Math.random() * config.worldWidth,
                Math.random() * config.worldHeight
            ));
        }
        
        console.log(`World initialized: ${this.scallops.length} scallops, ${this.aiSeagulls.length} AI seagulls`);
        if (this.scallops.length > 0) {
            console.log(`First scallop: ${JSON.stringify(this.scallops[0])}`);
        }
    }    createScallop(x, y) {
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
        
        return {
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
            isKingCandidate: false,
            isKing: false
        };
    }
    
    createAISeagull(x, y) {
        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
        const size = Math.random() * 0.8 + 0.5;
        const power = Math.floor(Math.random() * 30) + 30;
        
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
            baseSpeed: Math.random() * 2 + 2,
            aiState: 'wandering',
            aiTimer: Math.random() * 3
        };
    }
    
    addPlayer(playerId, name, color, ws) {
        if (this.players.size >= config.maxPlayers) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Server is full'
            }));
            return false;
        }
          // Spawn players near the center for easier multiplayer interaction
        const spawnRadius = 200; // Players spawn within 200 units of center
        const centerX = config.worldWidth / 2;
        const centerY = config.worldHeight / 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnRadius;
        
        const player = {
            id: playerId,
            name: name || `Player-${this.players.size + 1}`,
            color: color || this.getRandomColor(),
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            size: 1.0,
            power: config.initialPlayerPower,
            maxPower: 999999,
            velocityX: 0,
            velocityY: 0,
            directionX: 1,
            directionY: 0,
            accelDirectionX: 1,
            accelDirectionY: 0,
            speed: 0,
            baseSpeed: config.playerBaseSpeed,
            maxSpeed: config.playerMaxSpeed,
            acceleration: config.playerAcceleration,
            deceleration: config.playerDeceleration,
            isMoving: false,
            targetX: 0,
            targetY: 0,
            moveSpeed: 1.0,
            isAccelerating: false,
            scallopsEaten: 0,
            ws: ws
        };
        
        this.players.set(playerId, player);
        console.log(`Player joined: ${name} (${playerId})`);
        return true;
    }
    
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            console.log(`Player left: ${player.name} (${playerId})`);
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
                break;            case 'stop':
                player.isMoving = false;
                player.velocityX = 0;
                player.velocityY = 0;
                break;
                
            case 'quickStop':
                player.velocityX *= 0.3;
                player.velocityY *= 0.3;
                player.isMoving = false;
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
    
    getGameState() {        const players = Array.from(this.players.values()).map(p => ({
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
            scallopsEaten: p.scallopsEaten
        }));
        
        // Debug: Log player states periodically
        if (Math.random() < 0.005) {
            players.forEach(p => {
                const speed = Math.sqrt(p.velocityX ** 2 + p.velocityY ** 2);
                console.log(`SERVER: Player ${p.id.substring(0, 8)} - isMoving=${p.isMoving}, speed=${speed.toFixed(2)}, vel=(${p.velocityX.toFixed(2)},${p.velocityY.toFixed(2)}), pos=(${p.x.toFixed(1)},${p.y.toFixed(1)})`);
            });
        }        const state = {
            worldWidth: config.worldWidth,
            worldHeight: config.worldHeight,
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
            console.log(`Game state: ${this.scallops.length} scallops, ${this.aiSeagulls.length} AI seagulls, ${this.players.size} players`);
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
        
        // Boundary check
        player.x = Math.max(50, Math.min(config.worldWidth - 50, player.x));
        player.y = Math.max(50, Math.min(config.worldHeight - 50, player.y));
    }
    
    updateAISeagull(ai, deltaTime) {
        // Simple AI movement (wandering)
        ai.aiTimer -= deltaTime;
        
        if (ai.aiTimer <= 0) {
            ai.directionX = (Math.random() - 0.5) * 2;
            ai.directionY = (Math.random() - 0.5) * 2;
            
            const mag = Math.sqrt(ai.directionX ** 2 + ai.directionY ** 2);
            if (mag > 0) {
                ai.directionX /= mag;
                ai.directionY /= mag;
            }
            
            ai.aiTimer = Math.random() * 3 + 1;        }
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
        } else if (ai.x > config.worldWidth - margin) {
            ai.directionX = -Math.abs(ai.directionX);
            ai.x = config.worldWidth - margin;
            directionChanged = true;
        }
        
        if (ai.y < margin) {
            ai.directionY = Math.abs(ai.directionY);
            ai.y = margin;
            directionChanged = true;
        } else if (ai.y > config.worldHeight - margin) {
            ai.directionY = -Math.abs(ai.directionY);
            ai.y = config.worldHeight - margin;
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
                const dx = player.x - scallop.x;
                const dy = player.y - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Collision detection: seagull must get close to scallop to eat it
                // Seagull body radius = player.size * 10 (from drawing.js)
                // Use the visual size (currentSize) to match what player sees on screen
                const seagullRadius = player.size * 10;
                
                // Use currentSize if available (for growth animations), otherwise use size
                const visualSize = scallop.currentSize || scallop.size;
                
                // Collision happens when seagull center is within (radius + half scallop size)
                const collisionRadius = seagullRadius + (visualSize * 0.5);
                
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
                    
                    console.log(`🐚 Player ${player.name} ate scallop! Power: ${oldPower} → ${player.power} (+${scallop.powerValue}), Scallops: ${player.scallopsEaten}, Remaining: ${this.scallops.length - 1}`);
                    this.scallops.splice(i, 1);
                }
            }
        }
        
        // AI seagulls eating scallops
        for (const ai of this.aiSeagulls) {            for (let i = this.scallops.length - 1; i >= 0; i--) {
                const scallop = this.scallops[i];
                const dx = ai.x - scallop.x;
                const dy = ai.y - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Use same collision logic as player seagulls
                const seagullRadius = ai.size * 10;
                const visualSize = scallop.currentSize || scallop.size;
                const collisionRadius = seagullRadius + (visualSize * 0.5);
                  
                if (distance < collisionRadius) {
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
        const spawnCount = Math.max(0, config.minScallopCount - this.scallops.length);
        if (spawnCount > 0) {
            const edgeMargin = 80; // Keep scallops away from edges where players can't reach
            for (let i = 0; i < spawnCount; i++) {
                this.scallops.push(this.createScallop(
                    Math.random() * (config.worldWidth - 2 * edgeMargin) + edgeMargin,
                    Math.random() * (config.worldHeight - 2 * edgeMargin) + edgeMargin
                ));
            }
            console.log(`Spawned ${spawnCount} scallops, total: ${this.scallops.length}`);
        }
    }
    
    cleanupDeadEntities() {
        // Remove AI seagulls that are too weak (simplified for now)
        this.aiSeagulls = this.aiSeagulls.filter(ai => ai.power > 10);
    }
    
    getRandomColor() {
        const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF1493', '#00CED1'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    start(onUpdate) {
        const tickInterval = 1000 / config.tickRate;
        const stateInterval = 1000 / config.stateUpdateRate;
        
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
        
        console.log(`Game server started (tick rate: ${config.tickRate}Hz, state updates: ${config.stateUpdateRate}Hz)`);
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
        console.log('Game server stopped');
    }    updateScallopGrowth(deltaTime) {
        if (!config.scallopGrowth || !config.scallopGrowth.enabled) return;
        
        const now = Date.now();
        const growthSpeed = config.scallopGrowth.growthSpeed || 1.0;
        const growthAnimationDuration = 5000; // 5 seconds for visual growth animation (increased from 2s for better visibility)
        
        // Get top seagull power for King scallop calculation
        const topSeagullPower = this.getTopSeagullPower();
        
        this.scallops.forEach(scallop => {
            // Handle King candidate promotion
            if (scallop.isKingCandidate && !scallop.isKing) {
                const kingAge = now - scallop.kingGrowthStartTime;
                if (kingAge >= config.scallopKing.growthTime / growthSpeed) {
                    this.promoteToScallopKing(scallop, topSeagullPower);
                }
            }
            
            // Update growth animation for ALL growing scallops
            if (scallop.isGrowing && scallop.growthStartTime) {
                const growthAge = now - scallop.growthStartTime;
                
                if (scallop.isKingCandidate) {
                    // King candidate: grow from 15 to 20 over King growth time
                    const growthDuration = config.scallopKing.growthTime / growthSpeed;
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
            if (scallop.growthStage === 'small' && age >= config.scallopGrowth.smallToMediumTime / growthSpeed) {
                // Check if scallop hasn't been checked for small->medium growth
                if (!scallop.smallToMediumChecked) {
                    scallop.smallToMediumChecked = true;
                    const growthChance = config.scallopGrowth.smallToMediumChance || 0.95;
                    
                    if (Math.random() < growthChance) {
                        this.growScallop(scallop, 'medium', 6, 10); // From size 6 to 10
                        console.log(`🌱 Small scallop growing to medium (${Math.floor(growthChance * 100)}% chance)`);
                    } else {
                        console.log(`🐚 Small scallop stayed small (no growth)`);
                    }
                }
            } else if (scallop.growthStage === 'medium') {
                const totalGrowthTime = config.scallopGrowth.smallToMediumTime + config.scallopGrowth.mediumToLargeTime;
                if (age >= totalGrowthTime / growthSpeed) {
                    // Check if scallop hasn't been checked for medium->large growth
                    if (!scallop.mediumToLargeChecked) {
                        scallop.mediumToLargeChecked = true;
                        const growthChance = config.scallopGrowth.mediumToLargeChance || 0.50;
                          if (Math.random() < growthChance) {
                            this.growScallop(scallop, 'large', 10, 15); // From size 10 to 15
                            // console.log(`🌱 Medium scallop growing to large (${Math.floor(growthChance * 100)}% chance)`);
                        } else {
                            // console.log(`🐚 Medium scallop stayed medium (no growth)`);
                        }
                    }
                }            }// Check if large scallop should become King candidate
            if (scallop.growthStage === 'large' && !scallop.isKingCandidate && config.scallopKing.enabled) {
                // Only check for King candidate eligibility if not already checked
                if (!scallop.kingEligibilityChecked) {
                    const largeAge = age - (config.scallopGrowth.smallToMediumTime + config.scallopGrowth.mediumToLargeTime) / growthSpeed;
                    const eligibleTime = config.scallopKing.largeToKingCandidateTime || 45000;
                    
                    if (largeAge >= eligibleTime / growthSpeed) {
                        scallop.kingEligibilityChecked = true;
                        
                        // Count existing Kings and King candidates
                        const currentKingCount = this.scallops.filter(s => s.isKing).length;
                        const currentKingCandidateCount = this.scallops.filter(s => s.isKingCandidate && !s.isKing).length;
                        const totalKingSlots = currentKingCount + currentKingCandidateCount;
                        const maxKings = config.scallopKing.maxKingScallops || 1;
                        
                        // Only allow new King candidates if under the limit
                        if (totalKingSlots < maxKings) {
                            // Random chance to become King candidate (default 15%)
                            const kingChance = config.scallopKing.kingCandidateChance || 0.15;
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
            config.scallopKing.minPowerValue,
            Math.floor(topSeagullPower * config.scallopKing.powerPercentOfTopSeagull)
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
