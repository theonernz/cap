// ==================== Drawing System ====================
const DrawingSystem = {
    canvas: null,
    ctx: null,
    gameWidth: 0,
    gameHeight: 0,
    
    // Initialize drawing system
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    },
    
    // Set canvas size
    setSize(width, height) {
        this.gameWidth = width;
        this.gameHeight = height;
        this.canvas.width = width;
        this.canvas.height = height;    },
      // Draw main frame
    drawFrame(mainPlayer, players, aiSeagulls, scallops, powerTransferEffects, zoomLevel) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw sky background
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        if (!scallops || scallops.length === 0) {
            console.warn('No scallops to draw:', scallops);
        }
        
        // 调试：检查mainPlayer状态
        if (!mainPlayer) {
            console.error('❌ DrawFrame: mainPlayer is null!');
            return;
        }
        
        if (mainPlayer.isDead) {
            console.warn('⚠️ DrawFrame: mainPlayer is dead!');
        }
        
        if (mainPlayer && !mainPlayer.isDead) {
            this.ctx.save();
            this.ctx.translate(this.gameWidth / 2, this.gameHeight / 2);
            this.ctx.scale(zoomLevel, zoomLevel);
            
            // Calculate camera offset based on velocity for smooth following
            const cameraOffsetX = mainPlayer.velocityX * 10;
            const cameraOffsetY = mainPlayer.velocityY * 10;
            const maxOffset = 150;
            const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
            const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
            this.ctx.translate(-mainPlayer.x + actualOffsetX, -mainPlayer.y + actualOffsetY);
            
            // Draw world boundaries
            this.drawWorldBoundaries();
            
            // Draw water background
            this.drawWaterBackground();            // Draw scallops with default values for missing properties
            scallops.forEach(scallop => {
                const size = scallop.currentSize || scallop.size || 5;
                const color = scallop.color || '#87CEEB';
                const innerColor = scallop.innerColor || '#B0E0E6';
                const isGrowing = scallop.isGrowing || false;                const growthProgress = scallop.growthProgress || 0;
                
                // Pass the full scallop object for enhancement effects (King, Spoiled, etc.)
                this.drawScallop(scallop.x, scallop.y, size, color, innerColor, zoomLevel, isGrowing, growthProgress, scallop);
            });
            
            
            aiSeagulls.forEach(seagull => {
                if (!seagull.isDead) {
                    this.drawSeagull(seagull, false, zoomLevel, mainPlayer);
                }
            });
            
            
            players.forEach(player => {
                if (!player.isDead) {
                    this.drawSeagull(player, player.isControllable, zoomLevel, mainPlayer);
                }
            });
            
            
            // this.drawPowerTransferEffectsWorld(powerTransferEffects, zoomLevel, mainPlayer);
            
            this.ctx.restore();
        }        
        
        this.drawPowerTransferEffectsScreen(powerTransferEffects, zoomLevel, mainPlayer);
        
        // Draw paused indicator in multiplayer
        if (window.Game && window.Game.paused && window.MultiplayerGame && window.MultiplayerGame.enabled) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', this.gameWidth / 2, this.gameHeight / 2);
            
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText('Other players can still see your position', this.gameWidth / 2, this.gameHeight / 2 + 50);
            this.ctx.fillText('Press Pause/Resume to continue', this.gameWidth / 2, this.gameHeight / 2 + 80);
            this.ctx.restore();
        }
    },
    
      drawSeagull(entity, isControllable, zoomLevel, mainPlayer) {
        
        // 防止负数或过小的size导致Canvas错误
        const safeEntitySize = Math.max(0.1, entity.size || 1.0);
        const baseSize = safeEntitySize * 10;            
        const size = Math.max(1, baseSize); // 确保至少1像素
        const x = entity.x;
        const y = entity.y;        const wingFlapOffset = Math.sin(entity.wingFlapSpeed) * 5;
        
        // Calculate rotation angle from direction
        let angle = 0;
        let flipHorizontal = false;
        
        if (entity.directionX !== undefined && entity.directionY !== undefined) {
            const magnitude = Math.sqrt(entity.directionX * entity.directionX + entity.directionY * entity.directionY);
            if (magnitude > 0.01) {
                // Calculate angle in radians
                angle = Math.atan2(entity.directionY, entity.directionX);
                
                // Prevent seagull from flying upside down
                // If flying left (angle > 90° or < -90°), flip horizontally and adjust angle
                if (angle > Math.PI / 2) {
                    // Flying upper-left: flip and mirror angle
                    flipHorizontal = true;
                    angle = Math.PI - angle;
                } else if (angle < -Math.PI / 2) {
                    // Flying lower-left: flip and mirror angle
                    flipHorizontal = true;
                    angle = -Math.PI - angle;
                }
            }
        }
        
        // Save context and apply rotation
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Apply horizontal flip if flying backwards (to prevent upside down)
        if (flipHorizontal) {
            this.ctx.scale(-1, 1);  // Flip horizontally
        }
        
        this.ctx.rotate(angle);
        
        // Draw seagull body (centered at origin now)
        this.ctx.fillStyle = entity.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, size, size * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw head
        this.ctx.beginPath();
        this.ctx.ellipse(size * 0.8, -size * 0.3, size * 0.5, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(size * 1.0, -size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw beak
        this.ctx.fillStyle = '#FF9800';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 1.3, -size * 0.3);
        this.ctx.lineTo(size * 1.6, -size * 0.3);
        this.ctx.lineTo(size * 1.3, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw wing
        this.ctx.fillStyle = entity.color;
        this.ctx.beginPath();
        this.ctx.ellipse(
            -size * 0.5, 
            size * 0.2 + wingFlapOffset, 
            size * 0.8, 
            size * 0.4, 
            Math.PI/4, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw halo for controllable seagull
        if (isControllable) {
            const haloColor = entity.isBoosting ? 'rgba(255, 50, 50, 0.6)' : 'rgba(255, 215, 0, 0.5)';
            this.ctx.strokeStyle = haloColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            
            if (entity.isBoosting) {
                this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        // Restore context (before drawing power bar and info)
        this.ctx.restore();
        
        // Draw power bar (not rotated)
        const maxDisplayPower = 2000; 
        const powerPercent = Math.min(1, entity.power / maxDisplayPower);
        const barWidth = size * 1.5;
        const barHeight = 4;
        const barX = x - barWidth / 2;
        const barY = y + size + 5;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = powerPercent > 0.3 ? '#4CAF50' : powerPercent > 0.1 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);
        
        // Draw info screen
        this.drawSeagullInfoScreen(entity, x, y, baseSize, isControllable, zoomLevel, mainPlayer);
    },
    
    
    drawSeagullInfoScreen(entity, worldX, worldY, baseSize, isControllable, zoomLevel, mainPlayer) {
        this.ctx.save();
        
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        
        const cameraOffsetX = mainPlayer.velocityX * 10;
        const cameraOffsetY = mainPlayer.velocityY * 10;
        const maxOffset = 150;
        const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
        const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
        
        
        const viewportOriginX = mainPlayer.x - actualOffsetX - this.gameWidth / (2 * zoomLevel);
        const viewportOriginY = mainPlayer.y - actualOffsetY - this.gameHeight / (2 * zoomLevel);
        
        
        const screenX = (worldX - viewportOriginX) * zoomLevel;
        const screenY = (worldY - viewportOriginY) * zoomLevel;
        
        
        if (screenX >= -50 && screenX <= this.gameWidth + 50 && 
            screenY >= -50 && screenY <= this.gameHeight + 50) {
            
            const powerText = `${entity.power}`;
            const nameText = entity.name;
            
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            
            const powerTextY = screenY - (baseSize * zoomLevel) - 15;
            const nameTextY = powerTextY - 15;
            
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            const powerTextWidth = this.ctx.measureText(powerText).width;
            this.ctx.fillRect(
                screenX - powerTextWidth / 2 - 3,
                powerTextY - 6,
                powerTextWidth + 6,
                12
            );
            
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(powerText, screenX, powerTextY);
            
            
            this.ctx.font = 'bold 10px Arial';
            const nameTextWidth = this.ctx.measureText(nameText).width;
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(
                screenX - nameTextWidth / 2 - 3,
                nameTextY - 5,
                nameTextWidth + 6,
                10
            );
            
            
            this.ctx.fillStyle = isControllable ? '#FFD700' : '#FFF';
            this.ctx.fillText(nameText, screenX, nameTextY);
        }
        
        this.ctx.restore();    },    // Draw scallops
    drawScallop(x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress) {
        // Save canvas state before drawing
        this.ctx.save();
        
        // Enable anti-aliasing for smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        // Set line rendering properties to prevent artifacts
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
          // Round coordinates to prevent sub-pixel rendering issues
        const roundedX = Math.round(x);
        const roundedY = Math.round(y);
        
        // Calculate animated size if growing (smooth easing)
        let finalSize = size;
        if (isGrowing && growthProgress > 0 && growthProgress < 1) {
            // Smooth easing function for growth animation
            const easeProgress = 1 - Math.pow(1 - growthProgress, 3); // Ease-out cubic
            const startSize = size * 0.8; // Start from 80% of target size
            finalSize = startSize + (size - startSize) * easeProgress;
        }
        
        // Draw expanding circles effect for growing scallops
        if (isGrowing) {
            const time = Date.now() / 1000;
            const numCircles = 3;
            
            for (let i = 0; i < numCircles; i++) {
                // Stagger circles for wave effect
                const offset = i / numCircles;
                const circlePhase = (time * 0.5 + offset) % 1; // 0 to 1 over 2 seconds
                
                // Calculate expanding radius
                const minRadius = finalSize;
                const maxRadius = finalSize * 2.5;
                const radius = minRadius + (maxRadius - minRadius) * circlePhase;
                
                // Fade out as circle expands
                const alpha = (1 - circlePhase) * 0.4;
                
                // Draw expanding circle
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`; // Golden color
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(roundedX, roundedY, radius, 0, Math.PI * 2);
                this.ctx.closePath();
                this.ctx.stroke();
            }
            
            // Add inner pulsing glow
            const pulsePhase = (Math.sin(time * 3) + 1) / 2; // 0 to 1 sine wave
            const glowAlpha = 0.2 + pulsePhase * 0.3;
            this.ctx.fillStyle = `rgba(255, 255, 200, ${glowAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(roundedX, roundedY, finalSize * 1.1, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Draw main scallop body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(roundedX, roundedY, finalSize, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw border/outline instead of shell lines (shell lines create arrow artifacts)
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(roundedX, roundedY, finalSize, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Draw inner color
        this.ctx.fillStyle = innerColor;
        this.ctx.beginPath();
        this.ctx.arc(roundedX, roundedY, finalSize * 0.6, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw highlight for large scallops
        if (size >= 12) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(roundedX - finalSize * 0.3, roundedY - finalSize * 0.3, finalSize * 0.4, 0, Math.PI * 2);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Restore canvas state after drawing
        this.ctx.restore();
    },
    
    
    drawPowerTransferEffectsWorld(effects, zoomLevel, mainPlayer) {
        if (effects.length === 0) return;
        
        this.ctx.save();
        
        const viewportWidth = this.gameWidth / zoomLevel;
        const viewportHeight = this.gameHeight / zoomLevel;
        
        
        const viewportLeft = mainPlayer.x - viewportWidth / 2;
        const viewportRight = mainPlayer.x + viewportWidth / 2;
        const viewportTop = mainPlayer.y - viewportHeight / 2;
        const viewportBottom = mainPlayer.y + viewportHeight / 2;
        
        
        effects.forEach(effect => {
            
            if (effect.x >= viewportLeft && effect.x <= viewportRight &&
                effect.y >= viewportTop && effect.y <= viewportBottom) {
                
                
                const alpha = effect.alpha || Math.min(1, effect.life * 2);
                
                
                this.ctx.fillStyle = this.addAlphaToColor(effect.color, alpha);
                this.ctx.font = `${14 * effect.scale}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(effect.text, effect.x, effect.y);
            }
        });
        
        this.ctx.restore();
    },
    
    
    drawPowerTransferEffectsScreen(effects, zoomLevel, mainPlayer) {
        if (effects.length === 0) return;
        
        this.ctx.save();
        
        
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        
        const cameraOffsetX = mainPlayer.velocityX * 10;
        const cameraOffsetY = mainPlayer.velocityY * 10;
        const maxOffset = 150;
        const actualOffsetX = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetX));
        const actualOffsetY = Math.max(-maxOffset, Math.min(maxOffset, cameraOffsetY));
        
        
        const viewportOriginX = mainPlayer.x - actualOffsetX - this.gameWidth / (2 * zoomLevel);
        const viewportOriginY = mainPlayer.y - actualOffsetY - this.gameHeight / (2 * zoomLevel);
        
        
        const screenLeft = 0;
        const screenRight = this.gameWidth;
        const screenTop = 0;
        const screenBottom = this.gameHeight;
        
        
        effects.forEach(effect => {
            
            const screenX = (effect.x - viewportOriginX) * zoomLevel;
            const screenY = (effect.y - viewportOriginY) * zoomLevel;
            
            if (screenX >= screenLeft - 50 && screenX <= screenRight + 50 &&
                screenY >= screenTop - 50 && screenY <= screenBottom + 50) {
                
                
                const alpha = effect.alpha;
                
                
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
    
    
    addAlphaToColor(color, alpha) {
        
        if (color.startsWith('rgba')) {
            return color.replace(/[\d\.]+\)$/g, alpha + ')');
        }
        
        else if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        
        else if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        return color;
    },
    
    
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
    
    // Draw world boundaries
    drawWorldBoundaries() {
        this.ctx.save();
        
        // Draw boundary rectangle
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 8;
        this.ctx.setLineDash([20, 10]);
        this.ctx.strokeRect(0, 0, CONFIG.worldWidth, CONFIG.worldHeight);
        this.ctx.setLineDash([]);
        
        // Draw corner markers
        const markerSize = 50;
        const corners = [
            { x: 0, y: 0 },
            { x: CONFIG.worldWidth, y: 0 },
            { x: 0, y: CONFIG.worldHeight },
            { x: CONFIG.worldWidth, y: CONFIG.worldHeight }
        ];
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.lineWidth = 4;
        corners.forEach(corner => {
            // Draw L-shaped marker at each corner
            this.ctx.beginPath();
            if (corner.x === 0 && corner.y === 0) {
                // Top-left
                this.ctx.moveTo(0, markerSize);
                this.ctx.lineTo(0, 0);
                this.ctx.lineTo(markerSize, 0);
            } else if (corner.x === CONFIG.worldWidth && corner.y === 0) {
                // Top-right
                this.ctx.moveTo(CONFIG.worldWidth - markerSize, 0);
                this.ctx.lineTo(CONFIG.worldWidth, 0);
                this.ctx.lineTo(CONFIG.worldWidth, markerSize);
            } else if (corner.x === 0 && corner.y === CONFIG.worldHeight) {
                // Bottom-left
                this.ctx.moveTo(0, CONFIG.worldHeight - markerSize);
                this.ctx.lineTo(0, CONFIG.worldHeight);
                this.ctx.lineTo(markerSize, CONFIG.worldHeight);
            } else {
                // Bottom-right
                this.ctx.moveTo(CONFIG.worldWidth - markerSize, CONFIG.worldHeight);
                this.ctx.lineTo(CONFIG.worldWidth, CONFIG.worldHeight);
                this.ctx.lineTo(CONFIG.worldWidth, CONFIG.worldHeight - markerSize);
            }
            this.ctx.stroke();
        });
        
        // Draw coordinate labels at corners
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;
        
        const labels = [
            { text: '(0, 0)', x: 100, y: 50 },
            { text: `(${CONFIG.worldWidth}, 0)`, x: CONFIG.worldWidth - 100, y: 50 },
            { text: `(0, ${CONFIG.worldHeight})`, x: 100, y: CONFIG.worldHeight - 50 },
            { text: `(${CONFIG.worldWidth}, ${CONFIG.worldHeight})`, x: CONFIG.worldWidth - 100, y: CONFIG.worldHeight - 50 }
        ];
        
        labels.forEach(label => {
            this.ctx.strokeText(label.text, label.x, label.y);
            this.ctx.fillText(label.text, label.x, label.y);
        });
        
        this.ctx.restore();
    },    
    // Draw game info
    drawGameInfo(playerPower, playerSize, scallopsEaten, gameTime) {
        const mainPlayer = EntityManager.players.find(p => p.isControllable) || EntityManager.players[0];
        if (!mainPlayer || mainPlayer.isDead) return;
        
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 150, 80);
        
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
          this.ctx.fillText(`Power: ${playerPower}`, 20, 30);
        this.ctx.fillText(`Size: ${playerSize.toFixed(1)}`, 20, 50);
        this.ctx.fillText(`Eaten: ${scallopsEaten}`, 20, 70);
        this.ctx.fillText(`Time: ${Math.floor(gameTime)}s`, 20, 90);
        
        this.ctx.restore();
    }
};


window.DrawingSystem = DrawingSystem;
