# Dynamic Game System Test Script
# Tests the new dynamic game loading functionality

Write-Host "🎮 Testing Seagull World Dynamic Game System" -ForegroundColor Cyan
Write-Host "=" * 60

# Test 1: Check configuration file
Write-Host "`n📋 Test 1: Configuration File" -ForegroundColor Yellow
if (Test-Path "game/config/games.ini") {
    Write-Host "✅ games.ini exists" -ForegroundColor Green
    Get-Content "game/config/games.ini" | Select-Object -First 10
} else {
    Write-Host "❌ games.ini not found" -ForegroundColor Red
}

# Test 2: Check game manifests
Write-Host "`n📦 Test 2: Game Manifests" -ForegroundColor Yellow
$games = @("eatscallop", "island-adventure", "battle-royale")
foreach ($game in $games) {
    $manifestPath = "game/$game/manifest.json"
    if (Test-Path $manifestPath) {
        $manifest = Get-Content $manifestPath | ConvertFrom-Json
        Write-Host "✅ $game - $($manifest.name.zh) (v$($manifest.version))" -ForegroundColor Green
    } else {
        Write-Host "❌ $game manifest not found" -ForegroundColor Red
    }
}

# Test 3: Check game loader
Write-Host "`n🔄 Test 3: Game Loader Module" -ForegroundColor Yellow
if (Test-Path "general/js/game-loader.js") {
    $loaderSize = (Get-Item "general/js/game-loader.js").Length
    Write-Host "✅ game-loader.js exists ($loaderSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ game-loader.js not found" -ForegroundColor Red
}

# Test 4: Start server and test API
Write-Host "`n🌐 Test 4: Server API Test" -ForegroundColor Yellow
Write-Host "Starting server..." -ForegroundColor Gray

$serverJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node server/index.js 2>&1 | Out-Null
}

Start-Sleep -Seconds 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/games" -Method Get
    if ($response.success) {
        Write-Host "✅ API responded successfully" -ForegroundColor Green
        Write-Host "`nGames returned:" -ForegroundColor Cyan
        foreach ($game in $response.games) {
            Write-Host "  - $($game.name.zh) ($($game.gameId)) - $($game.status)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ API returned error" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to connect to server: $_" -ForegroundColor Red
} finally {
    Stop-Job $serverJob -ErrorAction SilentlyContinue
    Remove-Job $serverJob -ErrorAction SilentlyContinue
    Write-Host "`nServer stopped" -ForegroundColor Gray
}

# Test 5: Check game-index.html integration
Write-Host "`n🎨 Test 5: Game Hall Integration" -ForegroundColor Yellow
$gameIndexContent = Get-Content "game/game-index.html" -Raw
if ($gameIndexContent -match "game-loader\.js") {
    Write-Host "✅ game-loader.js included in game-index.html" -ForegroundColor Green
}
if ($gameIndexContent -match "gamesGridContainer") {
    Write-Host "✅ Dynamic container found in HTML" -ForegroundColor Green
}
if ($gameIndexContent -match "gameLoader\.renderGames") {
    Write-Host "✅ Render call found in JavaScript" -ForegroundColor Green
}

Write-Host "`n" + ("=" * 60)
Write-Host "✨ Testing Complete!" -ForegroundColor Cyan
Write-Host "`nTo manually test:" -ForegroundColor Yellow
Write-Host "  1. Run: node server/index.js"
Write-Host "  2. Open: http://localhost:3000/game/game-index.html"
Write-Host "  3. API: http://localhost:3000/api/games"
