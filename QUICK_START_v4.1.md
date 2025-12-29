# 🚀 快速启动指南 - 海鸥世界 v4.1

## 功能测试快速指南

### 📋 前置准备

确保已安装 Node.js 和相关依赖：
```bash
cd c:\Phonis\Games\Seagull
npm install
```

---

## 🎯 测试步骤

### 步骤1: 启动服务器
```bash
node server/index.js
```

✅ **预期输出：**
```
🚀 Server starting with NO CACHE headers for development...
Server running on http://localhost:3000
WebSocket server running
```

---

### 步骤2: 打开测试页面

打开浏览器访问：
```
http://localhost:3000/test-features-v4.1.html
```

这个页面提供了所有新功能的交互式测试界面。

---

### 步骤3: 测试各项功能

#### ✅ 功能1: 会话管理（4小时超时）

1. 打开主页：http://localhost:3000/index.html
2. 点击"注册"创建新账号或"登录"已有账号
3. 返回测试页面，点击"刷新状态"查看会话信息
4. 观察会话剩余时间（应为4小时）
5. 点击"模拟用户活动"验证会话刷新
6. 打开浏览器控制台，查看会话监控日志

**测试点：**
- ✅ 登录后会话有效期为4小时
- ✅ 用户活动自动刷新会话
- ✅ 剩余10分钟时显示警告
- ✅ 超时后自动登出

---

#### ✅ 功能2: 双语切换

1. 打开主页：http://localhost:3000/index.html
2. 点击右上角 🌐 语言切换按钮
3. 观察页面文字变化

**测试点：**
- ✅ 导航栏按钮切换（登录、注册、退出）
- ✅ 欢迎标题切换
- ✅ 游戏卡片文字切换
- ✅ 在线人数标签切换
- ✅ 打开登录对话框，验证表单标签切换
- ✅ 刷新页面，验证语言设置保存

**双语对照表：**
| 中文 | English |
|------|---------|
| 登录 | Login |
| 注册 | Register |
| 退出 | Logout |
| 欢迎来到海鸥世界！ | Welcome to Seagull World! |
| 在线 | Online |
| 评分 | Rating |
| 开始游戏 | Start Game |
| 匿名试玩 | Try Anonymously |

---

#### ✅ 功能3: 在线人数动态更新

1. 确保服务器运行中
2. 打开主页，查看游戏卡片
3. 找到"🎮 在线: X"字样
4. 多开几个浏览器标签页
5. 等待30秒，观察数字变化

**测试点：**
- ✅ 初始显示为 "-"，加载后显示具体数字
- ✅ 多开标签页，人数增加
- ✅ 关闭标签页，人数减少
- ✅ 每30秒自动刷新
- ✅ 关闭服务器，显示模拟数据（80-150）

**API测试：**
```bash
# 在浏览器或命令行访问
curl http://localhost:3000/api/stats/online
```

**预期响应：**
```json
{
  "success": true,
  "count": 3,
  "timestamp": 1234567890
}
```

---

#### ✅ 功能4: Standalone按钮移除

1. 打开主页：http://localhost:3000/index.html
2. 查看顶部导航栏右侧

**验证点：**
- ❌ 不应该看到"Standalone"按钮
- ✅ 应该看到 🌐 语言切换按钮
- ✅ 应该看到 🔓 登录按钮
- ✅ 应该看到 ✨ 注册按钮

---

## 🔍 调试技巧

### 查看会话状态
打开浏览器控制台（F12），输入：
```javascript
// 查看当前会话
JSON.parse(localStorage.getItem('seagullWorld_currentSession'))

// 查看当前语言
localStorage.getItem('seagullWorld_language')
```

### 查看控制台日志
会话管理的日志：
```
[Seagull World Auth] Initializing authentication system...
[Seagull World Auth] User logged in: username
[Seagull World UI] Initializing UI...
```

### 手动测试会话超时
修改会话过期时间（测试用）：
```javascript
// 在浏览器控制台执行
const session = JSON.parse(localStorage.getItem('seagullWorld_currentSession'));
session.expiresAt = Date.now() + (10 * 60 * 1000); // 改为10分钟后过期
localStorage.setItem('seagullWorld_currentSession', JSON.stringify(session));
```

---

## 📊 性能监控

### 在线人数更新频率
- **首次加载**: 立即获取
- **后续更新**: 每30秒
- **网络失败**: 自动降级到模拟数据

### 会话监控频率
- **检查频率**: 每60秒
- **警告时机**: 剩余10分钟
- **活动检测**: 鼠标、键盘、滚动、触摸

---

## ❓ 常见问题

### Q1: 在线人数一直显示 "-"
**A:** 检查服务器是否运行，或等待30秒自动更新。

### Q2: 语言切换后部分文字未变化
**A:** 确保HTML元素有 `data-lang-key` 属性。

### Q3: 会话超时时间不对
**A:** 检查 `auth.js` 中的 `sessionDuration.default` 配置。

### Q4: 警告提示未显示
**A:** 确保浏览器允许通知，或查看控制台日志。

---

## 📝 验收标准

### ✅ 所有功能正常运行时：
- [x] 登录后会话有效期为4小时
- [x] 用户活动自动刷新会话
- [x] 会话超时前10分钟显示警告
- [x] 语言切换按钮可见且可用
- [x] 点击语言按钮，页面文字实时切换
- [x] 刷新页面，语言设置保持不变
- [x] 游戏卡片显示在线人数
- [x] 在线人数每30秒自动更新
- [x] Standalone按钮已移除
- [x] 所有按钮点击响应正常

---

## 🎉 测试完成

如果所有测试点都通过，恭喜！v4.1 版本已成功部署。

**下一步：**
1. 阅读完整文档：`FEATURES_UPDATE_v4.1.md`
2. 查看后续计划和优化建议
3. 开始使用新功能！

---

## 📞 支持

遇到问题？
- 查看控制台错误日志
- 检查服务器运行状态
- 验证浏览器兼容性（推荐Chrome/Edge/Firefox最新版）

---

**更新时间**: 2025-12-29  
**版本**: v4.1  
**测试状态**: ✅ 全部通过
