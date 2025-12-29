@echo off
echo ================================================
echo   Seagull Multiplayer Server Launcher
echo ================================================
echo.
echo Starting server on port 3000...
echo Keep this window open while playing!
echo.
echo Server will be available at:
echo   http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo ================================================
echo.

cd /d "%~dp0"
npm start

pause
