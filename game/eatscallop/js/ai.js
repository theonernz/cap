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
                    
                    // 检测是否正在被追击 - 通过速度方向判断
                    const isChasing = this.isBeingHunted(player, other);
                    const adjustedThreatLevel = isChasing ? threatLevel * 2.0 : threatLevel;
                    
                    threats.push({
                        type: 'player',
                        target: other,
                        distance: distance,
                        directionX: dx / distance,
                        directionY: dy / distance,
                        threatLevel: adjustedThreatLevel,
                        isChasing: isChasing,
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
                    const isChasing = this.isBeingHunted(player, seagull);
                    const threatLevel = seagull.power / player.power;
                    const adjustedThreatLevel = isChasing ? threatLevel * 2.0 : threatLevel;
                    
                    threats.push({
                        type: 'seagull',
                        target: seagull,
                        distance: distance,
                        directionX: dx / distance,
                        directionY: dy / distance,
                        threatLevel: adjustedThreatLevel,
                        isChasing: isChasing,
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        return threats;
    }
    
    // 检测是否正在被追击
    isBeingHunted(player, predator) {
        // 检测捕食者是否正在接近（速度朝向AI）
        const dx = player.x - predator.x;
        const dy = player.y - predator.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return false;
        
        // 计算捕食者到玩家的方向
        const dirToPrey = { x: dx / distance, y: dy / distance };
        
        // 计算捕食者的速度方向（如果有速度）
        if (predator.velocityX !== undefined && predator.velocityY !== undefined) {
            const speed = Math.sqrt(predator.velocityX * predator.velocityX + 
                                  predator.velocityY * predator.velocityY);
            
            if (speed > 0.5) {
                const predatorDir = { 
                    x: predator.velocityX / speed, 
                    y: predator.velocityY / speed 
                };
                
                // 计算方向的点积（越接近1表示越直接追击）
                const dotProduct = predatorDir.x * dirToPrey.x + predatorDir.y * dirToPrey.y;
                
                // 如果点积大于0.7（约45度以内）且距离在200以内，认为正在被追击
                return dotProduct > 0.7 && distance < 200;
            }
        }
        
        // 如果没有速度信息，只根据距离判断
        return distance < 100;
    }
    
    // 检测食物源（增强捕食意识版本）
    detectFoodSources(player, scallops, allPlayers) {
        const foodSources = [];
        const detectionRange = player.power > 80 ? 700 : 500; // 增加侦查范围
        
        // 扇贝作为基础食物
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
        
        // 增强对弱小玩家的捕食优先级
        allPlayers.forEach(other => {
            if (other !== player && !other.isDead) {
                const powerRatio = player.power / other.power;
                
                // 放宽捕食条件：只要比对方强1.3倍就考虑捕猎
                if (powerRatio > 1.3) {
                    const dx = other.x - player.x;
                    const dy = other.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < detectionRange * 1.2) { // 扩大捕猎范围
                        // 计算猎物价值（考虑能量差、距离、逃跑速度）
                        const powerDiff = other.power;
                        const preySpeed = Math.sqrt((other.velocityX || 0) ** 2 + (other.velocityY || 0) ** 2);
                        const isEscaping = this.isPreyEscaping(player, other);
                        
                        // 价值计算：能量越高、距离越近、越难逃跑价值越高
                        let value = (powerDiff * powerRatio) / (distance + 50);
                        
                        // 如果猎物正在逃跑，降低一点价值（但仍然追击）
                        if (isEscaping) {
                            value *= 0.8;
                        }
                        
                        // 如果猎物速度慢或静止，大幅提高价值
                        if (preySpeed < 2) {
                            value *= 1.5;
                        }
                        
                        // 根据能力优势调整价值
                        if (powerRatio > 2.0) {
                            value *= 1.8; // 碾压性优势，高度优先
                        } else if (powerRatio > 1.5) {
                            value *= 1.4; // 明显优势，优先
                        }
                        
                        foodSources.push({
                            type: 'weak_player',
                            target: other,
                            distance: distance,
                            directionX: dx / distance,
                            directionY: dy / distance,
                            value: value,
                            powerRatio: powerRatio,
                            isEscaping: isEscaping,
                            preySpeed: preySpeed,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        });
        
        // 按价值排序，优先追击高价值目标
        foodSources.sort((a, b) => b.value - a.value);
        return foodSources.slice(0, 8); // 增加考虑的目标数量
    }
    
    // 检测猎物是否正在逃跑
    isPreyEscaping(predator, prey) {
        const dx = predator.x - prey.x;
        const dy = predator.y - prey.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return false;
        
        // 计算从捕食者到猎物的方向
        const dirToPredator = { x: -dx / distance, y: -dy / distance };
        
        // 检查猎物的移动方向
        if (prey.velocityX !== undefined && prey.velocityY !== undefined) {
            const speed = Math.sqrt(prey.velocityX ** 2 + prey.velocityY ** 2);
            
            if (speed > 1) {
                const preyDir = { 
                    x: prey.velocityX / speed, 
                    y: prey.velocityY / speed 
                };
                
                // 计算点积（猎物移动方向与远离捕食者方向的相似度）
                const dotProduct = preyDir.x * dirToPredator.x + preyDir.y * dirToPredator.y;
                
                // 如果点积大于0.6（约53度以内），认为正在逃跑
                return dotProduct > 0.6;
            }
        }
        
        return false;
    }
    
    // 获取最佳行动（增强捕食版本）
    getBestAction(player, allPlayers, aiSeagulls, scallops) {
        const memory = this.aiMemory.get(`player_${player.name}`);
        if (!memory) return { type: 'wander' };
        
        const currentState = this.evaluateState(player, memory);
        const intelligence = this.calculateIntelligence(player);
        
        // 优先级1: 极度危险时优先逃跑或反击
        if (currentState.threatLevel > 0.7) {
            const fartAttack = this.tryFartAttack(player, memory.threats);
            if (fartAttack) return fartAttack;
            return this.getEscapeAction(player, memory.threats);
        }
        
        // 优先级2: 积极捕猎模式（增强版）
        // 条件：有足够能力优势 && 发现弱小目标 && 不太饿
        const hasHuntingAdvantage = player.power > 120; // 有一定实力
        const hasPreyInSight = memory.foodSources.some(f => f.type === 'weak_player');
        const notStarving = currentState.hungerLevel < 0.8;
        
        if (hasHuntingAdvantage && hasPreyInSight && notStarving) {
            const preyTargets = memory.foodSources.filter(f => f.type === 'weak_player');
            
            if (preyTargets.length > 0) {
                const bestPrey = preyTargets[0]; // 已经按价值排序
                
                // 智能追击策略
                return this.getHuntingAction(player, bestPrey, intelligence);
            }
        }
        
        // 优先级3: 饥饿时寻找食物
        if (currentState.hungerLevel > 0.6 && memory.foodSources.length > 0) {
            return this.getFoodSeekingAction(player, memory.foodSources, intelligence);
        }
        
        // 优先级4: 能量不足时休息
        if (currentState.energyLevel < 0.3) {
            return { type: 'rest', duration: 2000 };
        }
        
        // 优先级5: 正常状态下的战略行动（包括主动寻找猎物）
        return this.getStrategicAction(player, currentState, allPlayers, memory);
    }
    
    // 新增：获取狩猎行动
    getHuntingAction(player, preyInfo, intelligence) {
        const prey = preyInfo.target;
        
        // 预测猎物位置（智能等级越高预测越准确）
        let targetX = prey.x;
        let targetY = prey.y;
        
        if (intelligence >= 3 && prey.velocityX !== undefined) {
            // 高智能AI可以预判猎物移动
            const predictionTime = preyInfo.distance / (player.baseSpeed * 1.5);
            targetX += prey.velocityX * predictionTime * 0.7;
            targetY += prey.velocityY * predictionTime * 0.7;
        }
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据距离和智能等级决定追击策略
        let speedMultiplier = 1.5; // 基础追击速度
        let aggression = 1.0;
        
        if (distance < 150) {
            speedMultiplier = 2.0; // 接近时全速追击
            aggression = 1.5;
        } else if (distance > 400) {
            speedMultiplier = 1.3; // 远距离时保存体力
            aggression = 0.8;
        }
        
        // 高智能AI追击更激进
        if (intelligence >= 4) {
            speedMultiplier *= 1.2;
            aggression *= 1.2;
        }
        
        return {
            type: 'hunt',
            target: prey,
            targetX: targetX,
            targetY: targetY,
            directionX: dx / distance,
            directionY: dy / distance,
            distance: distance,
            speedMultiplier: speedMultiplier,
            aggression: aggression,
            preyPower: prey.power,
            powerRatio: preyInfo.powerRatio,
            isPreyEscaping: preyInfo.isEscaping
        };
    }
    
    // 增强版：获取觅食行动
    getFoodSeekingAction(player, foodSources, intelligence) {
        if (foodSources.length === 0) return { type: 'wander' };
        
        // 智能选择食物目标
        let bestFood = foodSources[0];
        
        // 高智能AI会权衡收益和风险
        if (intelligence >= 3 && foodSources.length > 1) {
            // 寻找性价比最高的目标（不一定是价值最高的）
            for (let i = 0; i < Math.min(3, foodSources.length); i++) {
                const food = foodSources[i];
                // 偏好近距离、高价值、不逃跑的目标
                if (food.distance < bestFood.distance * 0.7 && food.value > bestFood.value * 0.6) {
                    bestFood = food;
                    break;
                }
            }
        }
        
        // 如果目标是弱小玩家，使用狩猎模式
        if (bestFood.type === 'weak_player') {
            return this.getHuntingAction(player, bestFood, intelligence);
        }
        
        return {
            type: 'seek_food',
            target: bestFood.target,
            directionX: bestFood.directionX,
            directionY: bestFood.directionY,
            distance: bestFood.distance,
            speedMultiplier: 1.2
        };
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
    
    // 获取逃跑行动（增强版 - 优先处理正在追击的威胁）
    getEscapeAction(player, threats) {
        if (threats.length === 0) return { type: 'wander' };
        
        // 检测是否有正在追击的威胁
        const activeChasers = threats.filter(t => t.isChasing);
        const hasActiveThreat = activeChasers.length > 0;
        
        let escapeX = 0, escapeY = 0;
        let totalWeight = 0;
        
        // 如果有追击者，优先逃离他们
        const priorityThreats = hasActiveThreat ? activeChasers : threats;
        
        priorityThreats.forEach(threat => {
            // 追击者给予更高权重
            const chasingBonus = threat.isChasing ? 3.0 : 1.0;
            const weight = (threat.threatLevel / threat.distance) * chasingBonus;
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
        
        // 添加随机性以避免可预测的逃跑路线
        if (hasActiveThreat) {
            const randomAngle = (Math.random() - 0.5) * Math.PI * 0.3; // ±27度随机偏移
            const cos = Math.cos(randomAngle);
            const sin = Math.sin(randomAngle);
            const newX = escapeX * cos - escapeY * sin;
            const newY = escapeX * sin + escapeY * cos;
            escapeX = newX;
            escapeY = newY;
        }
        
        return {
            type: 'escape',
            directionX: escapeX,
            directionY: escapeY,
            speedMultiplier: hasActiveThreat ? 2.0 : 1.5,  // 被追击时更快
            duration: hasActiveThreat ? 4000 : 3000,  // 被追击时持续更久
            isUrgent: hasActiveThreat
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
    
    // 获取战略行动（增强版 - 包含主动寻猎）
    getStrategicAction(player, state, allPlayers, memory) {
        const intelligence = this.calculateIntelligence(player);
        const strategies = ['patrol', 'hunt_patrol', 'ambush', 'explore'];
        let strategy;
        
        // 根据能力值和智能等级选择策略
        if (state.powerRatio > 0.8 && intelligence >= 3) {
            // 强大且聪明：主动巡逻寻找猎物
            strategy = 'hunt_patrol';
        } else if (state.powerRatio > 0.6) {
            strategy = Math.random() > 0.5 ? 'patrol' : 'ambush';
        } else {
            strategy = Math.random() > 0.5 ? 'explore' : 'ambush';
        }
        
        switch(strategy) {
            case 'hunt_patrol':
                // 主动寻猎模式：向玩家密集区域移动
                const huntingZone = this.findHuntingZone(player, allPlayers);
                const dx = huntingZone.x - player.x;
                const dy = huntingZone.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                return {
                    type: 'hunt_patrol',
                    targetX: huntingZone.x,
                    targetY: huntingZone.y,
                    directionX: distance > 0 ? dx / distance : 0,
                    directionY: distance > 0 ? dy / distance : 0,
                    speedMultiplier: 1.1,
                    changeDirectionChance: 0.05
                };
                
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
    
    // 新增：寻找狩猎区域（弱小玩家聚集的地方）
    findHuntingZone(player, allPlayers) {
        let targetX = player.x;
        let targetY = player.y;
        let maxPreyDensity = 0;
        
        // 在多个方向上搜索猎物密集区域
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
            const searchX = player.x + Math.cos(angle) * 400;
            const searchY = player.y + Math.sin(angle) * 400;
            
            // 确保在世界范围内
            const boundedX = Math.max(100, Math.min(CONFIG.worldWidth - 100, searchX));
            const boundedY = Math.max(100, Math.min(CONFIG.worldHeight - 100, searchY));
            
            // 计算该区域的猎物密度
            let preyDensity = 0;
            let totalPreyPower = 0;
            
            allPlayers.forEach(other => {
                if (other !== player && !other.isDead) {
                    const dx = boundedX - other.x;
                    const dy = boundedY - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 如果对方比自己弱，计入猎物密度
                    if (other.power < player.power * 0.8 && distance < 300) {
                        const weight = (player.power / other.power) / (distance + 1);
                        preyDensity += weight;
                        totalPreyPower += other.power;
                    }
                }
            });
            
            // 选择猎物最多且总能量最高的区域
            const zoneValue = preyDensity * (1 + totalPreyPower / 100);
            
            if (zoneValue > maxPreyDensity) {
                maxPreyDensity = zoneValue;
                targetX = boundedX;
                targetY = boundedY;
            }
        }
        
        // 如果没找到理想区域，随机探索
        if (maxPreyDensity === 0) {
            targetX = player.x + (Math.random() - 0.5) * 600;
            targetY = player.y + (Math.random() - 0.5) * 600;
            targetX = Math.max(100, Math.min(CONFIG.worldWidth - 100, targetX));
            targetY = Math.max(100, Math.min(CONFIG.worldHeight - 100, targetY));
        }
        
        return { x: targetX, y: targetY };
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
    
    // 执行行动（增强狩猎版本）
    executeAction(player, action, deltaTime) {
        // 计算是否可以加速（基于智能等级和行动类型）
        const intelligence = this.calculateIntelligence(player);
        const canAccelerate = intelligence >= 2; // 智能等级2+可以加速
        const shouldAccelerate = action.isUrgent || action.type === 'seek_food' || action.type === 'hunt';
        const accelerationMultiplier = (canAccelerate && shouldAccelerate) ? 1.5 : 1.0;
        
        switch(action.type) {
            case 'hunt':
                // 狩猎模式：积极追击弱小目标
                player.directionX = action.directionX;
                player.directionY = action.directionY;
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier * accelerationMultiplier;
                
                // 高智能AI狩猎时更激进
                if (canAccelerate) {
                    const huntBoost = action.aggression * 1.8;
                    player.velocityX += player.directionX * huntBoost;
                    player.velocityY += player.directionY * huntBoost;
                    
                    // 近距离时爆发加速
                    if (action.distance < 120) {
                        player.velocityX += player.directionX * 2.5;
                        player.velocityY += player.directionY * 2.5;
                    }
                }
                
                // 维持追击方向
                player.velocityX = player.directionX * player.speed * 0.7 + player.velocityX * 0.3;
                player.velocityY = player.directionY * player.speed * 0.7 + player.velocityY * 0.3;
                break;
                
            case 'hunt_patrol':
                // 寻猎巡逻：向猎物密集区移动
                if (action.directionX !== 0 || action.directionY !== 0) {
                    player.directionX = action.directionX;
                    player.directionY = action.directionY;
                    player.speed = (player.baseSpeed || 3) * action.speedMultiplier;
                    
                    // 平滑移动
                    player.velocityX = player.directionX * player.speed * 0.5 + player.velocityX * 0.5;
                    player.velocityY = player.directionY * player.speed * 0.5 + player.velocityY * 0.5;
                }
                
                // 小概率改变方向保持不可预测
                if (Math.random() < action.changeDirectionChance) {
                    const randomAngle = Math.random() * Math.PI * 2;
                    player.directionX = Math.cos(randomAngle);
                    player.directionY = Math.sin(randomAngle);
                }
                break;
            
            case 'escape':
                player.directionX = action.directionX;
                player.directionY = action.directionY;
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier * accelerationMultiplier;
                // 应用加速度
                if (canAccelerate && action.isUrgent) {
                    const boost = 2.0;
                    player.velocityX += player.directionX * boost;
                    player.velocityY += player.directionY * boost;
                }
                break;
                
            case 'seek_food':
                player.directionX = action.directionX;
                player.directionY = action.directionY;
                player.speed = (player.baseSpeed || 3) * action.speedMultiplier * accelerationMultiplier;
                
                // 高智能AI在追击时可以加速
                if (canAccelerate && action.distance < 200) {
                    const boost = 1.5;
                    player.velocityX += player.directionX * boost;
                    player.velocityY += player.directionY * boost;
                }
                
                if (action.distance < 50) {
                    player.velocityX = player.directionX * player.speed;
                    player.velocityY = player.directionY * player.speed;
                }
                break;
                
            case 'fart_attack':
                // 扣除能力值
                player.power -= action.cost;
                
                // 检查是否命中目标
                const dx = action.target.x - player.x;
                const dy = action.target.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= action.range) {
                    // 命中！造成2倍伤害
                    action.target.power -= action.damage;
                    
                    // 创建视觉效果（绿色气体）
                    if (window.game && window.game.createFartEffect) {
                        window.game.createFartEffect(player.x, player.y, action.directionX, action.directionY);
                    }
                    
                    // 反冲效果 - AI向前加速逃离
                    player.velocityX -= action.directionX * 3;
                    player.velocityY -= action.directionY * 3;
                }
                break;
                
            case 'ambush':
                const dxAmbush = action.targetX - player.x;
                const dyAmbush = action.targetY - player.y;
                const distanceAmbush = Math.sqrt(dxAmbush * dxAmbush + dyAmbush * dyAmbush);
                
                if (distanceAmbush > 20) {
                    player.directionX = dxAmbush / distanceAmbush;
                    player.directionY = dyAmbush / distanceAmbush;
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
                
            case 'fart_attack':
                player.power -= action.cost;
                action.target.power -= action.damage;
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
    
    // 计算AI智能等级 (基于能力值)
    calculateIntelligence(player) {
        // 智能等级随能力值增长：0-100 power = level 1, 100-300 = level 2, 300-600 = level 3, 600+ = level 4
        if (player.power < 100) return 1;
        if (player.power < 300) return 2;
        if (player.power < 600) return 3;
        return 4; // 最高智能等级
    }
    
    // 检查是否可以使用放屁攻击
    canUseFartAttack(player) {
        const intelligence = this.calculateIntelligence(player);
        return intelligence >= 3 && player.power > 100; // 需要智能等级3+且能力值>100
    }
    
    // 尝试使用放屁攻击
    tryFartAttack(player, threats) {
        if (!this.canUseFartAttack(player)) return null;
        if (!threats || threats.length === 0) return null;
        
        // 只在被追击且有紧急威胁时使用
        const activeChasers = threats.filter(t => t.isChasing && t.distance < 150);
        if (activeChasers.length === 0) return null;
        
        // 冷却时间检查 (5秒冷却)
        const now = Date.now();
        if (player.lastFartAttack && now - player.lastFartAttack < 5000) return null;
        
        // 选择最近的追击者
        const target = activeChasers.reduce((closest, threat) => 
            threat.distance < closest.distance ? threat : closest
        );
        
        player.lastFartAttack = now;
        
        return {
            type: 'fart_attack',
            target: target.target,
            cost: Math.floor(player.power * 0.01), // 消耗1%能力值
            damage: Math.floor(player.power * 0.02), // 造成2%能力值的伤害
            range: 100, // 攻击范围
            directionX: -target.directionX, // 朝后方释放
            directionY: -target.directionY
        };
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