# 🎮 海鸥吃扇贝 - 快速参考卡 v4.2.2
# Seagull Eat Scallops - Quick Reference Card v4.2.2

---

## 🚀 快速启动 / Quick Start

### 单人模式 / Single Player
```
打开: eatscallop-index.html
点击: "开始游戏（单人模式）" 按钮
```

### 多人模式 / Multiplayer
```bash
# 1. 启动服务器
cd c:\git\Seagull\game\eatscallop
npm start

# 2. 打开游戏
浏览器访问: eatscallop-index.html
点击: "🌐 开始多人游戏" 按钮
```

### URL 直接启动 / URL Auto-Start
```
手动启动单人: eatscallop-index.html
自动启动单人: eatscallop-index.html?autostart=single
自动启动多人: eatscallop-index.html?mode=multiplayer
```

---

## 🔄 模式切换 / Mode Switching

### 工作原理
```
点击切换按钮 → 确认对话框 → 页面刷新 → 自动启动目标模式 ✨
```

### 切换时间
- 单人 → 多人: ~0.4秒（含自动启动）
- 多人 → 单人: ~0.3秒（含自动启动）

### 注意事项
⚠️ 切换会重新加载页面（当前进度会丢失）
✅ 切换后自动进入游戏，无需手动点击

---

## 🎮 游戏控制 / Game Controls

| 操作 | 说明 |
|------|------|
| 左键点击 | 移动到目标位置 |
| 右键拖拽 | 加速移动 |
| 空格键 | 暂停/继续 |
| R 键 | 重新开始（保持当前模式）|

---

## 🐛 问题排查 / Troubleshooting

### 海鸥无法移动？
✅ v4.2 已彻底解决（使用页面刷新切换）

### 多人模式连接失败？
1. 确认服务器已启动: `npm start`
2. 检查端口3000是否被占用
3. 查看控制台错误信息

### 画面渲染异常？
✅ v4.2 已解决（Drawing系统完全重置）

---

## 📊 版本信息 / Version Info

- **当前版本**: v4.2.1
- **发布日期**: 2025-12-28
- **核心改进**: 页面刷新式模式切换 + 自动启动单人游戏

---

## 📖 查看文档 / Documentation

| 文档 | 用途 |
|------|------|
| `PAGE_RELOAD_SOLUTION.md` | 技术方案详解 |
| `TESTING_GUIDE.md` | 测试指南 |
| `README.md` | 项目说明 |
| `CHANGELOG.md` | 版本历史 |

---

## ✅ 功能清单 / Features

- ✅ 单人游戏模式
- ✅ 多人游戏模式
- ✅ 可靠的模式切换（页面刷新）
- ✅ AI 海鸥
- ✅ 扇贝系统
- ✅ 小地图
- ✅ 存档/读档
- ✅ 中英文双语
- ✅ 按钮禁用样式（v4.2.2）
- ✅ 存档名包含用户名（v4.2.2）

---

## 🎨 UI/UX 特性 / UI Features (v4.2.2)

### 按钮状态
- ✅ **禁用按钮显示灰色** - 清晰的视觉反馈
- ✅ 鼠标指针显示 `not-allowed`
- ✅ 透明度50%，避免误操作

### 存档系统
- ✅ **存档ID包含用户名** - 便于识别
- ✅ 格式: `mp_save_{userName}_{timestamp}`
- ✅ 示例: `mp_save_PlayerSeagull_1735372800000`

---

**快速帮助**: 按 F12 打开控制台查看日志
