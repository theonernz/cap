// ==================== Server Configuration ====================
// 服务器配置文件 - 可以轻松切换本地/远程服务器
// Server Configuration - Easy switching between local/remote servers

const SERVER_CONFIG = {
    // 可用的服务器列表 - Available servers
    servers: {
        local: {
            name: '本地服务器 (Local)',
            url: 'ws://localhost:3000',
            description: '在本机运行的服务器 - Server running on this machine'
        },        network: {
            name: '局域网服务器 (Network)',
            url: 'ws://192.168.1.68:3000', // Server network IP
            description: '局域网内的服务器 - Server on local network'
        },
        vdx2242: {
            name: 'VDX2242 服务器',
            url: 'ws://vdx2242:3000',
            description: 'vdx2242 主机上的服务器'
        },
        custom: {
            name: '自定义服务器 (Custom)',
            url: '',  // 用户可以输入自定义地址 - User can enter custom address
            description: '输入自定义服务器地址 - Enter custom server address'
        }
    },
      // 当前使用的服务器 - Current server to use
    // Options: 'local', 'network', 'vdx2242', 'custom'
    // Change this to 'network' when connecting from another machine
    current: 'local',
    
    // 获取当前服务器 URL
    getCurrentServerUrl() {
        const server = this.servers[this.current];
        if (!server) {
            console.error('Invalid server configuration:', this.current);
            return this.servers.local.url;
        }
        
        // 如果是自定义服务器，从 localStorage 读取
        if (this.current === 'custom') {
            const customUrl = localStorage.getItem('customServerUrl');
            if (customUrl) {
                return customUrl;
            }
            // 如果没有自定义 URL，回退到本地
            console.warn('No custom server URL set, falling back to local');
            return this.servers.local.url;
        }
        
        return server.url;
    },
    
    // 设置服务器
    setServer(serverKey) {
        if (this.servers[serverKey]) {
            this.current = serverKey;
            localStorage.setItem('selectedServer', serverKey);
            console.log(`Server changed to: ${this.servers[serverKey].name}`);
            return true;
        }
        return false;
    },
    
    // 设置自定义服务器 URL
    setCustomServerUrl(url) {
        // 验证 URL 格式
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
            url = 'ws://' + url;
        }
        
        localStorage.setItem('customServerUrl', url);
        this.servers.custom.url = url;
        this.setServer('custom');
        console.log('Custom server URL set:', url);
        return url;
    },
    
    // 从 localStorage 恢复上次选择的服务器
    restoreLastServer() {
        const lastServer = localStorage.getItem('selectedServer');
        if (lastServer && this.servers[lastServer]) {
            this.current = lastServer;
            
            // 如果是自定义服务器，也恢复 URL
            if (lastServer === 'custom') {
                const customUrl = localStorage.getItem('customServerUrl');
                if (customUrl) {
                    this.servers.custom.url = customUrl;
                }
            }
            
            console.log(`Restored last server: ${this.servers[lastServer].name}`);
        }
    },
    
    // 获取所有服务器列表
    getServerList() {
        return Object.keys(this.servers).map(key => ({
            key: key,
            ...this.servers[key]
        }));
    }
};

// 页面加载时恢复上次选择的服务器
SERVER_CONFIG.restoreLastServer();
