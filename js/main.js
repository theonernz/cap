// ==================== 主程序入口 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 初始化绘制系统
    DrawingSystem.init('gameCanvas');
    
    // 应用初始语言设置
    UISystem.applyLanguage();
    
    // 设置初始地图大小显示
    document.getElementById('mapSize').textContent = `${CONFIG.worldWidth}x${CONFIG.worldHeight}`;
    document.getElementById('aiPlayerCount').textContent = CONFIG.aiPlayerCount;
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化游戏尺寸
    game.initGameSize();
});

// 设置事件监听器
function setupEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    
    // 鼠标事件
    canvas.addEventListener('mousedown', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        if (e.button === 0) {
            e.preventDefault();
            game.isDragging = true;
            canvas.classList.add('dragging');
            
            const rect = canvas.getBoundingClientRect();
            game.dragStartX = e.clientX - rect.left;
            game.dragStartY = e.clientY - rect.top;
            game.dragCurrentX = game.dragStartX;
            game.dragCurrentY = game.dragStartY;
            
            UISystem.hideControlHint();
        }
        
        if (e.button === 2) game.isRightMouseDown = true;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (game.isDragging) {
            game.dragCurrentX = mouseX;
            game.dragCurrentY = mouseY;
            game.dragVectorX = game.dragCurrentX - game.dragStartX;
            game.dragVectorY = game.dragCurrentY - game.dragStartY;
        }
    });
    
    canvas.addEventListener('mouseup', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        if (e.button === 0) {
            game.isDragging = false;
            canvas.classList.remove('dragging');
        }
        
        if (e.button === 2) {
            game.isRightMouseDown = false;
            const mainPlayer = EntityManager.players[0];
            if (mainPlayer) mainPlayer.isBoosting = false;
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        if (game.isDragging) {
            game.isDragging = false;
            canvas.classList.remove('dragging');
        }
        
        game.isRightMouseDown = false;
        const mainPlayer = EntityManager.players[0];
        if (mainPlayer) mainPlayer.isBoosting = false;
    });
    
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!game.running || game.paused || game.gameOver) return;
        
        if (e.deltaY < 0) game.zoomIn();
        else game.zoomOut();
    });
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        if (!game.running || game.paused || game.gameOver) return;
        
        switch(e.key) {
            case ' ': game.quickStop(); break;
            case '+': case '=': game.zoomIn(); break;
            case '-': case '_': game.zoomOut(); break;
            case 'm': case 'M': MiniMapSystem.toggleMiniMap(); break;
        }
    });
    
    // 缩放按钮
    document.getElementById('zoomInBtn').addEventListener('click', () => game.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => game.zoomOut());
    
    // 窗口大小调整
    window.addEventListener('resize', () => {
        if (game.running) game.initGameSize();
    });
}