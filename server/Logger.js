const fs = require('fs');
const path = require('path');

class Logger {
    constructor(config = {}) {
        this.level = config.level || 'INFO';
        this.maxFileSize = (config.maxFileSize || 50) * 1024 * 1024; // 转换为字节
        this.maxFiles = config.maxFiles || 5;
        this.consoleOutput = config.consoleOutput !== false;
        this.timestampFormat = config.timestampFormat || 'full';
        this.logFilePath = config.logFilePath || path.join(__dirname, '../game/eatscallop/data/server.0.log');
        
        // 日志级别优先级
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        this.currentLevel = this.levels[this.level] !== undefined ? this.levels[this.level] : this.levels.INFO;
        
        // 确保日志目录存在
        const logDir = path.dirname(this.logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        // 创建写入流
        this.createWriteStream();
        
        this.info('Logger initialized', {
            level: this.level,
            maxFileSize: `${config.maxFileSize || 50}MB`,
            maxFiles: this.maxFiles,
            logFile: this.logFilePath
        });
    }
    
    createWriteStream() {
        if (this.writeStream) {
            this.writeStream.end();
        }
        this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    }
    
    getTimestamp() {
        const now = new Date();
        
        switch (this.timestampFormat) {
            case 'full':
                return now.toISOString().replace('T', ' ').substring(0, 23);
            case 'time':
                return now.toTimeString().substring(0, 8);
            case 'none':
                return '';
            default:
                return now.toISOString().replace('T', ' ').substring(0, 23);
        }
    }
    
    formatMessage(level, message, data) {
        const timestamp = this.getTimestamp();
        const timestampStr = timestamp ? `[${timestamp}]` : '';
        const levelStr = `[${level}]`;
        
        let formattedMessage = `${timestampStr}${levelStr} ${message}`;
        
        if (data && Object.keys(data).length > 0) {
            formattedMessage += ' ' + JSON.stringify(data);
        }
        
        return formattedMessage;
    }
    
    checkFileSize() {
        try {
            const stats = fs.statSync(this.logFilePath);
            if (stats.size >= this.maxFileSize) {
                this.rotateLogFiles();
            }
        } catch (err) {
            // 文件不存在，无需处理
        }
    }
    
    rotateLogFiles() {
        // 关闭当前写入流
        if (this.writeStream) {
            this.writeStream.end();
        }
        
        const logDir = path.dirname(this.logFilePath);
        const baseName = path.basename(this.logFilePath, '.log').replace(/\.0$/, '');
        
        // 从后往前滚动日志文件
        // 删除最后一个文件（如果存在）
        const lastFile = path.join(logDir, `${baseName}.${this.maxFiles - 1}.log`);
        if (fs.existsSync(lastFile)) {
            fs.unlinkSync(lastFile);
        }
        
        // 重命名其他文件
        for (let i = this.maxFiles - 2; i >= 0; i--) {
            const oldFile = path.join(logDir, `${baseName}.${i}.log`);
            const newFile = path.join(logDir, `${baseName}.${i + 1}.log`);
            
            if (fs.existsSync(oldFile)) {
                fs.renameSync(oldFile, newFile);
            }
        }
        
        // 重新创建写入流
        this.createWriteStream();
        
        if (this.consoleOutput) {
            console.log(`[Logger] Log file rotated. New log: ${this.logFilePath}`);
        }
    }
    
    writeLog(level, message, data) {
        // 检查日志级别
        if (this.levels[level] < this.currentLevel) {
            return;
        }
        
        // 检查文件大小
        this.checkFileSize();
        
        const formattedMessage = this.formatMessage(level, message, data);
        
        // 写入文件
        this.writeStream.write(formattedMessage + '\n');
        
        // 控制台输出
        if (this.consoleOutput) {
            const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log';
            console[consoleMethod](formattedMessage);
        }
    }
    
    debug(message, data) {
        this.writeLog('DEBUG', message, data);
    }
    
    info(message, data) {
        this.writeLog('INFO', message, data);
    }
    
    warn(message, data) {
        this.writeLog('WARN', message, data);
    }
    
    error(message, data) {
        this.writeLog('ERROR', message, data);
    }
    
    close() {
        if (this.writeStream) {
            this.writeStream.end();
        }
    }
}

module.exports = Logger;
