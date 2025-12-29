// ==================== 碰撞检测系统 ====================
const CollisionSystem = {
    // 处理玩家与扇贝的碰撞
    handlePlayerScallopCollisions(players, scallops, onScallopEaten) {
        players.forEach(player => {
            if (player.isDead) return;
            
            for (let i = scallops.length - 1; i >= 0; i--) {
                const scallop = scallops[i];
                const dx = player.x - scallop.x;
                const dy = player.y - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 修复：使用正确的碰撞半径
                // player.size * 10 是玩家半径，scallop.currentSize 或 scallop.size 是扇贝半径
                const playerRadius = player.size * 10;
                const scallopRadius = scallop.currentSize || scallop.size || 5;
                const minDistance = playerRadius + scallopRadius;
                
                if (distance < minDistance) {
                    onScallopEaten(player, scallop, i);
                }
            }
        });
    },
    
    // 处理AI海鸥与扇贝的碰撞
    handleAISeagullScallopCollisions(aiSeagulls, scallops, onScallopEaten) {
        aiSeagulls.forEach(seagull => {
            if (seagull.isDead) return;
            
            for (let i = scallops.length - 1; i >= 0; i--) {
                const scallop = scallops[i];
                const dx = seagull.x - scallop.x;
                const dy = seagull.y - scallop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 修复：使用正确的碰撞半径
                const seagullRadius = seagull.size * 10;
                const scallopRadius = scallop.currentSize || scallop.size || 5;
                const minDistance = seagullRadius + scallopRadius;
                
                if (distance < minDistance) {
                    onScallopEaten(seagull, scallop, i);
                }
            }
        });
    },
    
    // 处理实体间的能力值转移
    handlePowerTransfers(entities1, entities2, config, onPowerTransfer) {
        for (let i = 0; i < entities1.length; i++) {
            if (entities1[i].isDead) continue;
            
            // 如果是同一个数组，从 i+1 开始避免重复检查和自我检查
            const startJ = (entities1 === entities2) ? i + 1 : 0;
            
            for (let j = startJ; j < entities2.length; j++) {
                if (entities2[j].isDead) continue;
                
                // 跳过同一实体
                if (entities1[i] === entities2[j]) continue;
                
                this.checkAndHandlePowerTransfer(entities1[i], entities2[j], config, onPowerTransfer);
            }
        }
    },
    
    // 检查并处理单个实体间的能力值转移
    checkAndHandlePowerTransfer(entity1, entity2, config, onPowerTransfer) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (entity1.size + entity2.size) * 10;
        
        if (distance < minDistance) {
            // 检查能力值差异是否足够大（至少20%差异才触发转移）
            const powerDiff = Math.abs(entity1.power - entity2.power);
            const minPowerDiff = Math.max(entity1.power, entity2.power) * 0.2;
            
            if (powerDiff < minPowerDiff) return;
            
            let stronger, weaker;
            if (entity1.power > entity2.power) {
                stronger = entity1;
                weaker = entity2;
            } else {
                stronger = entity2;
                weaker = entity1;
            }
            
            // 添加冷却时间检查（每个实体0.5秒只能转移一次）
            const now = Date.now();
            if (!stronger.lastPowerTransfer) stronger.lastPowerTransfer = 0;
            if (!weaker.lastPowerTransfer) weaker.lastPowerTransfer = 0;
            
            if (now - stronger.lastPowerTransfer < 500 || now - weaker.lastPowerTransfer < 500) {
                return;
            }
            
            stronger.lastPowerTransfer = now;
            weaker.lastPowerTransfer = now;
            
            onPowerTransfer(stronger, weaker, config);
        }
    },
    
    // 检查边界
    keepInBounds(entity, worldWidth, worldHeight) {
        const margin = entity.size * 10;
        entity.x = Math.max(margin, Math.min(entity.x, worldWidth - margin));
        entity.y = Math.max(margin, Math.min(entity.y, worldHeight - margin));
    },
    
    // 检查是否在视口内
    isInViewport(x, y, size, mainPlayer, viewportWidth, viewportHeight) {
        if (!mainPlayer || mainPlayer.isDead) return false;
        
        const viewportLeft = mainPlayer.x - viewportWidth / 2;
        const viewportRight = mainPlayer.x + viewportWidth / 2;
        const viewportTop = mainPlayer.y - viewportHeight / 2;
        const viewportBottom = mainPlayer.y + viewportHeight / 2;
        
        return (
            x >= viewportLeft - size &&
            x <= viewportRight + size &&
            y >= viewportTop - size &&
            y <= viewportBottom + size
        );
    }
};

// 导出碰撞系统
window.CollisionSystem = CollisionSystem;