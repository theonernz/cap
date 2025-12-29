# 🦅 Seagull Eat Scallops - 多人在线游戏

一个基于 Node.js 和 WebSocket 的实时多人在线海鸥吃扇贝游戏。

[![Status](https://img.shields/badge/status-stable-green.svg)](https://github.com)
[![Version](https://img.shields/badge/version-1.0.8-blue.svg)](https://github.com)
[![License](https://img.shields/badge/license-MIT-orange.svg)](https://github.com)
[![Multiplayer](https://img.shields/badge/multiplayer-working-success.svg)](https://github.com)

---

## 🎯 版本选择

### 🎮 单机版 (Standalone)
- **文件**: `index-standalone.html`
- **特点**: 无需服务器，双击即玩
- **适合**: 个人游戏，离线使用
- [快速开始 →](#单机版使用)

### 🌐 服务器版 (Server)  
- **文件**: `index.html`
- **特点**: 支持多人联机（最多10人）
- **适合**: 在线竞技，局域网派对
- [快速开始 →](#服务器版使用)

📖 **详细对比**: 查看 [`VERSION_SPLIT_GUIDE.md`](VERSION_SPLIT_GUIDE.md)

---

## ✨ 特性

### 🎮 游戏模式
- **单人模式** - 与 AI 玩家和海鸥竞争
- **多人模式** - 实时在线多人游戏，最多 10 人

### 🌟 核心功能
- ✅ 流畅的鼠标控制系统
- ✅ 真实的物理惯性模拟
- ✅ 智能 AI 行为系统
- ✅ 实时能力转移机制
- ✅ 完整的扇贝生态系统
- ✅ 小地图导航
- ✅ 保存/加载游戏（单人模式）
- ✅ 多人模式保存/载入（最多3个存档，含位置，先死亡再恢复）⭐ 更新
- ✅ 中英文双语支持

### 🔧 最新修复（2024-12-27）
1. ✅ **多人模式保存/载入（最多3个存档）** - 保存所有静态数据，载入时先死亡再复活
2. ✅ **位置精确恢复** - 载入时恢复保存时的精确位置
3. ✅ **死亡复活机制** - 载入前清除当前状态，500ms后复活
4. ✅ **命名存档系统** - 支持自定义存档名称和管理
5. ✅ **扇贝显示正常** - 所有类型正确渲染
6. ✅ **小地图工作正常** - 实时显示所有实体
7. ✅ **能力转移生效** - 服务器权威碰撞检测

---

## 🚀 快速开始

### 🎮 单机版使用

#### 无需安装，即开即玩！
```bash
1. 双击 index-standalone.html
2. 点击 "Start Game"
3. 开始游戏！
```

**特点**:
- ✅ 无需Node.js
- ✅ 无需服务器
- ✅ 支持保存/加载
- ✅ 完整AI系统

---

### 🌐 服务器版使用

#### ⚠️ 重要提示
**多人游戏模式需要先启动服务器！服务器必须保持运行！**

### 环境要求
- Node.js 14.0+
- 现代浏览器（Chrome、Edge、Firefox）

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd Seagull
```

#### 2. 安装依赖
```bash
npm install
```

#### 3. 启动服务器（多人模式必需！）

**方法 1 - 使用批处理文件（推荐）：**
双击 `start-server.bat` 文件

**方法 2 - 使用命令行：**
```bash
npm start
```

**⚠️ 重要：保持服务器终端窗口打开！关闭它会停止服务器。**

你应该看到：
```
Seagull Multiplayer Server running on port 3000
Game URL: http://localhost:3000
```

#### 4. 打开游戏
浏览器访问：http://localhost:3000

#### 5. 选择游戏模式
- **Single Player** - 单人模式（无需服务器，也可在服务器版使用）
- **Multiplayer** - 多人模式（需要服务器运行，仅服务器版）

---
- **"Failed to connect"错误** → 确保服务器正在运行（步骤3）
- **其他问题** → 查看 `TROUBLESHOOTING.md`
- **连接诊断** → 访问 `http://localhost:3000/diagnosis.html`

---

## 🎯 游戏玩法

### 基本操作
- **左键拖拽** - 控制海鸥移动
- **右键按住** - 加速飞行
- **滚轮** - 缩放视图
- **空格** - 快速停止
- **M** - 切换小地图

### 游戏目标
1. 吃扇贝增加能力值
2. 扑食弱小的海鸥
3. 避开强大的敌人
4. 成为最强海鸥！

### 扇贝类型
| 类型 | 能力值 | 颜色 |
|------|--------|------|
| 小 | +5 | 浅蓝 |
| 中 | +10 | 钢蓝 |
| 大 | +15 | 道奇蓝 |

### 能力转移
- **强者** - 获得弱者能力的 8%
- **弱者** - 损失自己能力的 10%
- **条件** - 至少 20% 能力差异
- **冷却** - 500ms

---

## 🌐 多人游戏

### 本地测试
1. 打开多个浏览器窗口
2. 访问 http://localhost:3000
3. 点击 "🌐 Start Multiplayer"

### 局域网游戏
1. 查看服务器 IP
   ```bash
   ipconfig  # Windows
   ifconfig  # Linux/Mac
   ```

2. 其他设备访问
   ```
   http://[服务器IP]:3000
   ```

3. 配置防火墙
   ```powershell
   netsh advfirewall firewall add rule name="Seagull" dir=in action=allow protocol=TCP localport=3000
   ```

---

## 📊 技术架构

### 服务器端
- **Node.js** - 运行时环境
- **Express** - Web 服务器
- **WebSocket** - 实时通信
- **Game Loop** - 60Hz 游戏逻辑，20Hz 状态同步

### 客户端
- **Canvas API** - 游戏渲染
- **WebSocket Client** - 网络通信
- **Entity System** - 实体管理
- **Physics System** - 物理模拟

### 核心系统
```
┌─────────────────────────────────────┐
│         Client (Browser)            │
├─────────────────────────────────────┤
│  UI System    │  Drawing System     │
│  Input System │  Network Client     │
│  Game Logic   │  Entity Manager     │
└──────────────┬──────────────────────┘
               │ WebSocket
┌──────────────┴──────────────────────┐
│         Server (Node.js)            │
├─────────────────────────────────────┤
│  Game Server  │  Collision System   │
│  World State  │  Player Manager     │
│  AI System    │  Network Sync       │
└─────────────────────────────────────┘
```

---

## 📁 项目结构

```
Seagull/
├── server/              # 服务器端
│   ├── index.js         # 服务器入口
│   ├── GameServer.js    # 游戏服务器
│   └── config.js        # 服务器配置
├── js/                  # 客户端 JavaScript
│   ├── game.js          # 游戏主逻辑
│   ├── multiplayer.js   # 多人游戏
│   ├── network.js       # 网络通信
│   ├── drawing.js       # 渲染系统
│   ├── entities.js      # 实体管理
│   ├── collision.js     # 碰撞检测
│   ├── ai.js            # AI 系统
│   ├── minimap.js       # 小地图
│   ├── ui.js            # UI 系统
│   ├── config.js        # 客户端配置
│   └── main.js          # 主入口
├── css/
│   └── style.css        # 样式文件
├── index.html           # 游戏主页
├── test.html            # 测试页面
├── package.json         # 项目配置
└── docs/                # 文档目录
    ├── QUICKSTART.md
    ├── COMPLETE_USER_GUIDE.md
    └── ALL_FIXES_SUMMARY.md
```

---

## ⚙️ 配置

### 服务器配置（server/config.js）
```javascript
module.exports = {
    worldWidth: 3000,           // 世界宽度
    worldHeight: 2000,          // 世界高度
    initialScallopCount: 100,   // 初始扇贝数
    minScallopCount: 50,        // 最少扇贝数
    aiSeagullCount: 10,         // AI 海鸥数量
    maxPlayers: 10,             // 最大玩家数
    tickRate: 60,               // 游戏更新频率
    stateUpdateRate: 20,        // 网络同步频率
    initialPlayerPower: 100     // 初始能力值
};
```

### 客户端配置（js/config.js）
```javascript
const CONFIG = {
    worldWidth: 3000,
    worldHeight: 2000,
    initialPlayerPower: 100,
    scallopCount: 100,
    aiPlayerCount: 5,
    aiSeagullCount: 10,
    enableMiniMap: true,
    enableEnhancedAI: true,
    language: 'en'              // 'en' 或 'cn'
};
```

---

## 🧪 测试

### 访问测试页面
```
http://localhost:3000/test.html
```

### 测试项目
1. ✅ 扇贝显示测试
2. ✅ 小地图功能测试
3. ✅ 能力转移测试
4. ✅ 多人连接测试
5. ✅ 网络延迟测试

### 浏览器控制台调试
```javascript
// 查看游戏对象
console.log(game);

// 查看实体
console.log(EntityManager.scallops);
console.log(EntityManager.players);

// 查看小地图
console.log(MiniMapSystem.miniMap);

// 查看多人游戏状态
console.log(MultiplayerGame.enabled);
```

---

## 📖 文档

### 用户文档
- [快速启动](QUICKSTART.md)
- [完整用户指南](COMPLETE_USER_GUIDE.md)
- [中文用户手册](USER_MANUAL_CN.md)

### 技术文档
- [修复总结](ALL_FIXES_SUMMARY.md)
- [多人游戏修复](MULTIPLAYER_FIXES.md)
- [按钮修复](MULTIPLAYER_BUTTON_FIX.md)

### 功能文档
- [多人游戏说明](MULTIPLAYER_README.md)
- [保存/加载功能](SAVE_LOAD_FEATURE.md)
- [多人模式保存/载入（3存档槽位）](MULTIPLAYER_SAVE_3_SLOTS_GUIDE.md) ⭐ 更新
- [多人模式保存功能详解](MULTIPLAYER_SAVE_FEATURE.md)
- [AI 增强](AI_HUNTING_ENHANCEMENT.md)

---

## 🐛 故障排除

### 问题：服务器无法启动
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 杀死占用进程
taskkill /F /PID [进程ID]
```

### 问题：无法连接多人游戏
1. 确认服务器正在运行
2. 刷新页面（Ctrl+F5）
3. 检查浏览器控制台错误
4. 验证防火墙设置

### 问题：游戏卡顿
1. 关闭其他浏览器标签页
2. 降低游戏缩放级别
3. 减少 AI 数量（配置文件）

---

## 🤝 贡献

欢迎提交问题和改进建议！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

## 📝 更新日志

### v1.0.6 (2024-12-27)
- 🎮 多人模式保存/载入功能
- 💾 支持命名存档系统
- 📂 支持多个存档管理
- 🎯 载入时随机位置重生
- ✅ 仅保存玩家属性（不包含位置）

### v1.0.5 (2024-12-26)
- 👑 King Scallop 限制修复
- 🎮 单机/服务器版本分离
- 🔒 多人模式保存/载入保护

### v1.0.4 (2024-12-25)
- ✅ 修复扇贝显示问题
- ✅ 修复小地图不显示
- ✅ 修复能力转移不生效
- ✅ 修复多人游戏按钮
- ✅ 添加完整测试页面

### v1.0.3
- 🎮 添加多人游戏模式
- 🌐 WebSocket 实时通信
- 📊 网络延迟显示

### v1.0.2
- 💾 保存/加载功能
- 🤖 增强 AI 系统
- 🗺️ 小地图功能

### v1.0.1
- 🎨 优化渲染性能
- ⚡ 改进物理系统
- 🐛 修复多个 Bug

### v1.0.0
- 🎉 初始版本发布

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 👥 致谢

特别献给：**Weilin, Elaine, Jason 和 Maymay**

---

## 🔗 链接

- **GitHub**: [项目地址]
- **文档**: [在线文档]
- **问题反馈**: [Issues]

---

## 📧 联系方式

如有问题或建议，欢迎联系。

---

**Version**: 1.0.6  
**Last Updated**: 2024-12-27  
**Status**: ✅ Stable

享受游戏！🦅✨
