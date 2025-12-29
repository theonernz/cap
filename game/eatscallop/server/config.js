// ==================== Server Configuration ====================
module.exports = {    serverPort: 3000,
    
    // Game world settings - 更大的地图
    worldWidth: 3000,  // 从2000增加到3000
    worldHeight: 2250, // 从1500增加到2250 (保持3:2比例)
    
    // Timing
    tickRate: 60, // Server update rate (Hz)
    stateUpdateRate: 20, // How often to send state to clients (Hz)
    
    // Player settings
    maxPlayers: 20,
    initialPlayerPower: 100,
    playerBaseSpeed: 5,
    playerMaxSpeed: 8,
    playerAcceleration: 0.3,
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
    
    // Spoiled Scallop settings (Multiplayer Mode)
    spoiledScallop: {
        enabled: true,              // Enable spoiled scallop system
        probability: 0.02,          // 2% chance for new scallops to spawn spoiled (lower in multiplayer)
        maxPercentage: 0.025,       // Max 2.5% of total scallops can be spoiled (lower than single player)
        lifetime: 40000,            // Spoiled scallops decay after 40 seconds (longer than single player)
        powerMultiplier: -10,       // Eating spoiled = lose 10x the scallop's normal power
        colors: {
            outer: '#696969',       // Dark gray outer shell
            inner: '#2F4F2F'        // Dark green inner shell
        },
        warningDistance: 80         // Show warning icon within 80 pixels
    },
    
    // AI settings
    aiSeagullCount: 10,
    aiPlayerCount: 5,
    
    // Collision settings
    collisionDetectionRange: 200, // Only check collisions within this range
    
    // Physics
    enableServerSidePrediction: true,
    interpolationDelay: 100, // ms
    
    // Debug
    logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};
