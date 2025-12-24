// ==================== AI行为系统 ====================
class AIEnhancer {
    constructor(config) {
        this.config = config;
        this.aiMemory = new Map();
        this.threatMap = new Map();
        this.foodMap = new Map();
        this.updateInterval = 1000;
        this.lastUpdateTime = 0;
    }
    
    // 增强AI玩家行为
    enhanceAIPlayer(player, deltaTime, allPlayers, aiSeagulls, scallops) {
        if (player.isDead) return;
        
        const now = Date.now();
        
        if (now - this.lastUpdateTime > this.updateInterval / 2) {
            this.updateAIMemory(player, allPlayers, aiSeagulls, scallops);
            this.lastUpdateTime = now;
        }
        
        const action = this.getBestAction(player, allPlayers, aiSeagulls, scallops);
        this.executeAction(player, action, deltaTime);
        this.learnFromExperience(player);
    }
    
    // 更新AI记忆
    updateAIMemory(player, allPlayers, aiSeagulls, scallops) {
        const memoryKey = `player_${player.name}`;
        
        if (!this.aiMemory.has(memoryKey)) {
            this.aiMemory.set(memoryKey, {
                positions: [],
                threats: [],
                foodSources: [],
                successfulActions: [],
                lastUpdate: Date.now()
            });
        }
        
        const memory = this.aiMemory.get(memoryKey);
        
        memory.positions.push({ x: player.x, y: player.y, time: Date.now() });
        if (memory.positions.length > 10) {
            memory.positions.shift();
        }
        
        memory.threats = this.detectThreats(player, allPlayers, aiSeagulls);
        memory.foodSources = this.detectFoodSources(player, scallops, allPlayers);
        
        this.updateThreatMap(memory.threats);
        this.updateFoodMap(memory.foodSources);
    }
    
    // 检测威胁
    detectThreats(player, allPlayers, aiSeagulls) {
        const threats = [];
        const detectionRange = player.power > 100 ? 500 : 300;
        
        allPlayers.forEach(other => {
            if (other !== player && !other.isDead && other.power > player.power * 1.1) {
                const dx = other.x - player.x;
                const dy = other.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < detectionRange) {
                    const threatLevel = other.power / player.power;
                    threats.push({
                        type: 'player',
                        target: other,
                        distance: distance,
                        directionX: dx / distance,
                        directionY: dy / distance,
                        threatLevel: threatLevel,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        aiSeagulls.forEach(seagull => {
            if (!seagull.isDead && seagull.power > player.power * 1.2) {
                const dx = seagull.x - player.x;
                const dy = seagull.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < detectionRange * 0.8) {
                    threats.push({
                        type: 'seagull',
                        target: seagull,
                        distance: distance,
                        directionX: dx / distance,
                        directionY: dy / distance,
                        threatLevel: seagull.power / player.power,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        return threats;
    }
    
    // 检测食物源
    detectFoodSources(player, scallops, allPlayers) {
        const foodSources = [];
        const detectionRange = player.power > 80 ? 600 : 400;
        
        scallops.forEach(scallop => {
            const dx = scallop.x - player.x;
            const dy = scallop.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < detectionRange) {
                let competition = 0;
                allPlayers.forEach(other => {
                    if (other !== player && !other.isDead) {
                        const otherDx = scallop.x - other.x;
                        const otherDy = scallop.y - other.y;
                        const otherDistance = Math.sqrt(otherDx * otherDx + otherDy * otherDy);
                        if (otherDistance < distance) competition++;
                    }
                });
                
                const value = scallop.powerValue / (distance * (1 + competition * 0.5));
                foodSources.push({
                    type: 'scallop',
                    target: scallop,
                    distance: distance,
                    directionX: dx / distance,
                    directionY: dy / distance,
                    value: value,
                    timestamp: Date.now()
                });
            }
        });
        
        allPlayers.forEach(other => {
            if (other !== player && !other.isDead && other.power < player.power * 0.7) {
                const dx = other.x - player.x;
                const dy = other.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < detectionRange) {
                    const value = (player.power - other.power) / distance;
                    foodSources.push({
                        type: 'weak_player',
                        target: other,
                        distance: distance,
                        directionX: dx / distance,
                        directionY: dy / distance,
                        value: value,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        foodSources.sort((a, b) => b.value - a.value);
        return foodSources.slice(0, 5);
    }
    
    // 获取最佳行动
    getBestAction(player, allPlayers, aiSeagulls, scallops) {
        const memory = this.aiMemory.get(`player_${player.name}`);
        if (!memory) return { type: 'wander' };
        
        const currentState = this.evaluateState(player, memory);
        
        if (currentState.threatLevel > 0.7) {
            return this.getEscapeAction(player, memory.threats);
        } else if (currentState.hungerLevel > 0.6 && memory.foodSources.length > 0) {
            return this.getFoodSeekingAction(player, memory.foodSources);
        } else if (currentState.energyLevel < 0.4) {
            return { type: 'rest', duration: 2000 };
        } else {
            return this.getStrategicAction(player, currentState, allPlayers);
        }
    }
    
    // 评估当前状态
    evaluateState(player, memory) {
        // 使用动态参考值，适应能力值可以无限增长的情况
        const referencePower = 1000; // 参考值，用于计算比例
        const powerRatio = Math.min(1, player.power / referencePower);
        const timeSinceLastEat = Date.now() - (player.lastScallopEaten || 0);
        const hungerLevel = Math.min(1, timeSinceLastEat / 10000);
        const energyLevel = Math.max(0.1, 1 - (player.speed || 0) * 0.1);
        const threatLevel = memory.threats.length > 0 ? 
            Math.min(1, memory.threats[0].threatLevel / 3) : 0;
        
        return { powerRatio, hungerLevel, energyLevel, threatLevel };
    }
    
    // 获取逃跑行动
    getEscapeAction(player, threats) {
        if (threats.length === 0) return { type: 'wander' };
        
        let escapeX = 0, escapeY = 0;
        let totalWeight = 0;
        
        threats.forEach(threat => {
            const weight = threat.threatLevel / threat.distance;
            escapeX -= threat.directionX * weight;
            escapeY -= threat.directionY * weight;
            totalWeight += weight;
        });
        
        if (totalWeight > 0) {
            escapeX /= totalWeight;
            escapeY /= totalWeight;
            
            const length = Math.sqrt(escapeX * escapeX + escapeY * escapeY);
            if (length > 0) {
                escapeX /= length;
                escapeY /= length;
            }
        }
        
        return {
            type: 'escape',
            directionX: escapeX,
            directionY: escapeY,
            speedMultiplier: 1.5,
            duration: 3000
        };
    }
    
    // 获取觅食行动
    getFoodSeekingAction(player, foodSources) {
        if (foodSources.length === 0) return { type: 'wander' };
        
        const bestFood = foodSources[0];
        
        return {
            type: 'seek_food',
            target: bestFood.target,
            directionX: bestFood.directionX,
            directionY: bestFood.directionY,
            distance: bestFood.distance,
            speedMultiplier: 1.2
        };
    }
    
    // 获取战略行动
    getStrategicAction(player, state, allPlayers) {
        const strategies = ['patrol', 'ambush', 'explore'];
        let strategy;
        
        if (state.powerRatio > 0.8) {
            strategy = 'patrol';
        } else if (state.powerRatio > 0.5) {
            strategy = 'ambush';
        } else {
            strategy = 'explore';
        }
        
        switch(strategy) {
            case 'patrol':
                return {
                    type: 'patrol',
                    speedMultiplier: 0.8,
                    changeDirectionChance: 0.1
                };
            case 'ambush':
                const safeZone = this.findSafeZone(player, allPlayers);
                return {
                    type: 'ambush',
                    targetX: safeZone.x,
                    targetY: safeZone.y,
                    patience: 5000
                };
            case 'explore':
                return {
                    type: 'explore',
                    explorationRadius: 800,
                    speedMultiplier: 1.0
                };
            default:
                return { type: 'wander' };
        }
    }
    
    // 寻找安全区域
    findSafeZone(player, allPlayers) {
        let safeX = player.x, safeY = player.y;
        
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const testX = player.x + Math.cos(angle) * 300;
            const testY = player.y + Math.sin(angle) * 300;
            
            let isSafe = true;
            
            for (let other of allPlayers) {
                if (other !== player && !other.isDead && other.power > player.power) {
                    const dx = testX - other.x;
                    const dy = testY - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 400) {
                        isSafe = false;
                        break;
                    }
                }
            }
            
            if (isSafe) {
                safeX = testX;
                safeY = testY;
                break;
            }
        }
        
        safeX = Math.max(100, Math.min(CONFIG.worldWidth - 100, safeX));
        safeY = Math.max(100, Math.min(CONFIG.worldHeight - 100, safeY));
        
        return { x: safeX, y: safeY };
    }
    
    // 执行行动
    executeAction(player, action, deltaTime) {
        switch(action.type) {
            case 'escape':
                player.directionX = action.directionX;
                player.directionY = action.directionY;
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier;
                break;
                
            case 'seek_food':
                player.directionX = action.directionX;
                player.directionY = action.directionY;
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier;
                
                if (action.distance < 50) {
                    player.velocityX = player.directionX * player.speed;
                    player.velocityY = player.directionY * player.speed;
                }
                break;
                
            case 'ambush':
                const dx = action.targetX - player.x;
                const dy = action.targetY - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 20) {
                    player.directionX = dx / distance;
                    player.directionY = dy / distance;
                    player.speed = player.baseSpeed || 3;
                } else {
                    player.directionX = 0;
                    player.directionY = 0;
                    player.speed = 0;
                }
                break;
                
            case 'patrol':
                if (Math.random() < action.changeDirectionChance) {
                    const angle = Math.random() * Math.PI * 2;
                    player.directionX = Math.cos(angle);
                    player.directionY = Math.sin(angle);
                }
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier;
                break;
                
            case 'explore':
                if (Math.random() < 0.05) {
                    const angle = Math.random() * Math.PI * 2;
                    player.directionX = Math.cos(angle);
                    player.directionY = Math.sin(angle);
                }
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier;
                break;
                
            case 'rest':
                player.speed = 0;
                player.directionX = 0;
                player.directionY = 0;
                break;
                
            default:
                if (Math.random() < 0.02) {
                    const angle = Math.random() * Math.PI * 2;
                    player.directionX = Math.cos(angle);
                    player.directionY = Math.sin(angle);
                }
                player.speed = player.baseSpeed || 3;
                break;
        }
    }
    
    // 从经验中学习
    learnFromExperience(player) {
        const memoryKey = `player_${player.name}`;
        const memory = this.aiMemory.get(memoryKey);
        
        if (!memory || memory.successfulActions.length < 10) return;
        
        const patterns = this.analyzePatterns(memory.successfulActions);
        
        if (patterns.escapeSuccessRate > 0.8) {
            player.fearLevel = Math.min(1.5, (player.fearLevel || 0) + 0.1);
        }
        
        if (patterns.huntSuccessRate > 0.6) {
            player.aggressiveness = Math.min(1.0, (player.aggressiveness || 0) + 0.05);
        }
    }
    
    analyzePatterns(actions) {
        const patterns = {
            escapeSuccessRate: 0,
            huntSuccessRate: 0,
            foodCollectionRate: 0
        };
        
        const recentActions = actions.slice(-10);
        
        recentActions.forEach(action => {
            if (action.type === 'escape' && action.success) patterns.escapeSuccessRate++;
            if (action.type === 'seek_food' && action.success) patterns.huntSuccessRate++;
            if (action.foodCollected) patterns.foodCollectionRate++;
        });
        
        patterns.escapeSuccessRate /= recentActions.length;
        patterns.huntSuccessRate /= recentActions.length;
        patterns.foodCollectionRate /= recentActions.length;
        
        return patterns;
    }
    
    updateThreatMap(threats) {
        threats.forEach(threat => {
            const key = `${Math.floor(threat.target.x/100)}_${Math.floor(threat.target.y/100)}`;
            this.threatMap.set(key, {
                x: threat.target.x,
                y: threat.target.y,
                power: threat.target.power,
                timestamp: Date.now()
            });
        });
        
        const now = Date.now();
        for (let [key, threat] of this.threatMap.entries()) {
            if (now - threat.timestamp > 10000) {
                this.threatMap.delete(key);
            }
        }
    }
    
    updateFoodMap(foodSources) {
        foodSources.forEach(food => {
            const key = `${Math.floor(food.target.x/100)}_${Math.floor(food.target.y/100)}`;
            this.foodMap.set(key, {
                x: food.target.x,
                y: food.target.y,
                value: food.value,
                type: food.type,
                timestamp: Date.now()
            });
        });
        
        const now = Date.now();
        for (let [key, food] of this.foodMap.entries()) {
            if (now - food.timestamp > 5000) {
                this.foodMap.delete(key);
            }
        }
    }
    
    // 为普通AI海鸥提供基础增强
    enhanceBasicAI(entity, deltaTime, allPlayers, scallops) {
        const threats = this.detectThreats(entity, allPlayers, []);
        const foodSources = this.detectFoodSources(entity, scallops, []);
        
        if (threats.length > 0) {
            const threat = threats[0];
            entity.directionX = -threat.directionX;
            entity.directionY = -threat.directionY;
            entity.speed = (entity.baseSpeed || 2) * 1.3;
        } else if (foodSources.length > 0) {
            const food = foodSources[0];
            entity.directionX = food.directionX;
            entity.directionY = food.directionY;
            entity.speed = entity.baseSpeed || 2;
        } else {
            if (Math.random() < 0.01) {
                const angle = Math.random() * Math.PI * 2;
                entity.directionX = Math.cos(angle);
                entity.directionY = Math.sin(angle);
            }
        }
    }
}

// 导出AI增强器类
window.AIEnhancer = AIEnhancer;