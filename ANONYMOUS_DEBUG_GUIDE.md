# 匿名模式调试指南 / Anonymous Mode Debug Guide

## 问题 / Issue
匿名单人模式下，游戏对象（海鸥、玩家）不显示
Anonymous single-player mode does not display game objects (seagulls, players)

## 调试步骤 / Debug Steps

### 1. 打开浏览器控制台 / Open Browser Console
- 按 F12 键打开开发者工具
- 点击 "Console" 标签
- Press F12 to open developer tools
- Click the "Console" tab

### 2. 测试匿名模式 / Test Anonymous Mode
1. 确保**未登录**（如果已登录，请先登出）
   Make sure you are **NOT logged in** (logout if already logged in)

2. 点击主页上的"匿名试玩"按钮
   Click the "Anonymous Play" button on the homepage

3. 在游戏大厅页面，点击"匿名开始"按钮
   In the game hall page, click the "Start Anonymously" button

### 3. 查看控制台输出 / Check Console Output

应该看到以下日志（按顺序）：
You should see the following logs (in order):

```
🎮 Game init - Anonymous mode: true
🐚 Created 30 scallops
👥 Creating 6 players (including 1 local)...
✅ Created 1 players
🤖 Creating 14 AI seagulls...
✅ Created 14 AI seagulls
🎲 Anonymous mode: Selecting random AI seagull from 14 available
✅ Anonymous mode: Assigned control to AI seagull (Power: X, Size: Y)
📊 Final counts - Players: 1, AI Seagulls: 13
✅ Local player found: SeagullXX at (x, y)
📊 Init complete: { players: 1, aiSeagulls: 13, scallops: 30 }
🎨 First draw - mainPlayer: SeagullXX
🎨 MainPlayer details: { name: 'SeagullXX', isControllable: true, isDead: false, ... }
🎨 Drawing entities: { players: 1, aiSeagulls: 13, scallops: 30 }
```

### 4. 可能的错误信息 / Possible Error Messages

#### A. 如果看到 "❌ No mainPlayer found!"
```
❌ No mainPlayer found! Players array: []
```
**问题**：玩家数组为空，没有创建玩家实体
**Problem**: Players array is empty, no player entity created

#### B. 如果看到 "❌ DrawFrame: mainPlayer is null!"
```
❌ DrawFrame: mainPlayer is null!
```
**问题**：drawGame()找不到mainPlayer
**Problem**: drawGame() cannot find mainPlayer

#### C. 如果看到 "⚠️ DrawFrame: mainPlayer is dead!"
```
⚠️ DrawFrame: mainPlayer is dead!
```
**问题**：玩家已死亡，不会绘制实体
**Problem**: Player is dead, entities won't be drawn

#### D. 如果看到 "❌ No AI seagulls available for anonymous mode!"
```
❌ No AI seagulls available for anonymous mode!
```
**问题**：没有AI海鸥可供选择
**Problem**: No AI seagulls available for selection

### 5. 报告问题 / Report Issue

请复制控制台中的**所有日志**并发送给开发者：
Please copy **ALL console logs** and send to the developer:

1. 从"🎮 Game init"开始的所有日志
   All logs starting from "🎮 Game init"

2. 任何红色的错误信息
   Any error messages in red

3. 浏览器和操作系统信息
   Browser and OS information

## 预期行为 / Expected Behavior

**正常情况下**：
**Normal case**:
- 应该创建1个玩家（从AI海鸥转换而来）
  Should create 1 player (converted from AI seagull)
- 应该创建13个AI海鸥（14个减去1个转换为玩家的）
  Should create 13 AI seagulls (14 minus 1 converted to player)
- 应该创建30个扇贝
  Should create 30 scallops
- 应该能看到所有实体在画面上
  Should see all entities on the screen
- mainPlayer应该是可控制的（isControllable: true）
  mainPlayer should be controllable (isControllable: true)
- mainPlayer应该没有死亡（isDead: false）
  mainPlayer should not be dead (isDead: false)

## 技术细节 / Technical Details

### 初始化流程 / Initialization Flow
1. `Game.startGame()` - 开始游戏
2. `Game.init()` - 初始化游戏状态
3. 检查匿名模式 - `PlayerIdentity.isAnonymousMode()`
4. 创建实体 - `EntityManager.init()`
5. 在匿名模式下：
   - 不创建新玩家
   - 从AI海鸥中随机选择一个
   - 设置 `isControllable = true`
   - 将其添加到玩家列表
   - 从AI列表中移除
6. `Game.drawGame()` - 绘制游戏
7. `DrawingSystem.drawFrame()` - 绘制实体

### 绘制条件 / Drawing Conditions
实体只有在以下条件下才会被绘制：
Entities will only be drawn if:
- `mainPlayer` 不为 null (not null)
- `mainPlayer.isDead` 为 false (is false)

如果不满足这些条件，画面将只显示天空背景（浅蓝色）
If these conditions are not met, only the sky background (light blue) will be shown

## 更新日志 / Changelog
- 2024-01-XX: 添加详细调试日志到 game.js 和 drawing.js
  Added detailed debug logging to game.js and drawing.js
