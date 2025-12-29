const fs = require('fs');
const path = require('path');

/**
 * 简单的INI文件解析器
 */
class ConfigParser {
    constructor(configPath) {
        this.configPath = configPath;
        this.config = {};
        this.load();
    }
    
    load() {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.warn(`Config file not found: ${this.configPath}`);
                return;
            }
            
            const content = fs.readFileSync(this.configPath, 'utf-8');
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
                    this.config[currentSection] = {};
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
                    
                    this.config[currentSection][key] = value;
                }
            }
        } catch (err) {
            console.error(`Error loading config file: ${err.message}`);
        }
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
