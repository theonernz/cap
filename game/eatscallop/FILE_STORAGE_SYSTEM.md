# JSON File Storage System Documentation

## 📋 Overview

This system migrates from `localStorage` to **JSON file storage** for persistent data management across the Seagull World platform.

### **Storage Architecture:**

```
Seagull/
├── data/
│   └── users.json               # All user accounts
│   └── users.backup.*.json      # Automatic backups
└── game/eatscallop/data/
    └── savedgames.json          # All game saves
    └── savedgames.backup.*.json # Automatic backups
```

---

## 🚀 Getting Started

### **1. Start the Server**

```bash
cd c:\git\Seagull
node server/index.js
```

Or use the batch file:
```bash
cd c:\git\Seagull\game\eatscallop
start-server.bat
```

### **2. Run Migration Tool**

Open in browser:
```
http://localhost:3000/game/eatscallop/migration-tool.html
```

### **3. Migrate Data**

1. Click **"Refresh Stats"** to see current data
2. Click **"Create Backup"** (recommended)
3. Click **"Start Migration"** to transfer all data
4. After successful migration, click **"Clear localStorage"**

---

## 📊 Data Structure

### **Users.json Format:**

```json
{
  "version": "1.0.0",
  "users": {
    "user_1234567890_abc": {
      "userId": "user_1234567890_abc",
      "username": "seagull_player",
      "passwordHash": "sha256hash...",
      "profile": {
        "displayName": "Seagull Player",
        "avatar": "🦅",
        "bio": "",
        "motto": "",
        "createdAt": 1735344000000,
        "lastLogin": 1735344000000
      },
      "world": {
        "seagullCoins": 100,
        "worldLevel": 1,
        "totalPlayTime": 0,
        "totalGamesPlayed": 0
      },
      "games": {},
      "achievements": [],
      "friends": [],
      "preferences": {
        "language": "en",
        "theme": "light"
      }
    }
  },
  "metadata": {
    "created": "2025-12-28T00:00:00.000Z",
    "lastModified": "2025-12-28T12:34:56.000Z",
    "totalUsers": 1
  }
}
```

### **Savedgames.json Format:**

```json
{
  "version": "1.0.0",
  "saves": {
    "sp_save_username_1735344000000": {
      "id": "sp_save_username_1735344000000",
      "name": "My Save Game",
      "version": "1.0",
      "timestamp": 1735344000000,
      "dateString": "12/28/2025, 12:00:00 PM",
      "isMultiplayer": false,
      "owner": {
        "userId": "user_1234567890_abc",
        "username": "seagull_player",
        "playerName": "Seagull Player"
      },
      "player": {
        "name": "Seagull Player",
        "x": 1000,
        "y": 1000,
        "power": 150,
        "size": 25,
        "color": "#4285f4"
      },
      "gameStats": {
        "scallopsEaten": 42,
        "gameTime": 12000,
        "zoomLevel": 1.0
      }
    }
  },
  "metadata": {
    "created": "2025-12-28T00:00:00.000Z",
    "lastModified": "2025-12-28T12:34:56.000Z",
    "totalSaves": 1
  }
}
```

---

## 🔌 REST API Endpoints

### **User Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Register new user |
| POST | `/api/users/login` | Login user (get user data) |
| GET | `/api/users/:userId` | Get user by ID |
| PUT | `/api/users/:userId` | Update user |
| DELETE | `/api/users/:userId` | Delete user |

### **Save Game Management**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/saves` | Create new save |
| GET | `/api/saves/:username?multiplayer=false` | Get user's saves |
| GET | `/api/saves/id/:saveId` | Get save by ID |
| DELETE | `/api/saves/:saveId` | Delete save |
| DELETE | `/api/saves/user/:username` | Delete all user saves |

### **Backup**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/backup/users` | Create users.json backup |
| POST | `/api/backup/saves` | Create savedgames.json backup |

---

## 💻 Client-Side Usage

### **Using FileStorageService**

```javascript
// Register user
const result = await FileStorageService.registerUser({
    userId: 'user_123',
    username: 'player1',
    passwordHash: 'hash...',
    profile: { displayName: 'Player One', avatar: '🦅' }
});

// Get user's saves
const saves = await FileStorageService.getSavesByUser('player1', false);

// Create save
const saveData = SaveLoadSystem.createSaveData();
saveData.id = `sp_save_player1_${Date.now()}`;
const result = await FileStorageService.createSave(saveData);

// Delete save
await FileStorageService.deleteSave(saveId);
```

---

## 🔄 Migration Process

### **What Gets Migrated:**

1. **Users** from `localStorage.seagullWorld_users`
2. **Single Player Saves** from `localStorage.seagullGame_singlePlayerSaves_*`
3. **Multiplayer Saves** from `localStorage.seagullGame_multiplayerSaves`

### **Migration Steps:**

```javascript
// Automatic migration
const result = await FileStorageService.migrateFromLocalStorage();

console.log(result.results);
// {
//   users: { success: 3, failed: 0 },
//   saves: { success: 6, failed: 0 }
// }
```

---

## 🛡️ Benefits Over localStorage

| Feature | localStorage | JSON Files |
|---------|--------------|------------|
| **Browser-Specific** | ❌ Yes (Chrome ≠ Firefox) | ✅ No (Server-side) |
| **Device-Specific** | ❌ Yes | ✅ No |
| **Survives Cache Clear** | ❌ No | ✅ Yes |
| **Cross-Device Access** | ❌ No | ✅ Yes |
| **Backup Support** | ❌ Manual | ✅ Automatic |
| **Storage Limit** | ❌ 5-10MB | ✅ Unlimited |
| **Multi-User Support** | ❌ Shared | ✅ Isolated |
| **Data Portability** | ❌ Difficult | ✅ Easy (JSON) |

---

## 🔒 Security Considerations

### **Current Implementation:**

- Passwords are hashed with SHA-256 + salt
- Each user has isolated data
- Save ownership validation prevents unauthorized access

### **Production Recommendations:**

1. **Add JWT authentication** for API endpoints
2. **Implement rate limiting** to prevent abuse
3. **Use HTTPS** in production
4. **Add user session management**
5. **Implement proper error logging**

---

## 📦 Backup System

### **Automatic Backups:**

Backups are created with timestamp:
```
data/users.backup.2025-12-28T12-34-56.json
game/eatscallop/data/savedgames.backup.2025-12-28T12-34-56.json
```

### **Manual Backup:**

```javascript
await FileStorageService.backupUsers();
await FileStorageService.backupSaves();
```

### **Restore from Backup:**

1. Stop the server
2. Copy backup file to original location:
   ```bash
   copy data\users.backup.2025-12-28T12-34-56.json data\users.json
   ```
3. Restart server

---

## 🧪 Testing

### **Test Migration Tool:**

```
http://localhost:3000/game/eatscallop/migration-tool.html
```

### **Test API Endpoints:**

```bash
# Test user registration
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","username":"testuser","passwordHash":"hash"}'

# Test get saves
curl http://localhost:3000/api/saves/testuser?multiplayer=false
```

---

## 🐛 Troubleshooting

### **Problem: "Failed to fetch"**

- ✅ Make sure server is running
- ✅ Check server console for errors
- ✅ Verify API endpoint URLs

### **Problem: "User already exists"**

- ✅ Clear `data/users.json` if testing
- ✅ Or use different username

### **Problem: "Maximum 3 saves"**

- ✅ Delete old saves before creating new ones
- ✅ Or clear all saves for testing

### **Problem: Migration fails**

- ✅ Check if JSON files are writable
- ✅ Ensure directories exist
- ✅ Check server logs for errors

---

## 📝 Notes

- JSON files are updated atomically (safe for concurrent access)
- Metadata is automatically updated on each save
- Old localStorage data is not automatically deleted (manual cleanup)
- Backups should be created before major updates

---

## 🎯 Next Steps

1. ✅ Complete migration from localStorage
2. ✅ Test all save/load functionality
3. ✅ Create regular backups
4. 🔜 Implement JWT authentication (optional)
5. 🔜 Add cloud storage sync (optional)
6. 🔜 Implement data encryption (optional)

---

## 📞 Support

For issues or questions, check:
- Server logs in console
- Migration tool log output
- Browser DevTools console
- JSON file contents in `data/` directories
