# 💾 Enhanced Save System - 3 Saves per User

## 📋 Overview

Updated save system with the following improvements:
1. **3 saves in single player mode** (like multiplayer)
2. **Only show current user's saves** (filtered by username)
3. **Default save name uses username** (not "Player")
4. **Clear All Saves button** (removes all user's saves)

---

## 🎮 Feature 1: 3 Saves in Single Player Mode

### **Purpose**
- Allow players to maintain multiple save slots in single player mode
- Consistent experience between single player and multiplayer
- Better save management with named slots

### **Implementation**

#### **Save Dialog** (Single Player)
```javascript
showSinglePlayerSaveDialog() {
    // Shows dialog with:
    // - Input field for save name (defaults to username + date)
    // - List of existing saves (max 3)
    // - Save count indicator (X/3)
}
```

#### **Save Storage**
```
localStorage key pattern:
- Save ID: sp_save_<username>_<timestamp>
- Index: seagullGame_singlePlayerSaves_<username>

Example:
- sp_save_john_doe_1735392000000
- sp_save_john_doe_1735393000000
- sp_save_john_doe_1735394000000
```

### **User Experience**

```
Single Player Mode:
1. User clicks "💾 Save Game"
2. Dialog shows:
   ┌─────────────────────────────────────┐
   │  💾 保存游戏 / Save Game           │
   ├─────────────────────────────────────┤
   │  Input: [john_doe - 2024/12/28]    │
   │                                     │
   │  现有存档 (1/3):                    │
   │  ┌───────────────────────────────┐ │
   │  │ john_doe - 2024/12/27         │ │
   │  │ Power: 150 | Pos: (500, 300) │ │
   │  │ 2024/12/27 14:30:00    [删除] │ │
   │  └───────────────────────────────┘ │
   │                                     │
   │  [保存]  [取消]                     │
   └─────────────────────────────────────┘
3. User enters name or uses default
4. Click "保存" → Success!
```

---

## 👤 Feature 2: Show Only Current User's Saves

### **Purpose**
- Privacy: Users can only see their own saves
- Security: Username-based filtering
- Multi-user support on shared devices

### **Implementation**

#### **Single Player Saves**
```javascript
getSinglePlayerSaves() {
    const username = PlayerIdentity.getUsername();
    // Filter: save.owner.username === username
    return saves.filter(s => s.owner.username === username);
}
```

#### **Multiplayer Saves**
```javascript
getMultiplayerSaves() {
    const username = PlayerIdentity.getUsername();
    // Filter: save.owner.username === username
    return saves.filter(s => s.owner.username === username);
}
```

### **Scenarios**

**Scenario 1: User A (alice)**
```
Alice logs in:
- Sees only her 3 saves:
  ✅ alice - Morning Game
  ✅ alice - Afternoon
  ✅ alice - Evening

Bob's saves are hidden ❌
```

**Scenario 2: User B (bob)**
```
Bob logs in:
- Sees only his 2 saves:
  ✅ bob - Game 1
  ✅ bob - Game 2

Alice's saves are hidden ❌
```

---

## 📝 Feature 3: Default Save Name Uses Username

### **Purpose**
- Personalized default names
- Clear ownership indication
- Better than generic "Player"

### **Implementation**

#### **Single Player Default**
```javascript
// Old: "Player 2024/12/28"
// New: "john_doe - 2024/12/28"
const username = PlayerIdentity.getUsername();
const seagullName = PlayerIdentity.getSeagullName();
input.value = `${seagullName} - ${new Date().toLocaleDateString()}`;
```

#### **Multiplayer Default**
```javascript
// Old: "玩家 2024/12/28" or "Player 2024/12/28"
// New: "john_doe - 2024/12/28"
const seagullName = PlayerIdentity.getSeagullName();
input.value = `${seagullName} - ${new Date().toLocaleDateString()}`;
```

### **Examples**

| User | Default Save Name |
|------|-------------------|
| john_doe | john_doe - 12/28/2024 |
| alice_123 | alice_123 - 12/28/2024 |
| 张三 | 张三 - 2024/12/28 |
| Sky_Hunter (custom) | Sky_Hunter - 12/28/2024 |

---

## 🗑️ Feature 4: Clear All Saves

### **Purpose**
- Quick way to remove all saves
- Clean up storage
- Start fresh

### **Implementation**

#### **Clear Function**
```javascript
clearAllSaves() {
    const username = PlayerIdentity.getUsername();
    
    // Confirm dialog
    if (!confirm(`⚠️ Delete all saves for ${username}?`)) {
        return;
    }
    
    // Clear single player saves
    const spSaveIds = JSON.parse(localStorage.getItem(`seagullGame_singlePlayerSaves_${username}`) || '[]');
    for (const id of spSaveIds) {
        localStorage.removeItem(id);
    }
    localStorage.removeItem(`seagullGame_singlePlayerSaves_${username}`);
    
    // Clear multiplayer saves (only current user's)
    const mpSaveIds = JSON.parse(localStorage.getItem('seagullGame_multiplayerSaves') || '[]');
    // Filter out current user's saves, keep others
    const remainingSaves = mpSaveIds.filter(id => {
        const save = JSON.parse(localStorage.getItem(id));
        return save.owner.username !== username;
    });
    localStorage.setItem('seagullGame_multiplayerSaves', JSON.stringify(remainingSaves));
    
    // Clear auto-saves
    localStorage.removeItem(this.getCurrentAutoSaveKey());
}
```

### **User Experience**

```
User clicks "🗑️ Clear Saves":

┌────────────────────────────────────────┐
│  ⚠️ 确定要删除所有存档吗？            │
│                                        │
│  此操作不可恢复！                      │
│  用户: john_doe                        │
│                                        │
│  [确定]  [取消]                        │
└────────────────────────────────────────┘

If confirmed:
✅ Deleted 3 single player saves
✅ Deleted 2 multiplayer saves
✅ Cleared auto-save
🗑️ All saves cleared [john_doe]
```

### **Safety Features**
- ✅ Confirmation dialog required
- ✅ Shows username in confirmation
- ✅ Only deletes current user's saves
- ✅ Other users' saves are preserved
- ✅ Cannot be undone (intentional)

---

## 🔧 Technical Details

### **Save ID Formats**

| Mode | Format | Example |
|------|--------|---------|
| Single Player | `sp_save_<username>_<timestamp>` | `sp_save_john_doe_1735392000` |
| Multiplayer | `mp_save_<username>_<timestamp>` | `mp_save_alice_1735393000` |
| Auto-save | `seagullGame_save_<username>_auto` | `seagullGame_save_bob_auto` |

### **Index Storage**

| Type | Key | Value |
|------|-----|-------|
| Single Player | `seagullGame_singlePlayerSaves_<username>` | `["sp_save_...", ...]` |
| Multiplayer | `seagullGame_multiplayerSaves` | `["mp_save_...", ...]` |

### **Save Data Structure**

```json
{
  "id": "sp_save_john_doe_1735392000000",
  "name": "john_doe - Morning Game",
  "version": "1.0",
  "timestamp": 1735392000000,
  "dateString": "2024/12/28 09:00:00",
  "isAutoSave": false,
  "owner": {
    "playerId": "user_123...",
    "username": "john_doe",
    "playerName": "Sky Hunter",
    "createdAt": 1735300000000
  },
  "player": {
    "name": "Sky Hunter",
    "x": 500,
    "y": 300,
    "power": 150,
    "size": 1.5,
    ...
  },
  "gameStats": { ... },
  "aiPlayers": [ ... ],
  "scallops": [ ... ]
}
```

---

## 📂 Files Modified

| File | Changes | Lines Added |
|------|---------|-------------|
| `saveload.js` | ✅ Added 3-save system for single player<br>✅ User-filtered save lists<br>✅ Username-based default names<br>✅ Clear all saves function | ~200 lines |
| `eatscallop-index.html` | ✅ Added "Clear Saves" button | 1 line |
| `style.css` | ✅ Added delete button styling | 7 lines |

---

## 🧪 Testing Checklist

### **3 Saves System**
- [ ] Single player mode shows save dialog
- [ ] Can save up to 3 times
- [ ] 4th save shows error: "Maximum 3 saves allowed"
- [ ] Each save has unique name
- [ ] Saves are listed by newest first
- [ ] Can delete individual saves
- [ ] Can load any of the 3 saves

### **User Filtering**
- [ ] User A only sees their saves
- [ ] User A cannot see User B's saves
- [ ] Switching users shows different save lists
- [ ] Multi-user on same device works correctly

### **Default Names**
- [ ] Single player default: `<username> - <date>`
- [ ] Multiplayer default: `<username> - <date>`
- [ ] Custom seagull names appear correctly
- [ ] Chinese/special characters work
- [ ] Date format matches language setting

### **Clear All Saves**
- [ ] Button shows in UI
- [ ] Confirmation dialog appears
- [ ] Shows correct username in dialog
- [ ] Clears all user's saves (single + multi)
- [ ] Preserves other users' saves
- [ ] Updates load button state
- [ ] Shows success notification

---

## 🎯 Benefits

### **User Experience**
✅ **Multiple Save Slots**: Keep different game states  
✅ **Named Saves**: Easy to identify saves  
✅ **Privacy**: Can't see other users' saves  
✅ **Personalization**: Names use actual username/seagull name  
✅ **Clean Storage**: Easy to clear all saves  

### **Technical**
✅ **Consistent System**: Single and multi player use same approach  
✅ **User Isolation**: Each user's data is separate  
✅ **Scalable**: Easy to add more features  
✅ **Safe Deletion**: Confirmation prevents accidents  

---

## 📊 Storage Usage Example

```
User: alice
├── Single Player (3 saves)
│   ├── sp_save_alice_1735392000000 (2.5 KB)
│   ├── sp_save_alice_1735393000000 (2.4 KB)
│   └── sp_save_alice_1735394000000 (2.6 KB)
├── Multiplayer (2 saves)
│   ├── mp_save_alice_1735395000000 (1.2 KB)
│   └── mp_save_alice_1735396000000 (1.3 KB)
├── Auto-save
│   └── seagullGame_save_alice_auto (2.5 KB)
└── Index Files
    ├── seagullGame_singlePlayerSaves_alice (0.1 KB)
    └── seagullGame_multiplayerSaves (shared, 0.1 KB)

Total: ~12.7 KB per user
```

---

## 🚀 Usage Guide

### **For Players**

#### **Save a Game**
```
1. Click "💾 Save Game"
2. Dialog appears with your username pre-filled
3. Edit name if desired (e.g., "alice - Boss Fight")
4. Click "保存" / "Save"
5. Success! (Shows: "已保存 1/3")
```

#### **Load a Game**
```
1. Click "📂 Load Game"
2. See list of your saves only
3. Click on save to load it
4. Game restores to saved state
```

#### **Clear All Saves**
```
1. Click "🗑️ Clear Saves"
2. Confirm dialog: "Delete all saves for alice?"
3. Click "确定" / "OK"
4. All your saves are removed
5. Load button becomes disabled
```

---

## 🔮 Future Enhancements

1. **Save Rename**: Edit save names after creation
2. **Save Preview**: Show screenshot thumbnail
3. **Export/Import**: Backup saves to file
4. **Cloud Sync**: Sync saves across devices
5. **Save Tags**: Categorize saves (e.g., "Boss Fights", "High Score")
6. **Save Notes**: Add custom notes to saves

---

## 📞 Support

### **Common Questions**

**Q: Can I have more than 3 saves?**  
A: No, the limit is 3 saves per mode (single/multiplayer) per user. Delete old saves to make room.

**Q: Can other users see my saves?**  
A: No, saves are filtered by username. Only you can see your saves.

**Q: What happens if I clear all saves?**  
A: All your saves (single + multiplayer) are permanently deleted. This cannot be undone.

**Q: Do auto-saves count toward the 3-save limit?**  
A: No, auto-saves are separate and don't count toward the manual save limit.

---

**Last Updated**: December 28, 2024  
**Version**: 3.0  
**Author**: Seagull Game Development Team 🦅
