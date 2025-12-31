# 海鸥世界双语实现策略文档
# Seagull World Bilingual Implementation Strategy

## 📋 总体原则 / General Principles

本系统采用**统一的双语实现策略**，确保在所有层级（配置、后端、前端、UI）都使用一致的方式处理中英文内容。

This system adopts a **unified bilingual implementation strategy** to ensure consistent handling of Chinese and English content across all layers (configuration, backend, frontend, UI).

---

## 🏗️ 分层架构 / Layered Architecture

### 1️⃣ 配置层 (Configuration Layer)

#### 房间配置 (Room Configuration)
**文件**: `game/eatscallop/config/server.ini`

**格式**: `nameEn|nameZh|maxPlayers`

```ini
[rooms]
defaultRoomCount = 5
defaultRoom1 = Default Room|默认房间|16
defaultRoom2 = Muriwai Beach|穆里怀|16
defaultRoom3 = Sanya Island|三亚岛|16
defaultRoom4 = Kulangsu|鼓浪屿|16
defaultRoom5 = Red Beach|红海滩|16
```

**解析方式**:
```javascript
const parts = roomConfig.split('|');
const nameEn = parts[0].trim();
const nameZh = parts[1].trim();
const maxPlayers = parseInt(parts[2]);
```

---

#### 游戏配置 (Game Configuration)
**文件**: `game/{gameId}/manifest.json`

**格式**: 嵌套对象 (Nested Object)

```json
{
  "gameId": "eatscallop",
  "name": {
    "zh": "海鸥吃扇贝",
    "en": "Seagull Eat Scallops"
  },
  "description": {
    "zh": "控制你的海鸥在大海中吃扇贝，增强能力，与其他玩家竞争排行榜！",
    "en": "Control your seagull to eat scallops in the ocean, enhance abilities, and compete with other players!"
  },
  "badge": {
    "text": {
      "zh": "热门",
      "en": "Hot"
    }
  }
}
```

**访问方式**:
```javascript
const lang = 'zh' || 'en';
const gameName = manifest.name[lang];
const gameDesc = manifest.description[lang];
```

---

### 2️⃣ 后端层 (Backend Layer)

#### 房间管理 (Room Management)
**文件**: `server/RoomManager.js`

**数据结构**:
```javascript
class Room {
    constructor(id, nameEn, nameZh, maxPlayers, ...) {
        this.nameEn = nameEn || nameZh || 'Room';   // 英文名称
        this.nameZh = nameZh || nameEn || '房间';    // 中文名称
        this.name = nameEn;                          // 向后兼容
    }
    
    getInfo() {
        return {
            id: this.id,
            nameEn: this.nameEn,
            nameZh: this.nameZh,
            name: this.name,  // 兼容旧代码
            // ...
        };
    }
}
```

**创建房间**:
```javascript
roomManager.createRoom(nameEn, nameZh, maxPlayers, creatorId, isPrivate, password);
```

---

#### API接口 (API Endpoints)
**文件**: `server/index.js`

**接收双语参数**:
```javascript
app.post('/api/rooms/create', (req, res) => {
    const { name, nameEn, nameZh, maxPlayers, ... } = req.body;
    
    // 支持两种格式：
    // 1. 新格式：nameEn + nameZh（推荐）
    // 2. 旧格式：name（兼容性，自动复制到 nameEn 和 nameZh）
    let roomNameEn = nameEn || name;
    let roomNameZh = nameZh || name;
    
    const room = roomManager.createRoom(roomNameEn, roomNameZh, ...);
});
```

**返回双语数据**:
```javascript
{
    "success": true,
    "room": {
        "id": "uuid",
        "nameEn": "Muriwai Beach",
        "nameZh": "穆里怀",
        "name": "Muriwai Beach",  // 向后兼容
        // ...
    }
}
```

---

### 3️⃣ 前端层 (Frontend Layer)

#### 游戏卡片 (Game Cards)
**文件**: `general/js/game-loader.js`

**动态生成双语属性**:
```javascript
generateGameCard(game) {
    const lang = this.currentLanguage;
    const name = game.name[lang] || game.name.zh;
    const description = game.description[lang] || game.description.zh;
    
    return `
        <div class="game-card">
            <h3 class="game-title" 
                data-lang-key="gameName_${game.gameId}" 
                data-lang-zh="${game.name.zh}" 
                data-lang-en="${game.name.en}">
                ${name}
            </h3>
            <p class="game-description" 
               data-lang-key="gameDesc_${game.gameId}" 
               data-lang-zh="${game.description.zh}" 
               data-lang-en="${game.description.en}">
                ${description}
            </p>
        </div>
    `;
}
```

---

#### 房间列表 (Room List)
**文件**: `game/game-index.html`

**根据语言显示房间名**:
```javascript
function renderRoomList(rooms) {
    const currentLang = window.SeagullWorldUI?.currentLanguage || 'zh';
    
    const displayName = currentLang === 'en' ? 
        (room.nameEn || room.name) : 
        (room.nameZh || room.name);
    
    // 渲染表格...
}
```

---

#### 创建房间表单 (Create Room Form)
**文件**: `game/game-index.html`

**双语输入框**:
```html
<form id="createRoomForm">
    <div class="form-group">
        <label for="roomNameEn" data-lang-key="roomNameEn">房间名称（英文）</label>
        <input type="text" id="roomNameEn" required maxlength="30">
    </div>
    
    <div class="form-group">
        <label for="roomNameZh" data-lang-key="roomNameZh">房间名称（中文）</label>
        <input type="text" id="roomNameZh" required maxlength="30">
    </div>
</form>
```

**提交双语数据**:
```javascript
async function createRoom(event) {
    const roomNameEn = document.getElementById('roomNameEn').value.trim();
    const roomNameZh = document.getElementById('roomNameZh').value.trim();
    
    await fetch('/api/rooms/create', {
        method: 'POST',
        body: JSON.stringify({
            nameEn: roomNameEn,
            nameZh: roomNameZh,
            maxPlayers: maxPlayers
        })
    });
}
```

---

### 4️⃣ UI翻译层 (UI Translation Layer)

#### 静态文本翻译 (Static Text Translation)
**文件**: `general/js/seagull-world/ui.js`

**翻译字典**:
```javascript
translations: {
    zh: {
        'hot': '热门',
        'online': '在线',
        'rating': '评分',
        'roomNameEn': '房间名称（英文）',
        'roomNameZh': '房间名称（中文）',
        // ...
    },
    en: {
        'hot': 'Hot',
        'online': 'Online',
        'rating': 'Rating',
        'roomNameEn': 'Room Name (English)',
        'roomNameZh': 'Room Name (Chinese)',
        // ...
    }
}
```

**使用方式**:
```html
<!-- HTML中使用 data-lang-key -->
<span data-lang-key="hot">热门</span>
<span data-lang-key="online">在线</span>
```

---

#### 动态内容翻译 (Dynamic Content Translation)
**方式**: 使用 `data-lang-zh` 和 `data-lang-en` 属性

**更新逻辑**:
```javascript
updateAllTranslations() {
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        
        // 优先使用动态翻译属性
        const zhText = element.getAttribute('data-lang-zh');
        const enText = element.getAttribute('data-lang-en');
        
        if (zhText && enText) {
            // 动态内容（如游戏名称、房间名称）
            element.textContent = this.currentLanguage === 'zh' ? zhText : enText;
        } else {
            // 静态内容（从翻译字典）
            element.textContent = this.t(key);
        }
    });
}
```

---

## 📊 实现对照表 / Implementation Comparison

| 类型 | 存储方式 | 访问方式 | 示例 |
|------|---------|---------|------|
| 配置文件房间 | `nameEn\|nameZh\|maxPlayers` | `split('\|')` | `Muriwai Beach\|穆里怀\|16` |
| 后端房间对象 | `nameEn, nameZh` 独立字段 | `room.nameEn`, `room.nameZh` | `{ nameEn: "...", nameZh: "..." }` |
| 游戏manifest | 嵌套对象 `name.zh`, `name.en` | `game.name[lang]` | `{ name: { zh: "...", en: "..." } }` |
| 静态UI文本 | 翻译字典 | `data-lang-key` | `<span data-lang-key="hot">热门</span>` |
| 动态UI内容 | HTML属性 | `data-lang-zh`, `data-lang-en` | `<h3 data-lang-zh="..." data-lang-en="...">` |

---

## ✅ 实现检查清单 / Implementation Checklist

### 配置层 (Configuration)
- [x] server.ini 房间配置使用 `nameEn|nameZh|maxPlayers` 格式
- [x] manifest.json 游戏信息使用嵌套对象 `{ zh: "...", en: "..." }`

### 后端层 (Backend)
- [x] Room 类使用 `nameEn` 和 `nameZh` 独立字段
- [x] Room.getInfo() 返回双语名称
- [x] API接口支持接收和返回双语数据
- [x] 创建房间API支持新旧格式兼容

### 前端层 (Frontend)
- [x] GameLoader 生成带双语属性的HTML
- [x] 房间列表根据语言显示对应名称
- [x] 创建房间表单包含中英文输入框
- [x] 创建房间请求发送双语数据

### UI翻译层 (UI Translation)
- [x] 翻译字典包含所有UI文本
- [x] updateAllTranslations() 支持动态和静态内容
- [x] toggleLanguage() 触发完整的UI更新

---

## 🔄 数据流图 / Data Flow Diagram

```
配置文件 (server.ini)
    ↓
[解析] split('|')
    ↓
后端对象 { nameEn, nameZh }
    ↓
[API] JSON { nameEn, nameZh }
    ↓
前端渲染 <element data-lang-zh="..." data-lang-en="...">
    ↓
[语言切换] updateAllTranslations()
    ↓
显示对应语言文本
```

---

## 🚀 最佳实践 / Best Practices

### 1. 向后兼容 (Backward Compatibility)
- 保留 `name` 字段作为后备值
- API支持旧格式自动转换为新格式

### 2. 默认值处理 (Default Values)
```javascript
const nameEn = nameEn || nameZh || 'Room';
const nameZh = nameZh || nameEn || '房间';
```

### 3. 语言回退 (Language Fallback)
```javascript
const displayName = game.name[lang] || game.name.zh || game.name.en || 'Unknown';
```

### 4. 统一更新 (Unified Updates)
- 语言切换时调用 `updateAllTranslations()` 更新所有UI
- 房间列表重新渲染显示新语言

---

## 📝 添加新功能时的注意事项 / Notes for New Features

1. **配置文件**: 使用 `nameEn|nameZh` 或嵌套对象
2. **后端类**: 使用独立的 `nameEn` 和 `nameZh` 字段
3. **API接口**: 接收和返回双语数据
4. **前端HTML**: 添加 `data-lang-zh` 和 `data-lang-en` 属性
5. **翻译字典**: 在 `ui.js` 中添加新的翻译键值

---

## 🔧 故障排查 / Troubleshooting

### 问题: 语言切换后某些文本没有更新
**原因**: 元素缺少 `data-lang-key` 或 `data-lang-zh/en` 属性
**解决**: 为元素添加适当的属性

### 问题: 房间名称显示为 undefined
**原因**: 后端没有返回 `nameEn` 或 `nameZh`
**解决**: 检查 `Room.getInfo()` 是否返回双语字段

### 问题: 创建房间失败
**原因**: 前端只发送了 `name` 而不是 `nameEn/nameZh`
**解决**: 更新前端代码发送双语数据

---

## 📅 更新日志 / Changelog

### 2025-12-31
- ✅ 统一了所有层级的双语实现策略
- ✅ 修复了游戏卡片的动态内容翻译
- ✅ 更新了创建房间表单支持双语输入
- ✅ 优化了 API 接口的兼容性处理
- ✅ 完善了 UI 翻译系统的更新逻辑
- ✅ 创建了完整的双语实现策略文档

---

**维护者**: Seagull World Dev Team  
**最后更新**: 2025-12-31
