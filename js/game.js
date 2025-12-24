// ==================== 游戏核心逻辑 ====================
const Game = {
    // 游戏状态
    running: false,
    paused: false,
    gameOver: false,
    animationId: null,
    
    // 游戏数据
    playerPower: CONFIG.initialPlayerPower,
    playerSize: 1.0,
    scallopsEaten: 0,
    gameTime: 0,
    lastTime: 0,
    leaderboardUpdateTimer: 0,
    zoomLevel: 1.0,
    
    // 拖拽控制
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragCurrentX: 0,
    dragCurrentY: 0,
    isRightMouseDown: false,
    dragVectorX: 0,
    dragVectorY: 0,
    dragForce: 0,
    
    // AI增强器
    aiEnhancer: null,
    
    // 初始化游戏
    init() {
        UISystem.updateConfigFromUI();
        EntityManager.resetAll();
        
        // 创建真实玩家
        const mainPlayer = EntityManager.createPlayer(
            CONFIG.worldWidth / 2, 
            CONFIG.worldHeight / 2, 
            this.playerSize, 
            CONFIG.initialPlayerPower, 
            document.getElementById('playerName').textContent, 
            '#FFD700', 
            true
        );
        EntityManager.players.push(mainPlayer);
        
        // 创建AI玩家
        for (let i = 0; i < CONFIG.aiPlayerCount; i++) {
            const size = Math.random() * 0.5 + 0.8;
            const power = Math.floor(Math.random() * 50) + 50;
            const name = CONFIG.language === 'zh' ? `AI玩家${i+1}` : `AIPlayer${i+1}`;
            const color = this.getRandomPlayerColor();
            
            const aiPlayer = EntityManager.createPlayer(
                Math.random() * CONFIG.worldWidth,
                Math.random() * CONFIG.worldHeight,
                size,
                power,
                name,
                color,
                false
            );
            
            EntityManager.players.push(aiPlayer);
        }
        
        // 初始化扇贝
        for (let i = 0; i < CONFIG.scallopCount; i++) {
            EntityManager.scallops.push(EntityManager.createScallop(
                Math.random() * (CONFIG.worldWidth - 30) + 15,
                Math.random() * (CONFIG.worldHeight - 30) + 15
            ));
        }
        
        // 初始化AI海鸥
        for (let i = 0; i < CONFIG.aiSeagullCount; i++) {
            const size = Math.random() * 0.8 + 0.5;
            const power = Math.floor(Math.random() * 30) + 30;
            
            EntityManager.aiSeagulls.push(EntityManager.createAISeagull(
                Math.random() * CONFIG.worldWidth,
                Math.random() * CONFIG.worldHeight,
                size,
                power
            ));
        }
        
        // 重置游戏状态
        this.playerPower = CONFIG.initialPlayerPower;
        this.playerSize = 1.0;
        this.scallopsEaten = 0;
        this.gameTime = 0;
        
        this.isDragging = false;
        this.dragForce = 0;
        this.zoomLevel = 1.0;
        
        // 初始化小地图
        if (CONFIG.enableMiniMap) {
            MiniMapSystem.init(CONFIG, EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops);
        }
        
        // 初始化AI增强器
        if (CONFIG.enableEnhancedAI) {
            this.aiEnhancer = new AIEnhancer(CONFIG);
        }
        
        UISystem.updateStats(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime, EntityManager.getPlayerCount());
        UISystem.updateLeaderboard();
        UISystem.updateCoordinates(EntityManager.players[0]);
        UISystem.updateSpeed(EntityManager.players[0]);
        UISystem.updateZoomValue(this.zoomLevel);
    },
    
    // 开始游戏
    startGame() {
        if (this.running) return;
        
        this.running = true;
        this.paused = false;
        this.gameOver = false;
        UISystem.hideGameOver();
        
        this.initGameSize();
        this.init();
        
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
        
        document.getElementById('startButton').disabled = true;
        UISystem.hideControlHint();
        
        UISystem.updateLeaderboard();
    },
    
    // 暂停/继续游戏
    pauseGame() {
        if (!this.running || this.gameOver) return;
        
        this.paused = !this.paused;
        
        if (!this.paused) {
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
        }
    },
    
    // 重新开始游戏
    restartGame() {
        this.running = false;
        this.paused = false;
        this.gameOver = false;
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        UISystem.hideGameOver();
        document.getElementById('startButton').disabled = false;
        
        this.startGame();
    },
    
    // 结束游戏
    endGame() {
        this.gameOver = true;
        this.running = false;
        
        UISystem.showGameOver(this.playerPower);
    },
    
    // 初始化游戏尺寸
    initGameSize() {
        const gameArea = document.querySelector('.game-area-container');
        const width = gameArea.clientWidth - 20;
        const height = gameArea.clientHeight - 20;
        DrawingSystem.setSize(width, height);
    },
    
    // 游戏主循环
    updateGame(timestamp) {
        if (!this.running || this.paused || this.gameOver) return;
        
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.gameTime += deltaTime / 1000;
        
        this.leaderboardUpdateTimer += deltaTime;
        if (this.leaderboardUpdateTimer > 1000) {
            UISystem.updateLeaderboard();
            this.leaderboardUpdateTimer = 0;
        }
        
        this.updatePowerTransferEffects(deltaTime);
        this.updatePlayers(deltaTime);
        this.updateAISeagulls(deltaTime);
        this.updateScallopGrowth(deltaTime);
        this.handleCollisions();
        this.removeDeadEntities();
        UISystem.updateSpeed(EntityManager.players[0]);
        UISystem.updateCoordinates(EntityManager.players[0]);
        
        // 更新小地图
        if (CONFIG.enableMiniMap) {
            MiniMapSystem.update(EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops, EntityManager.players[0]);
        }
        
        this.drawGame();
        this.animationId = requestAnimationFrame((timestamp) => this.updateGame(timestamp));
    },
    
    // 更新玩家
    updatePlayers(deltaTime) {
        const mainPlayer = EntityManager.players[0];
        
        if (mainPlayer && mainPlayer.isControllable) {
            this.updateControllablePlayer(mainPlayer);
        }
        
        EntityManager.players.forEach(player => {
            if (!player.isControllable && !player.isDead) {
                if (this.aiEnhancer && CONFIG.enableEnhancedAI) {
                    this.aiEnhancer.enhanceAIPlayer(player, deltaTime, EntityManager.players, EntityManager.aiSeagulls, EntityManager.scallops);
                } else {
                    this.updateAIPlayer(player, deltaTime);
                }
            }
            
            if (!player.isDead) {
                CollisionSystem.keepInBounds(player, CONFIG.worldWidth, CONFIG.worldHeight);
                player.wingFlapSpeed += 0.1 * (Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY) + 1);
            }
        });
        
        if (mainPlayer && mainPlayer.isControllable) {
            this.playerPower = mainPlayer.power;
            this.playerSize = mainPlayer.size;
            UISystem.updateStats(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime, EntityManager.getPlayerCount());
        }
    },
    
    // 更新可控玩家
    updateControllablePlayer(player) {
        if (this.isDragging) {
            const dragLength = Math.sqrt(this.dragVectorX * this.dragVectorX + this.dragVectorY * this.dragVectorY);
            const dragAngle = Math.atan2(this.dragVectorY, this.dragVectorX);
            const maxDragLength = 150;
            this.dragForce = Math.min(1, dragLength / maxDragLength);
            
            // 计算目标速度
            let targetAcceleration = player.acceleration * this.dragForce;
            player.isBoosting = this.isRightMouseDown;
            if (this.isRightMouseDown) targetAcceleration *= player.boostMultiplier;
            
            if (dragLength > 10) {
                // 直接加速 - 更快速的响应
                player.velocityX += Math.cos(dragAngle) * targetAcceleration;
                player.velocityY += Math.sin(dragAngle) * targetAcceleration;
            }
        }
        
        const maxSpeed = player.isBoosting ? player.maxSpeed * player.boostMultiplier : player.maxSpeed;
        const currentSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
        
        if (currentSpeed > maxSpeed) {
            player.velocityX = (player.velocityX / currentSpeed) * maxSpeed;
            player.velocityY = (player.velocityY / currentSpeed) * maxSpeed;
        }
        
        player.x += player.velocityX;
        player.y += player.velocityY;
        
        if (!this.isDragging) {
            // 更平滑的减速
            const deceleration = 0.12; // 降低减速率，让移动更流畅
            player.velocityX *= (1 - deceleration);
            player.velocityY *= (1 - deceleration);
            
            if (Math.abs(player.velocityX) < 0.1) player.velocityX = 0;
            if (Math.abs(player.velocityY) < 0.1) player.velocityY = 0;
            player.isBoosting = false;
        }
        
        player.speed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
    },
    
    // 更新AI玩家
    updateAIPlayer(player, deltaTime) {
        this.updateAIBehavior(player, deltaTime, true);
        
        const speed = player.baseSpeed * (1 - player.size * 0.1);
        player.x += player.directionX * speed;
        player.y += player.directionY * speed;
    },
    
    // 更新AI海鸥
    updateAISeagulls(deltaTime) {
        EntityManager.aiSeagulls.forEach(seagull => {
            if (seagull.isDead) return;
            
            if (this.aiEnhancer && CONFIG.enableEnhancedAI) {
                this.aiEnhancer.enhanceBasicAI(seagull, deltaTime, EntityManager.players, EntityManager.scallops);
            } else {
                this.updateAIBehavior(seagull, deltaTime, false);
            }
            
            seagull.x += seagull.directionX * seagull.baseSpeed;
            seagull.y += seagull.directionY * seagull.baseSpeed;
            CollisionSystem.keepInBounds(seagull, CONFIG.worldWidth, CONFIG.worldHeight);
        });
    },
    
    // 更新AI行为
    updateAIBehavior(entity, deltaTime, isPlayer) {
        entity.aiTimer += deltaTime / 1000;
        
        if (entity.aiTimer > 2 + Math.random() * 3) {
            entity.aiTimer = 0;
            const rand = Math.random();
            if (rand < 0.4) entity.aiState = 'wandering';
            else if (rand < 0.7) entity.aiState = 'seekingFood';
            else entity.aiState = 'hunting';
        }
        
        entity.avoidanceVectorX = 0;
        entity.avoidanceVectorY = 0;
        entity.foodSeekingVectorX = 0;
        entity.foodSeekingVectorY = 0;
        entity.randomMovementVectorX = 0;
        entity.randomMovementVectorY = 0;
        
        // 避险检测
        let nearestDanger = null;
        let nearestDangerDistance = Infinity;
        let totalDangerX = 0, totalDangerY = 0;
        let dangerCount = 0;
        
        EntityManager.players.forEach(other => {
            if (other !== entity && !other.isDead && other.power > entity.power * 1.2) {
                const dx = other.x - entity.x;
                const dy = other.y - entity.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 400) {
                    if (distance < nearestDangerDistance) {
                        nearestDangerDistance = distance;
                        nearestDanger = other;
                    }
                    
                    totalDangerX += dx;
                    totalDangerY += dy;
                    dangerCount++;
                }
            }
        });
        
        if (!isPlayer) {
            EntityManager.aiSeagulls.forEach(other => {
                if (other !== entity && !other.isDead && other.power > entity.power * 1.2) {
                    const dx = other.x - entity.x;
                    const dy = other.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 300) {
                        if (distance < nearestDangerDistance) {
                            nearestDangerDistance = distance;
                            nearestDanger = other;
                        }
                        
                        totalDangerX += dx;
                        totalDangerY += dy;
                        dangerCount++;
                    }
                }
            });
        }
        
        if (dangerCount > 0 || nearestDanger) {
            entity.aiState = 'avoiding';
            entity.fearLevel = Math.min(1, 300 / (nearestDangerDistance || 300));
            
            if (totalDangerX !== 0 || totalDangerY !== 0) {
                entity.avoidanceVectorX = -totalDangerX / dangerCount;
                entity.avoidanceVectorY = -totalDangerY / dangerCount;
                
                const length = Math.sqrt(entity.avoidanceVectorX * entity.avoidanceVectorX + 
                                        entity.avoidanceVectorY * entity.avoidanceVectorY);
                if (length > 0) {
                    entity.avoidanceVectorX /= length;
                    entity.avoidanceVectorY /= length;
                }
            }
            
            if (nearestDangerDistance < 100) entity.fearLevel = 1.5;
        } else {
            entity.fearLevel = Math.max(0, entity.fearLevel - 0.01);
            
            if (entity.aiState === 'seekingFood') {
                let nearestFood = null;
                let nearestFoodDistance = Infinity;
                let totalFoodX = 0, totalFoodY = 0;
                let foodCount = 0;
                
                EntityManager.scallops.forEach(scallop => {
                    const dx = scallop.x - entity.x;
                    const dy = scallop.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 500) {
                        if (distance < nearestFoodDistance) {
                            nearestFoodDistance = distance;
                            nearestFood = scallop;
                        }
                        
                        totalFoodX += dx;
                        totalFoodY += dy;
                        foodCount++;
                    }
                });
                
                if (foodCount > 0) {
                    entity.foodSeekingVectorX = totalFoodX / foodCount;
                    entity.foodSeekingVectorY = totalFoodY / foodCount;
                    
                    const length = Math.sqrt(entity.foodSeekingVectorX * entity.foodSeekingVectorX + 
                                            entity.foodSeekingVectorY * entity.foodSeekingVectorY);
                    if (length > 0) {
                        entity.foodSeekingVectorX /= length;
                        entity.foodSeekingVectorY /= length;
                    }
                }
            } else if (entity.aiState === 'hunting') {
                let nearestWeakTarget = null;
                let nearestWeakDistance = Infinity;
                
                EntityManager.players.forEach(other => {
                    if (other !== entity && !other.isDead && other.power < entity.power * 0.8) {
                        const dx = other.x - entity.x;
                        const dy = other.y - entity.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 400 && distance < nearestWeakDistance) {
                            nearestWeakDistance = distance;
                            nearestWeakTarget = other;
                        }
                    }
                });
                
                if (!isPlayer) {
                    EntityManager.aiSeagulls.forEach(other => {
                        if (other !== entity && !other.isDead && other.power < entity.power * 0.8) {
                            const dx = other.x - entity.x;
                            const dy = other.y - entity.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < 400 && distance < nearestWeakDistance) {
                                nearestWeakDistance = distance;
                                nearestWeakTarget = other;
                            }
                        }
                    });
                }
                
                if (nearestWeakTarget) {
                    const dx = nearestWeakTarget.x - entity.x;
                    const dy = nearestWeakTarget.y - entity.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        entity.foodSeekingVectorX = dx / distance;
                        entity.foodSeekingVectorY = dy / distance;
                    }
                }
            }
            
            entity.randomMovementVectorX = (Math.random() - 0.5) * 2;
            entity.randomMovementVectorY = (Math.random() - 0.5) * 2;
        }
        
        const totalVectorX = 
            entity.avoidanceVectorX * (2.0 + entity.fearLevel) + 
            entity.foodSeekingVectorX * 1.5 + 
            entity.randomMovementVectorX * 0.5;
        
        const totalVectorY = 
            entity.avoidanceVectorY * (2.0 + entity.fearLevel) +
            entity.foodSeekingVectorY * 1.5 +
            entity.randomMovementVectorY * 0.5;
        
        const totalLength = Math.sqrt(totalVectorX * totalVectorX + totalVectorY * totalVectorY);
        
        if (totalLength > 0) {
            entity.directionX = totalVectorX / totalLength;
            entity.directionY = totalVectorY / totalLength;
        }
    },
    
    // 处理碰撞
    handleCollisions() {
        // 玩家与扇贝碰撞
        CollisionSystem.handlePlayerScallopCollisions(
            EntityManager.players,
            EntityManager.scallops,
            (player, scallop, index) => {
                this.onScallopEaten(player, scallop, index);
            }
        );
        
        // AI海鸥与扇贝碰撞
        CollisionSystem.handleAISeagullScallopCollisions(
            EntityManager.aiSeagulls,
            EntityManager.scallops,
            (seagull, scallop, index) => {
                this.onScallopEaten(seagull, scallop, index);
            }
        );
        
        // 玩家间能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.players,
            EntityManager.players,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
        
        // 玩家与AI海鸥能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.players,
            EntityManager.aiSeagulls,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
        
        // AI海鸥间能力值转移
        CollisionSystem.handlePowerTransfers(
            EntityManager.aiSeagulls,
            EntityManager.aiSeagulls,
            CONFIG,
            (stronger, weaker) => {
                this.onPowerTransfer(stronger, weaker);
            }
        );
    },
    
    // 扇贝被吃掉
    onScallopEaten(entity, scallop, index) {
        entity.power += scallop.powerValue;
        entity.size += CONFIG.scallopSizeIncrease * (entity.isPlayer ? 1 : 0.5);
        // 限制海鸥最大显示大小
        entity.size = Math.min(CONFIG.maxSeagullSize, entity.size);
        entity.lastScallopEaten = Date.now();
        
        if (entity.isControllable) this.scallopsEaten++;
        
        EntityManager.scallops.splice(index, 1);
        EntityManager.scallops.push(EntityManager.createScallop(
            Math.random() * (CONFIG.worldWidth - 30) + 15,
            Math.random() * (CONFIG.worldHeight - 30) + 15
        ));
        
        if (CONFIG.showPowerTransfers && entity.isControllable) {
            // 使用新的效果创建函数
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    scallop.x,
                    scallop.y,
                    `+${scallop.powerValue}`,
                    '#4CAF50'
                )
            );
        }
    },
    
    // 能力值转移
    onPowerTransfer(stronger, weaker) {
        // 计算转移量：
        // - 强者获得：弱者能力值的 strongTransferRate%
        // - 弱者损失：自己能力值的 weakTransferRate%
        const gainAmount = Math.floor(weaker.power * (CONFIG.strongTransferRate / 100));
        const lossAmount = Math.floor(weaker.power * (CONFIG.weakTransferRate / 100));
        
        // 确保损失量不超过弱者的实际能力值
        const actualLoss = Math.min(lossAmount, weaker.power);
        const actualGain = Math.min(gainAmount, weaker.power);

        // 应用转移（移除maxPower限制，允许无限成长）
        stronger.power = stronger.power + actualGain;
        weaker.power = Math.max(0, weaker.power - actualLoss);

        // 只在涉及可控玩家时显示效果，减少屏幕混乱
        if (CONFIG.showPowerTransfers && (stronger.isControllable || weaker.isControllable)) {
            const effectX = (stronger.x + weaker.x) / 2;
            const effectY = (stronger.y + weaker.y) / 2;

            // 显示正向增益
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    effectX,
                    effectY,
                    `+${actualGain}`,
                    '#4CAF50'
                )
            );

            // 显示弱者损失
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    effectX,
                    effectY + 15,
                    `-${actualLoss}`,
                    '#F44336'
                )
            );
        }

        // 根据能力值更新大小（限制最大值，防止海鸥占满屏幕）
        stronger.size = Math.min(CONFIG.maxSeagullSize, 0.5 + (stronger.power / 200));
        weaker.size = Math.min(CONFIG.maxSeagullSize, 0.5 + (weaker.power / 200));

        if (weaker.power <= 0) {
            weaker.isDead = true;
            if (weaker.isControllable) this.endGame();
        }
    },
    
    // 移除死亡实体
    removeDeadEntities() {
        // 移除死亡的AI玩家
        for (let i = EntityManager.players.length - 1; i >= 0; i--) {
            if (EntityManager.players[i].isDead && !EntityManager.players[i].isControllable) {
                EntityManager.players.splice(i, 1);
            }
        }
        
        // 移除死亡的AI海鸥并补充
        for (let i = EntityManager.aiSeagulls.length - 1; i >= 0; i--) {
            if (EntityManager.aiSeagulls[i].isDead) {
                EntityManager.aiSeagulls.splice(i, 1);
                
                if (EntityManager.aiSeagulls.length < CONFIG.aiSeagullCount) {
                    const size = Math.random() * 0.8 + 0.5;
                    const power = Math.floor(Math.random() * 30) + 30;
                    EntityManager.aiSeagulls.push(EntityManager.createAISeagull(
                        Math.random() * CONFIG.worldWidth,
                        Math.random() * CONFIG.worldHeight,
                        size,
                        power
                    ));
                }
            }
        }
    },
    
    // 更新能力值转移效果
    updatePowerTransferEffects(deltaTime) {
        const effects = EntityManager.powerTransferEffects;
        
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            
            // 更新生命值（加快消失速度）
            effect.life -= deltaTime / 1000;
            
            // 更快向上移动
            effect.y -= deltaTime / 20;  // 从 /30 改为 /20，移动更快
            
            // 更快缩小
            effect.scale = Math.max(0.3, effect.scale - deltaTime / 1000);  // 从 /2000 改为 /1000
            
            // 根据生命值调整透明度（更快淡出）
            effect.alpha = Math.min(1, effect.life * 1.5);  // 从 *2 改为 *1.5，更快淡出
        }
        
        // 清理过期效果
        EntityManager.cleanupEffects();
    },
    
    // 更新扇贝成长
    updateScallopGrowth(deltaTime) {
        if (!CONFIG.scallopGrowth.enabled) return;
        
        const now = Date.now();
        const growthSpeed = CONFIG.scallopGrowth.growthSpeed;
        
        // 获取当前最高海鸥能力值
        const topSeagullPower = this.getTopSeagullPower();
        
        EntityManager.scallops.forEach(scallop => {
            // 处理扇贝王候选的成长
            if (scallop.isKingCandidate && !scallop.isKing) {
                const kingAge = now - scallop.kingGrowthStartTime;
                if (kingAge >= CONFIG.scallopKing.growthTime / growthSpeed) {
                    EntityManager.promoteToScallopKing(scallop, topSeagullPower);
                    // 创建升级特效
                    if (CONFIG.scallopGrowth.showGrowthEffect) {
                        EntityManager.powerTransferEffects.push(
                            EntityManager.createPowerTransferEffect(
                                scallop.x,
                                scallop.y - 30,
                                '👑 KING!',
                                CONFIG.scallopKing.colors.glow
                            )
                        );
                    }
                }
            }
            
            // 跳过变质扇贝和扇贝王的普通成长
            if (scallop.isSpoiled || scallop.isKing || scallop.isKingCandidate) return;
            
            const age = now - scallop.birthTime;
            
            // 检查是否可以成长
            if (scallop.growthStage === 'small' && age >= CONFIG.scallopGrowth.smallToMediumTime / growthSpeed) {
                this.growScallop(scallop, 'medium');
            } else if (scallop.growthStage === 'medium' && age >= (CONFIG.scallopGrowth.smallToMediumTime + CONFIG.scallopGrowth.mediumToLargeTime) / growthSpeed) {
                this.growScallop(scallop, 'large');
            }
            
            // 更新成长动画
            if (scallop.isGrowing) {
                scallop.growthProgress += deltaTime / 1000;  // 1秒的成长动画
                
                if (scallop.growthProgress >= 1) {
                    scallop.isGrowing = false;
                    scallop.growthProgress = 0;
                    scallop.currentSize = scallop.targetSize;
                } else {
                    // 平滑过渡大小
                    const oldSize = CONFIG.scallopTypes[scallop.type === 'medium' ? 'small' : 'medium'].size;
                    scallop.currentSize = oldSize + (scallop.targetSize - oldSize) * scallop.growthProgress;
                }
            }
        });
    },
    
    // 获取最高海鸥能力值
    getTopSeagullPower() {
        let maxPower = 100;  // 默认最低值
        
        // 检查所有玩家
        EntityManager.players.forEach(player => {
            if (!player.isDead && player.power > maxPower) {
                maxPower = player.power;
            }
        });
        
        // 检查所有AI海鸥
        EntityManager.aiSeagulls.forEach(seagull => {
            if (!seagull.isDead && seagull.power > maxPower) {
                maxPower = seagull.power;
            }
        });
        
        return maxPower;
    },
    
    // 扇贝成长到下一阶段
    growScallop(scallop, newStage) {
        scallop.growthStage = newStage;
        scallop.type = newStage;
        
        const typeConfig = CONFIG.scallopTypes[newStage];
        scallop.targetSize = typeConfig.size;
        scallop.powerValue = typeConfig.powerValue;
        scallop.color = typeConfig.colors.outer;
        scallop.innerColor = typeConfig.colors.inner;
        
        // 启动成长动画
        scallop.isGrowing = true;
        scallop.growthProgress = 0;
        
        // 创建成长特效
        if (CONFIG.scallopGrowth.showGrowthEffect) {
            EntityManager.powerTransferEffects.push(
                EntityManager.createPowerTransferEffect(
                    scallop.x,
                    scallop.y - 20,
                    newStage === 'medium' ? '↑' : '↑↑',
                    '#4CAF50'
                )
            );
        }
    },
    
    // 绘制游戏
    drawGame() {
        const mainPlayer = EntityManager.players[0];
        DrawingSystem.drawFrame(
            mainPlayer,
            EntityManager.players,
            EntityManager.aiSeagulls,
            EntityManager.scallops,
            EntityManager.powerTransferEffects,
            this.zoomLevel
        );
        
        // 注释掉重复的游戏信息显示，因为左侧面板已经显示了这些信息
        // DrawingSystem.drawGameInfo(this.playerPower, this.playerSize, this.scallopsEaten, this.gameTime);
    },
    
    // 快速停止
    quickStop() {
        const mainPlayer = EntityManager.players[0];
        if (mainPlayer && mainPlayer.isControllable) {
            mainPlayer.velocityX = 0;
            mainPlayer.velocityY = 0;
            mainPlayer.speed = 0;
            UISystem.updateSpeed(mainPlayer);
        }
    },
    
    // 放大
    zoomIn() {
        if (this.zoomLevel < CONFIG.maxZoom) {
            this.zoomLevel = Math.min(CONFIG.maxZoom, this.zoomLevel + 0.2);
            UISystem.updateZoomValue(this.zoomLevel);
        }
    },
    
    // 缩小
    zoomOut() {
        if (this.zoomLevel > CONFIG.minZoom) {
            this.zoomLevel = Math.max(CONFIG.minZoom, this.zoomLevel - 0.2);
            UISystem.updateZoomValue(this.zoomLevel);
        }
    },
    
    // 获取随机玩家颜色
    getRandomPlayerColor() {
        const colors = ['#FF5252', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
};

// 导出游戏对象
window.game = Game;