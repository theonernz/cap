# 变质扇贝系统 (Spoiled Scallop System)

## 系统概述

变质扇贝系统为游戏增加了风险与挑战元素。玩家吃掉变质扇贝会损失大量能力值，需要谨慎识别和避开。

## 实现版本

- **v1.11+**: 完整实现变质-腐烂系统
- **单人模式**: `game/eatscallop/js/config.js`
- **多人模式**: `game/eatscallop/server/config.js`

---

## 配置参数对比

| 参数 | 单人模式 | 多人模式 | 说明 |
|------|---------|---------|------|
| `enabled` | `true` | `true` | 是否启用系统 |
| `probability` | `3%` | `2%` | 新扇贝生成时的变质概率 |
| `maxPercentage` | `3%` | `2.5%` | 最多占扇贝总数的百分比 |
| `lifetime` | `30秒` | `40秒` | 变质扇贝腐烂消失时间 |
| `powerMultiplier` | `-10` | `-10` | 吃掉后的能力值惩罚倍数 |
| `warningDistance` | `80` | `80` | 显示警告图标的距离 |

### 参数差异说明

**单人模式更激进：**
- 更高的变质概率（3% vs 2%）
- 更短的生命周期（30秒 vs 40秒）
- 更高的最大占比（3% vs 2.5%）
- 原因：单人模式节奏更快，玩家可以暂停思考

**多人模式更保守：**
- 降低变质概率，避免玩家频繁受挫
- 延长生命周期，给玩家更多反应时间
- 降低最大占比，减少地图中的"雷区"

---

## 核心机制

### 1. 生成机制

**初始生成**（服务器端 `createScallop`）：
```javascript
// 每个新扇贝有 probability% 的概率直接生成为变质状态
const shouldBeSpoiled = Math.random() < config.spoiledScallop.probability;
if (shouldBeSpoiled) {
    scallop.isSpoiled = true;
    scallop.spoiledTime = Date.now();
    scallop.powerValue = -100; // 负值表示惩罚
}
```

**运行时变质**（`updateSpoiledScallops`）：
```javascript
// 每次更新有 0.1% 概率随机变质一个正常扇贝
// 用于维持变质扇贝数量在 maxPercentage 以下
if (Math.random() < 0.001 && spoiledCount < maxSpoiled) {
    makeSpoiled(randomNormalScallop);
}
```

### 2. 生命周期管理

**腐烂消失**：
```javascript
// 每帧检查所有变质扇贝的年龄
if (scallop.isSpoiled) {
    const age = Date.now() - scallop.spoiledTime;
    if (age >= lifetime) {
        scallop.shouldRemove = true; // 标记待删除
    }
}

// 在 cleanupDeadEntities() 中统一清理
this.scallops = this.scallops.filter(s => !s.shouldRemove);
```

### 3. 数量控制

**最大占比限制**：
```javascript
const totalScallops = this.scallops.filter(s => !s.shouldRemove).length;
const spoiledCount = this.scallops.filter(s => s.isSpoiled).length;
const maxSpoiled = Math.floor(totalScallops * maxPercentage);

// 如果超过限制，删除最老的变质扇贝
if (spoiledCount > maxSpoiled) {
    spoiledScallops
        .sort((a, b) => a.spoiledTime - b.spoiledTime)
        .slice(0, spoiledCount - maxSpoiled)
        .forEach(s => s.shouldRemove = true);
}
```

---

## 视觉效果

### 外观标识（客户端 `enhancements.js`）

1. **红色虚线光圈**：
   - 围绕变质扇贝闪烁（500ms周期）
   - 透明度从 0.5 到 0.8 波动
   - 线宽 2px，虚线模式 [5, 5]

2. **骷髅标志 ☠️**：
   - 显示在扇贝上方 12 像素处
   - 红色（#FF0000）文字，黑色描边
   - 字号 14px 粗体

3. **灰绿色外壳**：
   - 外壳：深灰色 `#696969`
   - 内壳：暗绿色 `#2F4F2F`
   - 替代正常扇贝的亮色外观

### 绘制代码
```javascript
if (scallop.isSpoiled) {
    // 闪烁红圈
    ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(time) * 0.3})`;
    ctx.setLineDash([5, 5]);
    ctx.arc(x, y, size + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // 骷髅图标
    ctx.fillStyle = '#FF0000';
    ctx.fillText('☠', x, y - size - 12);
}
```

---

## 玩家交互

### 惩罚机制

**吃掉变质扇贝**：
```javascript
// 扇贝能力值已经是负数
scallop.powerValue = Math.abs(normalPowerValue) * (-10);

// 玩家吃掉后
player.power += scallop.powerValue; // 实际上是减去 100（小扇贝 5 * 10）
```

**惩罚示例**：
- 小变质扇贝：-50 能力值（正常 +5）
- 中变质扇贝：-100 能力值（正常 +10）
- 大变质扇贝：-200 能力值（正常 +20）

### 警告系统

**距离警告**（80像素内）：
- 显示红色警告标记
- 提醒玩家注意危险
- 需在UI层实现（待完善）

---

## 策略建议

### 单人模式（30秒生命周期）
- **快速识别**：看到骷髅标志立即避开
- **清理策略**：等待30秒让变质扇贝自然消失
- **风险等级**：中等（3%遇到概率）

### 多人模式（40秒生命周期）
- **更多容错**：40秒内有充足时间避开
- **竞争优势**：诱导对手吃变质扇贝
- **风险等级**：较低（2%遇到概率，2.5%最大占比）

---

## 调试信息

### 控制台日志

**变质生成**：
```
🦠 A scallop has spoiled! (5/24)
```

**数量超限清理**：
```
⚠️ Removed 3 excess spoiled scallops (max: 24/800)
```

**腐烂消失**：
```
🗑️ Removed 2 decayed spoiled scallops
```

### 实时监控

在浏览器控制台执行：
```javascript
// 查看当前变质扇贝数量
game.scallops.filter(s => s.isSpoiled).length

// 查看即将腐烂的扇贝（剩余时间 < 5秒）
game.scallops
    .filter(s => s.isSpoiled)
    .map(s => ({
        id: s.id,
        age: Date.now() - s.spoiledTime,
        remaining: 30000 - (Date.now() - s.spoiledTime)
    }))
    .filter(s => s.remaining < 5000)
```

---

## 技术细节

### 数据结构

**扇贝对象属性**：
```javascript
{
    id: 'scallop_1704000000000_0.123',
    isSpoiled: true,              // 是否变质
    spoiledTime: 1704000000000,   // 变质时间戳（毫秒）
    shouldRemove: false,          // 是否待删除
    powerValue: -100,             // 负值表示惩罚
    color: '#696969',             // 变质后的颜色
    innerColor: '#2F4F2F'
}
```

### 服务器端方法

1. **`makeSpoiled(scallop)`**：
   - 将扇贝标记为变质
   - 设置变质时间戳
   - 更改外观颜色
   - 调整能力值为负数

2. **`updateSpoiledScallops()`**：
   - 检查并标记腐烂扇贝
   - 控制变质扇贝数量上限
   - 随机变质正常扇贝（维持占比）

3. **`cleanupDeadEntities()`**：
   - 统一清理标记为 `shouldRemove` 的扇贝
   - 输出清理日志

### 性能优化

- **延迟删除**：先标记 `shouldRemove`，统一批量删除
- **条件检查**：仅在启用时执行变质逻辑
- **概率控制**：运行时变质概率仅 0.1%，避免频繁操作

---

## 未来扩展

### 计划功能

1. **视觉警告增强**：
   - 80像素内显示红色光圈
   - 距离越近，警告越明显
   - 添加音效提示

2. **变质等级系统**：
   - 轻微变质：-5倍惩罚，20秒消失
   - 中度变质：-10倍惩罚，30秒消失
   - 重度腐烂：-20倍惩罚，10秒消失

3. **环境影响**：
   - 特定区域变质概率更高
   - 天气系统影响腐烂速度

4. **解毒机制**：
   - 特殊道具消除惩罚
   - 吃特定扇贝恢复能力值

### 配置建议

**休闲模式**：
```javascript
probability: 0.01,      // 1%
maxPercentage: 0.02,    // 2%
lifetime: 45000,        // 45秒
powerMultiplier: -5     // 减少惩罚
```

**困难模式**：
```javascript
probability: 0.05,      // 5%
maxPercentage: 0.05,    // 5%
lifetime: 20000,        // 20秒
powerMultiplier: -15    // 增加惩罚
```

---

## 相关文件

- **服务器逻辑**: `game/eatscallop/server/GameServer.js`
  - `createScallop()` - 生成逻辑
  - `makeSpoiled()` - 变质处理
  - `updateSpoiledScallops()` - 生命周期管理
  - `cleanupDeadEntities()` - 清理逻辑

- **客户端渲染**: `game/eatscallop/js/enhancements.js`
  - `drawScallop()` - 扇贝绘制（包含变质效果）

- **配置文件**:
  - 单人模式: `game/eatscallop/js/config.js`
  - 多人模式: `game/eatscallop/server/config.js`

---

## 更新日志

**v1.11** (2025-12-29)
- ✅ 完整实现变质-腐烂系统
- ✅ 添加生命周期管理（30秒/40秒自动消失）
- ✅ 实现数量控制（最大占比 2.5%-3%）
- ✅ 添加运行时变质逻辑（0.1%概率）
- ✅ 优化单人/多人配置差异
- ✅ 完善控制台调试日志

---

**文档版本**: v1.0  
**最后更新**: 2025-12-29  
**维护者**: Seagull World Development Team
