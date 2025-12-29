@echo off
REM ========================================
REM 海鸥吃扇贝 - 游戏服务器启动脚本
REM ========================================

echo.
echo =======================================
echo   🦅 海鸥吃扇贝 游戏服务器 v4.0
echo =======================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version
echo.

REM 检查依赖
if not exist "node_modules" (
    if not exist "..\..\node_modules" (
        echo ⚠️  未找到 node_modules，正在安装依赖...
        echo.
        cd ..\..
        call npm install
        cd game\eatscallop
        if %errorlevel% neq 0 (
            echo ❌ 依赖安装失败
            pause
            exit /b 1
        )
        echo.
    )
)

echo ✅ 依赖检查通过
echo.

REM 显示配置信息
echo 📋 服务器配置:
echo    - 端口: 3000
echo    - 游戏刷新率: 60Hz
echo    - 世界大小: 5000x5000
echo    - 最大玩家: 50
echo    - AI海鸥: 50
echo    - 扇贝数量: 800
echo.

REM 启动服务器
echo 🚀 正在启动游戏服务器...
echo.
echo =======================================
echo.

node server/index.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ 服务器启动失败
    pause
    exit /b 1
)

pause
