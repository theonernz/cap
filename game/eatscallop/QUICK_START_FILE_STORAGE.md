# 🚀 Quick Start Guide - JSON File Storage

## Step-by-Step Setup

### ✅ **Step 1: Install Dependencies (if needed)**

```bash
cd c:\git\Seagull\game\eatscallop
npm install
```

### ✅ **Step 2: Start the Server**

```bash
cd c:\git\Seagull\game\eatscallop
start-server.bat
```

Or manually:
```bash
cd c:\git\Seagull
node server/index.js
```

You should see:
```
🚀 Server starting with NO CACHE headers for development...
Server running on http://localhost:3000
```

### ✅ **Step 3: Open Migration Tool**

Open in your browser:
```
http://localhost:3000/game/eatscallop/migration-tool.html
```

### ✅ **Step 4: Check Current Data**

Click **"Refresh Stats"** button to see:
- localStorage Users: X
- localStorage Saves: X
- JSON File Users: 0 (empty initially)
- JSON File Saves: 0 (empty initially)

### ✅ **Step 5: Create Backup (Recommended)**

Click **"💾 Create Backup"** button

This creates timestamped backup files:
- `Seagull/data/users.backup.2025-12-28T12-34-56.json`
- `Seagull/game/eatscallop/data/savedgames.backup.2025-12-28T12-34-56.json`

### ✅ **Step 6: Migrate Data**

Click **"🔄 Start Migration"** button

Watch the progress bar and log output:
```
[12:34:56] ℹ️ Starting migration process...
[12:34:57] ✅ Migration complete!
[12:34:57] ℹ️   Users: 3 success, 0 failed
[12:34:57] ℹ️   Saves: 6 success, 0 failed
```

### ✅ **Step 7: Verify Migration**

Click **"🔄 Refresh Stats"** again:
- JSON File Users: 3 ✅
- JSON File Saves: 6 ✅

### ✅ **Step 8: Test the System**

Click these buttons to test:
- **"Test User API"** - Should show ✅ success
- **"Test Save API"** - Should show ✅ success
- **"📄 View JSON Files"** - Shows file contents

### ✅ **Step 9: Clear localStorage (Optional)**

After confirming migration success, click **"🗑️ Clear localStorage"**

⚠️ Only do this AFTER verifying all data migrated successfully!

### ✅ **Step 10: Test the Game**

Open the game:
```
http://localhost:3000/game/eatscallop/eatscallop-index.html
```

Test features:
1. ✅ Login with migrated account
2. ✅ Load existing saves
3. ✅ Create new saves
4. ✅ Check save persistence (refresh page)

---

## 🎯 What Changed?

### **Before (localStorage):**
```javascript
localStorage.setItem('seagullWorld_users', JSON.stringify(users));
localStorage.setItem('sp_save_user_123', JSON.stringify(save));
```

### **After (JSON Files):**
```javascript
await FileStorageService.registerUser(userData);
await FileStorageService.createSave(saveData);
```

---

## 📁 File Locations

| Type | Location |
|------|----------|
| **User Registry** | `c:\git\Seagull\data\users.json` |
| **Game Saves** | `c:\git\Seagull\game\eatscallop\data\savedgames.json` |
| **User Backups** | `c:\git\Seagull\data\users.backup.*.json` |
| **Save Backups** | `c:\git\Seagull\game\eatscallop\data\savedgames.backup.*.json` |

---

## 🔍 Verify Files

### Check users.json:
```bash
type c:\git\Seagull\data\users.json
```

### Check savedgames.json:
```bash
type c:\git\Seagull\game\eatscallop\data\savedgames.json
```

---

## ✅ Success Checklist

- [ ] Server is running
- [ ] Migration tool opens successfully
- [ ] Stats show localStorage data
- [ ] Backup created successfully
- [ ] Migration completed (100%)
- [ ] JSON files contain data
- [ ] Game loads and works
- [ ] Saves persist after page refresh
- [ ] localStorage cleared (optional)

---

## ❌ Troubleshooting

### Problem: Server won't start

**Solution:**
```bash
# Kill existing process
taskkill /F /IM node.exe
# Restart server
node server/index.js
```

### Problem: Migration tool shows "Server not running"

**Solution:**
- Check if server is actually running (http://localhost:3000)
- Check server console for errors
- Make sure no firewall is blocking port 3000

### Problem: "Failed to fetch"

**Solution:**
- Refresh the page (Ctrl+F5)
- Check browser console for errors
- Verify server is running

### Problem: JSON files not created

**Solution:**
```bash
# Manually create directories
mkdir c:\git\Seagull\data
mkdir c:\git\Seagull\game\eatscallop\data
```

---

## 📞 Need Help?

1. Check server console logs
2. Check browser DevTools console (F12)
3. Check migration tool log output
4. View JSON file contents
5. Check FILE_STORAGE_SYSTEM.md for details

---

## 🎉 Success!

Once migration is complete:
- ✅ All data is now persistent in JSON files
- ✅ Works across browsers
- ✅ Survives cache clears
- ✅ Easy to backup and restore
- ✅ Ready for production!

---

**Next Steps:**
- Test all game features
- Create regular backups
- Consider implementing JWT authentication
- Deploy to production server
