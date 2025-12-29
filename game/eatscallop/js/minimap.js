// ==================== 小地图系统 ====================
const MiniMapSystem = {
    miniMap: null,
    
    // 初始化小地图
    init(config, players, aiSeagulls, scallops) {
        if (!config.enableMiniMap) return;
        
        this.miniMap = new MiniMap(config, players, aiSeagulls, scallops);
        return this.miniMap;
    },
    
    // 更新小地图
    update(players, aiSeagulls, scallops, mainPlayer) {
        if (this.miniMap) {
            this.miniMap.update(players, aiSeagulls, scallops, mainPlayer);
        }
    },
    
    // 切换小地图显示
    toggleMiniMap() {
        if (this.miniMap) {
            this.miniMap.toggle();
            const btn = document.getElementById('minimapBtn');
            if (this.miniMap.container.style.display === 'none') {
                btn.textContent = TRANSLATIONS[CONFIG.language].minimapShowBtn;
            } else {
                btn.textContent = TRANSLATIONS[CONFIG.language].minimapBtn;
            }
        }
    },
    
    // 更新小地图语言
    updateLanguage(lang) {
        if (this.miniMap) {
            this.miniMap.updateLanguage(lang);
        }
    }
};

// 小地图类
class MiniMap {
    constructor(config, players, aiSeagulls, scallops) {
        this.config = config;
        this.players = players;
        this.aiSeagulls = aiSeagulls;
        this.scallops = scallops;
        
        this.width = 200;
        this.height = 150;
        this.scale = 0.03;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        this.init();
    }
    
    init() {
        // Find or create game area container
        let gameAreaContainer = document.querySelector('.game-area-container');
        if (!gameAreaContainer) {
            // Create if it doesn't exist
            gameAreaContainer = document.createElement('div');
            gameAreaContainer.className = 'game-area-container';
            gameAreaContainer.style.cssText = 'position: relative; width: 100%; height: 100%;';
            const canvas = document.getElementById('gameCanvas');
            if (canvas && canvas.parentNode) {
                canvas.parentNode.insertBefore(gameAreaContainer, canvas);
                gameAreaContainer.appendChild(canvas);
            }
        }
        
        this.container = document.createElement('div');
        this.container.className = 'minimap-container';
        this.container.style.cssText = `
            position: absolute;
            bottom: 15px;
            left: 15px;
            width: ${this.width}px;
            height: ${this.height}px;
            background: rgba(0, 20, 40, 0.9);
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            z-index: 20;
            overflow: hidden;
        `;
        
        const title = document.createElement('div');
        title.textContent = TRANSLATIONS[this.config.language].minimapTitle;
        title.style.cssText = `
            background: rgba(0, 0, 0, 0.5);
            color: #FFD700;
            padding: 3px 10px;
            font-size: 10px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        this.container.appendChild(title);
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height - 20;
        this.canvas.style.cssText = `
            display: block;
            cursor: pointer;
        `;
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        gameAreaContainer.appendChild(this.container);
        this.canvas.addEventListener('click', (e) => this.handleMiniMapClick(e));
        
        console.log('MiniMap initialized successfully');
    }
    
    update(players, aiSeagulls, scallops, mainPlayer) {
        this.players = players;
        this.aiSeagulls = aiSeagulls;
        this.scallops = scallops;
        this.mainPlayer = mainPlayer;
        this.draw();
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 使用CONFIG中的世界尺寸，确保正确映射
        const worldWidth = CONFIG.worldWidth || 5000;
        const worldHeight = CONFIG.worldHeight || 5000;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(0, 50, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        this.scallops.forEach(scallop => {
            // 确保使用正确的世界坐标
            if (scallop.x >= 0 && scallop.x <= worldWidth && 
                scallop.y >= 0 && scallop.y <= worldHeight) {
                const x = (scallop.x / worldWidth) * width;
                const y = (scallop.y / worldHeight) * height;
                
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        this.aiSeagulls.forEach(seagull => {
            if (seagull.isDead) return;
            
            // 确保使用正确的世界坐标
            if (seagull.x >= 0 && seagull.x <= worldWidth && 
                seagull.y >= 0 && seagull.y <= worldHeight) {
                const x = (seagull.x / worldWidth) * width;
                const y = (seagull.y / worldHeight) * height;
            
                // Check if this is a top 3 leader
                const isTopLeader = seagull.leaderboardRank && seagull.leaderboardRank <= 3;
                
                if (isTopLeader) {
                    // Highlight top 3 leaders with larger circles and special colors
                    const leaderColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
                    ctx.fillStyle = leaderColors[seagull.leaderboardRank - 1];
                    const size = 5; // Larger size for leaders
                    
                    // Draw glow effect
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = leaderColors[seagull.leaderboardRank - 1];
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Draw trophy icon
                    const trophies = ['🏆', '🥈', '🥉'];
                    const trophy = trophies[seagull.leaderboardRank - 1];
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(trophy, x, y - size - 6);
                } else {
                    // Regular AI seagulls are tiny
                    ctx.fillStyle = '#2196F3';
                    const size = 2; // Tiny size for regular seagulls
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        this.players.forEach(player => {
            if (player.isDead) return;
            
            // 确保使用正确的世界坐标
            if (player.x >= 0 && player.x <= worldWidth && 
                player.y >= 0 && player.y <= worldHeight) {
                const x = (player.x / worldWidth) * width;
                const y = (player.y / worldHeight) * height;
                
                const isMain = player.isControllable;
                const isTopLeader = player.leaderboardRank && player.leaderboardRank <= 3;
                
                if (isMain) {
                    // Main player - prominent display with glow
                    ctx.fillStyle = '#FFD700';
                    const size = 6; // Larger size for main player
                    
                    // Draw glow effect
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Draw outer ring
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y, size + 3, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Show trophy if in top 3
                    if (isTopLeader) {
                        const trophies = ['🏆', '🥈', '🥉'];
                        const trophy = trophies[player.leaderboardRank - 1];
                        ctx.font = 'bold 10px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(trophy, x, y - size - 8);
                    }
                    
                    // View range indicator
                    const viewSize = 40;
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.arc(x, y, viewSize, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else if (isTopLeader) {
                    // Top 3 AI players - highlighted
                    const leaderColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
                    ctx.fillStyle = leaderColors[player.leaderboardRank - 1];
                    const size = 5; // Larger size for leaders
                    
                    // Draw glow effect
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = leaderColors[player.leaderboardRank - 1];
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    
                    // Draw trophy icon
                    const trophies = ['🏆', '🥈', '🥉'];
                    const trophy = trophies[player.leaderboardRank - 1];
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(trophy, x, y - size - 6);
                } else {
                    // Regular AI players - tiny
                    ctx.fillStyle = '#E91E63';
                    const size = 2; // Tiny size for regular players
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        // Draw viewport rectangle showing current game view area
        if (this.mainPlayer) {
            const playerX = (this.mainPlayer.x / worldWidth) * width;
            const playerY = (this.mainPlayer.y / worldHeight) * height;
            
            // Calculate viewport dimensions based on zoom level
            const zoomLevel = Game.zoomLevel || 1.0;
            const gameCanvas = DrawingSystem.canvas;
            if (gameCanvas) {
                const viewportWorldWidth = (gameCanvas.width / zoomLevel);
                const viewportWorldHeight = (gameCanvas.height / zoomLevel);
                
                // Convert viewport size to minimap coordinates
                const viewportMinimapWidth = (viewportWorldWidth / worldWidth) * width;
                const viewportMinimapHeight = (viewportWorldHeight / worldHeight) * height;
                
                // Calculate viewport rectangle position (centered on player)
                const viewportX = playerX - viewportMinimapWidth / 2;
                const viewportY = playerY - viewportMinimapHeight / 2;
                
                // Draw viewport rectangle
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // Yellow outline
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]); // Dashed line
                ctx.strokeRect(viewportX, viewportY, viewportMinimapWidth, viewportMinimapHeight);
                ctx.setLineDash([]); // Reset dash
                
                // Draw semi-transparent overlay outside viewport
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                
                // Top
                if (viewportY > 0) {
                    ctx.fillRect(0, 0, width, viewportY);
                }
                // Bottom
                if (viewportY + viewportMinimapHeight < height) {
                    ctx.fillRect(0, viewportY + viewportMinimapHeight, width, height - (viewportY + viewportMinimapHeight));
                }
                // Left
                if (viewportX > 0) {
                    ctx.fillRect(0, Math.max(0, viewportY), viewportX, Math.min(height, viewportMinimapHeight));
                }
                // Right
                if (viewportX + viewportMinimapWidth < width) {
                    ctx.fillRect(viewportX + viewportMinimapWidth, Math.max(0, viewportY), 
                                width - (viewportX + viewportMinimapWidth), 
                                Math.min(height, viewportMinimapHeight));
                }
            }
        }
        
        if (this.mainPlayer) {
            const playerX = (this.mainPlayer.x / worldWidth) * width;
            const playerY = (this.mainPlayer.y / worldHeight) * height;
            
            if (playerX < 0 || playerX > width || playerY < 0 || playerY > height) {
                const edgeMargin = 5;
                let indicatorX = Math.max(edgeMargin, Math.min(width - edgeMargin, playerX));
                let indicatorY = Math.max(edgeMargin, Math.min(height - edgeMargin, playerY));
                
                const centerX = width / 2;
                const centerY = height / 2;
                const angle = Math.atan2(playerY - centerY, playerX - centerX);
                
                if (playerX < 0) indicatorX = edgeMargin;
                if (playerX > width) indicatorX = width - edgeMargin;
                if (playerY < 0) indicatorY = edgeMargin;
                if (playerY > height) indicatorY = height - edgeMargin;
                
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                const arrowSize = 8;
                ctx.moveTo(indicatorX + Math.cos(angle) * arrowSize, 
                          indicatorY + Math.sin(angle) * arrowSize);
                ctx.lineTo(indicatorX + Math.cos(angle + 2.5) * arrowSize, 
                          indicatorY + Math.sin(angle + 2.5) * arrowSize);
                ctx.lineTo(indicatorX + Math.cos(angle - 2.5) * arrowSize, 
                          indicatorY + Math.sin(angle - 2.5) * arrowSize);
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    handleMiniMapClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const worldWidth = CONFIG.worldWidth || 5000;
        const worldHeight = CONFIG.worldHeight || 5000;
        
        const worldX = (clickX / this.canvas.width) * worldWidth;
        const worldY = (clickY / this.canvas.height) * worldHeight;
        
        this.smoothMoveTo(worldX, worldY);
    }
    
    smoothMoveTo(targetX, targetY) {
        const mainPlayer = this.players.find(p => p.isControllable);
        if (!mainPlayer) return;
        
        const dx = targetX - mainPlayer.x;
        const dy = targetY - mainPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const speed = 15;
            mainPlayer.velocityX = (dx / distance) * speed;
            mainPlayer.velocityY = (dy / distance) * speed;
        }
    }
    
    toggle() {
        if (this.container.style.display === 'none') {
            this.container.style.display = 'block';
        } else {
            this.container.style.display = 'none';
        }
    }
    
    updateLanguage(lang) {
        const title = this.container.querySelector('div');
        if (title) {
            title.textContent = lang === 'zh' ? '小地图' : 'Mini Map';
        }
    }
}

// 导出小地图系统
window.MiniMapSystem = MiniMapSystem;
window.minimap = MiniMapSystem;
window.MiniMap = MiniMap;
