// ==================== Version Detection System ====================
// Detects whether the game is running in standalone or server mode

const GameVersion = {
    // Version types
    STANDALONE: 'standalone',  // Single-player only, no server needed
    SERVER: 'server',          // Full multiplayer with server
    
    // Current version (auto-detected or manually set)
    current: null,
    
    // Feature availability based on version
    features: {
        standalone: {
            singlePlayer: true,
            multiplayer: false,
            saveLoad: true,
            minimap: true,
            aiPlayers: true,
            localSettings: true,
            networkLatency: false,
            serverSync: false
        },
        server: {
            singlePlayer: true,
            multiplayer: true,
            saveLoad: true,
            minimap: true,
            aiPlayers: true,
            localSettings: true,
            networkLatency: true,
            serverSync: true
        }
    },
      // Auto-detect version
    detect() {
        // Check if version is manually set
        if (window.GAME_VERSION) {
            this.current = window.GAME_VERSION;
            console.log(`🎮 Game Version: ${this.current.toUpperCase()} (manually set)`);
            return this.current;
        }
        
        // Check if running from file:// protocol (standalone)
        if (window.location.protocol === 'file:') {
            this.current = this.STANDALONE;
            console.log('🎮 Game Version: STANDALONE (Single-player mode)');
            return this.STANDALONE;
        }
        
        // Check if server is accessible
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname !== '') {
            this.current = this.SERVER;
            console.log('🌐 Game Version: SERVER (Multiplayer available)');
            return this.SERVER;
        }
        
        // Default to standalone
        this.current = this.STANDALONE;
        console.log('🎮 Game Version: STANDALONE (default)');
        return this.STANDALONE;
    },
    
    // Check if a feature is available
    hasFeature(featureName) {
        if (!this.current) {
            this.detect();
        }
        return this.features[this.current][featureName] || false;
    },
    
    // Get current version
    getVersion() {
        if (!this.current) {
            this.detect();
        }
        return this.current;
    },
    
    // Check if standalone version
    isStandalone() {
        return this.getVersion() === this.STANDALONE;
    },
    
    // Check if server version
    isServer() {
        return this.getVersion() === this.SERVER;
    },
    
    // Initialize UI based on version
    initializeUI() {
        const version = this.getVersion();
        console.log(`🎨 Initializing UI for ${version} version...`);
        
        // Hide/show multiplayer button
        const multiplayerBtn = document.getElementById('multiplayerButton');
        if (multiplayerBtn) {
            if (this.hasFeature('multiplayer')) {
                multiplayerBtn.style.display = 'inline-block';
                multiplayerBtn.disabled = false;
            } else {
                multiplayerBtn.style.display = 'none';
                multiplayerBtn.disabled = true;
            }
        }
        
        // Hide/show network latency
        const latencyDisplay = document.getElementById('latencyDisplay');
        if (latencyDisplay) {
            latencyDisplay.style.display = this.hasFeature('networkLatency') ? 'block' : 'none';
        }
        
        // Update title based on version
        const gameTitle = document.getElementById('gameTitle');
        if (gameTitle && this.isStandalone()) {
            gameTitle.textContent = 'Seagull Eat Scallops.io - Standalone';
        }
        
        // Show version badge
        this.showVersionBadge();
    },
      // Show version badge - DEPRECATED: Now using integrated user panel for mode display
    showVersionBadge() {
        // Remove old badge if exists
        const existingBadge = document.getElementById('versionBadge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Badge functionality moved to integrated user panel
        // No longer creating the floating badge in top-right corner
    },
    
    // Update badge when game mode changes - DEPRECATED
    updateModeBadge() {
        // Mode display now handled by integrated user panel
        // This method kept for backward compatibility
    }
};

// Auto-detect on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GameVersion.detect();
        GameVersion.initializeUI();
    });
} else {
    GameVersion.detect();
    GameVersion.initializeUI();
}
