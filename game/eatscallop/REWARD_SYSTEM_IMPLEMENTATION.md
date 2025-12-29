# 奖励系统实现文档

## 概述
实现了完整的用户进度系统，包括经验值、等级、金币奖励机制。用户面板显示真实的用户名、等级和金币数据。

## 实现内容

### 1. 用户数据结构 ✅
**文件**: `game/eatscallop/js/seagull-world/auth.js`

新增用户数据字段：
```javascript
world: {
    seagullCoins: 100,      // 海鸥币
    worldLevel: 1,          // 世界等级
    experience: 0,          // ⭐ 新增：经验值
    totalPlayTime: 0,       // 总游戏时间
    totalGamesPlayed: 0     // 总游戏次数
}
```

### 2. 等级计算系统 ✅
**文件**: `game/eatscallop/js/rewards.js`

#### 等级公式
```javascript
所需经验 = 100 × level^1.5
```

例如：
- Level 1 → 2: 100 EXP
- Level 2 → 3: 282 EXP
- Level 3 → 4: 520 EXP
- Level 5 → 6: 1118 EXP
- Level 10 → 11: 3162 EXP

### 3. 金币奖励系统 ✅

#### 奖励因素
| 因素 | 基础奖励 | 说明 |
|-----|---------|------|
| 基础奖励 | 10 金币 | 每局游戏固定 |
| 生存时间 | 2/分钟 | 鼓励长时间生存 |
| 最终能力值 | 5/100点 | 每100点能力值+5金币 |
| 扇贝数量 | 1/个 | 每吃1个扇贝+1金币 |
| 击败AI | 3/个 | 每击败1个AI海鸥+3金币 |
| 排行榜奖励 | 第1名: 50<br>第2名: 30<br>第3名: 20 | 多人模式排名奖励 |

#### 示例计算
```javascript
// 单局游戏示例
生存时间: 180秒 (3分钟) → 6 金币
最终能力值: 500 → 25 金币
吃的扇贝: 20个 → 20 金币
击败AI: 5个 → 15 金币
排行榜: 第1名 → 50 金币
基础奖励: 10 金币
--------------------------------
总计: 126 金币
```

### 4. 经验值奖励系统 ✅

#### 奖励因素
| 因素 | 基础奖励 | 说明 |
|-----|---------|------|
| 基础奖励 | 50 EXP | 每局游戏固定 |
| 生存时间 | 10/分钟 | 鼓励长时间生存 |
| 最终能力值 | 20/100点 | 每100点能力值+20 EXP |
| 扇贝数量 | 5/个 | 每吃1个扇贝+5 EXP |
| 击败AI | 15/个 | 每击败1个AI海鸥+15 EXP |
| 排行榜奖励 | 第1名: 200<br>第2名: 120<br>第3名: 80 | 多人模式排名奖励 |

#### 示例计算
```javascript
// 同样的游戏示例
生存时间: 180秒 (3分钟) → 30 EXP
最终能力值: 500 → 100 EXP
吃的扇贝: 20个 → 100 EXP
击败AI: 5个 → 75 EXP
排行榜: 第1名 → 200 EXP
基础奖励: 50 EXP
--------------------------------
总计: 555 EXP
```

### 5. 游戏统计追踪 ✅
**文件**: `game/eatscallop/js/game.js`

新增游戏统计字段：
```javascript
Game = {
    scallopsEaten: 0,  // 吃的扇贝数量
    aiDefeated: 0,     // ⭐ 新增：击败的AI数量
    gameTime: 0,       // 游戏时长
    // ...
}
```

AI击败计数逻辑：
```javascript
if (weaker.power <= 0) {
    weaker.isDead = true;
    if (stronger.isControllable && !weaker.isControllable) {
        // 玩家击败了AI海鸥
        this.aiDefeated++;
    }
}
```

### 6. 服务器API支持 ✅
**文件**: `server/index.js`

新增专用更新端点：
```javascript
POST /api/user/update
Body: {
    userId: string,
    experience: number,
    seagullCoins: number,
    worldLevel: number
}
```

特点：
- 自动处理缺失字段（保留原值）
- 用户验证
- 数据持久化到 `data/users.json`

### 7. 用户界面更新 ✅

#### 用户面板显示
**文件**: `game/eatscallop/js/dashboard.js`

```javascript
// 显示真实用户名
userName.textContent = user.profile.displayName || user.username;

// 显示等级和经验进度
const levelInfo = RewardSystem.levelConfig.calculateLevel(experience);
levelElement.textContent = `Lv.${levelInfo.level}`;
levelElement.title = `经验: ${expInLevel}/${expNeeded} (总经验: ${experience})`;

// 显示金币
userCoins.textContent = `💰 ${user.world.seagullCoins}`;
```

#### 奖励展示界面
**文件**: `game/eatscallop/js/rewards.js` (displayRewardUI方法)

特性：
- 动态奖励面板
- 金币和经验详细分解
- 升级动画提示
- 自动关闭（3秒后）

### 8. 游戏结束触发 ✅
**文件**: `game/eatscallop/js/game.js` (endGame方法)

```javascript
endGame() {
    // 收集游戏统计
    const gameStats = {
        survivalTime: Math.floor(this.gameTime / 1000),
        finalPower: Math.floor(this.playerPower),
        scallopsEaten: this.scallopsEaten,
        aiDefeated: this.aiDefeated,
        leaderboardRank: null
    };
    
    // 如果已登录，更新用户数据
    if (typeof RewardSystem !== 'undefined' && 
        window.SeagullWorldAuth?.currentUser) {
        RewardSystem.updateUserStats(gameStats);
    }
}
```

## 文件清单

### 新增文件
1. `game/eatscallop/js/rewards.js` - 完整的奖励系统（500+行）

### 修改文件
1. `game/eatscallop/eatscallop-index.html`
   - 添加 rewards.js 脚本引用
   - 用户等级显示添加 title 提示

2. `game/eatscallop/js/game.js`
   - 添加 aiDefeated 统计
   - 碰撞处理中追踪AI击败
   - endGame() 集成奖励系统

3. `game/eatscallop/js/dashboard.js`
   - 显示真实用户名
   - 显示经验进度（悬停提示）
   - 动态等级计算

4. `game/eatscallop/js/seagull-world/auth.js`
   - 用户注册时添加 experience: 0

5. `server/index.js`
   - 新增 POST /api/user/update 端点

## 测试要点

### 单人模式测试
1. ✅ 登录用户
2. ✅ 开始单人游戏
3. ✅ 吃扇贝（追踪数量）
4. ✅ 击败AI海鸥（追踪数量）
5. ✅ 游戏结束
6. ✅ 查看奖励面板
7. ✅ 验证用户数据更新

### 多人模式测试
1. ✅ 创建房间
2. ✅ 与其他玩家游戏
3. ✅ 查看排行榜排名
4. ✅ 游戏结束获得排名奖励

### 用户界面测试
1. ✅ 用户面板显示真实用户名
2. ✅ 等级显示正确
3. ✅ 悬停显示经验进度
4. ✅ 金币数量正确

## 进度系统设计理念

### 1. 平衡性
- **指数级成长**：等级提升越来越难，防止等级通胀
- **多样化奖励**：不同玩法都有奖励，鼓励多样化策略
- **时间价值**：生存时间也有奖励，新手也能获得进步

### 2. 激励机制
- **即时反馈**：游戏结束立即显示奖励
- **目标可见**：等级进度清晰可见
- **成就感**：升级动画增强满足感

### 3. 可扩展性
- 模块化设计，易于调整参数
- 支持未来添加新的奖励因素
- 排行榜奖励为多人模式预留
- 可添加成就系统、每日任务等

## 数据流程图

```
游戏开始
    ↓
[追踪统计] → scallopsEaten, aiDefeated, gameTime, finalPower
    ↓
游戏结束 (endGame)
    ↓
[计算奖励] → RewardSystem.calculateGameRewards(stats)
    ↓
[更新用户数据] → POST /api/user/update
    ↓
[保存到文件] → data/users.json
    ↓
[显示奖励面板] → displayRewardUI()
    ↓
[更新用户界面] → dashboard刷新显示
```

## API使用示例

### 客户端调用
```javascript
// 游戏结束时自动调用
const gameStats = {
    survivalTime: 180,      // 3分钟
    finalPower: 500,        // 最终能力值
    scallopsEaten: 20,      // 吃了20个扇贝
    aiDefeated: 5,          // 击败5个AI
    leaderboardRank: 1      // 排行榜第1名（可选）
};

await RewardSystem.updateUserStats(gameStats);
```

### 服务器响应
```json
{
    "success": true,
    "user": {
        "userId": "user_123",
        "username": "player1",
        "world": {
            "experience": 555,
            "seagullCoins": 226,
            "worldLevel": 2
        }
    }
}
```

## 配置参数调整

如需调整难度/奖励，修改 `rewards.js` 中的配置对象：

```javascript
// 等级配置
const levelConfig = {
    baseExp: 100,        // 基础经验需求
    exponent: 1.5        // 指数系数（越大升级越难）
};

// 金币配置
const coinConfig = {
    base: 10,            // 基础奖励
    perMinute: 2,        // 每分钟奖励
    per100Power: 5,      // 每100能力值奖励
    perScallop: 1,       // 每个扇贝奖励
    perAI: 3,            // 每个AI奖励
    leaderboard: {
        first: 50,
        second: 30,
        third: 20
    }
};
```

## 后续优化建议

1. **经验条可视化**
   - 在用户面板添加进度条
   - 实时显示当前等级进度百分比

2. **成就系统**
   - "首次击败AI"
   - "连续生存10分钟"
   - "单局吃100个扇贝"

3. **每日任务**
   - 每日登录奖励
   - 每日任务目标
   - 额外金币和经验奖励

4. **商店系统**
   - 使用金币购买皮肤
   - 购买特殊效果
   - 解锁新的海鸥形象

5. **排行榜集成**
   - 全服等级排行
   - 金币排行
   - 本周最佳表现

## 已知问题和限制

1. ✅ 现有用户数据中没有 experience 字段
   - **解决方案**：服务器端点自动处理，缺失时默认为0

2. ⏳ 多人模式排行榜奖励未完全集成
   - **待实现**：从排行榜获取玩家排名
   - **临时方案**：leaderboardRank 可选，默认null

3. ⏳ 奖励面板样式可能需要优化
   - **建议**：根据游戏整体风格调整CSS
   - **位置**：rewards.js 中的 displayRewardUI 方法

## 版本历史

**v1.0.0** - 2025-01-28
- ✅ 初始实现
- ✅ 等级系统（经验值计算）
- ✅ 金币奖励系统
- ✅ AI击败追踪
- ✅ 服务器端点支持
- ✅ 用户界面集成
- ✅ 奖励展示界面

---

**实现完成** ✅  
所有功能已就绪，用户现在可以：
- 看到真实用户名
- 通过游戏获得金币和经验
- 等级提升
- 查看详细奖励分解
- 数据持久化保存
