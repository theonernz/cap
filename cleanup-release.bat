@echo off
chcp 65001 >nul
color 0B
title 清理临时文件 - Release Cleanup

echo.
echo ════════════════════════════════════════════════════════════════
echo   🗑️  清理临时文件 Clean Temporary Files
echo   准备发布版本 Prepare Release Version
echo ════════════════════════════════════════════════════════════════
echo.

cd /d c:\git\Seagull

echo 📋 开始清理... Starting cleanup...
echo.

REM 删除测试文件
echo 🗑️  删除测试文件 Deleting test files...
if exist test-script-order.html del /f /q test-script-order.html
if exist test-registration.html del /f /q test-registration.html
if exist test-migration.html del /f /q test-migration.html
if exist test-game-diagnostic.html del /f /q test-game-diagnostic.html
if exist diagnostic-script.js del /f /q diagnostic-script.js
if exist test-helper.ps1 del /f /q test-helper.ps1
echo    ✅ 测试文件已删除

REM 删除修复文档
echo.
echo 🗑️  删除临时修复文档 Deleting temporary fix documents...
if exist CACHE_SOLUTION.md del /f /q CACHE_SOLUTION.md
if exist CLEAR_CACHE_NOW.md del /f /q CLEAR_CACHE_NOW.md
if exist FIX_SCRIPT_ORDER.md del /f /q FIX_SCRIPT_ORDER.md
if exist FIX_SERVER_CONNECTION.md del /f /q FIX_SERVER_CONNECTION.md
if exist REGISTRATION_TROUBLESHOOTING.md del /f /q REGISTRATION_TROUBLESHOOTING.md
if exist SOLUTION_NOW.md del /f /q SOLUTION_NOW.md
if exist QUICK_FIX.md del /f /q QUICK_FIX.md
if exist URGENT_FIX_MAIN_PAGE.md del /f /q URGENT_FIX_MAIN_PAGE.md
if exist ROOT_CAUSE_FIXED.txt del /f /q ROOT_CAUSE_FIXED.txt
if exist VISUAL_SUMMARY.txt del /f /q VISUAL_SUMMARY.txt
if exist FINAL_TROUBLESHOOTING.md del /f /q FINAL_TROUBLESHOOTING.md
echo    ✅ 修复文档已删除

REM 删除辅助工具
echo.
echo 🗑️  删除辅助工具 Deleting helper tools...
if exist clear-cache-and-open.bat del /f /q clear-cache-and-open.bat
if exist clear-cache-and-reload.ps1 del /f /q clear-cache-and-reload.ps1
if exist ONE_CLICK_FIX.bat del /f /q ONE_CLICK_FIX.bat
if exist FORCE_RELOAD_GAME.html del /f /q FORCE_RELOAD_GAME.html
if exist SOLUTION_HUB.html del /f /q SOLUTION_HUB.html
if exist START_HERE.md del /f /q START_HERE.md
echo    ✅ 辅助工具已删除

REM 删除游戏目录下的临时文档
echo.
echo 🗑️  清理游戏目录 Cleaning game directory...
if exist game\eatscallop\AUTH_LOCALSTORAGE_MIGRATION.md del /f /q game\eatscallop\AUTH_LOCALSTORAGE_MIGRATION.md
if exist game\eatscallop\FILE_STORAGE_SUMMARY.md del /f /q game\eatscallop\FILE_STORAGE_SUMMARY.md
if exist game\eatscallop\FINAL_COMPLETION_v4.2.md del /f /q game\eatscallop\FINAL_COMPLETION_v4.2.md
if exist game\eatscallop\FINAL_COMPLETION_v4.2.2.md del /f /q game\eatscallop\FINAL_COMPLETION_v4.2.2.md
if exist game\eatscallop\COMPLETION_SUMMARY_v4.2.2.md del /f /q game\eatscallop\COMPLETION_SUMMARY_v4.2.2.md
if exist game\eatscallop\COMPLETION_REPORT.md del /f /q game\eatscallop\COMPLETION_REPORT.md
if exist game\eatscallop\FINAL_MIGRATION_REPORT.md del /f /q game\eatscallop\FINAL_MIGRATION_REPORT.md
if exist game\eatscallop\FINAL_REPORT.md del /f /q game\eatscallop\FINAL_REPORT.md
if exist game\eatscallop\FIX_DETAILS.md del /f /q game\eatscallop\FIX_DETAILS.md
if exist game\eatscallop\FIX_SUMMARY.md del /f /q game\eatscallop\FIX_SUMMARY.md
if exist game\eatscallop\LOCALSTORAGE_CLEANUP_COMPLETE.md del /f /q game\eatscallop\LOCALSTORAGE_CLEANUP_COMPLETE.md
if exist game\eatscallop\PAGE_RELOAD_SOLUTION.md del /f /q game\eatscallop\PAGE_RELOAD_SOLUTION.md
if exist game\eatscallop\SAVE_LOGIN_REQUIREMENTS.md del /f /q game\eatscallop\SAVE_LOGIN_REQUIREMENTS.md
if exist game\eatscallop\VERIFICATION_CHECKLIST.md del /f /q game\eatscallop\VERIFICATION_CHECKLIST.md
if exist game\eatscallop\VISUAL_OVERVIEW.md del /f /q game\eatscallop\VISUAL_OVERVIEW.md
echo    ✅ 游戏目录已清理

REM 删除测试工具
echo.
echo 🗑️  删除游戏测试工具 Deleting game test tools...
if exist game\eatscallop\migration-tool.html del /f /q game\eatscallop\migration-tool.html
if exist game\eatscallop\test-login-and-badge.html del /f /q game\eatscallop\test-login-and-badge.html
if exist game\eatscallop\test-mode-switch.html del /f /q game\eatscallop\test-mode-switch.html
if exist game\eatscallop\test-username-system.html del /f /q game\eatscallop\test-username-system.html
echo    ✅ 测试工具已删除

echo.
echo ════════════════════════════════════════════════════════════════
echo   ✅ 清理完成！Cleanup Complete!
echo ════════════════════════════════════════════════════════════════
echo.
echo 保留的重要文档 Important docs kept:
echo   ✅ README.md
echo   ✅ README_CN.md
echo   ✅ RELEASE_README.md
echo   ✅ RELEASE_CHECKLIST.md
echo   ✅ RELEASE_PREPARATION.md
echo   ✅ COMPLETE_SOLUTION_FINAL.md
echo   ✅ README_SOLUTION.md
echo   ✅ TESTING_CHECKLIST.md
echo   ✅ MIGRATION_COMPLETE.md
echo   ✅ game\eatscallop\README.md
echo   ✅ game\eatscallop\CHANGELOG.md
echo   ✅ game\eatscallop\FILE_STORAGE_SYSTEM.md
echo.
echo 下一步 Next steps:
echo   1. 查看 RELEASE_PREPARATION.md 准备发布
echo   2. 更新版本号到 package.json
echo   3. 运行功能测试
echo   4. 提交到版本控制
echo.
pause
