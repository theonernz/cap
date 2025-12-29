# ✅ Testing Checklist - Quick Reference

## 🚀 Pre-Flight Check

- [ ] Server running on port 3000
- [ ] Browser opened to http://localhost:3000/test-migration.html
- [ ] Browser console open (F12)
- [ ] No errors in console

---

## 👤 User Authentication Tests

### Register New User
- [ ] Open test-migration.html
- [ ] Enter username: `testuser`
- [ ] Enter password: `password123`
- [ ] Click "Test Register"
- [ ] See ✅ success message
- [ ] Verify users.json updated (PowerShell: `Get-Content c:\git\Seagull\data\users.json`)

### Login Existing User
- [ ] Refresh page
- [ ] Enter same username/password
- [ ] Click "Test Login"
- [ ] See ✅ success message
- [ ] Session shows "Active" in stats

### Get User Info
- [ ] Click "Get User Info"
- [ ] See user details displayed
- [ ] Verify all fields present (userId, username, profile, world, games)

### Update User Profile
- [ ] Click "Update User"
- [ ] See ✅ success message
- [ ] Verify motto updated with timestamp

### Logout
- [ ] Click "Test Logout"
- [ ] Session shows "None" in stats
- [ ] localStorage session cleared

---

## 💾 Game Save Tests

### Create Single Player Save
- [ ] Login first (if not logged in)
- [ ] Click "Create Test Save"
- [ ] See ✅ success message
- [ ] Note the Save ID

### Get All Saves
- [ ] Click "Get All Saves"
- [ ] See list of saves
- [ ] Count matches expected

### Load Existing Save
- [ ] Click "Load Save"
- [ ] See game data displayed
- [ ] Verify data matches what was saved

### Create Multiplayer Save
- [ ] Click "Test Multiplayer Save"
- [ ] See ✅ success message
- [ ] Note it says "Multiplayer"

### Delete Save
- [ ] Click "Delete Save"
- [ ] See ✅ success message
- [ ] Click "Get All Saves" to verify deletion

---

## 🔌 System Status Tests

### Check Server Status
- [ ] Click "Check Server"
- [ ] See ✅ "Server is online"
- [ ] Status badge shows "Online" (green)

### Check Data Files
- [ ] Click "Check Data Files"
- [ ] See ✅ for users.json
- [ ] See ✅ for savedgames.json
- [ ] Numbers show correct counts

### View localStorage
- [ ] Click "View localStorage"
- [ ] Should only see session keys
- [ ] No save data in localStorage
- [ ] No user data in localStorage

---

## 🎮 Real Game Test

### In-Game Registration
- [ ] Open http://localhost:3000/game/eatscallop/eatscallop-index.html
- [ ] Click "Login/Register" button
- [ ] Register new user: `gametest`
- [ ] See login confirmation

### In-Game Save
- [ ] Play game for 30 seconds
- [ ] Press ESC key
- [ ] Click "Save Game"
- [ ] Enter save name: "Test Save 1"
- [ ] See success message

### In-Game Load
- [ ] Refresh the page (F5)
- [ ] Login as same user
- [ ] Press ESC key
- [ ] Click "Load Game"
- [ ] Select your save
- [ ] Click "Load"
- [ ] Verify game state restored

### Multiple Saves
- [ ] Play more
- [ ] Save as "Test Save 2"
- [ ] Save as "Test Save 3"
- [ ] Press ESC → Load Game
- [ ] Should see all 3 saves listed

---

## 🐛 Error Handling Tests

### Invalid Login
- [ ] Logout if logged in
- [ ] Try login with wrong username: `nonexistent`
- [ ] Should see error message
- [ ] No session created

### Save Without Login
- [ ] Logout completely
- [ ] Try "Create Test Save"
- [ ] Should see error: "No active session"

### Delete Non-Existent Save
- [ ] Try to delete with invalid save ID
- [ ] Should handle gracefully

---

## 📊 Data Verification

### Check users.json
```powershell
Get-Content c:\git\Seagull\data\users.json | ConvertFrom-Json | Select-Object -ExpandProperty users
```
- [ ] Users present
- [ ] Passwords hashed
- [ ] Profile data complete

### Check savedgames.json
```powershell
Get-Content c:\git\Seagull\game\eatscallop\data\savedgames.json | ConvertFrom-Json | Select-Object -ExpandProperty saves
```
- [ ] Saves present
- [ ] Game data stored
- [ ] Metadata correct

### Verify localStorage Clean
```javascript
// In browser console
Object.keys(localStorage).filter(k => k.includes('seagull'))
```
- [ ] Only session keys present
- [ ] No `seagullWorld_users`
- [ ] No `seagullGame_singlePlayerSaves_*`
- [ ] No `seagullGame_multiplayerSaves`

---

## ✨ Final Verification

### Code Quality
- [ ] No errors in browser console
- [ ] No errors in VS Code problems panel
- [ ] All async methods working

### Functionality
- [ ] Registration works
- [ ] Login works
- [ ] Saves work
- [ ] Loads work
- [ ] Deletes work

### Data Integrity
- [ ] Users persist after refresh
- [ ] Saves persist after refresh
- [ ] localStorage only has sessions
- [ ] Server files update correctly

### Documentation
- [ ] Read MIGRATION_COMPLETE.md
- [ ] Understand system architecture
- [ ] Know where to find help

---

## 🎯 All Tests Passed?

If all boxes are checked ✅:

**CONGRATULATIONS!** 🎉

Your migration is complete and working perfectly!

**Next Steps:**
1. Deploy to production (when ready)
2. Add authentication middleware
3. Implement JWT tokens
4. Add rate limiting
5. Set up monitoring

---

## 🚨 Problems?

### Server Issues
```powershell
# Check server
Get-Process -Name node

# Restart server
cd c:\git\Seagull\game\eatscallop
.\start-server.bat
```

### Browser Issues
- Clear cache (Ctrl+Shift+Delete)
- Disable extensions
- Try incognito mode

### Data Issues
- Check file permissions
- Verify JSON files are valid
- Check server logs

---

**Test Started:** ___________  
**Test Completed:** ___________  
**Result:** ⭐⭐⭐⭐⭐

---

**Tester Notes:**

_________________________________

_________________________________

_________________________________

_________________________________
