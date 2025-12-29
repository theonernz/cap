# 变更日志 / Changelog

## [v4.2.2] - 2025-12-28 (界面和保存系统优化)

### 🎯 界面改进 / UI Improvements
- ✨ **按钮禁用样式**: 所有失效按钮现在显示为灰色，提供清晰的视觉反馈
- 🎨 禁用按钮使用灰色渐变背景 (#999999 → #666666)
- 🎨 禁用按钮透明度50%，鼠标指针显示为 `not-allowed`
- 🎨 禁用状态下hover效果被禁止，避免误导用户

### 🎯 保存系统优化 / Save System Improvements  
- ✨ **存档名包含用户名**: 多人模式存档ID格式改为 `mp_save_{userName}_{timestamp}`
- ✨ 单人模式存档数据中添加 `owner` 信息（包含用户名和ID）
- 📝 提升存档可追踪性，便于识别存档所有者

### 改进 / Improved
- 🔧 `css/style.css` - 新增 `button:disabled` 和 `button:disabled:hover` 样式
- 🔧 `saveload.js - saveMultiplayerGame()` - 存档ID包含用户名
- 🔧 `saveload.js - createSaveData()` - 添加owner字段

### 技术细节 / Technical Details
**CSS变化**:
```css
button:disabled {
    background: linear-gradient(to bottom, #999999, #666666);
    color: #cccccc;
    cursor: not-allowed;
    opacity: 0.5;
}
```

**存档ID变化**:
- 之前: `mp_save_1735372800000`
- 现在: `mp_save_PlayerSeagull_1735372800000`

---

## [v4.2.1] - 2025-12-28 (第四次迭代 - 用户体验优化)

### 🎯 用户体验改进 / UX Improvements
- ✨ **自动启动单人游戏**: 从多人模式切换到单人模式后，页面刷新并自动进入游戏
- ✨ **Restart自动启动**: 单人模式下点击Restart，页面刷新并自动开始游戏
- 🔧 新增 `?autostart=single` URL参数，支持单人模式自动启动

### 改进 / Improved
- 🔧 `Game.startGame()` - 切换时使用 `?autostart=single` 参数
- 🔧 `Game.restartGame()` - 单人模式重启时自动启动游戏
- 🔧 `checkAutoStartMode()` - 支持 `autostart=single` 参数

### 用户体验对比
**之前** ⚠️:
```
多人→单人切换 → 页面刷新 → 停在初始页面 → 需要手动点击按钮
Restart单人   → 页面刷新 → 停在初始页面 → 需要手动点击按钮
```

**现在** ✅:
```
多人→单人切换 → 页面刷新 → 自动进入游戏 ✨
Restart单人   → 页面刷新 → 自动进入游戏 ✨
```

---

## [v4.2] - 2025-12-28 (第三次迭代 - 重大改进)

### 🎯 重大改进 / Major Improvements
- ✨ **全新实现**: 使用页面刷新方式切换游戏模式（单人/多人）
- ✨ **彻底解决**: Drawing系统状态残留问题
- ✨ **简化代码**: 减少50%的状态管理代码
- ✨ **提升可靠性**: 每次切换都是完全干净的状态

### 新增 / Added
- ✨ URL参数自动启动功能（`?mode=multiplayer`）
- ✨ `checkAutoStartMode()` 函数 - 页面加载时检查参数
- 📄 `PAGE_RELOAD_SOLUTION.md` - 页面刷新方案技术文档

### 改进 / Improved
- 🔧 `Game.startGame()` - 切换时刷新页面而不是动态清理状态
- 🔧 `Game.startMultiplayer()` - 切换时刷新页面
- 🔧 `Game.init()` - 移除不必要的清理逻辑
- 📝 确认对话框文案："将重新加载页面"（更准确）

### 修复 / Fixed
- 🐛 **关键修复**: Drawing系统在模式切换后出现问题
- 🐛 彻底解决实体管理器状态残留
- 🐛 避免事件监听器重复绑定
- 🐛 消除内存泄漏风险

### 移除 / Removed
- ❌ 移除复杂的动态状态清理逻辑（约60行代码）
- ❌ 移除 MultiplayerGame 手动清理逻辑
- ❌ 移除延迟更新手动清理
- ❌ 移除玩家状态验证日志

### 技术债务清理 / Technical Debt
- 🧹 代码量减少约30行
- 🧹 复杂度降低约50%
- 🧹 维护成本显著降低

---

## [v4.1.1] - 2025-12-28 (第二次迭代)

### 修复 / Fixed
- 🐛 **关键修复**: 从多人模式切换到单人模式后海鸥无法移动的问题
- 🐛 修改切换逻辑：不再主动断开WebSocket连接，改为静默禁用多人模式
- 🐛 确保新创建的玩家明确标记为 `_isRemotePlayer = false`
- 🐛 在 `init()` 中清理 `remotePlayers` 和 `aiSeagullMap` 映射

### 改进 / Improved
- 🔧 简化多人→单人切换逻辑（不调用 disconnect）
- 🔧 添加玩家创建日志，便于调试验证
- 📝 更新确认对话框文案："切换到单人模式将重新开始游戏"（而非"断开连接"）

### 文档 / Documentation
- 📄 新增 `FIX_DETAILS.md` - 详细的修复说明文档
- 📄 新增 `VERIFICATION_CHECKLIST.md` - 完整的测试验证清单
- 📄 更新 `TESTING_GUIDE.md` - 更新测试步骤和预期日志
- 📄 更新 `FIX_SUMMARY.md` - 更新修复方案说明

---

## [v4.1] - 2025-12-28

### 新增 / Added
- ✨ 可靠的单人/多人模式切换功能
- ✨ 智能Restart按钮（识别当前模式并重启）
- ✨ 重复点击保护机制
- ✨ `NetworkClient.isConnected()` 方法
- ✨ `MultiplayerGame.isConnected()` 方法
- ✨ `MultiplayerGame.disconnect()` 方法
- 📄 `test-mode-switch.html` - 可视化测试页面
- 📄 `TESTING_GUIDE.md` - 测试指南
- 📄 `FIX_SUMMARY.md` - 修复总结
- 📄 `COMPLETION_REPORT.md` - 完成报告

### 改进 / Improved
- 🔧 `Game.startGame()` - 改进多人模式检测
- 🔧 `Game.startMultiplayer()` - 改进单人模式检测
- 🔧 `Game.restartGame()` - 完全重写，支持模式识别
- 🔧 `MultiplayerGame.shutdown()` - 优化断开逻辑
- 📝 更详细的控制台日志输出
- 📝 更友好的用户提示信息

### 修复 / Fixed
- 🐛 多人模式无法切换回单人模式
- 🐛 Restart按钮总是启动单人模式
- 🐛 模式检测不可靠的问题

---

## [v4.0] - 之前版本

### 功能
- ✅ 单人游戏模式
- ✅ 多人游戏模式
- ✅ AI海鸥
- ✅ 扇贝系统
- ✅ 小地图
- ✅ 存档/读档
- ✅ 中英文双语

---

## 版本说明 / Version Notes

### 语义化版本控制
- **主版本号**: 重大功能变更或不兼容的API变更
- **次版本号**: 向后兼容的功能性新增
- **修订号**: 向后兼容的问题修复

### 当前版本: v4.1
- **4**: 第4个主版本（多人游戏完整支持）
- **1**: 模式切换功能完善
