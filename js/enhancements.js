// Game Enhancements - Scallop King, Spoiled Scallops, Leaderboard Badges
const originalDrawScallop = DrawingSystem.drawScallop;
DrawingSystem.drawScallop = function(x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress, scallop) {
    if (!scallop) {
        return originalDrawScallop.call(this, x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress);
    }
    const drawSize = size;
    let animationScale = 1.0;
    if (isGrowing && growthProgress !== undefined) {
        animationScale = 1.0 + Math.sin(growthProgress * Math.PI * 4) * 0.15;
    }
    const finalSize = drawSize * animationScale;
    if (scallop.isKing || scallop.isKingCandidate) {
        this.ctx.save();
        const time = Date.now() / 1000;
        const glowSize = finalSize + 8 + Math.sin(time * 3) * 3;
        const gradient = this.ctx.createRadialGradient(x, y, finalSize, x, y, glowSize);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.7, scallop.isKing ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 105, 180, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
        if (scallop.isKing) {
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            const crown = String.fromCharCode(0x1F451);
            this.ctx.strokeText(crown, x, y - finalSize - 15);
            this.ctx.fillText(crown, x, y - finalSize - 15);
        }
        this.ctx.restore();
    }
    if (scallop.isSpoiled) {
        this.ctx.save();
        const time = Date.now() / 500;
        this.ctx.strokeStyle = 'rgba(255, 0, 0, ' + (0.5 + Math.sin(time) * 0.3) + ')';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, finalSize + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FF0000';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        const skull = String.fromCharCode(0x2620);
        this.ctx.strokeText(skull, x, y - finalSize - 12);
        this.ctx.fillText(skull, x, y - finalSize - 12);
        this.ctx.restore();
    }
    originalDrawScallop.call(this, x, y, size, color, innerColor, zoomLevel, isGrowing, growthProgress);
};
const originalDrawSeagull = DrawingSystem.drawSeagull;
DrawingSystem.drawSeagull = function(entity, isControllable, zoomLevel, mainPlayer) {
    originalDrawSeagull.call(this, entity, isControllable, zoomLevel, mainPlayer);
    if (CONFIG.leaderboardBadges && CONFIG.leaderboardBadges.enabled && entity.leaderboardRank) {
        const rank = entity.leaderboardRank;
        const size = entity.size * 10;
        this.ctx.save();
        const badgeY = entity.y - size - 25;
        const badgeSize = 18;
        if (rank <= 3 && CONFIG.leaderboardBadges.showTrophies) {
            let trophyColor, trophy;
            if (rank === 1) {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.first;
                trophy = String.fromCharCode(0x1F3C6);
            } else if (rank === 2) {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.second;
                trophy = String.fromCharCode(0x1F948);
            } else {
                trophyColor = CONFIG.leaderboardBadges.trophyColors.third;
                trophy = String.fromCharCode(0x1F949);
            }
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(entity.x, badgeY, badgeSize / 2 + 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = trophyColor;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeText(trophy, entity.x, badgeY);
            this.ctx.fillText(trophy, entity.x, badgeY);
        } else if (CONFIG.leaderboardBadges.showRankNumber) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(entity.x, badgeY, badgeSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(rank.toString(), entity.x, badgeY);
        }
        this.ctx.restore();
    }
};
const originalUpdateGame = Game.updateGame;
Game.updateGame = function(timestamp) {
    const result = originalUpdateGame.call(this, timestamp);
    if (CONFIG.leaderboardBadges && CONFIG.leaderboardBadges.enabled) {
        this.updateLeaderboardRanks();
    }
    return result;
};
Game.updateLeaderboardRanks = function() {
    const allEntities = [];
    EntityManager.players.forEach(player => {
        if (!player.isDead) {
            allEntities.push(player);
        }
    });
    EntityManager.aiSeagulls.forEach(seagull => {
        if (!seagull.isDead) {
            allEntities.push(seagull);
        }
    });
    allEntities.sort((a, b) => b.power - a.power);
    allEntities.forEach((entity, index) => {
        entity.leaderboardRank = index + 1;
    });
};
console.log('Game enhancements loaded: Scallop King, Spoiled Scallops, Leaderboard Badges');
