// ==================== 海鸥世界UI管理系统 ====================
/**
 * Seagull World UI Manager
 * 管理登录/注册对话框、用户菜单等UI组件
 */

const SeagullWorldUI = {
    // 初始化UI
    init() {
        console.log('[Seagull World UI] Initializing UI...');
        
        // 更新用户界面
        this.updateUserInterface();
        
        // 监听键盘事件（Enter键提交表单）
        this.setupKeyboardListeners();
    },
    
    // 更新用户界面
    updateUserInterface() {
        const session = SeagullWorldAuth.getCurrentSession();
        const userMenu = document.getElementById('userMenu');
        const guestPrompt = document.getElementById('guestPrompt');
        
        if (session) {
            // 已登录：显示用户菜单
            if (userMenu) {
                userMenu.style.display = 'flex';
                document.getElementById('userAvatar').textContent = session.avatar || '🦅';
                document.getElementById('userName').textContent = session.displayName || session.username;
                
                // 获取完整用户数据
                const user = SeagullWorldAuth.getCurrentUser();
                if (user && user.world) {
                    document.getElementById('userLevel').textContent = `Lv.${user.world.worldLevel || 1}`;
                    document.getElementById('userCoins').textContent = `💰 ${user.world.seagullCoins || 0}`;
                }
            }
            
            if (guestPrompt) {
                guestPrompt.style.display = 'none';
            }
        } else {
            // 未登录：显示游客提示
            if (userMenu) {
                userMenu.style.display = 'none';
            }
            
            if (guestPrompt) {
                guestPrompt.style.display = 'flex';
            }
        }
    },
    
    // 显示认证对话框
    showAuthDialog(mode = 'login') {
        const overlay = document.getElementById('authDialogOverlay');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        if (!overlay) return;
        
        overlay.style.display = 'flex';
        
        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            title.textContent = '登录海鸥世界';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            title.textContent = '注册海鸥世界账号';
        }
        
        this.clearAuthError();
        this.clearFormInputs();
    },
    
    // 关闭认证对话框
    closeAuthDialog() {
        const overlay = document.getElementById('authDialogOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        this.clearAuthError();
        this.clearFormInputs();
    },
    
    // 切换到登录表单
    switchToLogin() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        title.textContent = '登录海鸥世界';
        this.clearAuthError();
    },
    
    // 切换到注册表单
    switchToRegister() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const title = document.getElementById('authDialogTitle');
        
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        title.textContent = '注册海鸥世界账号';
        this.clearAuthError();
    },
    
    // 处理登录
    async handleLogin() {        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!username || !password) {
            this.showAuthError('请输入用户名和密码');
            return;
        }
        
        // 显示加载状态
        const submitBtn = document.querySelector('#loginForm .auth-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;
        
        try {
            const result = await SeagullWorldAuth.login(username, password, rememberMe);
            
            if (result.success) {
                console.log('[Seagull World UI] Login successful:', result.user.username);
                this.closeAuthDialog();
                this.updateUserInterface();
                this.showNotification('✅ 登录成功！欢迎回到海鸥世界', 'success');
            } else {
                this.showAuthError(result.error || '登录失败');
            }
        } catch (error) {
            console.error('[Seagull World UI] Login error:', error);
            this.showAuthError('登录时发生错误，请重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },
      // 处理注册
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const displayName = document.getElementById('registerDisplayName').value.trim();
        
        if (!username || !password) {
            this.showAuthError('请输入用户名和密码');
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showAuthError('两次输入的密码不一致');
            return;
        }
        
        // 显示加载状态
        const submitBtn = document.querySelector('#registerForm .auth-submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '注册中...';
        submitBtn.disabled = true;
        
        try {
            const result = await SeagullWorldAuth.register(username, password, {
                displayName: displayName || username,
                avatar: '🦅',
                language: (typeof CONFIG !== 'undefined' ? CONFIG.language : null) || 'en'
            });
            
            if (result.success) {
                console.log('[Seagull World UI] Registration successful:', result.user.username);
                this.closeAuthDialog();
                this.updateUserInterface();
                this.showNotification('🎉 注册成功！欢迎加入海鸥世界', 'success');
            } else {
                this.showAuthError(result.error || '注册失败');
            }
        } catch (error) {
            console.error('[Seagull World UI] Registration error:', error);
            this.showAuthError('注册时发生错误，请重试');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },
    
    // 登出
    logout() {
        if (confirm('确定要退出登录吗？')) {
            SeagullWorldAuth.logout();
            this.updateUserInterface();
            this.showNotification('👋 已退出登录', 'info');
            
            // 如果在游戏中，可以选择刷新页面
            if (typeof game !== 'undefined' && game.running) {
                if (confirm('退出登录后需要重新加载页面，是否继续？')) {
                    location.reload();
                }
            }
        }
    },
    
    // 显示认证错误
    showAuthError(message) {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },
    
    // 清除认证错误
    clearAuthError() {
        const errorElement = document.getElementById('authError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    },
    
    // 清除表单输入
    clearFormInputs() {
        const inputs = [
            'loginUsername', 'loginPassword', 'rememberMe',
            'registerUsername', 'registerPassword', 'registerPasswordConfirm', 'registerDisplayName'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = false;
                } else {
                    element.value = '';
                }
            }
        });
    },
    
    // 显示通知（使用现有的SaveLoadSystem通知系统）
    showNotification(message, type = 'info') {
        if (typeof SaveLoadSystem !== 'undefined' && SaveLoadSystem.showNotification) {
            SaveLoadSystem.showNotification(message, type);
        } else {
            alert(message);
        }
    },
    
    // 设置键盘监听
    setupKeyboardListeners() {
        // 登录表单回车提交
        const loginInputs = ['loginUsername', 'loginPassword'];
        loginInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleLogin();
                    }
                });
            }
        });
        
        // 注册表单回车提交
        const registerInputs = ['registerUsername', 'registerPassword', 'registerPasswordConfirm', 'registerDisplayName'];
        registerInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleRegister();
                    }
                });
            }
        });
        
        // ESC键关闭对话框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('authDialogOverlay');
                if (overlay && overlay.style.display === 'flex') {
                    this.closeAuthDialog();
                }
            }
        });
        
        // 点击遮罩层关闭对话框
        const overlay = document.getElementById('authDialogOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAuthDialog();
                }
            });
        }
    }
};

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.SeagullWorldUI = SeagullWorldUI;
}
