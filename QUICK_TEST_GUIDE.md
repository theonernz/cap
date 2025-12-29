# 快速测试指南 | Quick Testing Guide

## 🚀 快速开始 | Quick Start

### 1. 启动服务器 | Start Server
```bash
cd c:\Phonis\Games\Seagull
node server/index.js
```

### 2. 打开浏览器 | Open Browser
访问 | Visit: `http://localhost:3000/index.html`

---

## ✅ 测试清单 | Test Checklist

### 测试1: 双语切换 | Test 1: Language Toggle
- [ ] 点击右上角"🌐"按钮
- [ ] 所有文本切换为英文
- [ ] 再次点击切换回中文
- [ ] **验证**: 主页、游戏大厅、游戏页面都支持双语

### 测试2: 登录按钮显示 | Test 2: Login Button Display
- [ ] 清除浏览器缓存（F12 → Application → Clear storage）
- [ ] 刷新页面
- [ ] **验证**: 登录/注册按钮立即显示（无需再次刷新）

### 测试3: 匿名试玩 | Test 3: Anonymous Trial
- [ ] 点击主页"匿名试玩"按钮
- [ ] 看到提示："🎮 进入匿名模式 - 无法保存游戏进度"
- [ ] 进入游戏，点击"开始游戏"
- [ ] **验证1**: 玩家名为随机匿名名称（如"匿名海鸥 123"）
- [ ] **验证2**: 控制台显示 `🎮 Anonymous mode: Assigned control to AI seagull`
- [ ] 点击"💾 保存"按钮
- [ ] **验证3**: 显示警告："⚠️ 匿名试玩模式下无法保存游戏"
- [ ] 点击"📂 读取"按钮
- [ ] **验证4**: 显示警告："⚠️ 匿名试玩模式下无法加载存档"

### 测试4: 正常登录对比 | Test 4: Normal Login Comparison
- [ ] 返回主页
- [ ] 注册/登录账号
- [ ] 进入游戏，点击"开始游戏"
- [ ] **验证1**: 创建金色新海鸥（能量100，大小1.0）
- [ ] **验证2**: 存档/读档按钮正常工作
- [ ] **验证3**: 可以成功保存和加载游戏

---

## 🎯 关键验证点 | Key Verification Points

### 匿名模式特征 | Anonymous Mode Features:
✅ 玩家名：随机生成（如"匿名海鸥 456"）  
✅ 初始能量：30-60范围（随机AI海鸥属性）  
✅ 初始大小：0.5-1.3范围  
✅ 颜色：金色（#FFD700）  
✅ 存档：禁用 ❌  
✅ 读档：禁用 ❌  

### 正常模式特征 | Normal Mode Features:
✅ 玩家名：用户设置的名称  
✅ 初始能量：100  
✅ 初始大小：1.0  
✅ 颜色：金色（#FFD700）  
✅ 存档：启用 ✅  
✅ 读档：启用 ✅  

---

## 🔍 控制台输出 | Console Output

### 匿名模式成功标志 | Anonymous Mode Success:
```
🎮 Anonymous mode: Assigned control to AI seagull (Power: 42, Size: 0.87)
```

### 存档尝试输出 | Save Attempt Output:
```
⚠️ 匿名试玩模式下无法保存游戏
请注册或登录以使用完整功能。
```

---

## 📊 预期行为对比表 | Expected Behavior Comparison

| 操作 | 匿名模式 | 登录模式 |
|------|---------|---------|
| 开始游戏 | 随机AI海鸥 | 新建金色海鸥 |
| 初始状态 | 随机（30-60能量） | 固定（100能量） |
| 点击保存 | 显示警告 ❌ | 弹出保存对话框 ✅ |
| 点击读取 | 显示警告 ❌ | 弹出读取对话框 ✅ |
| 语言切换 | 双语支持 ✅ | 双语支持 ✅ |

---

## 🐛 常见问题 | Common Issues

### Q: 登录按钮还是不显示？
**A**: 
1. 清除浏览器缓存
2. 确保没有JavaScript错误（F12查看控制台）
3. 确认 `ui.js` 版本为最新

### Q: 匿名模式下仍然可以保存？
**A**: 
1. 检查 `sessionStorage.anonymousMode` 是否为 'true'
2. 检查控制台是否有错误
3. 确认 `saveload.js` 已更新

### Q: 语言切换不生效？
**A**: 
1. 检查所有页面是否加载了 `ui.js`
2. 确认 `data-lang-key` 属性是否正确
3. 检查 `localStorage.seagullWorldLanguage` 值

---

## ✅ 全部完成标志 | All Tests Passed

如果以下所有项都通过，说明系统运行正常：

- [x] 双语切换无遗漏文本
- [x] 登录按钮初次加载显示
- [x] 匿名试玩入口可用
- [x] 匿名模式随机分配AI海鸥
- [x] 匿名模式禁用存档
- [x] 匿名模式禁用读档
- [x] 正常模式存档功能正常
- [x] 无JavaScript错误

**🎉 恭喜！所有功能正常运行！**

---

## 📝 更多信息 | More Information

详细文档：
- [ISSUES_RESOLUTION_SUMMARY.md](ISSUES_RESOLUTION_SUMMARY.md) - 问题修复总结
- [ANONYMOUS_MODE_IMPLEMENTATION.md](ANONYMOUS_MODE_IMPLEMENTATION.md) - 匿名模式实现详情
