# ========================================
# 清理临时文件 - 准备发布版本
# Clean Temporary Files - Prepare Release
# ========================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  清理临时文件并准备发布版本" -ForegroundColor Cyan
Write-Host "  Clean Temporary Files and Prepare Release" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = "c:\git\Seagull"
$cleanupLog = @()

# ============================================
# 1. 定义需要清理的临时文件和调试文件
# ============================================

$filesToDelete = @(
    # 调试和测试文件
    "test-script-order.html",
    "test-registration.html",
    "test-migration.html",
    "test-game-diagnostic.html",
    "diagnostic-script.js",
    "test-helper.ps1",
    
    # 修复过程文档（保留最终版本）
    "CACHE_SOLUTION.md",
    "CLEAR_CACHE_NOW.md",
    "FIX_SCRIPT_ORDER.md",
    "FIX_SERVER_CONNECTION.md",
    "REGISTRATION_TROUBLESHOOTING.md",
    "SOLUTION_NOW.md",
    "QUICK_FIX.md",
    "URGENT_FIX_MAIN_PAGE.md",
    "ROOT_CAUSE_FIXED.txt",
    "VISUAL_SUMMARY.txt",
    
    # 辅助工具
    "clear-cache-and-open.bat",
    "clear-cache-and-reload.ps1",
    "ONE_CLICK_FIX.bat",
    
    # 重复的调试页面
    "FORCE_RELOAD_GAME.html",
    "SOLUTION_HUB.html",
    "START_HERE.md",
    
    # 游戏目录下的重复文档
    "game\eatscallop\AUTH_LOCALSTORAGE_MIGRATION.md",
    "game\eatscallop\FILE_STORAGE_SUMMARY.md",
    "game\eatscallop\FINAL_COMPLETION_v4.2.md",
    "game\eatscallop\FINAL_COMPLETION_v4.2.2.md",
    "game\eatscallop\COMPLETION_SUMMARY_v4.2.2.md",
    "game\eatscallop\COMPLETION_REPORT.md",
    "game\eatscallop\FINAL_MIGRATION_REPORT.md",
    "game\eatscallop\FINAL_REPORT.md",
    "game\eatscallop\FIX_DETAILS.md",
    "game\eatscallop\FIX_SUMMARY.md",
    "game\eatscallop\LOCALSTORAGE_CLEANUP_COMPLETE.md",
    "game\eatscallop\PAGE_RELOAD_SOLUTION.md",
    "game\eatscallop\SAVE_LOGIN_REQUIREMENTS.md",
    "game\eatscallop\VERIFICATION_CHECKLIST.md",
    "game\eatscallop\VISUAL_OVERVIEW.md",
    
    # 测试工具
    "game\eatscallop\migration-tool.html",
    "game\eatscallop\test-login-and-badge.html",
    "game\eatscallop\test-mode-switch.html",
    "game\eatscallop\test-username-system.html"
)

# ============================================
# 2. 保留的重要文档（不删除）
# ============================================

$keepFiles = @(
    "README.md",
    "README_CN.md",
    "RELEASE_README.md",
    "RELEASE_CHECKLIST.md",
    "COMPLETE_SOLUTION_FINAL.md",
    "README_SOLUTION.md",
    "TESTING_CHECKLIST.md",
    "MIGRATION_COMPLETE.md",
    "game\eatscallop\README.md",
    "game\eatscallop\CHANGELOG.md",
    "game\eatscallop\FILE_STORAGE_SYSTEM.md",
    "game\eatscallop\FINAL_IMPLEMENTATION.md",
    "game\eatscallop\IMPLEMENTATION_CHECKLIST.md",
    "game\eatscallop\USERNAME_SYSTEM.md",
    "game\eatscallop\SAVE_SYSTEM_3SLOTS.md",
    "game\eatscallop\TESTING_GUIDE.md",
    "game\eatscallop\COMPLETE_TESTING_GUIDE.md",
    "game\eatscallop\TESTING_QUICK_GUIDE.md",
    "game\eatscallop\QUICK_REFERENCE.md",
    "game\eatscallop\QUICK_START_FILE_STORAGE.md"
)

Write-Host "保留的重要文档 (Keeping important docs):" -ForegroundColor Green
$keepFiles | ForEach-Object { Write-Host "  ✅ $_" -ForegroundColor Gray }
Write-Host ""

# ============================================
# 3. 执行清理
# ============================================

Write-Host "开始清理临时文件... (Starting cleanup...)" -ForegroundColor Yellow
Write-Host ""

$deletedCount = 0
$skippedCount = 0
$notFoundCount = 0

foreach ($file in $filesToDelete) {
    $fullPath = Join-Path $rootPath $file
    
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "  🗑️  已删除 Deleted: $file" -ForegroundColor Green
            $cleanupLog += "✅ Deleted: $file"
            $deletedCount++
        }
        catch {
            Write-Host "  ⚠️  无法删除 Failed to delete: $file" -ForegroundColor Red
            Write-Host "     错误 Error: $($_.Exception.Message)" -ForegroundColor Red
            $cleanupLog += "❌ Failed: $file - $($_.Exception.Message)"
            $skippedCount++
        }
    }
    else {
        Write-Host "  ℹ️  未找到 Not found: $file" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  清理统计 Cleanup Statistics" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ✅ 已删除 Deleted: $deletedCount 个文件" -ForegroundColor Green
Write-Host "  ⚠️  跳过 Skipped: $skippedCount 个文件" -ForegroundColor Yellow
Write-Host "  ℹ️  未找到 Not Found: $notFoundCount 个文件" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 4. 创建 ARCHIVED 文件夹（可选）
# ============================================

$choice = Read-Host "是否创建 ARCHIVED 文件夹保存部分文档？ Create ARCHIVED folder? [Y/N]"
if ($choice -eq "Y" -or $choice -eq "y") {
    $archivePath = Join-Path $rootPath "ARCHIVED"
    
    if (-not (Test-Path $archivePath)) {
        New-Item -ItemType Directory -Path $archivePath -Force | Out-Null
        Write-Host "✅ 已创建 ARCHIVED 文件夹" -ForegroundColor Green
    }
    
    # 将一些重要的修复文档移到归档
    $docsToArchive = @(
        "FINAL_TROUBLESHOOTING.md",
        "COMPLETE_SOLUTION_FINAL.md"
    )
    
    foreach ($doc in $docsToArchive) {
        $sourcePath = Join-Path $rootPath $doc
        $destPath = Join-Path $archivePath $doc
        
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath $destPath -Force
            Write-Host "  📦 已归档 Archived: $doc" -ForegroundColor Cyan
        }
    }
}

# ============================================
# 5. 验证关键文件存在
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  验证关键文件 Verify Critical Files" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$criticalFiles = @(
    "index.html",
    "package.json",
    "server\index.js",
    "server\FileStorageAPI.js",
    "general\js\file-storage-client.js",
    "general\js\seagull-world\auth.js",
    "game\eatscallop\eatscallop-index.html",
    "game\eatscallop\js\file-storage-client.js",
    "data\users.json"
)

$allCriticalExist = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $rootPath $file
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "  ❌ 缺失 Missing: $file" -ForegroundColor Red
        $allCriticalExist = $false
    }
}

Write-Host ""

if ($allCriticalExist) {
    Write-Host "✅ 所有关键文件都存在！All critical files exist!" -ForegroundColor Green
}
else {
    Write-Host "⚠️  警告：某些关键文件缺失！Warning: Some critical files missing!" -ForegroundColor Red
}

# ============================================
# 6. 生成清理报告
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  生成清理报告 Generate Cleanup Report" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$reportPath = Join-Path $rootPath "CLEANUP_REPORT.txt"
$reportContent = @"
════════════════════════════════════════════════════════════════
  清理报告 Cleanup Report
  日期 Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
════════════════════════════════════════════════════════════════

统计 Statistics:
  ✅ 已删除文件 Deleted: $deletedCount
  ⚠️  跳过文件 Skipped: $skippedCount
  ℹ️  未找到文件 Not Found: $notFoundCount

详细日志 Detailed Log:
$($cleanupLog -join "`n")

保留的文档 Kept Documents:
$($keepFiles -join "`n")

关键文件验证 Critical Files Verification:
$($criticalFiles | ForEach-Object { 
    $path = Join-Path $rootPath $_
    if (Test-Path $path) { "✅ $_" } else { "❌ $_" }
} | Out-String)

════════════════════════════════════════════════════════════════
  清理完成！Cleanup Complete!
════════════════════════════════════════════════════════════════
"@

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "📄 清理报告已保存到 Report saved to: CLEANUP_REPORT.txt" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  🎉 清理完成！Cleanup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. 检查 CLEANUP_REPORT.txt 查看详细信息" -ForegroundColor White
Write-Host "  2. 运行测试确保功能正常" -ForegroundColor White
Write-Host "  3. 更新 README.md 和 RELEASE_README.md" -ForegroundColor White
Write-Host "  4. 提交到版本控制系统" -ForegroundColor White
Write-Host ""

pause
