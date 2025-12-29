# 🦅 海鸥吃扇贝 - 独立游戏包

**游戏版本:** v4.2  
**类型:** 多人在线游戏  
**状态:** ✅ 可独立运行

---

## 🆕 最新更新 (2025-12-29)

### ✅ v4.3 - 变质扇贝系统完整实现
- **🦠 新功能**: 完整的变质-腐烂系统
  - 变质扇贝自动生成（2-3%概率）
  - 30-40秒后自动腐烂消失
  - 吃掉后扣除10倍能力值
  - 骷髅标志☠️和红色虚线警告
- **⚙️ 配置优化**: 单人/多人模式差异化参数
- **📚 文档完善**: 新增详细技术文档和测试指南
  - `SPOILED_SCALLOP_SYSTEM.md` - 完整技术文档
  - `TESTING_SPOILED_SYSTEM.md` - 测试验证指南

### ✅ v4.2 - 页面刷新式模式切换（重大改进）
- **🎯 全新方案**: 使用页面刷新方式切换游戏模式，彻底解决状态残留问题
- **🐛 修复**: Drawing系统在模式切换后出现的问题
- **✨ 新功能**: URL参数自动启动（`?mode=multiplayer`）
- **🧹 代码优化**: 减少50%的状态管理代码，降低复杂度

### ✅ v4.1.1 - 关键Bug修复
- **🐛 修复**: 从多人模式切换到单人模式后海鸥无法移动的问题
- **🔧 优化**: 不再主动断开连接，改为静默禁用多人模式
- **✅ 验证**: 确保新创建的玩家完全可控（`_isRemotePlayer = false`）

### ✅ v4.1 - 模式切换功能完善
- **单人 ↔ 多人模式切换**: 可靠的模式切换，带确认对话框
- **智能Restart按钮**: 自动识别当前模式并在相同模式下重启
- **重复点击保护**: 防止误操作和重复启动
- **详细日志输出**: 便于调试和问题诊断

### 📚 新增文档
- **`SPOILED_SCALLOP_SYSTEM.md`** - 变质扇贝系统技术文档 ⭐ NEW
- **`TESTING_SPOILED_SYSTEM.md`** - 变质系统测试指南 ⭐ NEW
- **`PAGE_RELOAD_SOLUTION.md`** - 页面刷新方案技术文档
- **`test-mode-switch.html`** - 可视化测试页面
- **`TESTING_GUIDE.md`** - 详细测试指南
- **`VERIFICATION_CHECKLIST.md`** - 测试验证清单
- **`FINAL_REPORT.md`** - 最终完成报告

### 🔧 技术改进
- 新增 `makeSpoiled()` 方法 - 扇贝变质处理
- 新增 `updateSpoiledScallops()` 方法 - 生命周期管理
- 优化 `cleanupDeadEntities()` - 统一清理腐烂扇贝
- 完善 `createScallop()` - 集成变质概率判断
- 服务器端配置 - 多人模式专属参数

**查看完整更新**: 见 [`SPOILED_SCALLOP_SYSTEM.md`](SPOILED_SCALLOP_SYSTEM.md) 和 [`CHANGELOG.md`](CHANGELOG.md)

---

## 📁 完整游戏结构

```
eatscallop/
├── eatscallop-index.html          # 游戏入口页面
├── css/
│   └── style.css                  # 游戏样式
├── js/                            # 游戏客户端脚本
│   ├── game.js                    # 游戏核心逻辑
│   ├── entities.js                # 实体系统（海鸥、扇贝）
│   ├── ai.js                      # AI海鸥
│   ├── collision.js               # 碰撞检测
│   ├── drawing.js                 # 渲染引擎
│   ├── ui.js                      # 游戏UI
│   ├── minimap.js                 # 小地图
│   ├── multiplayer.js             # 多人模式
│   ├── network.js                 # 网络通信
│   ├── saveload.js                # 存档系统
│   ├── serverConfig.js            # 服务器配置
│   ├── version.js                 # 版本信息
│   ├── main.js                    # 主入口
│   └── enhancements.js            # 增强功能
├── server/                        # 游戏服务器
│   ├── index.js                   # 服务器入口
│   ├── GameServer.js              # 游戏服务器逻辑
│   └── config.js                  # 服务器配置
└── module/                        # 扩展模块（预留）
```

---

## 🚀 快速启动

### 方法1: 独立游戏服务器（推荐）

```powershell
# 进入游戏目录
cd c:\git\Seagull\game\eatscallop

# 启动游戏服务器
node server/index.js
```

**访问地址:** `http://localhost:3000/eatscallop-index.html`

### 方法2: 从海鸥世界主页启动

```powershell
# 返回根目录
cd c:\git\Seagull

# 启动主服务器
node server/index.js
```

**访问地址:** `http://localhost:3000/game/eatscallop/eatscallop-index.html`

---

## 🎮 游戏玩法

### 基本操作
- **移动:** 鼠标控制海鸥方向
- **目标:** 吃扇贝增强能力
- **规则:** 大海鸥可以吃小海鸥

### 扇贝类型
- 🐚 **小扇贝** (6px) - 能量值: 5
- 🐚 **中扇贝** (10px) - 能量值: 15
- 🐚 **大扇贝** (16px) - 能量值: 50
- 👑 **扇贝王** (24px) - 能量值: 150

### 游戏模式
1. **单人模式** - 与AI海鸥竞争
2. **多人模式** - 与真实玩家对战
3. **观察者模式** - 观看游戏不参与

---

## ⚙️ 配置选项

### 客户端配置 (js/serverConfig.js)
```javascript
const SERVER_CONFIG = {
    host: 'localhost',           // 服务器地址
    port: 3000,                  // 端口
    autoConnect: false,          // 自动连接
    reconnectDelay: 3000,        // 重连延迟
    maxReconnectAttempts: 5      // 最大重连次数
};
```

### 服务器配置 (server/config.js)
```javascript
module.exports = {
    port: 3000,                  // 监听端口
    tickRate: 60,                // 游戏刷新率
    worldWidth: 5000,            // 世界宽度
    worldHeight: 5000,           // 世界高度
    maxPlayers: 50,              // 最大玩家数
    aiSeagullCount: 50,          // AI海鸥数量
    scallopCount: 800            // 扇贝数量
};
```

---

## 📦 依赖要求

### Node.js 依赖
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "uuid": "^9.0.1"
  }
}
```

### 安装依赖
```powershell
# 在游戏目录
npm install

# 或者在根目录（共享依赖）
cd c:\git\Seagull
npm install
```

---

## 🌐 多人模式

### 启动服务器
```powershell
cd c:\git\Seagull\game\eatscallop
node server/index.js
```

### 客户端连接
1. 打开游戏页面
2. 勾选"启用多人模式"
3. 输入服务器地址：`ws://localhost:3000`
4. 开始游戏

### 网络游戏
- 服务器地址改为：`ws://YOUR_IP:3000`
- 其他玩家可通过局域网连接

---

## 💾 存档系统

### 本地存档（单人模式）
- 自动保存游戏状态
- 支持多个存档槽
- 数据存储在 localStorage

### 账号存档（需登录）
- 登录海鸥世界账号
- 云端同步存档
- 跨设备访问

---

## 🐛 常见问题

### Q: 服务器启动失败
**A:** 检查端口3000是否被占用
```powershell
# 查看端口占用
netstat -ano | findstr :3000

# 杀死进程
taskkill /PID <进程ID> /F
```

### Q: 多人模式连接失败
**A:** 
1. 确认服务器正在运行
2. 检查防火墙设置
3. 验证服务器地址正确

### Q: 游戏卡顿
**A:** 
1. 降低扇贝密度
2. 减少AI海鸥数量
3. 关闭小地图

### Q: 存档丢失
**A:** 
1. 检查浏览器是否清除了缓存
2. 确认登录状态
3. 查看 localStorage 是否可用

---

## 🔧 开发调试

### 调试模式
按 `F12` 打开浏览器开发者工具

### 有用的控制台命令
```javascript
// 查看游戏状态
console.log(game);

// 查看玩家信息
console.log(player);

// 查看所有扇贝
console.log(scallops);

// 启用调试模式
window.DEBUG = true;
```

### 性能监控
游戏自带FPS显示和性能统计

---

## 📊 游戏数据

### 世界配置
- 世界尺寸: 5000x5000px
- 扇贝数量: 800个
- AI海鸥: 50只
- 最大玩家: 50人

### 成长系统
- 初始能量: 100
- 吃扇贝获得能量
- 能量决定海鸥大小
- 大海鸥可吃小海鸥

### 排行榜
- 实时更新
- 显示前10名
- 根据能量值排序

---

## 🎯 游戏特色

### ✨ 独特功能
1. **扇贝成长系统** - 扇贝会随时间成长
2. **扇贝王机制** - 稀有强大的扇贝王
3. **AI海鸥** - 智能AI提供挑战
4. **小地图** - 实时显示世界全貌
5. **多人对战** - 支持多人在线

### 🎨 视觉效果
- 流畅的动画
- 粒子效果
- 能量转移指示器
- 成长动画

---

## 📝 版本历史

### v4.0 (2025-12-28)
- ✅ 重组为独立游戏包
- ✅ 包含完整服务器
- ✅ 支持独立运行
- ✅ 完善文档

### v3.2 (2025-12-27)
- ✅ 修复认证系统
- ✅ 优化多人模式
- ✅ 改进存档系统

### v3.0 (2025-12-26)
- ✅ 添加海鸥世界集成
- ✅ 账号系统
- ✅ 云存档

---

## 📞 技术支持

### 游戏问题
- 查看根目录的 `README.md`
- 参考 `COMPLETE_USER_GUIDE.md`

### 多人模式
- 参考 `MULTIPLAYER_README.md`
- 查看 `CLIENT_CONNECTION_GUIDE.md`

### API 文档
- 参考源代码注释
- 查看 `DOCUMENTATION_INDEX.md`

---

## 🎓 学习资源

### 代码结构
1. **客户端** - 所有 `js/*.js` 文件
2. **服务器** - `server/` 目录
3. **样式** - `css/style.css`

### 扩展开发
- 添加新功能到 `module/` 目录
- 修改配置文件
- 创建新的游戏模式

---

## 📜 许可证

本游戏为海鸥世界项目的一部分。

© 2025 海鸥世界 Seagull World

---

## 🚀 开始游戏

```powershell
# 1. 进入游戏目录
cd c:\git\Seagull\game\eatscallop

# 2. 安装依赖（首次）
npm install

# 3. 启动服务器
node server/index.js

# 4. 打开浏览器
# 访问: http://localhost:3000/eatscallop-index.html
```

**祝游戏愉快！** 🎮🦅
