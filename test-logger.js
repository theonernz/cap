// 测试日志滚动功能
const ConfigParser = require('./server/ConfigParser');
const Logger = require('./server/Logger');
const path = require('path');

const configPath = path.join(__dirname, 'game/eatscallop/config/game.ini');
const configParser = new ConfigParser(configPath);
const logConfig = configParser.getSection('log');

console.log('配置文件内容:', logConfig);
console.log('');

// 创建一个小文件大小的日志器用于测试滚动
const testLogger = new Logger({
    level: 'DEBUG',
    maxFileSize: 0.001, // 1KB for testing
    maxFiles: 3,
    consoleOutput: true,
    timestampFormat: 'full',
    logFilePath: path.join(__dirname, 'game/eatscallop/data/test.0.log')
});

console.log('开始写入测试日志...');
console.log('文件大小限制: 1KB，文件数量: 3');
console.log('');

// 写入大量日志测试滚动
for (let i = 0; i < 100; i++) {
    testLogger.info(`测试日志消息 ${i}`, { 
        iteration: i, 
        timestamp: new Date().toISOString(),
        data: 'A'.repeat(50) // 添加一些数据让文件快速增长
    });
    
    // 每10条暂停一下
    if ((i + 1) % 10 === 0) {
        console.log(`已写入 ${i + 1} 条日志...`);
    }
}

testLogger.close();

console.log('');
console.log('测试完成！请检查 game/eatscallop/data/ 目录下的日志文件：');
console.log('  - test.0.log (当前日志)');
console.log('  - test.1.log (上一个日志)');  
console.log('  - test.2.log (更早的日志)');
console.log('');
console.log('注意：test.3.log 不应该存在（maxFiles=3）');
