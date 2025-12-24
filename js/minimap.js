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
                btn.textContent = CONFIG.language === 'zh' ? '显示小地图' : 'Show Mini Map';
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
        title.textContent = this.config.language === 'zh' ? '小地图' : 'Mini Map';
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
        
        document.querySelector('.game-area-container').appendChild(this.container);
        this.canvas.addEventListener('click', (e) => this.handleMiniMapClick(e));
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
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(0, 50, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        this.scallops.forEach(scallop => {
            const x = (scallop.x / this.config.worldWidth) * width;
            const y = (scallop.y / this.config.worldHeight) * height;
            
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        this.aiSeagulls.forEach(seagull => {
            if (seagull.isDead) return;
            
            const x = (seagull.x / this.config.worldWidth) * width;
            const y = (seagull.y / this.config.worldHeight) * height;
            
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                ctx.fillStyle = '#2196F3';
                // 根据能力值计算更准确的显示大小（限制最大值）
                const gameSize = Math.min(CONFIG.maxSeagullSize, 0.5 + (seagull.power / 200));
                const size = Math.max(2, gameSize * 2);
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                if (seagull.power > 80) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(Math.floor(seagull.power/10), x, y - 5);
                }
            }
        });
        
        this.players.forEach(player => {
            if (player.isDead) return;
            
            const x = (player.x / this.config.worldWidth) * width;
            const y = (player.y / this.config.worldHeight) * height;
            
            if (x >= 0 && x <= width && y >= 0 && y <= height) {
                const isMain = player.isControllable;
                ctx.fillStyle = isMain ? '#FFD700' : '#E91E63';
                // 根据能力值计算更准确的显示大小（限制最大值，与 onPowerTransfer 中的计算一致）
                const gameSize = Math.min(CONFIG.maxSeagullSize, 0.5 + (player.power / 200));
                const size = Math.max(3, gameSize * 2.5);
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
                
                if (isMain) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(x, y, size + 2, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    const viewSize = 40;
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.arc(x, y, viewSize, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        });
        
        if (this.mainPlayer) {
            const playerX = (this.mainPlayer.x / this.config.worldWidth) * width;
            const playerY = (this.mainPlayer.y / this.config.worldHeight) * height;
            
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
        
        const worldX = (clickX / this.canvas.width) * this.config.worldWidth;
        const worldY = (clickY / this.canvas.height) * this.config.worldHeight;
        
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
