# 游戏模式切换测试指南 / Game Mode Switching Test Guide

## 测试日期 / Test Date
2025-12-28

## 修复内容 / Fixed Issues

### 1. 多人模式切换回单人模式 ✅
- **修复前**: 多人模式无法可靠切换回单人模式
- **修复后**: 使用 `MultiplayerGame.isConnected()` 可靠检测连接状态

### 2. Restart按钮识别当前模式 ✅
- **修复前**: Restart总是启动单人模式
- **修复后**: 自动识别当前模式（单人/多人）并在相同模式下重启

### 3. 改进的模式检测 ✅
- 新增 `NetworkClient.isConnected()` 方法
- 新增 `MultiplayerGame.isConnected()` 方法
- 新增 `MultiplayerGame.disconnect()` 方法

## 测试步骤 / Test Steps

### 测试1: 单人模式 → 多人模式切换
1. 打开游戏页面
2. 点击 "开始游戏（单人模式）" 按钮
3. 游戏运行后，点击 "🌐 开始多人游戏" 按钮
4. ✅ 应该弹出确认对话框："当前正在单人游戏中，切换到多人模式将重新开始游戏。确定要切换吗？"
5. 点击"确定"
6. ✅ 单人游戏应停止
7. ✅ 如果服务器在运行，应启动多人游戏
8. ✅ 控制台应显示：
   ```
   🔄 Switching from single player to multiplayer...
   ✓ Stopped single player, starting multiplayer...
   ```

### 测试2: 多人模式 → 单人模式切换
**前提**: 需要先启动服务器
```bash
cd c:\git\Seagull\game\eatscallop
npm start
```

1. 点击 "🌐 开始多人游戏" 按钮
2. 等待连接成功（右上角显示延迟信息）
3. 游戏运行后，点击 "开始游戏（单人模式）" 按钮
4. ✅ 应该弹出确认对话框："当前正在多人游戏中，切换到单人模式将重新开始游戏。确定要切换吗？"
5. 点击"确定"
6. ✅ 多人模式应被禁用（不主动断开连接，让服务器超时处理）
7. ✅ 延迟显示应消失
8. ✅ 单人游戏应启动，并且海鸥可以正常移动
9. ✅ 控制台应显示：
   ```
   🔄 Switching from multiplayer to single player...
   ✓ Multiplayer mode disabled
   ✓ Ready to start single player mode...
   ✅ Main player created: { isControllable: true, _isRemotePlayer: false, name: 'xxx' }
   ✅ Single player mode started successfully
   ```

### 测试3: 单人模式下Restart按钮
1. 启动单人游戏
2. 玩一段时间后点击 "Restart" 按钮
3. ✅ 游戏应在单人模式下重启
4. ✅ 控制台应显示：
   ```
   🔄 Restarting game... Mode: Single Player
   ♻️ Restarting in single player mode...
   ```

### 测试4: 多人模式下Restart按钮
1. 启动多人游戏（需要服务器运行）
2. 玩一段时间后点击 "Restart" 按钮
3. ✅ 游戏应断开连接并重新连接
4. ✅ 游戏应在多人模式下重启
5. ✅ 控制台应显示：
   ```
   🔄 Restarting game... Mode: Multiplayer
   ♻️ Restarting in multiplayer mode...
   🔌 Disconnecting from multiplayer...
   ✓ Disconnected from multiplayer
   ```

### 测试5: 游戏结束后Restart按钮
1. 启动游戏（单人或多人模式）
2. 等待游戏结束（Game Over）
3. 点击 Game Over 界面上的 "Restart" 按钮
4. ✅ 游戏应在相同模式下重启

### 测试6: 重复点击按钮保护
1. 启动单人游戏
2. 连续多次点击 "开始游戏（单人模式）" 按钮
3. ✅ 应该没有反应（控制台显示：⚠️ Single player mode already running）
4. 启动多人游戏（如果服务器可用）
5. 连续多次点击 "🌐 开始多人游戏" 按钮
6. ✅ 应该没有反应（控制台显示：⚠️ Multiplayer mode already running）

## 预期结果 / Expected Results

### 控制台日志示例

**单人 → 多人**:
```
🔄 Switching from single player to multiplayer...
✓ Stopped single player, starting multiplayer...
Connecting to multiplayer server...
✓ Connected to server successfully
✓ Received initial game state
```

**多人 → 单人**:
```
🔄 Switching from multiplayer to single player...
✓ Multiplayer mode disabled
✓ Ready to start single player mode...
✅ Main player created: { isControllable: true, _isRemotePlayer: false, ... }
✅ Single player mode started successfully
```

**单人模式重启**:
```
🔄 Restarting game... Mode: Single Player
♻️ Restarting in single player mode...
```

**多人模式重启**:
```
🔄 Restarting game... Mode: Multiplayer
♻️ Restarting in multiplayer mode...
🔌 Disconnecting from multiplayer...
✓ Disconnected from multiplayer
Connecting to multiplayer server...
```

## 启动服务器 / Start Server

### 方法1: 使用批处理文件（Windows）
```bash
cd c:\git\Seagull\game\eatscallop
start-server.bat
```

### 方法2: 使用npm命令
```bash
cd c:\git\Seagull\game\eatscallop
npm start
```

### 方法3: 使用PowerShell脚本
```powershell
cd c:\git\Seagull\game\eatscallop
.\start-server.ps1
```

## 修改的文件 / Modified Files

1. **game/eatscallop/js/network.js**
   - 新增 `isConnected()` 方法

2. **game/eatscallop/js/multiplayer.js**
   - 新增 `isConnected()` 方法
   - 改进 `disconnect()` 方法
   - 优化 `shutdown()` 方法

3. **game/eatscallop/js/game.js**
   - 改进 `startGame()` 函数的多人模式检测
   - 改进 `startMultiplayer()` 函数的单人模式检测
   - 完全重写 `restartGame()` 函数以识别当前模式

## 已知问题 / Known Issues

无 / None

## 下一步 / Next Steps

- ✅ 代码修复完成
- ⏳ 需要实际测试验证（需要手动测试）
- ⏳ 如有问题，根据测试结果进一步调整

---

**版本**: v1.0  
**作者**: GitHub Copilot  
**最后更新**: 2025-12-28
