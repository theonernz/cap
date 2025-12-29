/**
 * Dynamic Game Loader for Seagull World
 * Loads game list from config and dynamically generates game cards
 */

class GameLoader {
    constructor() {
        this.games = [];
        this.currentLanguage = localStorage.getItem('language') || 'zh';
    }

    /**
     * Load games from server API
     */
    async loadGames() {
        try {
            const response = await fetch('/api/games');
            const data = await response.json();
            
            if (data.success) {
                this.games = data.games;
                return this.games;
            } else {
                console.error('Failed to load games:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error loading games:', error);
            return [];
        }
    }

    /**
     * Generate HTML for a game card
     */
    generateGameCard(game) {
        const lang = this.currentLanguage;
        const name = game.name[lang] || game.name.zh;
        const description = game.description[lang] || game.description.zh;
        const badgeText = game.badge?.text[lang] || game.badge?.text.zh || '';
        
        // Determine card status class
        const cardClass = game.status === 'active' 
            ? (game.badge?.type === 'featured' ? 'game-card featured' : 'game-card')
            : 'game-card coming-soon';

        // Generate badge HTML
        const badgeHTML = game.badge 
            ? `<div class="game-badge ${game.badge.type === 'coming-soon' ? 'coming-soon-badge' : ''}">
                ${game.badge.icon} <span>${badgeText}</span>
               </div>`
            : '';

        // Generate stats HTML based on game status
        let statsHTML = '';
        if (game.status === 'active') {
            if (game.features?.roomSystem) {
                // For games with room system (like eatscallop)
                statsHTML = `
                    <div class="game-stats">
                        <span>👥 <span data-lang-key="online">${lang === 'zh' ? '在线' : 'Online'}</span>: <strong id="onlinePlayers-${game.gameId}">0</strong></span>
                        <span>⭐ <span data-lang-key="rating">${lang === 'zh' ? '评分' : 'Rating'}</span>: <strong>${game.stats.rating}</strong></span>
                    </div>
                `;
            } else {
                statsHTML = `
                    <div class="game-stats">
                        <span>⭐ ${game.stats.rating}</span>
                    </div>
                `;
            }
        } else if (game.status === 'development') {
            statsHTML = `
                <div class="game-stats">
                    <span>🗓️ <span data-lang-key="expected">${lang === 'zh' ? '预计' : 'Expected'}</span>: <strong>${game.stats.expectedRelease}</strong></span>
                    <span>📢 <span data-lang-key="preorder">${lang === 'zh' ? '预约' : 'Preorder'}</span>: <strong>${game.stats.preorders}</strong></span>
                </div>
            `;
        }

        // Generate actions HTML based on game status
        let actionsHTML = '';
        if (game.status === 'active') {
            if (game.features?.roomSystem) {
                // Room system game (eatscallop)
                actionsHTML = `
                    <div class="room-list-container" style="margin-top: 25px;">
                        <div class="room-list-header">
                            <h2 style="font-size: 1.3rem;">🏠 <span data-lang-key="availableRooms">${lang === 'zh' ? '可用房间' : 'Available Rooms'}</span></h2>
                            <div style="display: flex; gap: 10px;">
                                <button class="refresh-btn" onclick="refreshRoomList()" title="${lang === 'zh' ? '刷新房间列表' : 'Refresh Room List'}">
                                    🔄
                                </button>
                                <button class="create-room-btn" id="createRoomBtn" onclick="showCreateRoomModal()" disabled title="${lang === 'zh' ? '创建新房间' : 'Create Room'}">
                                    ➕
                                </button>
                            </div>
                        </div>
                        
                        <div class="room-list" id="roomList">
                            <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                                <p data-lang-key="loadingRooms">${lang === 'zh' ? '加载房间列表中...' : 'Loading rooms...'}</p>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 15px;">
                            <button class="play-btn secondary" onclick="enterGameAnonymous('${game.gameId}')" style="display: inline-block;">
                                👤 <span data-lang-key="anonymousTry">${lang === 'zh' ? '匿名试玩' : 'Anonymous Play'}</span>
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Simple game without room system
                actionsHTML = `
                    <div class="game-actions">
                        <button class="play-btn primary" onclick="enterGame('${game.gameId}')">
                            🎮 <span data-lang-key="startGame">${lang === 'zh' ? '开始游戏' : 'Start Game'}</span>
                        </button>
                    </div>
                `;
            }
        } else {
            // Coming soon game
            actionsHTML = `
                <div class="game-actions">
                    <button class="play-btn primary" disabled>
                        <span data-lang-key="inDev">${lang === 'zh' ? '开发中...' : 'In Development...'}</span>
                    </button>
                </div>
            `;
        }

        return `
            <div class="${cardClass}" data-game-id="${game.gameId}">
                ${badgeHTML}
                <div class="game-icon">${game.icon}</div>
                <h3 class="game-title">${name}</h3>
                <p class="game-description">${description}</p>
                ${statsHTML}
                ${actionsHTML}
            </div>
        `;
    }

    /**
     * Render all games to the container
     */
    async renderGames(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Game container not found:', containerId);
            return;
        }

        // Show loading state
        container.innerHTML = '<div style="text-align: center; padding: 60px; color: white;"><p>加载游戏列表中...</p></div>';

        // Load games
        await this.loadGames();

        if (this.games.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 60px; color: white;"><p>暂无可用游戏</p></div>';
            return;
        }

        // Generate and insert game cards
        const gamesHTML = this.games.map(game => this.generateGameCard(game)).join('');
        container.innerHTML = gamesHTML;

        // After rendering, initialize room lists for active games with room systems
        this.initializeRoomSystems();
    }

    /**
     * Initialize room systems for games that support them
     */
    initializeRoomSystems() {
        this.games.forEach(game => {
            if (game.status === 'active' && game.features?.roomSystem) {
                // Use existing room list functionality
                if (typeof refreshRoomList === 'function') {
                    refreshRoomList();
                }
            }
        });
    }

    /**
     * Update language for all game cards
     */
    setLanguage(lang) {
        this.currentLanguage = lang;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLoader;
}
