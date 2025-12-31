const fs = require('fs');
const path = require('path');

/**
 * INI配置文件解析器（支持配置继承和覆盖）
 * 支持从基础配置文件继承，并用覆盖配置文件覆盖特定值
 */
class ConfigParser {
    constructor(configPath, baseConfigPath = null) {
        this.configPath = configPath;
        this.baseConfigPath = baseConfigPath;
        this.config = {};
        this.baseConfig = {};
        this.watchers = [];
        this.onConfigChange = null;
        
        this.load();
    }
    
    /**
     * 加载配置文件
     */
    load() {
        // 先加载基础配置（如果有）
        if (this.baseConfigPath) {
            this.baseConfig = this.parseFile(this.baseConfigPath);
            console.log(`[ConfigParser] Loaded base config: ${this.baseConfigPath}`);
        }
        
        // 再加载覆盖配置
        const overrideConfig = this.parseFile(this.configPath);
        console.log(`[ConfigParser] Loaded config: ${this.configPath}`);
        
        // 合并配置（覆盖配置优先）
        this.config = this.mergeConfig(this.baseConfig, overrideConfig);
        
        console.log(`[ConfigParser] Config merged successfully`);
    }
    
    /**
     * 解析单个INI文件
     */
    parseFile(filePath) {
        const config = {};
        
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`[ConfigParser] Config file not found: ${filePath}`);
                return config;
            }
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            let currentSection = null;
            
            for (let line of lines) {
                line = line.trim();
                
                // 跳过空行和注释
                if (!line || line.startsWith('#') || line.startsWith(';')) {
                    continue;
                }
                
                // 解析段落 [section]
                if (line.startsWith('[') && line.endsWith(']')) {
                    currentSection = line.substring(1, line.length - 1);
                    // 如果段落不存在，创建新段落
                    if (!config[currentSection]) {
                        config[currentSection] = {};
                    }
                    continue;
                }
                
                // 解析键值对
                const equalIndex = line.indexOf('=');
                if (equalIndex > 0 && currentSection) {
                    const key = line.substring(0, equalIndex).trim();
                    let value = line.substring(equalIndex + 1).trim();
                    
                    // 移除行尾注释
                    const commentIndex = value.indexOf('#');
                    if (commentIndex > 0) {
                        value = value.substring(0, commentIndex).trim();
                    }
                    
                    // 类型转换
                    if (value.toLowerCase() === 'true') {
                        value = true;
                    } else if (value.toLowerCase() === 'false') {
                        value = false;
                    } else if (!isNaN(value) && value !== '') {
                        value = Number(value);
                    }
                    
                    config[currentSection][key] = value;
                }
            }
        } catch (err) {
            console.error(`[ConfigParser] Error loading config file: ${err.message}`);
        }
        
        return config;
    }
    
    /**
     * 合并配置（深度合并）
     */
    mergeConfig(base, override) {
        const result = JSON.parse(JSON.stringify(base));
        
        for (const section in override) {
            if (!result[section]) {
                result[section] = {};
            }
            
            for (const key in override[section]) {
                result[section][key] = override[section][key];
            }
        }
        
        return result;
    }
    
    /**
     * 重新加载配置（热重载）
     */
    reload() {
        console.log('[ConfigParser] 🔄 Reloading configuration...');
        this.load();
        
        if (this.onConfigChange) {
            this.onConfigChange(this.config);
        }
        
        console.log('[ConfigParser] ✅ Configuration reloaded');
    }
    
    /**
     * 监听配置文件变化（热重载）
     */
    watchConfig() {
        if (this.baseConfigPath && fs.existsSync(this.baseConfigPath)) {
            const baseWatcher = fs.watch(this.baseConfigPath, (eventType) => {
                if (eventType === 'change') {
                    console.log(`[ConfigParser] 📝 Base config changed: ${this.baseConfigPath}`);
                    setTimeout(() => this.reload(), 200);
                }
            });
            this.watchers.push(baseWatcher);
            console.log(`[ConfigParser] 👁️  Watching: ${this.baseConfigPath}`);
        }
        
        if (fs.existsSync(this.configPath)) {
            const watcher = fs.watch(this.configPath, (eventType) => {
                if (eventType === 'change') {
                    console.log(`[ConfigParser] 📝 Config changed: ${this.configPath}`);
                    setTimeout(() => this.reload(), 200);
                }
            });
            this.watchers.push(watcher);
            console.log(`[ConfigParser] 👁️  Watching: ${this.configPath}`);
        }
    }
    
    /**
     * 停止监听
     */
    unwatchConfig() {
        this.watchers.forEach(w => w.close());
        this.watchers = [];
        console.log('[ConfigParser] 🛑 Stopped watching');
    }
    
    get(section, key, defaultValue = null) {
        if (this.config[section] && this.config[section][key] !== undefined) {
            return this.config[section][key];
        }
        return defaultValue;
    }
    
    getSection(section) {
        return this.config[section] || {};
    }
    
    getAll() {
        return this.config;
    }
}

module.exports = ConfigParser;
