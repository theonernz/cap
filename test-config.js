// 测试变质扇贝配置
const config = require('./server/config');

console.log('=== 变质扇贝配置测试 ===\n');
console.log('配置对象存在:', !!config.spoiledScallop);
console.log('配置内容:', JSON.stringify(config.spoiledScallop, null, 2));

if (config.spoiledScallop) {
    console.log('\n检查项:');
    console.log('✓ enabled:', config.spoiledScallop.enabled);
    console.log('✓ probability:', config.spoiledScallop.probability);
    console.log('✓ maxPercentage:', config.spoiledScallop.maxPercentage);
    console.log('✓ lifetime:', config.spoiledScallop.lifetime, 'ms');
    console.log('✓ powerMultiplier:', config.spoiledScallop.powerMultiplier);
    
    console.log('\n模拟测试:');
    let spoiledCount = 0;
    const testCount = 10000;
    
    for (let i = 0; i < testCount; i++) {
        if (config.spoiledScallop.enabled && Math.random() < config.spoiledScallop.probability) {
            spoiledCount++;
        }
    }
    
    const actualPercentage = (spoiledCount / testCount * 100).toFixed(2);
    const expectedPercentage = (config.spoiledScallop.probability * 100).toFixed(2);
    
    console.log(`生成 ${testCount} 个扇贝:`);
    console.log(`- 变质数量: ${spoiledCount}`);
    console.log(`- 实际概率: ${actualPercentage}%`);
    console.log(`- 预期概率: ${expectedPercentage}%`);
    console.log(`- 差异: ${Math.abs(actualPercentage - expectedPercentage).toFixed(2)}%`);
    
    if (Math.abs(actualPercentage - expectedPercentage) < 0.5) {
        console.log('\n✅ 概率测试通过！');
    } else {
        console.log('\n⚠️ 概率偏差较大，但可能是正常的随机波动');
    }
} else {
    console.log('\n❌ 配置不存在！');
}

console.log('\n=== 测试完成 ===');
