# 配置文件说明 - Configuration Guide

## 📁 配置文件结构

海鸥吃扇贝游戏使用**分离的配置文件**来管理单人模式和多人模式：

```
game/eatscallop/config/
├── client.ini          # 单人模式配置（客户端）
├── server.ini          # 多人模式配置（服务器端）
└── game.ini            # 旧配置文件（已弃用，仅作参考）
```

## 🎮 配置文件用途

### 1. client.ini - 客户端配置（单人模式）

**使用场景：** 
- 单人游戏模式
- 客户端本地运行所有游戏逻辑
- 离线游戏

**关键配置：**
- AI数量：`aiSeagullCount = 50` （更多AI提供挑战）
- 扇贝密度：`count = 800` （高密度）
- 变质扇贝：`probability = 0.03` （3%概率，较高难度）
- 存档系统：自动保存、槽位管理
- UI设置：语言、缩放、奖励等

**特点：**
- ✅ 更高的AI数量（挑战性）
- ✅ 更高的扇贝密度
- ✅ 存档和自动保存功能
- ✅ 本地奖励系统
- ⚠️ 无网络同步

### 2. server.ini - 服务器配置（多人模式）

**使用场景：**
- 多人在线游戏
- 服务器权威控制所有逻辑
- 实时同步

**关键配置：**
- 玩家限制：`maxPlayers = 20`
- AI数量：`aiSeagullCount = 20` （避免拥挤）
- 扇贝密度：`initialCount = 800` （支持多玩家）
- 变质扇贝：渐进变质系统（更平衡）
- 网络设置：重连、心跳、预测
- 安全设置：反作弊、验证

**特点：**
- ✅ 支持20个同时在线玩家
- ✅ 较少AI（避免服务器负载）
- ✅ 渐进变质系统（更公平）
- ✅ 客户端预测+服务器协调
- ✅ 反作弊机制
- ⚠️ 无本地存档

## 🔧 配置差异对比

| 配置项 | 单人模式 (client.ini) | 多人模式 (server.ini) |
|--------|----------------------|---------------------|
| **AI海鸥数量** | 50 | 20 |
| **最大玩家** | 1 | 20 |
| **变质扇贝** | 固定概率3% | 渐进变质 |
| **存档系统** | ✅ 支持 | ❌ 不支持 |
| **自动保存** | ✅ 30秒 | ❌ 无 |
| **网络设置** | ❌ 无 | ✅ 完整 |
| **反作弊** | ❌ 无需 | ✅ 启用 |
| **性能监控** | 简单 | 详细 |

## 🚀 如何使用

### 当前状态（需要代码修改）

⚠️ **重要：** 目前游戏代码**尚未实现**从 INI 文件读取配置！

**当前实现：**
- 服务器端使用：`server/config.js` (硬编码)
- 客户端使用：`game/eatscallop/js/config.js` (硬编码)
- 仅日志配置从 INI 读取

### 实现配置加载（需要开发）

要让游戏使用 INI 配置文件，需要：

**1. 服务器端修改 (server/index.js):**

```javascript
// 替换硬编码的 config.js
const configParser = new ConfigParser('game/eatscallop/config/server.ini');
const serverConfig = {
    worldWidth: configParser.get('world', 'width', 5000),
    worldHeight: configParser.get('world', 'height', 5000),
    maxPlayers: configParser.get('server', 'maxPlayers', 20),
    // ... 其他配置
};
```

**2. 客户端修改 (game/eatscallop/js/config.js):**

```javascript
// 需要创建客户端 INI 解析器（浏览器环境）
// 或在服务器端预处理 INI 为 JSON
const CONFIG = await loadClientConfig();
```

## 📝 配置项详解

### 世界设置 [world]

```ini
width = 5000          # 游戏世界宽度（像素）
height = 5000         # 游戏世界高度（像素）
tickRate = 60         # 服务器更新频率（Hz）
```

**说明：**
- 单人和多人都是 5000x5000
- 60Hz 刷新率确保流畅体验

### 玩家设置 [player]

```ini
initialPower = 100    # 起始能力值
baseSpeed = 4.0       # 基础移动速度
maxSpeed = 6.0        # 最大移动速度
acceleration = 0.25   # 加速度
deceleration = 0.15   # 减速度
```

**重要：** 客户端和服务器的速度参数**必须完全一致**，否则会导致：
- 位置不同步
- 客户端预测不准确
- 碰撞检测错误

### AI设置 [ai]

**单人模式：**
```ini
aiSeagullCount = 50   # 更多AI提供挑战
```

**多人模式：**
```ini
aiSeagullCount = 20   # 较少AI避免拥挤
```

### 扇贝系统 [scallop_*]

**基础设置：**
```ini
initialCount = 800    # 初始数量（高密度）
minCount = 400        # 最少维持数量
spawnRate = 0.5       # 生成速率（个/秒）
```

**类型权重：**
```ini
smallWeight = 80      # 80% 小扇贝
mediumWeight = 15     # 15% 中等扇贝
largeWeight = 5       # 5% 大扇贝
```

### 变质扇贝 [scallop_spoiled]

**单人模式（固定概率）：**
```ini
enabled = true
probability = 0.03    # 3% 固定概率
maxPercentage = 0.03  # 最多3%
```

**多人模式（渐进变质）：**
```ini
enabled = true
maxPercentage = 0.025          # 最多2.5%
gradualSpoilingEnabled = true  # 渐进变质（更公平）
lifetime = 40000               # 40秒后腐烂
```

## ⚙️ 推荐配置方案

### 方案一：轻松模式（单人）

```ini
[ai]
aiSeagullCount = 30     # 减少AI

[scallop_spoiled]
enabled = false         # 禁用变质扇贝
```

### 方案二：困难模式（单人）

```ini
[ai]
aiSeagullCount = 80     # 增加AI

[scallop_spoiled]
probability = 0.05      # 5%变质概率
powerMultiplier = -15   # 更严重的惩罚
```

### 方案三：性能优化（多人）

```ini
[server]
maxPlayers = 10         # 减少最大玩家

[ai]
aiSeagullCount = 10     # 减少AI

[scallop]
initialCount = 500      # 减少扇贝密度
```

## 🔄 热重载配置

**多人模式（服务器端）：**
```bash
# 修改 server.ini 后重启服务器
npm start
```

**单人模式（客户端）：**
```bash
# 刷新浏览器页面
F5 或 Ctrl+R
```

## 📚 配置优先级

1. **服务器端（多人）：** server.ini → server/config.js
2. **客户端（单人）：** client.ini → game/eatscallop/js/config.js
3. **日志：** game.ini 的 [log] 部分（当前唯一生效的配置）

## ⚠️ 注意事项

### 1. 速度参数必须同步

客户端和服务器的以下参数**必须完全相同**：
- `baseSpeed`
- `maxSpeed`
- `acceleration`
- `deceleration`

### 2. 扇贝权重总和

确保扇贝类型权重合理：
```ini
smallWeight + mediumWeight + largeWeight = 100
# 例如：80 + 15 + 5 = 100
```

### 3. 变质扇贝限制

```ini
maxPercentage <= 0.05  # 建议不超过5%
```

### 4. 性能考虑

高配置需求：
```ini
aiSeagullCount > 30
initialCount > 1000
maxPlayers > 15
```

## 🛠️ 故障排查

### 问题：配置修改不生效

**原因：** 当前代码未实现 INI 加载

**解决：**
1. 修改对应的 `.js` 配置文件
2. 或等待实现 INI 加载功能

### 问题：多人模式位置不同步

**原因：** 客户端和服务器速度参数不一致

**解决：** 确保 client.ini 和 server.ini 的 [player] 部分完全相同

### 问题：变质扇贝过多

**原因：** `maxPercentage` 设置过高

**解决：**
```ini
maxPercentage = 0.025  # 降低到2.5%
```

## 📖 延伸阅读

- [ConfigParser.js](../../server/ConfigParser.js) - INI 解析器实现
- [server/config.js](../../server/config.js) - 当前服务器配置
- [game/eatscallop/js/config.js](../js/config.js) - 当前客户端配置

---

**最后更新：** 2025-12-31  
**状态：** 配置文件已创建，等待代码集成
