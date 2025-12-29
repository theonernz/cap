# 动态游戏加载系统 (Dynamic Game Loading System)

## 概述 (Overview)

海鸥世界游戏平台现在支持动态游戏加载。新游戏只需添加到配置文件中，游戏大厅就会自动集成。

## 架构 (Architecture)

### 1. 配置文件 (Configuration)
**位置**: `game/config/games.ini`

```ini
[games]
list = eatscallop, island-adventure, battle-royale

[eatscallop]
path = game/eatscallop
enabled = true
featured = true

[island-adventure]
path = game/island-adventure
enabled = false
comingSoon = true
```

### 2. 游戏清单 (Game Manifest)
每个游戏目录需要包含 `manifest.json` 文件：

**示例**: `game/eatscallop/manifest.json`

```json
{
  "gameId": "eatscallop",
  "name": {
    "zh": "海鸥吃扇贝",
    "en": "Seagull Eat Scallops"
  },
  "description": {
    "zh": "控制你的海鸥在大海中吃扇贝...",
    "en": "Control your seagull to eat scallops..."
  },
  "icon": "🦅",
  "badge": {
    "text": { "zh": "热门", "en": "Hot" },
    "icon": "🔥",
    "type": "featured"
  },
  "version": "1.12",
  "status": "active",
  "stats": {
    "rating": 4.8,
    "showOnlinePlayers": true
  },
  "paths": {
    "entry": "game/eatscallop/eatscallop-index.html",
    "manifest": "game/eatscallop/manifest.json"
  },
  "features": {
    "multiplayer": true,
    "roomSystem": true,
    "ranking": true
  }
}
```

### 3. 核心组件 (Core Components)

#### 服务端 API (Server API)
**路由**: `GET /api/games`
**文件**: `server/index.js`

- 读取 `game/config/games.ini` 获取游戏列表
- 加载每个游戏的 `manifest.json`
- 返回所有已启用或即将推出的游戏信息

#### 客户端加载器 (Client Loader)
**文件**: `general/js/game-loader.js`

**类**: `GameLoader`
- `loadGames()` - 从 `/api/games` 获取游戏列表
- `generateGameCard(game)` - 根据 manifest 生成游戏卡片 HTML
- `renderGames(containerId)` - 渲染所有游戏到指定容器

#### 游戏大厅 (Game Hall)
**文件**: `game/game-index.html`

```javascript
const gameLoader = new GameLoader();
await gameLoader.renderGames('gamesGridContainer');
```

## 添加新游戏 (Adding New Games)

### 步骤 1: 创建游戏目录
```
game/
  └── your-new-game/
      ├── manifest.json
      ├── index.html
      └── ... (游戏文件)
```

### 步骤 2: 创建 manifest.json
参考 `game/eatscallop/manifest.json` 的结构

### 步骤 3: 添加到配置
编辑 `game/config/games.ini`:

```ini
[games]
list = eatscallop, island-adventure, battle-royale, your-new-game

[your-new-game]
path = game/your-new-game
enabled = true
```

### 步骤 4: 启动服务器
```bash
node server/index.js
```

游戏大厅会自动显示新游戏！

## 游戏状态 (Game Status)

### Active (已激活)
- `status: "active"`
- `enabled: true` in games.ini
- 显示游戏入口和功能

### Coming Soon (即将推出)
- `status: "development"`
- `comingSoon: true` in games.ini
- 显示"开发中"徽章和预期发布日期

### Disabled (已禁用)
- `enabled: false` in games.ini
- 不会在游戏大厅中显示

## 特殊功能支持 (Special Features)

### 房间系统 (Room System)
如果游戏支持房间系统，在 manifest.json 中设置：

```json
"features": {
  "roomSystem": true
}
```

游戏卡片会自动显示房间列表和创建房间按钮。

### 在线玩家统计 (Online Players)
```json
"stats": {
  "showOnlinePlayers": true
}
```

会显示实时在线玩家数量。

## 当前游戏列表 (Current Games)

1. **海鸥吃扇贝** (Seagull Eat Scallops) - ✅ Active
   - 多人 IO 游戏
   - 房间系统
   - 排行榜

2. **海鸥岛屿冒险** (Seagull Island Adventure) - 🔜 Coming Q1 2026
   - 开放世界
   - 生存建造

3. **海鸥大乱斗** (Seagull Battle Royale) - 🔜 Coming Q2 2026
   - PvP 对战
   - 技能系统

## 技术细节 (Technical Details)

### 文件结构
```
game/
  ├── config/
  │   └── games.ini              # 游戏列表配置
  ├── eatscallop/
  │   └── manifest.json          # 游戏清单
  ├── island-adventure/
  │   └── manifest.json
  └── battle-royale/
      └── manifest.json

general/js/
  └── game-loader.js             # 动态加载器

server/
  └── index.js                   # API: GET /api/games
```

### 依赖
- ConfigParser (server/ConfigParser.js) - INI 文件解析
- Logger (server/Logger.js) - 日志记录

## 未来扩展 (Future Enhancements)

- [ ] 游戏更新通知
- [ ] 游戏内购和成就系统
- [ ] 游戏分类和标签过滤
- [ ] 搜索功能
- [ ] 用户游戏收藏
- [ ] 游戏推荐算法

---

**版本**: v1.13  
**最后更新**: 2025-12-29  
**作者**: Seagull World Team
