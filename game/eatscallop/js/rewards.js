// ==================== 奖励和升级系统 ====================
const RewardSystem = {
    // 等级配置
    levelConfig: {
        maxLevel: 100,
        // 经验值计算：基础经验 * (等级 ^ 1.5)
        getRequiredExp(level) {
            return Math.floor(100 * Math.pow(level, 1.5));
        },
        // 根据经验值计算等级
        calculateLevel(totalExp) {
            let level = 1;
            let expForNextLevel = this.getRequiredExp(level);
            
            while (totalExp >= expForNextLevel && level < this.maxLevel) {
                totalExp -= expForNextLevel;
                level++;
                expForNextLevel = this.getRequiredExp(level);
            }
            
            return {
                level: level,
                currentExp: totalExp,
                requiredExp: expForNextLevel
            };
        }
    },
    
    // 金币配置
    coinConfig: {
        // 基础金币奖励
        baseGameReward: 10,
        // 每分钟存活奖励
        perMinuteSurvival: 2,
        // 每100能量奖励
        per100Power: 5,
        // 每吃一个扇贝奖励
        perScallop: 1,
        // 击败AI玩家奖励
        perAIDefeat: 3,
        // 排行榜奖励（前三名）
        leaderboardBonus: {
            1: 50,  // 第一名
            2: 30,  // 第二名
            3: 20   // 第三名
        }
    },
    
    // 经验值配置
    expConfig: {
        // 基础经验奖励
        baseGameReward: 50,
        // 每分钟存活奖励
        perMinuteSurvival: 10,
        // 每100能量奖励
        per100Power: 20,
        // 每吃一个扇贝奖励
        perScallop: 5,
        // 击败AI玩家奖励
        perAIDefeat: 15,
        // 排行榜奖励（前三名）
        leaderboardBonus: {
            1: 200,
            2: 120,
            3: 80
        }
    },
    
    // 计算游戏奖励
    calculateGameRewards(gameStats) {
        const {
            survivalTime = 0,      // 存活时间（秒）
            finalPower = 0,         // 最终能量
            scallopsEaten = 0,      // 吃掉的扇贝数
            aiDefeated = 0,         // 击败的AI数
            leaderboardRank = 0     // 排行榜排名（0表示未上榜）
        } = gameStats;
        
        // 计算金币
        let coins = this.coinConfig.baseGameReward;
        
        // 存活时间奖励（按分钟计算）
        const survivalMinutes = Math.floor(survivalTime / 60);
        coins += survivalMinutes * this.coinConfig.perMinuteSurvival;
        
        // 能量奖励
        coins += Math.floor(finalPower / 100) * this.coinConfig.per100Power;
        
        // 扇贝奖励
        coins += scallopsEaten * this.coinConfig.perScallop;
        
        // AI击败奖励
        coins += aiDefeated * this.coinConfig.perAIDefeat;
        
        // 排行榜奖励
        if (leaderboardRank > 0 && leaderboardRank <= 3) {
            coins += this.coinConfig.leaderboardBonus[leaderboardRank] || 0;
        }
        
        // 计算经验值
        let exp = this.expConfig.baseGameReward;
        
        // 存活时间奖励
        exp += survivalMinutes * this.expConfig.perMinuteSurvival;
        
        // 能量奖励
        exp += Math.floor(finalPower / 100) * this.expConfig.per100Power;
        
        // 扇贝奖励
        exp += scallopsEaten * this.expConfig.perScallop;
        
        // AI击败奖励
        exp += aiDefeated * this.expConfig.perAIDefeat;
        
        // 排行榜奖励
        if (leaderboardRank > 0 && leaderboardRank <= 3) {
            exp += this.expConfig.leaderboardBonus[leaderboardRank] || 0;
        }
        
        return {
            coins: Math.floor(coins),
            exp: Math.floor(exp),
            breakdown: {
                base: {
                    coins: this.coinConfig.baseGameReward,
                    exp: this.expConfig.baseGameReward
                },
                survival: {
                    minutes: survivalMinutes,
                    coins: survivalMinutes * this.coinConfig.perMinuteSurvival,
                    exp: survivalMinutes * this.expConfig.perMinuteSurvival
                },
                power: {
                    finalPower: finalPower,
                    coins: Math.floor(finalPower / 100) * this.coinConfig.per100Power,
                    exp: Math.floor(finalPower / 100) * this.expConfig.per100Power
                },
                scallops: {
                    count: scallopsEaten,
                    coins: scallopsEaten * this.coinConfig.perScallop,
                    exp: scallopsEaten * this.expConfig.perScallop
                },
                aiDefeats: {
                    count: aiDefeated,
                    coins: aiDefeated * this.coinConfig.perAIDefeat,
                    exp: aiDefeated * this.expConfig.perAIDefeat
                },
                leaderboard: {
                    rank: leaderboardRank,
                    coins: (leaderboardRank > 0 && leaderboardRank <= 3) ? 
                           (this.coinConfig.leaderboardBonus[leaderboardRank] || 0) : 0,
                    exp: (leaderboardRank > 0 && leaderboardRank <= 3) ? 
                         (this.expConfig.leaderboardBonus[leaderboardRank] || 0) : 0
                }
            }
        };
    },
    
    // 更新用户数据
    async updateUserStats(gameStats) {
        // 检查是否已登录
        if (typeof SeagullWorldAuth === 'undefined' || !SeagullWorldAuth.isLoggedIn()) {
            console.log('⚠️ User not logged in, skipping reward update');
            return null;
        }
        
        try {
            const user = SeagullWorldAuth.getCurrentUser();
            if (!user || !user.userId) {
                console.warn('⚠️ No valid user data');
                return null;
            }
            
            // 计算奖励
            const rewards = this.calculateGameRewards(gameStats);
            
            // 获取当前用户数据
            const currentExp = user.world?.experience || 0;
            const currentCoins = user.world?.seagullCoins || 0;
            
            // 计算新的经验值和金币
            const newExp = currentExp + rewards.exp;
            const newCoins = currentCoins + rewards.coins;
            
            // 计算等级
            const levelInfo = this.levelConfig.calculateLevel(newExp);
            const oldLevel = user.world?.worldLevel || 1;
            const leveledUp = levelInfo.level > oldLevel;
            
            // 更新用户数据
            const updateData = {
                world: {
                    ...user.world,
                    experience: newExp,
                    seagullCoins: newCoins,
                    worldLevel: levelInfo.level,
                    totalGamesPlayed: (user.world?.totalGamesPlayed || 0) + 1
                }
            };
            
            // 保存到服务器
            const response = await fetch('/api/user/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SeagullWorldAuth.getToken()}`
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update user stats');
            }
            
            const result = await response.json();
            
            // 更新本地缓存
            if (result.success) {
                SeagullWorldAuth.updateLocalUser(result.user);
            }
            
            console.log('✅ User stats updated:', {
                coinsEarned: rewards.coins,
                expEarned: rewards.exp,
                newLevel: levelInfo.level,
                leveledUp: leveledUp
            });
            
            return {
                rewards: rewards,
                levelInfo: levelInfo,
                leveledUp: leveledUp,
                oldLevel: oldLevel,
                newCoins: newCoins,
                newExp: newExp
            };
            
        } catch (error) {
            console.error('❌ Failed to update user stats:', error);
            return null;
        }
    },
    
    // 显示奖励界面
    showRewardSummary(rewardData) {
        if (!rewardData) return;
        
        const { rewards, levelInfo, leveledUp, oldLevel } = rewardData;
        
        let message = `游戏结束！\n\n`;
        message += `🎁 获得奖励：\n`;
        message += `💰 金币: +${rewards.coins}\n`;
        message += `⭐ 经验: +${rewards.exp}\n\n`;
        
        if (leveledUp) {
            message += `🎉 恭喜升级！\n`;
            message += `Lv.${oldLevel} → Lv.${levelInfo.level}\n\n`;
        }
        
        message += `当前等级: Lv.${levelInfo.level}\n`;
        message += `经验进度: ${levelInfo.currentExp}/${levelInfo.requiredExp}\n`;
        
        console.log(message);
        
        // 可以在这里添加UI显示
        this.displayRewardUI(rewardData);
    },
    
    // 显示奖励UI
    displayRewardUI(rewardData) {
        // 创建奖励显示面板
        const existingPanel = document.getElementById('rewardPanel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'rewardPanel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            color: white;
            min-width: 350px;
            text-align: center;
        `;
        
        const { rewards, levelInfo, leveledUp, oldLevel } = rewardData;
        
        let html = `
            <h2 style="margin: 0 0 20px 0; font-size: 2rem;">🎁 游戏结束</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-bottom: 15px;">
                <div style="font-size: 1.5rem; margin-bottom: 10px;">
                    💰 +${rewards.coins} 金币
                </div>
                <div style="font-size: 1.5rem;">
                    ⭐ +${rewards.exp} 经验
                </div>
            </div>
        `;
        
        if (leveledUp) {
            html += `
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                            padding: 15px; border-radius: 15px; margin-bottom: 15px;">
                    <div style="font-size: 1.8rem; margin-bottom: 5px;">🎉 升级了！</div>
                    <div style="font-size: 1.3rem;">Lv.${oldLevel} → Lv.${levelInfo.level}</div>
                </div>
            `;
        }
        
        html += `
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 15px; margin-bottom: 20px;">
                <div style="margin-bottom: 5px;">当前等级: <strong>Lv.${levelInfo.level}</strong></div>
                <div>经验进度: ${levelInfo.currentExp}/${levelInfo.requiredExp}</div>
                <div style="background: rgba(0,0,0,0.3); height: 20px; border-radius: 10px; margin-top: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #4CAF50, #8BC34A); 
                                height: 100%; width: ${(levelInfo.currentExp / levelInfo.requiredExp * 100).toFixed(1)}%; 
                                transition: width 0.5s;"></div>
                </div>
            </div>
            <button onclick="document.getElementById('rewardPanel').remove()" 
                    style="background: white; color: #667eea; border: none; padding: 12px 30px; 
                           border-radius: 10px; font-size: 1.1rem; font-weight: bold; 
                           cursor: pointer; transition: all 0.3s;">
                确定
            </button>
        `;
        
        panel.innerHTML = html;
        document.body.appendChild(panel);
        
        // 3秒后自动关闭（如果用户没有点击）
        setTimeout(() => {
            if (document.getElementById('rewardPanel')) {
                panel.style.transition = 'opacity 0.5s';
                panel.style.opacity = '0';
                setTimeout(() => panel.remove(), 500);
            }
        }, 5000);
    }
};
