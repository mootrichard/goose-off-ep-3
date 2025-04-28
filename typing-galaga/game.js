class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.activePowerUps = new Map();
        this.powerUpTypes = [
            {
                id: 'rapid',
                name: 'RAPID',
                color: '#00ff00',
                duration: 10000,
                effect: () => {
                    this.game.laserSpeed *= 2;
                    this.game.multiShot = 2;
                },
                cleanup: () => {
                    this.game.laserSpeed /= 2;
                    this.game.multiShot = 1;
                }
            },
            {
                id: 'shield',
                name: 'SHIELD',
                color: '#0066ff',
                duration: 8000,
                effect: () => {
                    this.game.damageMultiplier = 0.5;
                },
                cleanup: () => {
                    this.game.damageMultiplier = 1;
                }
            },
            {
                id: 'heal',
                name: 'HEAL',
                color: '#ff00ff',
                duration: 0,
                effect: () => {
                    this.game.player.health = Math.min(
                        this.game.player.maxHealth,
                        this.game.player.health + 30
                    );
                    this.game.updateHealth();
                }
            },
            {
                id: 'bomb',
                name: 'BOMB',
                color: '#ff0000',
                duration: 0,
                effect: () => {
                    this.game.enemies.forEach(enemy => {
                        this.game.createExplosion(enemy.x, enemy.y, enemy.color);
                    });
                    this.game.score += this.game.enemies.length * 50;
                    this.game.enemies = [];
                    this.game.updateScore();
                }
            }
        ];
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.2) { // 20% chance to spawn
            const powerUp = {...this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)]};
            powerUp.x = x;
            powerUp.y = y;
            powerUp.speed = 1;
            return powerUp;
        }
        return null;
    }

    activatePowerUp(powerUp) {
        const type = this.powerUpTypes.find(t => t.id === powerUp.id);
        if (type) {
            // If it's already active, just reset the duration
            if (this.activePowerUps.has(type.id)) {
                clearTimeout(this.activePowerUps.get(type.id));
            } else {
                type.effect();
            }

            if (type.duration > 0) {
                this.activePowerUps.set(type.id, setTimeout(() => {
                    type.cleanup();
                    this.activePowerUps.delete(type.id);
                    this.updateUI();
                }, type.duration));
            }
            this.updateUI();
        }
    }

    updateUI() {
        const container = document.getElementById('active-powers');
        container.innerHTML = '';
        
        for (const [id, timeout] of this.activePowerUps) {
            const type = this.powerUpTypes.find(t => t.id === id);
            const element = document.createElement('div');
            element.className = 'power-up-indicator';
            element.style.borderColor = type.color;
            element.textContent = type.name;
            container.appendChild(element);
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.powerUpManager = new PowerUpManager(this);
        this.init();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && e.code === 'Space') {
                this.restart();
                return;
            }
            if (e.key.length === 1) {
                this.handleTyping(e.key.toUpperCase());
            }
        });
    }

    init() {
        // Game state
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.particles = [];
        this.lasers = [];
        this.powerUps = [];
        this.laserSpeed = 15;
        this.multiShot = 1;
        this.damageMultiplier = 1;
        
        // Word lists by difficulty
        this.wordsByLevel = {
            easy: ['SPACE', 'ALIEN', 'STAR', 'SHIP', 'BEAM', 'MOON'],
            medium: ['GALAXY', 'COSMIC', 'METEOR', 'NEBULA', 'PLASMA', 'PHOTON'],
            hard: ['SUPERNOVA', 'ASTEROID', 'QUANTUM', 'STARSHIP', 'WORMHOLE', 'NEUTRON']
        };
        
        // Game settings
        this.baseEnemySpeed = 0.5;
        this.spawnInterval = 2000;
        this.enemies = [];
        this.spawnTimer = null;
        
        // Player setup
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 50,
            height: 30,
            color: '#00ff00',
            health: 100,
            maxHealth: 100
        };

        // Set up event listeners
        this.setupEventListeners();
        
        // Start game systems
        this.startSpawning();
        this.gameLoop();
        
        // Update UI
        this.updateScore();
        this.updateLevel();
        this.updateHealth();
    }

    restart() {
        document.getElementById('game-over').style.display = 'none';
        this.init();
    }

    startSpawning() {
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        this.spawnTimer = setInterval(() => this.spawnEnemy(), 
            Math.max(500, this.spawnInterval - (this.level - 1) * 100));
    }

    getRandomWord() {
        let pool;
        if (this.level <= 3) {
            pool = this.wordsByLevel.easy;
        } else if (this.level <= 6) {
            pool = [...this.wordsByLevel.easy, ...this.wordsByLevel.medium];
        } else {
            pool = [...this.wordsByLevel.medium, ...this.wordsByLevel.hard];
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    spawnEnemy() {
        const word = this.getRandomWord();
        const enemy = {
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: 0,
            word: word,
            currentIndex: 0,
            speed: this.baseEnemySpeed * (1 + (this.level - 1) * 0.1),
            width: 40,
            height: 40,
            color: this.getRandomEnemyColor(),
            angle: 0,
            targetable: true
        };
        this.enemies.push(enemy);
    }

    getRandomEnemyColor() {
        const colors = ['#ff0000', '#ff4400', '#ff6600', '#ff9900'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 2 + Math.random() * 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color
            });
        }
    }

    fireLaser(startX, startY, targetX, targetY) {
        const laser = {
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            targetX,
            targetY,
            speed: this.laserSpeed,
            color: '#00ffff',
            life: 1
        };
        
        // Calculate velocity
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        laser.vx = (dx / distance) * laser.speed;
        laser.vy = (dy / distance) * laser.speed;
        
        this.lasers.push(laser);
    }

    takeDamage(amount) {
        this.player.health = Math.max(0, this.player.health - amount * this.damageMultiplier);
        this.updateHealth();
        
        if (this.player.health <= 0) {
            this.gameOver = true;
            document.getElementById('game-over').style.display = 'block';
            clearInterval(this.spawnTimer);
        }
    }

    updateHealth() {
        document.getElementById('health-value').textContent = this.player.health;
    }

    levelUp() {
        this.level++;
        this.updateLevel();
        this.startSpawning();
        // Heal player a bit on level up
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        this.updateHealth();
    }

    updateScore() {
        document.getElementById('score-value').textContent = this.score;
    }

    updateLevel() {
        document.getElementById('level-value').textContent = this.level;
    }

    handleTyping(key) {
        let correctKey = false;
        let targetEnemy = null;

        // Check power-ups first
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (key === powerUp.name[0]) {
                powerUp.currentIndex = (powerUp.currentIndex || 0) + 1;
                if (powerUp.currentIndex === powerUp.name.length) {
                    // Collect power-up
                    this.powerUpManager.activatePowerUp(powerUp);
                    this.powerUps.splice(i, 1);
                }
                correctKey = true;
                break;
            }
        }

        if (!correctKey) {
            for (let enemy of this.enemies) {
                if (!enemy.targetable) continue;
                const nextChar = enemy.word[enemy.currentIndex];
                if (key === nextChar) {
                    enemy.currentIndex++;
                    correctKey = true;
                    targetEnemy = enemy;

                    // Fire multiple lasers if multiShot is active
                    for (let i = 0; i < this.multiShot; i++) {
                        const spread = (i - (this.multiShot - 1) / 2) * 10;
                        this.fireLaser(
                            this.player.x + spread,
                            this.player.y - 20,
                            enemy.x + spread,
                            enemy.y
                        );
                    }

                    if (enemy.currentIndex === enemy.word.length) {
                        // Word completed, remove enemy and increase score
                        this.createExplosion(enemy.x, enemy.y, enemy.color);
                        
                        // Chance to spawn power-up
                        const powerUp = this.powerUpManager.spawnPowerUp(enemy.x, enemy.y);
                        if (powerUp) {
                            this.powerUps.push(powerUp);
                        }
                        
                        this.enemies = this.enemies.filter(e => e !== enemy);
                        this.score += 100 * this.level;
                        this.updateScore();
                        
                        if (this.score >= this.level * 1000) {
                            this.levelUp();
                        }
                    }
                    break;
                }
            }
        }

        // If wrong key pressed, take damage
        if (!correctKey) {
            this.takeDamage(10);
        }
    }

    // ... [previous methods remain the same until update] ...

    drawPowerUps() {
        const ctx = this.ctx;
        
        this.powerUps.forEach(powerUp => {
            ctx.save();
            ctx.translate(powerUp.x, powerUp.y);
            
            // Draw power-up crystal shape
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(10, 0);
            ctx.lineTo(0, 15);
            ctx.lineTo(-10, 0);
            ctx.closePath();
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, -15, 0, 15);
            gradient.addColorStop(0, powerUp.color);
            gradient.addColorStop(1, '#ffffff');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowColor = powerUp.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            
            // Draw text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Courier New"';
            ctx.fillText(powerUp.name, 0, 30);
            
            // Draw progress if being collected
            if (powerUp.currentIndex) {
                const progress = powerUp.currentIndex / powerUp.name.length;
                ctx.fillStyle = powerUp.color;
                ctx.fillRect(-15, 35, 30 * progress, 3);
            }
            
            ctx.restore();
        });
    }

    drawStarfield() {
        const ctx = this.ctx;
        const time = Date.now() * 0.0005;
        
        // Create multiple layers of stars
        for (let i = 0; i < 100; i++) {
            const x = (Math.sin(i * 5 + time) + 1) * this.canvas.width / 2;
            const y = (i * 6 + time * 100) % this.canvas.height;
            const size = ((Math.sin(i + time) + 1) * 1.5) + 0.5;
            const alpha = (Math.sin(i + time) + 1) * 0.5;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(x, y, size, size);
        }
    }

    drawPlayer() {
        const ctx = this.ctx;
        
        // Draw player ship
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        
        // Ship body
        ctx.fillStyle = this.player.color;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-20, 10);
        ctx.lineTo(20, 10);
        ctx.closePath();
        ctx.fill();
        
        // Engine glow
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.lineTo(0, 20 + Math.random() * 5);
        ctx.closePath();
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    }

    drawEnemy(enemy) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        enemy.angle += 0.02;
        ctx.rotate(enemy.angle);
        
        // Enemy ship body
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-20, 20);
        ctx.lineTo(20, 20);
        ctx.closePath();
        ctx.fill();
        
        // Enemy ship details
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
        
        // Draw word
        ctx.font = '16px "Courier New"';
        ctx.textAlign = 'center';
        
        // Draw completed part in green
        if (enemy.currentIndex > 0) {
            ctx.fillStyle = '#00ff00';
            const completedText = enemy.word.substring(0, enemy.currentIndex);
            ctx.fillText(completedText, enemy.x - 20, enemy.y - 30);
        }
        
        // Draw remaining part in white
        ctx.fillStyle = '#ffffff';
        const remainingText = enemy.word.substring(enemy.currentIndex);
        const completedWidth = ctx.measureText(enemy.word.substring(0, enemy.currentIndex)).width;
        ctx.fillText(remainingText, enemy.x + 20, enemy.y - 30);
    }

    drawLasers() {
        const ctx = this.ctx;
        ctx.save();
        
        for (const laser of this.lasers) {
            ctx.strokeStyle = laser.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = laser.life;
            
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.currentX, laser.currentY);
            ctx.stroke();
            
            // Add glow effect
            ctx.shadowColor = laser.color;
            ctx.shadowBlur = 10;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    drawParticles() {
        const ctx = this.ctx;
        ctx.save();
        
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            
            // Draw particle with glow
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 5;
            ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        }
        
        ctx.restore();
    }

    drawHealthBar() {
        const ctx = this.ctx;
        const width = 200;
        const height = 10;
        const x = 10;
        const y = this.canvas.height - 20;

        // Draw background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);

        // Draw health
        const healthWidth = (this.player.health / this.player.maxHealth) * width;
        const healthColor = this.player.health > 50 ? '#00ff00' : 
                          this.player.health > 25 ? '#ffff00' : '#ff0000';
        
        // Add glow effect
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 5;
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, healthWidth, height);
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }

    update() {
        // Update enemy positions
        this.enemies.forEach(enemy => {
            enemy.y += enemy.speed;
            
            // Check for collision with player or bottom of screen
            if (enemy.y > this.canvas.height - 50) {
                this.takeDamage(20 * this.damageMultiplier);
                this.enemies = this.enemies.filter(e => e !== enemy);
            }
        });

        // Update power-ups
        this.powerUps.forEach(powerUp => {
            powerUp.y += powerUp.speed;
        });
        this.powerUps = this.powerUps.filter(powerUp => powerUp.y < this.canvas.height);

        // Update lasers
        this.lasers.forEach(laser => {
            laser.currentX += laser.vx;
            laser.currentY += laser.vy;
            laser.life -= 0.05;
        });
        this.lasers = this.lasers.filter(laser => laser.life > 0);

        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;
        });
        this.particles = this.particles.filter(particle => particle.life > 0);
    }

    gameLoop() {
        if (this.gameOver) return;

        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield background
        this.drawStarfield();

        // Update game state
        this.update();

        // Draw game elements
        this.drawLasers();
        this.drawPlayer();
        this.enemies.forEach(enemy => this.drawEnemy(enemy));
        this.drawPowerUps();
        this.drawParticles();
        this.drawHealthBar();

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};