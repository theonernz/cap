# ========================================
# 海鸥吃扇贝.io - 游戏服务器启动脚本
# ========================================

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  🦅 海鸥吃扇贝.io 游戏服务器 v4.0" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到 Node.js" -ForegroundColor Red
    Write-Host "请先安装 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按任意键退出"
    exit 1
}

Write-Host ""

# 检查依赖
if (-not (Test-Path "node_modules") -and -not (Test-Path "..\..\node_modules")) {
    Write-Host "⚠️  未找到 node_modules，正在安装依赖..." -ForegroundColor Yellow
    Write-Host ""
    Push-Location ..\..
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        Read-Host "按任意键退出"
        exit 1
    }
    Write-Host ""
}

Write-Host "✅ 依赖检查通过" -ForegroundColor Green
Write-Host ""

# 显示配置信息
Write-Host "📋 服务器配置:" -ForegroundColor Cyan
Write-Host "   - 端口: 3000" -ForegroundColor White
Write-Host "   - 游戏刷新率: 60Hz" -ForegroundColor White
Write-Host "   - 世界大小: 5000x5000" -ForegroundColor White
Write-Host "   - 最大玩家: 50" -ForegroundColor White
Write-Host "   - AI海鸥: 50" -ForegroundColor White
Write-Host "   - 扇贝数量: 800" -ForegroundColor White
Write-Host ""

# 获取本机IP
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress

if ($ipAddress) {
    Write-Host "🌐 访问地址:" -ForegroundColor Cyan
    Write-Host "   本地: http://localhost:3000/eatscallop-index.html" -ForegroundColor Green
    Write-Host "   网络: http://$($ipAddress):3000/eatscallop-index.html" -ForegroundColor Green
} else {
    Write-Host "🌐 访问地址: http://localhost:3000/eatscallop-index.html" -ForegroundColor Green
}
Write-Host ""

# 启动服务器
Write-Host "🚀 正在启动游戏服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

node server/index.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ 服务器启动失败" -ForegroundColor Red
    Read-Host "按任意键退出"
    exit 1
}

Read-Host "按任意键退出"
