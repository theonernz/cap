/**
 * 服务器配置加载器
 * 从 INI 文件加载配置，取代硬编码的 config.js
 */

function loadConfigFromINI(configParser) {
    const config = {};
    
    // 服务器设置
    config.serverPort = configParser.get('server', 'port', 80);
    config.maxPlayers = configParser.get('server', 'maxPlayers', 20);
    
    // 世界设置
    config.worldWidth = configParser.get('world', 'width', 5000);
    config.worldHeight = configParser.get('world', 'height', 5000);
    config.tickRate = configParser.get('world', 'tickRate', 60);
    config.stateUpdateRate = configParser.get('world', 'stateUpdateRate', 60);
    config.collisionDetectionRange = configParser.get('world', 'collisionDetectionRange', 200);
    
    // 玩家设置
    config.initialPlayerPower = configParser.get('player', 'initialPower', 100);
    config.playerBaseSpeed = configParser.get('player', 'baseSpeed', 4);
    config.playerMaxSpeed = configParser.get('player', 'maxSpeed', 6);
    config.playerAcceleration = configParser.get('player', 'acceleration', 0.25);
    config.playerDeceleration = configParser.get('player', 'deceleration', 0.15);
    config.playerSpawnRadius = configParser.get('player', 'spawnRadius', 200);
    
    // AI设置
    config.aiSeagullCount = configParser.get('ai', 'seagullCount', 20);
    config.aiPlayerCount = configParser.get('ai', 'playerCount', 5);
    
    // 扇贝设置
    config.initialScallopCount = configParser.get('scallop', 'initialCount', 800);
    config.minScallopCount = configParser.get('scallop', 'minCount', 400);
    config.scallopSpawnRate = configParser.get('scallop', 'spawnRate', 0.5);
    
    // 扇贝成长
    config.scallopGrowth = {
        enabled: configParser.get('scallop_growth', 'enabled', true),
        smallToMediumTime: configParser.get('scallop_growth', 'smallToMediumTime', 20000),
        mediumToLargeTime: configParser.get('scallop_growth', 'mediumToLargeTime', 40000),
        growthSpeed: configParser.get('scallop_growth', 'growthSpeed', 1.0),
        smallToMediumChance: configParser.get('scallop_growth', 'smallToMediumChance', 0.95),
        mediumToLargeChance: configParser.get('scallop_growth', 'mediumToLargeChance', 0.50)
    };
    
    // 扇贝王
    config.scallopKing = {
        enabled: configParser.get('scallop_king', 'enabled', true),
        maxKingScallops: configParser.get('scallop_king', 'maxKingScallops', 1),
        kingCandidateChance: configParser.get('scallop_king', 'kingCandidateChance', 0.15),
        largeToKingCandidateTime: configParser.get('scallop_king', 'largeToKingCandidateTime', 45000),
        growthTime: configParser.get('scallop_king', 'growthTime', 60000),
        minPowerValue: configParser.get('scallop_king', 'minPowerValue', 50),
        powerPercentOfTopSeagull: configParser.get('scallop_king', 'powerPercentOfTopSeagull', 0.5)
    };
    
    // 变质扇贝
    config.spoiledScallop = {
        enabled: configParser.get('scallop_spoiled', 'enabled', true),
        probability: configParser.get('scallop_spoiled', 'probability', 0.02),
        maxPercentage: configParser.get('scallop_spoiled', 'maxPercentage', 0.025),
        lifetime: configParser.get('scallop_spoiled', 'lifetime', 40000),
        powerMultiplier: configParser.get('scallop_spoiled', 'powerMultiplier', -10),
        colors: {
            outer: configParser.get('scallop_spoiled', 'colorOuter', '#696969'),
            inner: configParser.get('scallop_spoiled', 'colorInner', '#2F4F2F')
        },
        warningDistance: configParser.get('scallop_spoiled', 'warningDistance', 80),
        gradualSpoilingEnabled: configParser.get('scallop_spoiled', 'gradualSpoilingEnabled', true)
    };
    
    // 物理引擎
    config.enableServerSidePrediction = configParser.get('physics', 'enableServerSidePrediction', true);
    config.interpolationDelay = configParser.get('physics', 'interpolationDelay', 100);
    
    // 日志
    config.logLevel = configParser.get('log', 'level', 'info').toLowerCase();
    
    return config;
}

module.exports = { loadConfigFromINI };
