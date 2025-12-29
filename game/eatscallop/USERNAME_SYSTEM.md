# 🦅 Username & Seagull Name System

## 📋 Overview

This document describes the dual-name system implemented for the Seagull game, which separates **Username** (for save files) from **Seagull Name** (for in-game display).

## 🎯 System Design

### **Username** (用户名)
- **Purpose**: Used for save file naming
- **Source**: 
  - SeagullWorld account username (if logged in)
  - Auto-generated `Player_XXXXXX` (if guest)
- **Properties**:
  - Permanent and stable
  - Used as save file identifier
  - Cannot be changed easily (tied to account)
  - Format: `seagullGame_save_<username>`

### **Seagull Name** (海鸥名)
- **Purpose**: Displayed in game (leaderboard, player label)
- **Source**:
  - Initially equals Username
  - Can be customized by player anytime
- **Properties**:
  - Customizable and changeable
  - Stored independently in localStorage
  - Updated via "Change Name" button
  - Does NOT affect save file naming

---

## 🔧 Implementation Details

### **1. PlayerIdentity System** (`saveload.js`)

```javascript
const PlayerIdentity = {
    USERNAME_KEY: 'seagullGame_username',
    SEAGULL_NAME_KEY: 'seagullGame_seagullName',
    
    // Get username (for save files)
    getUsername() { ... },
    
    // Get seagull name (for game display)
    getSeagullName() { ... },
    
    // Set seagull name (when user changes it)
    setSeagullName(name) { ... },
    
    // Check if seagull name was customized
    hasCustomSeagullName() { ... }
}
```

### **2. Save System** (`saveload.js`)

```javascript
const SaveLoadSystem = {
    SAVE_KEY_PREFIX: 'seagullGame_save_',
    
    // Get save key for current user
    getCurrentSaveKey() {
        const username = PlayerIdentity.getUsername();
        return this.SAVE_KEY_PREFIX + username;  // e.g., seagullGame_save_Player_ABC123
    },
    
    // Save uses username-based key
    saveGame() {
        const saveKey = this.getCurrentSaveKey();
        localStorage.setItem(saveKey, JSON.stringify(saveData));
    }
}
```

### **3. UI System** (`ui.js`)

```javascript
changeName() {
    const newName = prompt('Enter new seagull name:', currentName);
    if (newName && newName.trim() !== '') {
        // Update seagull name (not username!)
        PlayerIdentity.setSeagullName(newName.trim());
        
        // Update game player
        mainPlayer.name = newName.trim();
        
        // Update UI
        document.getElementById('playerName').textContent = newName.trim();
        
        // Log for clarity
        console.log(`🦅 Seagull name: ${newName.trim()}`);
        console.log(`💾 Save file: seagullGame_save_${PlayerIdentity.getUsername()}`);
    }
}
```

### **4. Game Initialization** (`main.js`, `game.js`)

```javascript
// On page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize player name display with seagull name
    const seagullName = PlayerIdentity.getSeagullName();
    document.getElementById('playerName').textContent = seagullName;
    
    console.log(`🦅 Seagull name: ${seagullName}`);
    console.log(`💾 Save file username: ${PlayerIdentity.getUsername()}`);
});

// When starting game
Game.init() {
    const seagullName = PlayerIdentity.getSeagullName();
    const mainPlayer = EntityManager.createPlayer(
        x, y, size, power,
        seagullName,  // Use seagull name for display
        color, true
    );
}
```

---

## 📂 Save File Structure

### Save File Naming
```
localStorage key: seagullGame_save_<username>

Example for logged-in user:
  Username: john_doe
  Seagull Name: Sky Hunter
  Save Key: seagullGame_save_john_doe

Example for guest:
  Username: Player_7X9K2A
  Seagull Name: 海鸥王
  Save Key: seagullGame_save_Player_7X9K2A
```

### Save Data Structure
```json
{
  "version": "1.0",
  "timestamp": 1735392000000,
  "owner": {
    "playerId": "user_1234567890_abc",
    "username": "john_doe",
    "playerName": "Sky Hunter"
  },
  "player": {
    "name": "Sky Hunter",  // Seagull name (can differ from username)
    "power": 150,
    "size": 1.5,
    ...
  }
}
```

---

## 🎮 User Experience Flow

### **Scenario 1: First Time Player (Guest)**
1. Player opens game
2. System generates username: `Player_7X9K2A`
3. Initial seagull name = username: `Player_7X9K2A`
4. Player sees: "Player Name: Player_7X9K2A"
5. Player clicks "Change Name" → enters "Storm Seagull"
6. Player sees: "Player Name: Storm Seagull"
7. Player saves game → file saved as: `seagullGame_save_Player_7X9K2A`

### **Scenario 2: Logged In User**
1. Player logs in to SeagullWorld as `ocean_king`
2. Initial seagull name = username: `ocean_king`
3. Player sees: "Player Name: ocean_king"
4. Player changes name to "海洋之王"
5. Player sees: "Player Name: 海洋之王"
6. Player saves game → file saved as: `seagullGame_save_ocean_king`

### **Scenario 3: Multiple Sessions**
1. Player A (username: `alice`, seagull name: "Sky Hunter")
   - Saves game → `seagullGame_save_alice`
2. Player B (username: `bob`, seagull name: "Ocean Glider")
   - Saves game → `seagullGame_save_bob`
3. Each player has their own save file
4. No conflicts even if seagull names are identical

---

## 🔍 LocalStorage Keys

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `seagullGame_playerId` | Unique player ID | `player_1735392000_abc123` |
| `seagullGame_username` | Username for saves | `john_doe` or `Player_7X9K2A` |
| `seagullGame_seagullName` | Custom display name | `Sky Hunter` or `海鸥王` |
| `seagullGame_save_<username>` | Manual save file | JSON object |
| `seagullGame_save_<username>_auto` | Auto-save file | JSON object |

---

## 🧪 Testing

### Test File Location
```
c:\git\Seagull\game\eatscallop\test-username-system.html
```

### Test Cases
1. ✅ Generate default username and seagull name
2. ✅ Change seagull name (username remains unchanged)
3. ✅ Save game (uses username for file key)
4. ✅ Load game (restores seagull name from save)
5. ✅ Multiple sessions with different users
6. ✅ SeagullWorld login integration

### Manual Testing Steps
1. Open `test-username-system.html` in browser
2. Click "Show Current Info" → verify username and seagull name
3. Click "Change Seagull Name" → verify name changes
4. Click "Simulate Save" → check localStorage for correct key
5. Click "Simulate Load" → verify data loads correctly
6. Click "Clear All Data" → reset and test again

---

## 🚀 Benefits

### ✅ Advantages
1. **Stable Save Files**: Username-based keys prevent save file conflicts
2. **Flexible Display**: Players can change in-game name anytime
3. **Multi-User Support**: Each user has isolated save files
4. **Account Integration**: Seamless with SeagullWorld login
5. **Backward Compatible**: Old saves still work (upgrade path)

### 🎯 Use Cases
- **Guest Players**: Auto-generated username, customizable seagull name
- **Logged In**: Account username, personalized seagull name
- **Shared Devices**: Each account has separate saves
- **Multilingual**: Seagull name supports any language/emoji

---

## 📝 Code Files Modified

| File | Changes |
|------|---------|
| `saveload.js` | Added username/seagull name separation, updated save/load keys |
| `ui.js` | Updated `changeName()` to set seagull name only |
| `main.js` | Initialize seagull name on page load |
| `game.js` | Use seagull name for player creation |

---

## 🔮 Future Enhancements

1. **Username Change**: Allow username change (migrate save files)
2. **Save Profiles**: Multiple save slots per user
3. **Cloud Sync**: Sync saves across devices using username
4. **Name History**: Track previous seagull names
5. **Validation**: Add name length/format restrictions

---

## 📞 Support

If you encounter issues:
1. Check browser console for log messages
2. Verify localStorage keys using DevTools
3. Use test page to diagnose issues
4. Clear data and regenerate identity if needed

---

**Last Updated**: December 28, 2024  
**Version**: 1.0  
**Author**: Seagull Game Development Team 🦅
