// Game Enhancements - Scallop King, Spoiled Scallops, Leaderboard Badges
const originalDrawScallop = DrawingSystem.drawScallop;
DrawingSystem.drawScallop = function(x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress, scallop) {
    
    // If no scallop object or it's a King, handle specially
    if (scallop && scallop.isKing) {
        // Draw King scallop with multi-color shell pattern (NO growth animation)
        this.drawKingScallop(x, y, size, zoomLevel);
        return;
    }
    
    // Draw basic scallop for non-King scallops
    originalDrawScallop.call(this, x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress);
    
    // If no scallop object, return early
    if (!scallop) {
        return;
    }
    
    // Draw crown above King candidates (scallops growing to become Kings)
    if (scallop.isKingCandidate && !scallop.isKing) {
        this.ctx.save();
        
        // Pulsing effect for crown
        const time = Date.now() / 300;
        const pulse = 0.8 + Math.sin(time) * 0.2;
        
        // Crown emoji
        this.ctx.font = `bold ${Math.floor(16 * pulse)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Gold color with pulsing opacity
        this.ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + Math.sin(time) * 0.3})`;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        const crown = '👑';
        const yOffset = size + 15;
        this.ctx.strokeText(crown, x, y - yOffset);
        this.ctx.fillText(crown, x, y - yOffset);
        
        this.ctx.restore();
    }
    
    // Only draw effects for Spoiled scallops
    if (scallop.isSpoiled) {
        this.ctx.save();
        const time = Date.now() / 500;
        this.ctx.strokeStyle = 'rgba(255, 0, 0, ' + (0.5 + Math.sin(time) * 0.3) + ')';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        const finalSize = size;
        this.ctx.arc(x, y, finalSize + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Spoiled scallop skull
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FF0000';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        const skull = String.fromCharCode(0x2620);
        this.ctx.strokeText(skull, x, y - finalSize - 12);
        this.ctx.fillText(skull, x, y - finalSize - 12);
        this.ctx.restore();
    }
};

// Draw King Scallop with multi-color shell pattern
DrawingSystem.drawKingScallop = function(x, y, size, zoomLevel) {
    this.ctx.save();
    
    // Enable anti-aliasing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    
    // Draw outer circle (red base)
    this.ctx.fillStyle = '#FF0000'; // Bright red
    this.ctx.beginPath();
    this.ctx.arc(roundedX, roundedY, size, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw shell pattern - radial lines from center
    const shellLines = 12; // Number of radial lines
    this.ctx.strokeStyle = '#CC0000'; // Darker red for pattern
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < shellLines; i++) {
        const angle = (Math.PI * 2 / shellLines) * i;
        const startX = roundedX + Math.cos(angle) * (size * 0.3);
        const startY = roundedY + Math.sin(angle) * (size * 0.3);
        const endX = roundedX + Math.cos(angle) * size;
        const endY = roundedY + Math.sin(angle) * size;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    
    // Draw inner circle (lighter center)
    this.ctx.fillStyle = '#FF6666'; // Light red center
    this.ctx.beginPath();
    this.ctx.arc(roundedX, roundedY, size * 0.5, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw alternating colored segments for shell effect
    const segments = 12;
    for (let i = 0; i < segments; i++) {
        const angle1 = (Math.PI * 2 / segments) * i;
        const angle2 = (Math.PI * 2 / segments) * (i + 1);
        
        // Alternate between two red shades
        this.ctx.fillStyle = i % 2 === 0 ? '#FF3333' : '#FF0000';
        
        this.ctx.beginPath();
        this.ctx.moveTo(roundedX, roundedY);
        this.ctx.arc(roundedX, roundedY, size * 0.85, angle1, angle2);
        this.ctx.lineTo(roundedX, roundedY);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    // Draw white highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(roundedX - size * 0.3, roundedY - size * 0.3, size * 0.3, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw border
    this.ctx.strokeStyle = '#990000'; // Dark red border
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(roundedX, roundedY, size, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
};

const originalDrawSeagull = DrawingSystem.drawSeagull;
DrawingSystem.drawSeagull = function(entity, isControllable, zoomLevel, mainPlayer) {
    originalDrawSeagull.call(this, entity, isControllable, zoomLevel, mainPlayer);
    
    // 只显示在排行榜内的海鸥排名（不超过leaderboardSize）
    if (CONFIG.leaderboardBadges && CONFIG.leaderboardBadges.enabled && 
        entity.leaderboardRank && entity.leaderboardRank <= CONFIG.leaderboardSize) {
        
        const rank = entity.leaderboardRank;
        const size = entity.size * 10;
        this.ctx.save();
        
        // 排名显示在海鸥身体中心
        const badgeY = entity.y;
        const circleRadius = Math.max(12, size * 0.4);
        
        if (rank <= 3 && CONFIG.leaderboardBadges.showTrophies) {
            let trophyColor, trophy;
            if (rank === 1) {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.first;
                trophy = '🥇'; // 金牌
            } else if (rank === 2) {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.second;
                trophy = '🥈'; // 银牌
            } else {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.third;
                trophy = '🥉'; // 铜牌
            }
            
            // 绘制圆形背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(entity.x, badgeY, circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制奖杯emoji在圆圈内
            const trophySize = Math.max(18, circleRadius * 1.2);
            this.ctx.font = `bold ${trophySize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = trophyColor;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(trophy, entity.x, badgeY);
            this.ctx.fillText(trophy, entity.x, badgeY);
            
        } else if (CONFIG.leaderboardBadges.showRankNumber) {
            // 绘制圆形背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(entity.x, badgeY, circleRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制金色边框
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制排名数字在圆圈内
            const fontSize = Math.max(12, circleRadius * 1.2);
            this.ctx.font = `bold ${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(rank.toString(), entity.x, badgeY);
        }
        this.ctx.restore();
    }
};
const originalUpdateGame = Game.updateGame;
Game.updateGame = function(timestamp) {
    const result = originalUpdateGame.call(this, timestamp);
    if (CONFIG.leaderboardBadges && CONFIG.leaderboardBadges.enabled) {
        this.updateLeaderboardRanks();
    }
    return result;
};
Game.updateLeaderboardRanks = function() {
    const allEntities = [];
    EntityManager.players.forEach(player => {
        if (!player.isDead) {
            allEntities.push(player);
        }
    });
    EntityManager.aiSeagulls.forEach(seagull => {
        if (!seagull.isDead) {
            allEntities.push(seagull);
        }
    });
    allEntities.sort((a, b) => b.power - a.power);
    allEntities.forEach((entity, index) => {
        entity.leaderboardRank = index + 1;
    });
};

// ==================== 礼花效果系统 ====================
// 礼花粒子类
class Firework {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.color = color;
        
        // 创建礼花粒子
        const particleCount = 50;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const velocity = 3 + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                life: 1.0,
                size: 2 + Math.random() * 3,
                color: color
            });
        }
    }
    
    update(deltaTime) {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // 重力
            p.life -= deltaTime / 1000;
        });
        
        // 移除死亡粒子
        this.particles = this.particles.filter(p => p.life > 0);
    }
    
    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    isDead() {
        return this.particles.length === 0;
    }
}

// 礼花管理器
const FireworkManager = {
    fireworks: [],
    playerPreviousRank: null,
    
    addFirework(x, y, color) {
        this.fireworks.push(new Firework(x, y, color));
    },
    
    update(deltaTime) {
        this.fireworks.forEach(fw => fw.update(deltaTime));
        this.fireworks = this.fireworks.filter(fw => !fw.isDead());
    },
    
    draw(ctx) {
        this.fireworks.forEach(fw => fw.draw(ctx));
    },
    
    checkTopThreeEntry(player) {
        if (!player || player.isDead) return;
        
        const currentRank = player.leaderboardRank;
        
        // 检测前三名的任何排名提升
        if (currentRank && currentRank <= 3) {
            // 检测是否有排名提升：首次进入前三 或 排名上升
            const hasImproved = this.playerPreviousRank === null || 
                               this.playerPreviousRank > currentRank;
            
            if (hasImproved) {
                // 触发礼花效果
                const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32'];
                const canvas = document.getElementById('gameCanvas');
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                // 创建多个礼花
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const offsetX = (Math.random() - 0.5) * 200;
                        const offsetY = (Math.random() - 0.5) * 200;
                        const color = colors[Math.floor(Math.random() * colors.length)];
                        this.addFirework(centerX + offsetX, centerY + offsetY, color);
                    }, i * 200);
                }
                
                // 显示祝贺消息
                this.showCongratulationMessage(currentRank, this.playerPreviousRank);
            }
        }
        
        this.playerPreviousRank = currentRank;
    },
    
    showCongratulationMessage(rank, previousRank) {
        let message;
        
        // 如果是首次进入前三
        if (previousRank === null || previousRank > 3) {
            message = rank === 1 ? '🎉 恭喜！你是第一名！' : 
                     rank === 2 ? '🎊 太棒了！你是第二名！' : 
                     '🎈 厉害！你是第三名！';
        } else {
            // 排名提升
            if (rank === 1) {
                message = '👑 晋升第一！无人能敌！';
            } else if (rank === 2) {
                message = '⬆️ 晋升第二！继续努力！';
            }
        }
        
        // 创建临时消息元素
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #FFD700;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 3s ease-in-out;
            pointer-events: none;
        `;
        msgDiv.textContent = message;
        document.body.appendChild(msgDiv);
        
        // 3秒后移除
        setTimeout(() => {
            msgDiv.remove();
        }, 3000);
    }
};

// 添加CSS动画
const enhancementsStyle = document.createElement('style');
enhancementsStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(enhancementsStyle);

// 扩展游戏更新以包含礼花
const originalUpdateGameWithFireworks = Game.updateGame;
Game.updateGame = function(timestamp) {
    const result = originalUpdateGameWithFireworks.call(this, timestamp);
    
    // 更新礼花
    if (this.lastTime) {
        const deltaTime = timestamp - this.lastTime;
        FireworkManager.update(deltaTime);
        
        // 检查玩家是否进入前三
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (mainPlayer && !mainPlayer.isDead) {
            FireworkManager.checkTopThreeEntry(mainPlayer);
        }
    }
    
    return result;
};

// 扩展绘制系统以绘制礼花
const originalDrawFrame = DrawingSystem.drawFrame;
DrawingSystem.drawFrame = function(mainPlayer, players, aiSeagulls, scallops, powerTransferEffects, zoomLevel) {
    // 调用原始绘制
    originalDrawFrame.call(this, mainPlayer, players, aiSeagulls, scallops, powerTransferEffects, zoomLevel);
    
    // 在最上层绘制礼花（屏幕坐标）
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    FireworkManager.draw(this.ctx);
    this.ctx.restore();
};

console.log('Game enhancements loaded: Scallop King, Spoiled Scallops, Leaderboard Badges, Fireworks');
