// ==================== 绘制函数 ====================
const DrawingSystem = {
    canvas: null,
    ctx: null,
    gameWidth: 0,
    gameHeight: 0,
    
    // 初始化绘制系统
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },
    
    // 设置画布大小
    setSize(width, height) {
        this.gameWidth = width;
        this.gameHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;
    },
    
    // 绘制游戏帧
    drawFrame(mainPlayer, players, aiSeagulls, scallops, powerTransferEffects, zoomLevel) {
        // 清除画布
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // 绘制背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        if (mainPlayer && !mainPlayer.isDead) {
            this.ctx.save();
            this.ctx.translate(this.gameWidth / 2, this.gameHeight / 2);
            this.ctx.scale(zoomLevel, zoomLevel);
            
            // 添加相机偏移（跟随玩家）
            const cameraOffsetX = mainPlayer.velocityX * 10;
            const cameraOffsetY = mainPlayer.velocityY * 10;
            const maxOffset = 150;
            const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
            const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
            
            this.ctx.translate(-mainPlayer.x + actualOffsetX, -mainPlayer.y + actualOffsetY);
            
            // 绘制水背景
            this.drawWaterBackground();
            
            // 绘制扇贝
            scallops.forEach(scallop => {
                this.drawScallop(scallop.x, scallop.y, scallop.currentSize || scallop.size, scallop.color, scallop.innerColor, zoomLevel, scallop.isGrowing, scallop.growthProgress, scallop);
            });
            
            // 绘制AI海鸥
            aiSeagulls.forEach(seagull => {
                if (!seagull.isDead) {
                    this.drawSeagull(seagull, false, zoomLevel, mainPlayer);
                }
            });
            
            // 绘制玩家
            players.forEach(player => {
                if (!player.isDead) {
                    this.drawSeagull(player, player.isControllable, zoomLevel, mainPlayer);
                }
            });
            
            // 移除世界坐标系中的效果绘制，避免与屏幕坐标重复导致重影
            // this.drawPowerTransferEffectsWorld(powerTransferEffects, zoomLevel, mainPlayer);
            
            this.ctx.restore();
        }
        
        // 仅在屏幕空间绘制效果，避免重影
        this.drawPowerTransferEffectsScreen(powerTransferEffects, zoomLevel, mainPlayer);
    },
    
    // 绘制海鸥（修复文字重影）
    drawSeagull(entity, isControllable, zoomLevel, mainPlayer) {
        // 世界尺寸（不需要手动乘以 zoomLevel，因为 canvas 已经被 scale 了）
        const baseSize = entity.size * 10;            // 世界单位
        const size = baseSize;                         // 在世界坐标系中绘制，不需要额外缩放
        const x = entity.x;
        const y = entity.y;
        const wingFlapOffset = Math.sin(entity.wingFlapSpeed) * 5;
        
        // 绘制海鸥身体
        this.ctx.fillStyle = entity.color;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size, size * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制头部
        this.ctx.beginPath();
        this.ctx.ellipse(x + size * 0.8, y - size * 0.3, size * 0.5, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制眼睛
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x + size * 1.0, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制嘴巴
        this.ctx.fillStyle = '#FF9800';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 1.3, y - size * 0.3);
        this.ctx.lineTo(x + size * 1.6, y - size * 0.3);
        this.ctx.lineTo(x + size * 1.3, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 绘制翅膀
        this.ctx.fillStyle = entity.color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            x - size * 0.5, 
            y + size * 0.2 + wingFlapOffset, 
            size * 0.8, 
            size * 0.4, 
            Math.PI/4, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // 绘制光环效果（如果是可控玩家）
        if (isControllable) {
            const haloColor = entity.isBoosting ? 'rgba(255, 50, 50, 0.6)' : 'rgba(255, 215, 0, 0.5)';
            this.ctx.strokeStyle = haloColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            
            if (entity.isBoosting) {
                this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(x, y, size + 8, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        // 绘制能力值条（使用对数刻度，适应无限增长）
        // 使用对数来让高能力值也能有合理的显示
        const maxDisplayPower = 2000; // 显示参考值
        const powerPercent = Math.min(1, entity.power / maxDisplayPower);
        const barWidth = size * 1.5;
        const barHeight = 4;
        const barX = x - barWidth / 2;
        const barY = y + size + 5;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = powerPercent > 0.3 ? '#4CAF50' : powerPercent > 0.1 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);
        
        // 在屏幕空间绘制文字（避免重影）——使用 baseSize 结合 zoomLevel 计算偏移
        this.drawSeagullInfoScreen(entity, x, y, baseSize, isControllable, zoomLevel, mainPlayer);
    },
    
    // 在屏幕空间绘制海鸥信息（修复重影的关键）
    drawSeagullInfoScreen(entity, worldX, worldY, baseSize, isControllable, zoomLevel, mainPlayer) {
        this.ctx.save();
        
        // 重置变换到屏幕坐标系
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 与 drawFrame 保持一致的相机偏移计算
        const cameraOffsetX = mainPlayer.velocityX * 10;
        const cameraOffsetY = mainPlayer.velocityY * 10;
        const maxOffset = 150;
        const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
        const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
        
        // 视口左上角（世界坐标）
        const viewportOriginX = mainPlayer.x - actualOffsetX - this.gameWidth / (2 * zoomLevel);
        const viewportOriginY = mainPlayer.y - actualOffsetY - this.gameHeight / (2 * zoomLevel);
        
        // 世界->屏幕坐标转换
        const screenX = (worldX - viewportOriginX) * zoomLevel;
        const screenY = (worldY - viewportOriginY) * zoomLevel;
        
        // 确保海鸥在屏幕范围内
        if (screenX >= -50 && screenX <= this.gameWidth + 50 && 
            screenY >= -50 && screenY <= this.gameHeight + 50) {
            
            const powerText = `${entity.power}`;
            const nameText = entity.name;
            
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 文字相对海鸥的偏移：世界尺寸 * zoomLevel
            const powerTextY = screenY - (baseSize * zoomLevel) - 15;
            const nameTextY = powerTextY - 15;
            
            // 背景框
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const powerTextWidth = this.ctx.measureText(powerText).width;
            this.ctx.fillRect(
                screenX - powerTextWidth / 2 - 3,
                powerTextY - 6,
                powerTextWidth + 6,
                12
            );
            
            // 能力值
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(powerText, screenX, powerTextY);
            
            // 名字背景
            this.ctx.font = 'bold 10px Arial';
            const nameTextWidth = this.ctx.measureText(nameText).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(
                screenX - nameTextWidth / 2 - 3,
                nameTextY - 5,
                nameTextWidth + 6,
                10
            );
            
            // 名字
            this.ctx.fillStyle = isControllable ? '#FFD700' : '#FFF';
            this.ctx.fillText(nameText, screenX, nameTextY);
        }
        
        this.ctx.restore();
    },
    
    // 绘制扇贝
    drawScallop(x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress, scallop) {
        const drawSize = size;  // 在世界坐标系中，不需要额外缩放
        
        // 成长动画：脉动效果
        let animationScale = 1.0;
        if (isGrowing && growthProgress !== undefined) {
            // 使用正弦波创建脉动效果
            animationScale = 1.0 + Math.sin(growthProgress * Math.PI * 4) * 0.15;
        }
        
        const finalSize = drawSize * animationScale;
        
        // 扇贝王光环效果
        if (scallop && (scallop.isKing || scallop.isKingCandidate)) {
            this.ctx.save();
            const time = Date.now() / 1000;
            const glowSize = finalSize + 8 + Math.sin(time * 3) * 3;
            
            // 外层金色光环
            const gradient = this.ctx.createRadialGradient(x, y, finalSize, x, y, glowSize);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
            gradient.addColorStop(0.7, scallop.isKing ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 105, 180, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            
            // 扇贝王标记
            if (scallop.isKing) {
                this.ctx.save();
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.strokeText('👑', x, y - finalSize - 15);
                this.ctx.fillText('👑', x, y - finalSize - 15);
                this.ctx.restore();
            }
        }
        
        // 变质扇贝警告效果
        if (scallop && scallop.isSpoiled) {
            this.ctx.save();
            const time = Date.now() / 500;
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(time) * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(x, y, finalSize + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // 毒标记
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FF0000';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText('☠', x, y - finalSize - 12);
            this.ctx.fillText('☠', x, y - finalSize - 12);
            this.ctx.restore();
        }
        
        // 成长光环效果
        if (isGrowing && CONFIG.scallopGrowth.showGrowthEffect) {
            // ...existing code...
        }
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(76, 175, 80, ${0.8 * (1 - growthProgress)})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, finalSize + 5 + growthProgress * 10, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = `rgba(76, 175, 80, ${0.5 * (1 - growthProgress)})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, finalSize + 10 + growthProgress * 15, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, finalSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制扇贝纹理
        this.ctx.strokeStyle = '#DDD';
        this.ctx.lineWidth = 1;
        const lineCount = Math.floor(size / 1.5);  // 根据大小调整纹理线条数量
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + Math.cos(angle) * finalSize, y + Math.sin(angle) * finalSize);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = innerColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, finalSize * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加光泽效果（大扇贝更明显）
        if (size >= 12) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(x - finalSize * 0.3, y - finalSize * 0.3, finalSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },
    
    // 在世界坐标系中绘制能力值转移效果
    drawPowerTransferEffectsWorld(effects, zoomLevel, mainPlayer) {
        if (effects.length === 0) return;
        
        this.ctx.save();
        
        const viewportWidth = this.gameWidth / zoomLevel;
        const viewportHeight = this.gameHeight / zoomLevel;
        
        // 计算视口范围
        const viewportLeft = mainPlayer.x - viewportWidth / 2;
        const viewportRight = mainPlayer.x + viewportWidth / 2;
        const viewportTop = mainPlayer.y - viewportHeight / 2;
        const viewportBottom = mainPlayer.y + viewportHeight / 2;
        
        // 绘制每个效果
        effects.forEach(effect => {
            // 检查效果是否在视口内
            if (effect.x >= viewportLeft && effect.x <= viewportRight &&
                effect.y >= viewportTop && effect.y <= viewportBottom) {
                
                // 根据生命值设置透明度
                const alpha = effect.alpha || Math.min(1, effect.life * 2);
                
                // 绘制文字
                this.ctx.fillStyle = this.addAlphaToColor(effect.color, alpha);
                this.ctx.font = `${14 * effect.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(effect.text, effect.x, effect.y);
            }
        });
        
        this.ctx.restore();
    },
    
    // 在屏幕坐标系中绘制能力值转移效果（优化版本）
    drawPowerTransferEffectsScreen(effects, zoomLevel, mainPlayer) {
        if (effects.length === 0) return;
        
        this.ctx.save();
        
        // 切换到屏幕坐标系
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 使用与 drawFrame 一致的相机偏移
        const cameraOffsetX = mainPlayer.velocityX * 10;
        const cameraOffsetY = mainPlayer.velocityY * 10;
        const maxOffset = 150;
        const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
        const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
        
        // 视口左上角（世界坐标）
        const viewportOriginX = mainPlayer.x - actualOffsetX - this.gameWidth / (2 * zoomLevel);
        const viewportOriginY = mainPlayer.y - actualOffsetY - this.gameHeight / (2 * zoomLevel);
        
        // 屏幕范围
        const screenLeft = 0;
        const screenRight = this.gameWidth;
        const screenTop = 0;
        const screenBottom = this.gameHeight;
        
        // 绘制每个可见的效果
        effects.forEach(effect => {
            // 世界->屏幕坐标转换
            const screenX = (effect.x - viewportOriginX) * zoomLevel;
            const screenY = (effect.y - viewportOriginY) * zoomLevel;
            
            if (screenX >= screenLeft - 50 && screenX <= screenRight + 50 &&
                screenY >= screenTop - 50 && screenY <= screenBottom + 50) {
                
                // 使用 effect.alpha 而不是重新计算，确保与更新逻辑一致
                const alpha = effect.alpha;
                
                // 当透明度很低时，直接跳过绘制
                if (alpha < 0.05) return;
                
                this.ctx.font = `bold ${14 * effect.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const text = effect.text;
                const textWidth = this.ctx.measureText(text).width;
                const textHeight = 14 * effect.scale;
                
                this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
                this.ctx.fillRect(
                    screenX - textWidth / 2 - 4,
                    screenY - textHeight / 2 - 2,
                    textWidth + 8,
                    textHeight + 4
                );
                
                this.ctx.fillStyle = this.addAlphaToColor(effect.color, alpha);
                this.ctx.fillText(text, screenX, screenY);
                
                // 只在生命值很高时显示发光效果
                if (effect.life > 0.8) {
                    this.ctx.shadowColor = effect.color;
                    this.ctx.shadowBlur = 5 * effect.scale * alpha;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                    this.ctx.fillText(text, screenX, screenY);
                    this.ctx.shadowBlur = 0;
                }
            }
        });
        
        this.ctx.restore();
    },
    
    // 为颜色添加透明度
    addAlphaToColor(color, alpha) {
        // 如果颜色已经是rgba格式
        if (color.startsWith('rgba')) {
            return color.replace(/[\d\.]+\)$/g, alpha + ')');
        }
        // 如果颜色是rgb格式
        else if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        // 如果颜色是十六进制格式
        else if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // 默认返回原色
        return color;
    },
    
    // 绘制水背景
    drawWaterBackground() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        
        const time = Date.now() / 1000;
        const waveCount = 10;
        
        for (let i = 0; i < waveCount; i++) {
            const offset = i * 0.5;
            const radius = 200 + Math.sin(time + offset) * 30;
            const x = (CONFIG.worldWidth / waveCount) * i;
            const y = CONFIG.worldHeight / 2;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    },
    
    // 绘制游戏信息（屏幕空间）
    drawGameInfo(playerPower, playerSize, scallopsEaten, gameTime) {
        const mainPlayer = EntityManager.players[0];
        if (!mainPlayer || mainPlayer.isDead) return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 绘制信息面板背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 80);
        
        // 绘制信息文字
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillText(`能力值: ${playerPower}`, 20, 30);
        this.ctx.fillText(`大小: ${playerSize.toFixed(1)}`, 20, 50);
        this.ctx.fillText(`扇贝: ${scallopsEaten}`, 20, 70);
        this.ctx.fillText(`时间: ${Math.floor(gameTime)}s`, 20, 90);
        
        this.ctx.restore();
    }
};

// 导出绘制系统
window.DrawingSystem = DrawingSystem;