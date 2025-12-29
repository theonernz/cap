# 变质扇贝系统测试指南

## 快速验证

### 1. 启动服务器
```powershell
npm start
```

### 2. 观察控制台日志

**预期看到的日志：**
```
World initialized: 800 scallops, 10 AI seagulls
🦠 A scallop has spoiled! (1/24)
🦠 A scallop has spoiled! (2/24)
⚠️ Removed 1 excess spoiled scallops (max: 20/800)
🗑️ Removed 3 decayed spoiled scallops
```

### 3. 浏览器测试

打开 `http://localhost:3000/game/eatscallop/eatscallop-index.html`

**验证项目：**
- [ ] 看到带☠️标志的灰绿色扇贝
- [ ] 红色虚线光圈闪烁
- [ ] 吃掉变质扇贝后能力值大幅下降
- [ ] 约30秒后变质扇贝自动消失

## 调试命令

### 浏览器控制台

```javascript
// 查看当前变质扇贝数量
game.scallops.filter(s => s.isSpoiled).length

// 查看所有变质扇贝详情
game.scallops
    .filter(s => s.isSpoiled)
    .map(s => ({
        id: s.id.substr(-8),
        age: Math.floor((Date.now() - s.spoiledTime) / 1000) + 's',
        pos: `(${Math.floor(s.x)}, ${Math.floor(s.y)})`,
        power: s.powerValue
    }))

// 强制生成变质扇贝（测试用）
game.scallops[0].isSpoiled = true;
game.scallops[0].spoiledTime = Date.now();
game.scallops[0].powerValue = -100;

// 检查即将腐烂的扇贝（剩余<5秒）
game.scallops
    .filter(s => s.isSpoiled)
    .map(s => ({
        age: Date.now() - s.spoiledTime,
        remaining: 30000 - (Date.now() - s.spoiledTime)
    }))
    .filter(s => s.remaining < 5000)
```

## 配置测试

### 测试高概率变质

临时修改 `game/eatscallop/server/config.js`:
```javascript
spoiledScallop: {
    enabled: true,
    probability: 0.30,      // 30%高概率
    maxPercentage: 0.10,    // 10%最大占比
    lifetime: 10000,        // 10秒快速腐烂
    powerMultiplier: -5     // 减少惩罚便于测试
}
```

重启服务器后应看到大量变质扇贝快速生成和消失。

### 测试禁用系统

```javascript
spoiledScallop: {
    enabled: false,  // 禁用
    // ...其他配置
}
```

重启后不应看到任何变质扇贝。

## 单人模式测试

打开 `http://localhost:3000/game/eatscallop/eatscallop-index.html`（单机版）

**配置位置**: `game/eatscallop/js/config.js`

- `probability: 0.03` (3%)
- `lifetime: 30000` (30秒)
- `maxPercentage: 0.03` (3%)

**预期行为：**
- 约800个扇贝中有24个变质（3%）
- 30秒后自动消失
- 吃掉后损失100能力值（中等扇贝）

## 多人模式测试

打开 `http://localhost:3000/game/game-index.html` → 加入房间

**配置位置**: `game/eatscallop/server/config.js`

- `probability: 0.02` (2%)
- `lifetime: 40000` (40秒)
- `maxPercentage: 0.025` (2.5%)

**预期行为：**
- 约800个扇贝中有20个变质（2.5%）
- 40秒后自动消失
- 多个玩家同时看到相同的变质扇贝

## 性能测试

### 监控扇贝数量
```javascript
setInterval(() => {
    const total = game.scallops.length;
    const spoiled = game.scallops.filter(s => s.isSpoiled).length;
    console.log(`Scallops: ${total} total, ${spoiled} spoiled (${(spoiled/total*100).toFixed(1)}%)`);
}, 5000);
```

### 检查内存泄漏
```javascript
// 运行10分钟后检查
console.log('Scallops with shouldRemove:', game.scallops.filter(s => s.shouldRemove).length);
// 应该为 0（所有待删除扇贝已清理）
```

## 常见问题排查

### 问题1: 没有变质扇贝出现
**检查：**
- `spoiledScallop.enabled` 是否为 `true`
- `probability` 是否 > 0
- 控制台是否有错误日志

### 问题2: 变质扇贝不消失
**检查：**
- `lifetime` 配置是否正确
- `cleanupDeadEntities()` 是否被调用
- 控制台是否有 "Removed decayed" 日志

### 问题3: 变质扇贝太多
**检查：**
- `maxPercentage` 设置是否过高
- 控制台是否有 "Removed excess" 日志
- 是否有超额清理机制运行

### 问题4: 吃掉后没有惩罚
**检查：**
- `powerMultiplier` 是否为负数
- `scallop.powerValue` 是否正确设置为负值
- 碰撞检测是否正常工作

## 测试通过标准

✅ **基本功能**
- [ ] 变质扇贝正常生成（2-3%）
- [ ] 视觉效果显示（骷髅、红圈、灰绿色）
- [ ] 吃掉后能力值下降
- [ ] 30-40秒后自动消失

✅ **数量控制**
- [ ] 不超过最大占比（2.5-3%）
- [ ] 超额时自动清理
- [ ] 不足时随机变质补充

✅ **多人同步**
- [ ] 所有客户端看到相同变质扇贝
- [ ] 一个玩家吃掉后其他玩家也看到消失
- [ ] 腐烂消失同步到所有客户端

✅ **性能稳定**
- [ ] 运行10分钟无内存泄漏
- [ ] CPU占用正常（<5%）
- [ ] 无卡顿或延迟

## 自动化测试脚本

```javascript
// 在浏览器控制台运行
async function testSpoiledSystem() {
    console.log('=== 变质扇贝系统测试 ===');
    
    const results = {
        totalScallops: game.scallops.length,
        spoiledCount: game.scallops.filter(s => s.isSpoiled).length,
        spoiledPercentage: 0
    };
    
    results.spoiledPercentage = (results.spoiledCount / results.totalScallops * 100).toFixed(2);
    
    console.log(`✓ 总扇贝数: ${results.totalScallops}`);
    console.log(`✓ 变质数量: ${results.spoiledCount} (${results.spoiledPercentage}%)`);
    
    // 检查配置
    const config = CONFIG.spoiledScallop;
    console.log(`✓ 配置最大占比: ${config.maxPercentage * 100}%`);
    console.log(`✓ 生命周期: ${config.lifetime / 1000}秒`);
    
    // 检查是否在限制内
    const withinLimit = results.spoiledPercentage <= (config.maxPercentage * 100);
    console.log(withinLimit ? '✓ 数量控制正常' : '✗ 超过最大占比!');
    
    // 等待30秒检查消失
    console.log('等待30秒检查腐烂消失...');
    const oldIds = game.scallops.filter(s => s.isSpoiled).map(s => s.id);
    
    setTimeout(() => {
        const currentIds = game.scallops.filter(s => s.isSpoiled).map(s => s.id);
        const disappeared = oldIds.filter(id => !currentIds.includes(id)).length;
        console.log(`✓ ${disappeared} 个变质扇贝已消失`);
        console.log('=== 测试完成 ===');
    }, 30000);
}

// 运行测试
testSpoiledSystem();
```

---

**测试版本**: v1.11  
**最后更新**: 2025-12-29
