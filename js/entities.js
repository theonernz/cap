// ==================== 实体创建和管理 ====================
const EntityManager = {
    // 实体数组
    players: [],
    scallops: [],
    aiSeagulls: [],
    powerTransferEffects: [],
    
    // 效果池（重用效果对象，避免频繁创建销毁）
    effectPool: [],
    effectPoolSize: 50,
    
    // 创建玩家
    createPlayer(x, y, size, power, name, color, isControllable) {
        const baseSpeed = 5;
        const maxSpeed = 8;
        
        return {
            x: x, y: y, size: size, power: power, maxPower: 999999, // 移除实际限制，设置为极高值
            name: name, color: color, isControllable: isControllable,
            isPlayer: isControllable, baseSpeed: baseSpeed, speed: 0,
            velocityX: 0, velocityY: 0, maxSpeed: maxSpeed,
            acceleration: 0.3, deceleration: 0.15, wingFlapSpeed: 0,
            isBoosting: false, boostMultiplier: 1.5,
            aiState: isControllable ? null : 'wandering',
            aiTimer: Math.random() * 3, avoidanceVectorX: 0, avoidanceVectorY: 0,
            foodSeekingVectorX: 0, foodSeekingVectorY: 0, randomMovementVectorX: 0,
            randomMovementVectorY: 0, fearLevel: 0, lastScallopEaten: 0,
            isDead: false, aggressiveness: 0.5
        };
    },
    
    // 创建AI海鸥
    createAISeagull(x, y, size, power) {
        const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
        return {
            x: x, y: y, size: size, power: power, maxPower: 999999, // 允许AI海鸥也能无限成长
            name: CONFIG.language === 'zh' ? `海鸥${Math.floor(Math.random() * 1000)}` : `Seagull${Math.floor(Math.random() * 1000)}`,
            color: colors[Math.floor(Math.random() * colors.length)],
            isPlayer: false, baseSpeed: Math.random() * 2 + 2,
            directionX: Math.random() > 0.5 ? 1 : -1,
            directionY: Math.random() > 0.5 ? 1 : -1,
            aiState: 'wandering', aiTimer: Math.random() * 3,
            avoidanceVectorX: 0, avoidanceVectorY: 0,
            foodSeekingVectorX: 0, foodSeekingVectorY: 0,
            randomMovementVectorX: 0, randomMovementVectorY: 0,
            fearLevel: 0, lastScallopEaten: 0, isDead: false
        };
    },
    
    // 创建扇贝
    createScallop(x, y) {
        // 首先检查是否生成变质扇贝
        if (CONFIG.spoiledScallop.enabled && Math.random() < CONFIG.spoiledScallop.probability) {
            return this.createSpoiledScallop(x, y);
        }
        
        // 检查是否生成扇贝王候选
        if (CONFIG.scallopKing.enabled && Math.random() < CONFIG.scallopKing.probability) {
            return this.createScallopKingCandidate(x, y);
        }
        
        // 根据概率选择扇贝类型
        const rand = Math.random();
        let scallopType;
        let cumulativeProbability = 0;
        
        for (const [type, config] of Object.entries(CONFIG.scallopTypes)) {
            cumulativeProbability += config.probability;
            if (rand < cumulativeProbability) {
                scallopType = type;
                break;
            }
        }
        
        // 如果没有选中（概率配置错误），默认中等
        if (!scallopType) scallopType = 'medium';
        
        const typeConfig = CONFIG.scallopTypes[scallopType];
        
        return {
            x: x,
            y: y,
            size: typeConfig.size,
            color: typeConfig.colors.outer,
            innerColor: typeConfig.colors.inner,
            powerValue: typeConfig.powerValue,
            type: scallopType,
            isSpoiled: false,
            isKingCandidate: false,
            isKing: false,
            // 成长系统属性
            birthTime: Date.now(),  // 出生时间
            growthStage: scallopType,  // 当前成长阶段
            isGrowing: false,  // 是否正在成长
            growthProgress: 0,  // 成长进度 0-1
            targetSize: typeConfig.size,  // 目标大小
            currentSize: typeConfig.size  // 当前实际大小
        };
    },
    
    // 创建变质扇贝
    createSpoiledScallop(x, y) {
        // 随机选择一个基础类型
        const baseTypes = ['small', 'medium', 'large'];
        const baseType = baseTypes[Math.floor(Math.random() * baseTypes.length)];
        const typeConfig = CONFIG.scallopTypes[baseType];
        
        return {
            x: x,
            y: y,
            size: typeConfig.size,
            color: CONFIG.spoiledScallop.colors.outer,
            innerColor: CONFIG.spoiledScallop.colors.inner,
            powerValue: typeConfig.powerValue * CONFIG.spoiledScallop.powerMultiplier,  // 负值
            type: baseType,
            isSpoiled: true,
            isKingCandidate: false,
            isKing: false,
            birthTime: Date.now(),
            growthStage: baseType,
            isGrowing: false,
            growthProgress: 0,
            targetSize: typeConfig.size,
            currentSize: typeConfig.size
        };
    },
    
    // 创建扇贝王候选
    createScallopKingCandidate(x, y) {
        return {
            x: x,
            y: y,
            size: CONFIG.scallopTypes.large.size,
            color: CONFIG.scallopKing.colors.outer,
            innerColor: CONFIG.scallopKing.colors.inner,
            powerValue: CONFIG.scallopKing.minPowerValue,
            type: 'king-candidate',
            isSpoiled: false,
            isKingCandidate: true,
            isKing: false,
            birthTime: Date.now(),
            growthStage: 'large',
            isGrowing: false,
            growthProgress: 0,
            targetSize: CONFIG.scallopKing.size,
            currentSize: CONFIG.scallopTypes.large.size,
            kingGrowthStartTime: Date.now()  // 开始成长为王的时间
        };
    },
    
    // 升级扇贝王候选为扇贝王
    promoteToScallopKing(scallop, topSeagullPower) {
        scallop.isKing = true;
        scallop.isKingCandidate = false;
        scallop.size = CONFIG.scallopKing.size;
        scallop.currentSize = CONFIG.scallopKing.size;
        scallop.powerValue = Math.max(
            CONFIG.scallopKing.minPowerValue,
            Math.floor(topSeagullPower * CONFIG.scallopKing.powerPercentOfTopSeagull)
        );
        scallop.type = 'king';
    },
    
    // 从池中获取效果对象
    getEffectFromPool() {
        if (this.effectPool.length > 0) {
            return this.effectPool.pop();
        }
        return null;
    },
    
    // 将效果对象返回到池中
    returnEffectToPool(effect) {
        if (this.effectPool.length < this.effectPoolSize) {
            // 重置效果属性
            effect.x = 0;
            effect.y = 0;
            effect.text = '';
            effect.color = '#FFFFFF';
            effect.life = 0;
            effect.scale = 1.0;
            effect.alpha = 1.0;
            this.effectPool.push(effect);
        }
    },
    
    // 创建能力值转移效果（使用对象池）
    createPowerTransferEffect(x, y, text, color) {
        let effect = this.getEffectFromPool();
        
        if (!effect) {
            effect = {
                x: 0,
                y: 0,
                text: '',
                color: '#FFFFFF',
                life: 0,
                scale: 1.0,
                alpha: 1.0
            };
        }
        
        effect.x = x;
        effect.y = y;
        effect.text = text;
        effect.color = color;
        effect.life = 1.0;  // 减少生命周期从 1.5 到 1.0 秒
        effect.scale = 1.0;
        effect.alpha = 1.0;
        
        return effect;
    },
    
    // 重置所有实体
    resetAll() {
        this.players = [];
        this.scallops = [];
        this.aiSeagulls = [];
        
        // 将所有效果返回到对象池
        this.powerTransferEffects.forEach(effect => {
            this.returnEffectToPool(effect);
        });
        this.powerTransferEffects = [];
    },
    
    // 清理过期效果（返回到对象池）
    cleanupEffects() {
        const effects = this.powerTransferEffects;
        
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            
            if (effect.life <= 0) {
                this.returnEffectToPool(effect);
                effects.splice(i, 1);
            }
        }
    },
    
    // 获取所有存活实体
    getAllAliveEntities() {
        return [
            ...this.players.filter(p => !p.isDead),
            ...this.aiSeagulls.filter(s => !s.isDead)
        ];
    },
    
    // 获取玩家数量
    getPlayerCount() {
        return this.players.filter(p => !p.isDead).length + 
               this.aiSeagulls.filter(s => !s.isDead).length;
    }
};

// 导出实体管理器
window.EntityManager = EntityManager;