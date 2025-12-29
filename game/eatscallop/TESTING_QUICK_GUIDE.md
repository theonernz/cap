# Quick Testing Guide - FileStorage System

## 🚀 Quick Start

### 1. Start the Server
```powershell
cd c:\git\Seagull\game\eatscallop
.\start-server.bat
```
Server will start on: `http://localhost:3000`

### 2. Open the Game
Navigate to: `http://localhost:3000/eatscallop-index.html`

### 3. Login (Required for Save/Load)
- Click **Login** button
- Enter any username/password (registers new user automatically)
- You should see your username displayed

---

## 🧪 Test Scenarios

### ✅ Test 1: Single Player Save
1. Start a new game (Single Player mode)
2. Play for a bit to accumulate some power
3. Click **Save** button
4. Enter a save name (e.g., "Test Save 1")
5. Click **Save**
6. **Expected**: Success notification, save appears in list

**Verify**:
- Check `c:\git\Seagull\game\eatscallop\data\savedgames.json`
- Should contain your save with all game data

### ✅ Test 2: Single Player Load
1. Continue from Test 1
2. Click **Load** button
3. See your save in the list
4. Click on a save to load it
5. **Expected**: Game restored to saved state

**Verify**:
- Player position matches saved position
- Power level matches saved power
- All scallops and AI restored

### ✅ Test 3: Save Limit (3 max)
1. Create 3 saves in Single Player mode
2. Try to create a 4th save
3. **Expected**: Error message "Maximum 3 saves allowed"

### ✅ Test 4: Delete Save
1. Click **Save** button
2. Find a save in the list
3. Click **Delete** button next to it
4. **Expected**: Save removed from list and server

**Verify**:
- Save removed from `savedgames.json`

### ✅ Test 5: Multiplayer Save
1. Start game in Multiplayer mode
2. Connect to server
3. Play for a bit
4. Click **Save** button
5. Enter save name
6. **Expected**: Multiplayer save created

**Verify**:
- Save has `isMultiplayer: true` flag
- Save contains `playerData` with position and power

### ✅ Test 6: Clear All Saves
1. Create a few saves
2. Open browser console: `SaveLoadSystem.clearAllSaves()`
3. Confirm deletion
4. **Expected**: All user saves deleted

**Verify**:
- User's saves removed from `savedgames.json`
- Other users' saves remain untouched

### ✅ Test 7: Save Without Login
1. Don't login
2. Try to click **Save** button
3. **Expected**: Button disabled, tooltip says "Please login"

### ✅ Test 8: Load Without Login
1. Don't login
2. Try to click **Load** button
3. **Expected**: Button disabled, tooltip says "Please login"

---

## 🔍 Debugging

### Check Save Files
```powershell
# View savedgames.json
cat c:\git\Seagull\game\eatscallop\data\savedgames.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# View users.json
cat c:\git\Seagull\data\users.json | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Browser Console Commands
```javascript
// Check if FileStorageService is loaded
console.log(FileStorageService);

// Test API connection
await FileStorageService.getSavesByUser('testuser', false);

// Check current player identity
PlayerIdentity.getCurrentIdentity();

// Check if user is logged in
SaveLoadSystem.isUserLoggedIn();

// Manually trigger save
SaveLoadSystem.saveGame();

// Get all saves
await SaveLoadSystem.getSinglePlayerSaves();
await SaveLoadSystem.getMultiplayerSaves();
```

### Common Issues

#### ❌ "Cannot read property of undefined (FileStorageService)"
**Solution**: Make sure `file-storage-client.js` is loaded in HTML:
```html
<script src="js/file-storage-client.js"></script>
```

#### ❌ "Fetch failed" or "Network error"
**Solution**: 
1. Check server is running: `http://localhost:3000`
2. Check server console for errors
3. Verify `server/index.js` has all API endpoints

#### ❌ "Save failed" 
**Solution**:
1. Check browser console for error details
2. Check server console for error logs
3. Verify data files exist and have write permissions

#### ❌ Load button stays disabled
**Solution**:
1. Make sure you're logged in
2. Check if you have any saves: `await SaveLoadSystem.getSinglePlayerSaves()`
3. Check `updateLoadButtonState()` was called after login

---

## 📊 Expected Behavior

### Save File Structure (`savedgames.json`)
```json
{
  "metadata": {
    "created": 1703721600000,
    "lastModified": 1703721600000,
    "totalSaves": 1,
    "version": "1.0.0"
  },
  "saves": [
    {
      "id": "save_1703721600000_abc123",
      "name": "Test Save 1",
      "username": "player1",
      "timestamp": 1703721600000,
      "dateString": "12/28/2025, 10:00:00 AM",
      "isMultiplayer": false,
      "owner": {
        "playerId": "player_1703721500000_xyz789",
        "username": "player1",
        "playerName": "SeagullPlayer",
        "createdAt": 1703721500000
      },
      "player": {
        "name": "SeagullPlayer",
        "x": 500,
        "y": 300,
        "power": 150,
        "size": 25,
        "color": "#4A90E2"
      },
      "gameStats": {
        "scallopsEaten": 15,
        "gameTime": 45000,
        "zoomLevel": 1.0
      },
      "aiPlayers": [...],
      "scallops": [...],
      "config": {...}
    }
  ]
}
```

### User File Structure (`users.json`)
```json
{
  "metadata": {
    "created": 1703721600000,
    "lastModified": 1703721600000,
    "totalUsers": 1,
    "version": "1.0.0"
  },
  "users": [
    {
      "id": "user_1703721600000_abc123",
      "username": "player1",
      "password": "hashed_password_here",
      "createdAt": 1703721600000,
      "lastLogin": 1703721600000
    }
  ]
}
```

---

## 🎯 Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **Saves persist after browser refresh**
✅ **Saves accessible from different browsers/devices**
✅ **JSON files created and updated correctly**
✅ **No localStorage errors**
✅ **Login/logout works correctly**
✅ **Save ownership enforced**

---

## 📞 Need Help?

### Check Documentation
- `FILE_STORAGE_SYSTEM.md` - Technical details
- `QUICK_START_FILE_STORAGE.md` - Setup guide
- `LOCALSTORAGE_CLEANUP_COMPLETE.md` - Migration summary
- `IMPLEMENTATION_CHECKLIST.md` - Full testing checklist

### Useful Commands
```javascript
// Enable detailed logging
localStorage.setItem('debug', 'true');

// View all localStorage keys (should only have PlayerIdentity stuff)
Object.keys(localStorage).filter(k => k.includes('seagull'));

// Test save creation directly
await FileStorageService.createSave({
    name: "Test",
    username: "player1",
    timestamp: Date.now(),
    player: { power: 100 }
});
```

---

## ✨ Happy Testing!

Remember: The localStorage cleanup is **complete**. All game saves now use the server-side JSON file storage system via the FileStorageService API.
