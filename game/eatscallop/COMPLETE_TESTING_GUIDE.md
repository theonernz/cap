# 完整测试指南 - 用户认证与存档系统迁移

## 🎯 测试目标

验证用户认证系统和游戏存档系统已完全从 localStorage 迁移到服务器端 JSON 文件存储。

---

## 📋 测试前准备

### 1. 启动服务器
```powershell
cd c:\git\Seagull\game\eatscallop
.\start-server.bat
```

服务器应该在 `http://localhost:3000` 运行

### 2. 确认文件存在
```powershell
# 检查用户数据文件
Test-Path "c:\git\Seagull\data\users.json"

# 检查游戏存档文件
Test-Path "c:\git\Seagull\game\eatscallop\data\savedgames.json"
```

两个都应该返回 `True` 或显示文件已创建。

### 3. 清除旧的 localStorage 数据（可选）
打开浏览器控制台，运行：
```javascript
// 查看现有的 localStorage 键
Object.keys(localStorage).filter(k => k.includes('seagull'));

// 清除旧的用户数据（如果需要全新测试）
localStorage.removeItem('seagullWorld_users');
localStorage.removeItem('seagullWorld_currentSession');
```

---

## 🧪 测试场景

### ✅ 场景 1: 用户注册

#### 步骤
1. 打开游戏页面: `http://localhost:3000/eatscallop-index.html`
2. 点击 **"登录/注册"** 按钮
3. 切换到 **"注册"** 标签
4. 输入新用户名和密码（例如: `testuser` / `password123`）
5. 点击 **"注册"**

#### 预期结果
- ✅ 显示成功消息
- ✅ 自动登录，显示用户名和头像
- ✅ 浏览器控制台显示: `[Auth] Registration successful`
- ✅ 检查 `data/users.json`，应包含新用户：

```powershell
cat c:\git\Seagull\data\users.json | ConvertFrom-Json | Select-Object -ExpandProperty users | Where-Object { $_.username -eq 'testuser' }
```

#### 验证点
- [ ] 注册成功
- [ ] 用户数据保存到 `users.json`
- [ ] 自动登录成功
- [ ] 用户信息显示正确

---

### ✅ 场景 2: 用户登录

#### 步骤
1. 刷新页面（或打开新标签页）
2. 点击 **"登录/注册"** 按钮
3. 输入之前注册的用户名和密码
4. 点击 **"登录"**

#### 预期结果
- ✅ 登录成功
- ✅ 显示用户名和头像
- ✅ localStorage 中有会话信息：

```javascript
JSON.parse(localStorage.getItem('seagullWorld_currentSession'))
```

应该显示:
```json
{
  "userId": "user_xxx",
  "username": "testuser",
  "displayName": "testuser",
  "avatar": "🦅",
  "createdAt": 1234567890,
  "expiresAt": 1234567890
}
```

#### 验证点
- [ ] 登录成功
- [ ] 会话保存到 localStorage
- [ ] 用户信息显示正确
- [ ] `lastLogin` 时间已更新

---

### ✅ 场景 3: 会话持久化

#### 步骤
1. 登录成功后
2. 刷新页面
3. 观察是否仍然保持登录状态

#### 预期结果
- ✅ 页面刷新后仍然显示用户信息
- ✅ 不需要重新登录
- ✅ 会话在 24 小时内有效（或 30 天如果选择了"记住我"）

#### 验证点
- [ ] 会话持久化工作正常
- [ ] 页面刷新后保持登录
- [ ] 用户信息正确显示

---

### ✅ 场景 4: 游戏存档保存（单人模式）

#### 步骤
1. 确保已登录
2. 开始新游戏（单人模式）
3. 玩一会儿游戏，吃几个扇贝
4. 点击 **"保存"** 按钮
5. 输入存档名称（例如: "Test Save 1"）
6. 点击 **"保存"**

#### 预期结果
- ✅ 显示成功通知: "✅ 已保存: Test Save 1"
- ✅ 存档列表显示新存档
- ✅ 检查 `savedgames.json`：

```powershell
cat c:\git\Seagull\game\eatscallop\data\savedgames.json | ConvertFrom-Json | Select-Object -ExpandProperty saves | Where-Object { $_.name -eq 'Test Save 1' }
```

#### 验证点
- [ ] 存档保存成功
- [ ] 存档出现在 `savedgames.json`
- [ ] 存档包含所有游戏状态（位置、能力、扇贝等）
- [ ] 存档绑定到当前用户

---

### ✅ 场景 5: 游戏存档加载

#### 步骤
1. 继续游戏或死亡
2. 点击 **"载入"** 按钮
3. 选择之前保存的存档
4. 点击存档条目

#### 预期结果
- ✅ 游戏恢复到保存时的状态
- ✅ 玩家位置正确
- ✅ 能力值正确
- ✅ 扇贝和AI恢复
- ✅ 显示成功通知

#### 验证点
- [ ] 存档加载成功
- [ ] 游戏状态完全恢复
- [ ] 玩家数据正确
- [ ] 环境数据正确

---

### ✅ 场景 6: 存档删除

#### 步骤
1. 打开保存对话框
2. 找到一个存档
3. 点击 **"删除"** 按钮

#### 预期结果
- ✅ 存档从列表中消失
- ✅ 显示删除成功通知
- ✅ 存档从 `savedgames.json` 中移除

#### 验证点
- [ ] 删除成功
- [ ] UI 更新正确
- [ ] 文件系统更新正确

---

### ✅ 场景 7: 多设备同步

#### 步骤
1. 在浏览器 A 登录并保存游戏
2. 在浏览器 B（或隐身模式）登录相同账号
3. 点击 **"载入"** 按钮

#### 预期结果
- ✅ 浏览器 B 可以看到在浏览器 A 创建的存档
- ✅ 可以成功加载存档
- ✅ 数据完全一致

#### 验证点
- [ ] 跨浏览器数据同步
- [ ] 存档可在不同设备访问
- [ ] 数据一致性

---

### ✅ 场景 8: 存档所有权

#### 步骤
1. 用用户 A 登录并保存游戏
2. 登出
3. 用用户 B 登录
4. 尝试访问用户 A 的存档

#### 预期结果
- ✅ 用户 B 看不到用户 A 的存档
- ✅ 每个用户只能看到自己的存档
- ✅ 存档列表为空（如果用户 B 没有存档）

#### 验证点
- [ ] 存档隔离工作正常
- [ ] 用户只能访问自己的存档
- [ ] 安全性得到保障

---

### ✅ 场景 9: 存档数量限制

#### 步骤
1. 创建 3 个存档
2. 尝试创建第 4 个存档

#### 预期结果
- ✅ 显示错误消息: "❌ 最多只能保存3个存档，请先删除旧存档"
- ✅ 第 4 个存档不被创建

#### 验证点
- [ ] 3 存档限制生效
- [ ] 错误消息显示正确
- [ ] 系统不允许超过限制

---

### ✅ 场景 10: 登出

#### 步骤
1. 点击用户头像或用户名
2. 选择 **"登出"** 选项

#### 预期结果
- ✅ 用户信息消失
- ✅ 保存/载入按钮被禁用
- ✅ localStorage 中的会话被清除:

```javascript
localStorage.getItem('seagullWorld_currentSession') // 应该返回 null
```

#### 验证点
- [ ] 登出成功
- [ ] UI 状态更新
- [ ] 会话已清除
- [ ] 功能按钮正确禁用

---

## 🔍 故障排查

### 问题 1: "Network error" 或 "Failed to fetch"

**可能原因:**
- 服务器未运行
- 端口被占用
- 防火墙阻止

**解决方案:**
```powershell
# 检查服务器是否运行
netstat -ano | findstr :3000

# 重启服务器
cd c:\git\Seagull\game\eatscallop
.\start-server.bat

# 测试 API 连接
curl http://localhost:3000/api/users
```

---

### 问题 2: "User already exists"

**可能原因:**
- 用户名已在 `users.json` 中

**解决方案:**
1. 使用不同的用户名
2. 或清空 `users.json`：

```powershell
# 备份现有数据
Copy-Item "c:\git\Seagull\data\users.json" "c:\git\Seagull\data\users.json.backup"

# 重置为空
@'
{
  "metadata": {
    "created": 1735430400000,
    "lastModified": 1735430400000,
    "totalUsers": 0,
    "version": "1.0.0"
  },
  "users": []
}
'@ | Out-File -Encoding UTF8 "c:\git\Seagull\data\users.json"
```

---

### 问题 3: 登录后仍然看不到保存按钮

**可能原因:**
- UI 未正确更新
- 会话未正确创建

**解决方案:**
1. 打开控制台检查:
```javascript
SaveLoadSystem.isUserLoggedIn()  // 应该返回 true
```

2. 手动触发按钮状态更新:
```javascript
SaveLoadSystem.updateLoadButtonState()
```

3. 刷新页面

---

### 问题 4: 存档保存后看不到

**可能原因:**
- API 请求失败
- 文件权限问题

**解决方案:**
1. 检查浏览器控制台错误
2. 检查服务器控制台日志
3. 验证文件权限:
```powershell
# 检查文件是否存在且可写
Test-Path "c:\git\Seagull\game\eatscallop\data\savedgames.json"
```

4. 手动检查文件内容:
```powershell
cat c:\git\Seagull\game\eatscallop\data\savedgames.json | ConvertFrom-Json
```

---

## 📊 验证清单

### 用户认证系统
- [ ] 用户注册成功，数据保存到 `users.json`
- [ ] 用户登录成功，会话保存到 localStorage
- [ ] 会话持久化，页面刷新后保持登录
- [ ] 登出功能正常，会话被清除
- [ ] 密码验证在服务器端完成
- [ ] 用户资料可以更新

### 游戏存档系统
- [ ] 单人模式存档保存成功
- [ ] 多人模式存档保存成功
- [ ] 存档加载正确恢复游戏状态
- [ ] 存档删除功能正常
- [ ] 3 存档限制生效
- [ ] 存档绑定到用户账号
- [ ] 跨设备存档同步
- [ ] 存档所有权隔离

### localStorage 使用
- [ ] 用户数据**不再**存储在 localStorage
- [ ] 游戏存档**不再**存储在 localStorage
- [ ] 只有会话信息存储在 localStorage（正确）
- [ ] PlayerIdentity 数据仍在 localStorage（向后兼容）

---

## 🎯 成功标准

### 必须满足的条件
1. ✅ 所有用户数据存储在 `data/users.json`
2. ✅ 所有游戏存档存储在 `data/savedgames.json`
3. ✅ 用户注册、登录、登出功能正常
4. ✅ 游戏存档保存、加载、删除功能正常
5. ✅ 多设备同步工作正常
6. ✅ 存档所有权隔离正确
7. ✅ 无 JavaScript 错误
8. ✅ 无服务器错误

### 可选优化
- ⭐ 加载速度快（< 500ms）
- ⭐ 错误提示友好
- ⭐ UI 响应流畅
- ⭐ 数据备份功能

---

## 📈 性能测试

### API 响应时间
```javascript
// 测试注册 API
console.time('register');
await SeagullWorldAuth.register('perftest', 'password123');
console.timeEnd('register');  // 应该 < 500ms

// 测试登录 API
console.time('login');
await SeagullWorldAuth.login('perftest', 'password123');
console.timeEnd('login');  // 应该 < 300ms

// 测试存档保存 API
console.time('save');
await SaveLoadSystem.saveSinglePlayerGame('Performance Test');
console.timeEnd('save');  // 应该 < 1000ms

// 测试存档加载 API
console.time('load');
const saves = await SaveLoadSystem.getSinglePlayerSaves();
console.timeEnd('load');  // 应该 < 500ms
```

---

## 🎉 测试完成

如果所有测试都通过，说明系统迁移成功！

### 下一步
1. ✅ 进行生产环境部署准备
2. ✅ 编写用户迁移指南
3. ✅ 创建数据备份计划
4. ✅ 监控系统性能

---

## 📞 需要帮助？

查看相关文档:
- `AUTH_LOCALSTORAGE_MIGRATION.md` - 认证系统迁移详情
- `LOCALSTORAGE_CLEANUP_COMPLETE.md` - 存档系统迁移详情
- `FILE_STORAGE_SYSTEM.md` - 文件存储技术文档
- `TESTING_QUICK_GUIDE.md` - 快速测试指南
