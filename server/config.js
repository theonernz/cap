// ==================== Server Configuration ====================
module.exports = {    serverPort: 80,
    
    // Game world settings - 更大的地图
    worldWidth: 5000,
    worldHeight: 5000,
    
    // Timing
    tickRate: 60, // Server update rate (Hz)
    stateUpdateRate: 60, // How often to send state to clients (Hz) - 60Hz消除本地抖动
    
    // Player settings
    maxPlayers: 20,
    initialPlayerPower: 100,
    playerBaseSpeed: 4,      // 从5降低到4，减少网络延迟影响
    playerMaxSpeed: 6,       // 从8降低到6，提高碰撞检测精确度
    playerAcceleration: 0.25, // 从0.3降低到0.25，更平滑的加速
    playerDeceleration: 0.15,    // Scallop settings - 超高密度扇贝
    initialScallopCount: 800, // 800个扇贝，大部分是小扇贝
    minScallopCount: 400,     // 最少保持400个
    scallopSpawnRate: 0.5,    // 每秒生成0.5个 (Per second)
      // Scallop growth settings - 调整成长速度，让玩家看到更多成长动画
    scallopGrowth: {
        enabled: true,
        smallToMediumTime: 20000, // 20秒：小扇贝快速成长到中等（让玩家看到更多成长）
        mediumToLargeTime: 40000, // 40秒：中等扇贝较慢成长到大扇贝
        growthSpeed: 1.0,
        smallToMediumChance: 0.95, // 95%的小扇贝会成长到中等
        mediumToLargeChance: 0.50  // 50%的中等扇贝会成长到大扇贝
    },
      // Scallop King settings
    scallopKing: {
        enabled: true,
        maxKingScallops: 1, // Maximum number of King scallops at once
        kingCandidateChance: 0.15, // Only 15% of large scallops become King candidates
        largeToKingCandidateTime: 45000, // 45 seconds as large before eligible for King
        growthTime: 60000, // 60 seconds to become King (was 40)
        minPowerValue: 50,
        powerPercentOfTopSeagull: 0.5 // King worth 50% of top player's power
    },
    
    // Spoiled Scallop settings (Multiplayer Mode - Gradual Spoiling)
    spoiledScallop: {
        enabled: true,              // Enable spoiled scallop system
        probability: 0.02,          // [Not used] Gradual spoiling instead of instant spawn
        maxPercentage: 0.025,       // Max 2.5% of total scallops can be spoiled
        lifetime: 40000,            // Spoiled scallops decay after 40 seconds
        powerMultiplier: -10,       // Eating spoiled = lose 10x the scallop's normal power
        colors: {
            outer: '#696969',       // Dark gray outer shell
            inner: '#2F4F2F'        // Dark green inner shell
        },
        warningDistance: 80,        // Show warning icon within 80 pixels
        // Gradual spoiling settings:
        // - Scallops aged 15-30s: 0.5% chance per 5s check (≈1.5% total in window)
        // - More natural than instant spawn, avoids "spoiling waves"
    },
    
    // AI settings - Increased for better scallop consumption
    aiSeagullCount: 20,         // Increased from 10 to 20 for better ecosystem balance
    aiPlayerCount: 5,
    
    // Collision settings
    collisionDetectionRange: 200, // Only check collisions within this range
    
    // Physics
    enableServerSidePrediction: true,
    interpolationDelay: 100, // ms
    
    // Debug
    logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};
