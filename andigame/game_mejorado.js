// Battle Royale Bolivia - Edición Free Fire Mejorada
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.gameState = 'menu'; // menu, playing, gameOver
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.weapons = [];
        this.bullets = [];
        this.particles = [];
        this.safeZone = null;
        this.storm = null;
        this.gameTime = 0;
        this.playersAlive = 30;
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false, rightClicked: false };
        this.settings = {
            sfxVolume: 70,
            musicVolume: 50,
            graphicsQuality: 'medium',
            mobileControls: true
        };
        this.sounds = {};
        this.killFeed = [];
        this.matchStartTime = 0;
        
        this.init();
    }

    init() {
        this.loadSounds();
        this.setupEventListeners();
        this.showScreen('startScreen');
        this.createParticleSystem();
    }

    loadSounds() {
        // Simular sonidos (en una implementación real cargarías archivos de audio)
        this.sounds = {
            shoot: { play: () => this.playSound('shoot') },
            pickup: { play: () => this.playSound('pickup') },
            background: { play: () => this.playSound('background'), pause: () => {} }
        };
    }

    playSound(soundName) {
        // Simulación de reproducción de sonido
        if (this.settings.sfxVolume > 0) {
            console.log(`🔊 Reproduciendo sonido: ${soundName}`);
        }
    }

    setupEventListeners() {
        // Botones del menú
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('backBtn').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('backFromSettingsBtn').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showScreen('startScreen'));

        // Configuraciones
        document.getElementById('sfxVolume').addEventListener('input', (e) => {
            this.settings.sfxVolume = e.target.value;
            document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
        });

        document.getElementById('musicVolume').addEventListener('input', (e) => {
            this.settings.musicVolume = e.target.value;
            document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
        });

        document.getElementById('graphicsQuality').addEventListener('change', (e) => {
            this.settings.graphicsQuality = e.target.value;
        });

        // Controles del teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'e') this.pickupNearbyItem();
            if (e.key.toLowerCase() === 'tab') {
                e.preventDefault();
                this.toggleInventory();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Controles del mouse
        document.addEventListener('mousemove', (e) => {
            if (this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Click izquierdo
                this.mouse.clicked = true;
                if (this.gameState === 'playing') {
                    this.shoot();
                }
            } else if (e.button === 2) { // Click derecho
                this.mouse.rightClicked = true;
                if (this.gameState === 'playing') {
                    this.aim();
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.clicked = false;
            } else if (e.button === 2) {
                this.mouse.rightClicked = false;
            }
        });

        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // Controles móviles
        this.setupMobileControls();
    }

    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const shootBtn = document.getElementById('shootBtn');
        const aimBtn = document.getElementById('aimBtn');
        const pickupBtn = document.getElementById('pickupBtn');
        const runBtn = document.getElementById('runBtn');

        // Joystick virtual mejorado
        let joystickActive = false;
        let joystickCenter = { x: 0, y: 0 };

        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const rect = joystick.getBoundingClientRect();
            joystickCenter.x = rect.left + rect.width / 2;
            joystickCenter.y = rect.top + rect.height / 2;
            joystick.classList.add('active');
        });

        document.addEventListener('touchmove', (e) => {
            if (joystickActive && e.touches.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                const deltaX = touch.clientX - joystickCenter.x;
                const deltaY = touch.clientY - joystickCenter.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const maxDistance = 35;

                let finalDeltaX = deltaX;
                let finalDeltaY = deltaY;

                if (distance > maxDistance) {
                    const angle = Math.atan2(deltaY, deltaX);
                    finalDeltaX = Math.cos(angle) * maxDistance;
                    finalDeltaY = Math.sin(angle) * maxDistance;
                }

                const knob = joystick.querySelector('.joystick-knob');
                knob.style.transform = `translate(calc(-50% + ${finalDeltaX}px), calc(-50% + ${finalDeltaY}px))`;

                // Simular teclas WASD con mayor precisión
                const threshold = 15;
                this.keys['w'] = finalDeltaY < -threshold;
                this.keys['s'] = finalDeltaY > threshold;
                this.keys['a'] = finalDeltaX < -threshold;
                this.keys['d'] = finalDeltaX > threshold;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (joystickActive) {
                joystickActive = false;
                const knob = joystick.querySelector('.joystick-knob');
                knob.style.transform = 'translate(-50%, -50%)';
                this.keys['w'] = this.keys['s'] = this.keys['a'] = this.keys['d'] = false;
                joystick.classList.remove('active');
            }
        });

        // Botones de acción mejorados
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shoot();
            shootBtn.classList.add('active');
        });

        shootBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            shootBtn.classList.remove('active');
        });

        aimBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.aim();
            aimBtn.classList.add('active');
        });

        aimBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            aimBtn.classList.remove('active');
        });

        pickupBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pickupNearbyItem();
            pickupBtn.classList.add('active');
        });

        pickupBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            pickupBtn.classList.remove('active');
        });

        runBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['shift'] = true;
            runBtn.classList.add('active');
        });

        runBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['shift'] = false;
            runBtn.classList.remove('active');
        });
    }

    createParticleSystem() {
        this.particles = [];
    }

    addParticle(x, y, type, color = '#ff6b35') {
        this.particles.push(new Particle(x, y, type, color));
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    }

    showInstructions() {
        this.showScreen('instructionsScreen');
    }

    showSettings() {
        this.showScreen('settingsScreen');
    }

    toggleInventory() {
        // Implementar sistema de inventario expandido
        console.log('📦 Inventario toggled');
    }

    startGame() {
        this.gameState = 'playing';
        this.showScreen('gameScreen');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        // Ajustar canvas al tamaño de la ventana
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initializeGame();
        this.matchStartTime = Date.now();
        this.sounds.background.play();
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initializeGame() {
        // Inicializar jugador
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        
        // Inicializar zona segura y tormenta
        this.safeZone = new SafeZone(this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.4);
        this.storm = new Storm(this.canvas.width / 2, this.canvas.height / 2, Math.min(this.canvas.width, this.canvas.height) * 0.6);
        
        // Generar enemigos
        this.generateEnemies();
        
        // Generar objetos
        this.generateItems();
        
        // Resetear variables
        this.gameTime = 0;
        this.playersAlive = 30;
        this.bullets = [];
        this.particles = [];
        this.killFeed = [];
        this.updateHUD();
    }

    generateEnemies() {
        this.enemies = [];
        for (let i = 0; i < 29; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.enemies.push(new Enemy(x, y, `Bot_${i + 1}`));
        }
    }

    generateItems() {
        this.items = [];
        this.weapons = [];
        
        // Generar armas con rareza
        const weaponTypes = [
            { name: 'Escopeta', rarity: 'common', damage: 80, range: 150, ammo: 8 },
            { name: 'Honda', rarity: 'common', damage: 40, range: 200, ammo: 20 },
            { name: 'Machete', rarity: 'uncommon', damage: 60, range: 50, ammo: Infinity },
            { name: 'Dinamita', rarity: 'rare', damage: 100, range: 120, ammo: 3 },
            { name: 'Rifle Andino', rarity: 'epic', damage: 95, range: 300, ammo: 30 }
        ];
        
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
            this.weapons.push(new Weapon(x, y, weaponType));
        }
        
        // Generar objetos de curación
        const healingItems = [
            { name: 'Mate de Coca', healing: 25, rarity: 'common' },
            { name: 'Botiquín Rural', healing: 50, rarity: 'uncommon' },
            { name: 'Agua de Manantial', healing: 75, rarity: 'rare' },
            { name: 'Medicina Ancestral', healing: 100, rarity: 'epic' }
        ];
        
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const itemType = healingItems[Math.floor(Math.random() * healingItems.length)];
            this.items.push(new Item(x, y, itemType, 'healing'));
        }
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.update();
        this.render();
        this.updateMinimap();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.gameTime += 1/60;
        
        // Actualizar jugador
        this.player.update(this.keys);
        
        // Actualizar enemigos
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.player, this.safeZone, this.enemies);
            
            // Simular combate entre enemigos
            if (Math.random() < 0.001 && this.enemies.length > 1) {
                this.eliminateEnemy(index);
            }
        });
        
        // Actualizar balas
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.shouldRemove) {
                this.bullets.splice(index, 1);
            } else {
                this.checkBulletCollisions(bullet, index);
            }
        });
        
        // Actualizar partículas
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.shouldRemove) {
                this.particles.splice(index, 1);
            }
        });
        
        // Actualizar zona segura y tormenta
        this.storm.update();
        this.safeZone.update(this.gameTime);
        
        // Verificar colisiones con la tormenta
        if (this.storm.isPlayerInStorm(this.player)) {
            this.player.takeDamage(1);
            this.showZoneWarning(true);
            this.addParticle(this.player.x, this.player.y, 'damage', '#ff4757');
        } else {
            this.showZoneWarning(false);
        }
        
        // Verificar si el jugador murió
        if (this.player.health <= 0) {
            this.gameOver(false);
        }
        
        // Verificar victoria
        if (this.playersAlive <= 1) {
            this.gameOver(true);
        }
        
        this.updateHUD();
        this.updateMatchTimer();
    }

    checkBulletCollisions(bullet, bulletIndex) {
        // Verificar colisiones con enemigos
        this.enemies.forEach((enemy, enemyIndex) => {
            const distance = Math.sqrt(
                Math.pow(enemy.x - bullet.x, 2) + 
                Math.pow(enemy.y - bullet.y, 2)
            );
            
            if (distance < 20) {
                // Impacto en enemigo
                this.addParticle(enemy.x, enemy.y, 'hit', '#ff4757');
                this.bullets.splice(bulletIndex, 1);
                this.eliminateEnemy(enemyIndex);
                this.player.addKill();
                this.sounds.shoot.play();
            }
        });
    }

    eliminateEnemy(index) {
        if (index >= 0 && index < this.enemies.length) {
            const enemy = this.enemies[index];
            this.addKillFeedEntry(`Eliminaste a ${enemy.name}`);
            this.enemies.splice(index, 1);
            this.playersAlive--;
            
            // Efectos visuales de eliminación
            for (let i = 0; i < 10; i++) {
                this.addParticle(enemy.x, enemy.y, 'explosion', '#ffa502');
            }
        }
    }

    addKillFeedEntry(message) {
        this.killFeed.unshift({
            message: message,
            timestamp: Date.now(),
            duration: 5000
        });
        
        if (this.killFeed.length > 5) {
            this.killFeed.pop();
        }
        
        this.updateKillFeed();
    }

    updateKillFeed() {
        const killFeedElement = document.getElementById('killFeed');
        killFeedElement.innerHTML = '';
        
        this.killFeed.forEach((entry, index) => {
            if (Date.now() - entry.timestamp < entry.duration) {
                const div = document.createElement('div');
                div.className = 'kill-feed-entry';
                div.textContent = entry.message;
                div.style.cssText = `
                    background: rgba(255, 107, 53, 0.8);
                    padding: 8px 15px;
                    margin-bottom: 5px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    animation: slideIn 0.3s ease;
                `;
                killFeedElement.appendChild(div);
            }
        });
    }

    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo mejorado
        this.drawEnhancedBackground();
        
        // Dibujar zona segura y tormenta
        this.storm.draw(this.ctx);
        this.safeZone.draw(this.ctx);
        
        // Dibujar objetos con efectos
        this.weapons.forEach(weapon => weapon.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        
        // Dibujar balas
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        
        // Dibujar enemigos
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Dibujar jugador
        this.player.draw(this.ctx);
        
        // Dibujar partículas
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // Efectos de post-procesamiento según calidad gráfica
        this.applyGraphicsEffects();
    }

    drawEnhancedBackground() {
        // Cielo con gradiente mejorado
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(0.7, '#DEB887');
        gradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Elementos del paisaje rural mejorados
        this.drawEnhancedRuralElements();
        
        // Efectos de iluminación
        this.drawLightingEffects();
    }

    drawEnhancedRuralElements() {
        // Montañas de fondo
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 100) {
            this.ctx.lineTo(i, this.canvas.height - 200 - Math.sin(i * 0.01) * 50);
        }
        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.fill();
        
        // Casas de adobe mejoradas
        for (let i = 0; i < 8; i++) {
            const x = (i * this.canvas.width / 8) + Math.random() * 100;
            const y = this.canvas.height - 120 - Math.random() * 50;
            this.drawAdobeHouse(x, y);
        }
        
        // Árboles con sombras
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.canvas.width;
            const y = this.canvas.height - 100 - Math.random() * 100;
            this.drawTreeWithShadow(x, y);
        }
        
        // Caminos de tierra con textura
        this.drawTexturedRoads();
    }

    drawAdobeHouse(x, y) {
        // Sombra
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(x + 5, y + 5, 70, 45);
        
        // Casa principal
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(x, y, 70, 40);
        
        // Techo
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 5, y - 15, 80, 20);
        
        // Puerta
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x + 25, y + 15, 20, 25);
        
        // Ventana
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(x + 10, y + 10, 12, 12);
    }

    drawTreeWithShadow(x, y) {
        // Sombra del árbol
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + 3, y + 35, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Tronco
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - 5, y, 10, 35);
        
        // Copa del árbol
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hojas adicionales para más realismo
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.arc(x - 8, y - 5, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + 8, y - 5, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTexturedRoads() {
        // Camino horizontal principal
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 25);
        
        // Textura del camino
        this.ctx.fillStyle = '#CD853F';
        for (let i = 0; i < this.canvas.width; i += 20) {
            this.ctx.fillRect(i, this.canvas.height - 35, 10, 3);
            this.ctx.fillRect(i + 5, this.canvas.height - 25, 8, 2);
        }
        
        // Camino vertical
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(this.canvas.width / 2 - 12, 0, 25, this.canvas.height);
        
        // Textura del camino vertical
        this.ctx.fillStyle = '#CD853F';
        for (let i = 0; i < this.canvas.height; i += 20) {
            this.ctx.fillRect(this.canvas.width / 2 - 8, i, 3, 10);
            this.ctx.fillRect(this.canvas.width / 2 + 2, i + 5, 2, 8);
        }
    }

    drawLightingEffects() {
        if (this.settings.graphicsQuality === 'high' || this.settings.graphicsQuality === 'ultra') {
            // Efecto de luz solar
            const gradient = this.ctx.createRadialGradient(
                this.canvas.width * 0.8, this.canvas.height * 0.2, 0,
                this.canvas.width * 0.8, this.canvas.height * 0.2, 300
            );
            gradient.addColorStop(0, 'rgba(255, 255, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    applyGraphicsEffects() {
        if (this.settings.graphicsQuality === 'ultra') {
            // Efectos de post-procesamiento avanzados
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        }
    }

    updateMinimap() {
        if (!this.minimapCtx) return;
        
        // Limpiar minimapa
        this.minimapCtx.clearRect(0, 0, 146, 146);
        
        // Fondo del minimapa
        this.minimapCtx.fillStyle = 'rgba(139, 69, 19, 0.8)';
        this.minimapCtx.fillRect(0, 0, 146, 146);
        
        // Escala del minimapa
        const scaleX = 146 / this.canvas.width;
        const scaleY = 146 / this.canvas.height;
        
        // Zona segura en minimapa
        this.minimapCtx.strokeStyle = '#00FF00';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(
            this.safeZone.x * scaleX,
            this.safeZone.y * scaleY,
            this.safeZone.radius * scaleX,
            0, Math.PI * 2
        );
        this.minimapCtx.stroke();
        
        // Tormenta en minimapa
        this.minimapCtx.strokeStyle = '#800080';
        this.minimapCtx.lineWidth = 1;
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(
            this.storm.x * scaleX,
            this.storm.y * scaleY,
            this.storm.radius * scaleX,
            0, Math.PI * 2
        );
        this.minimapCtx.stroke();
        
        // Jugador en minimapa
        this.minimapCtx.fillStyle = '#FF6B35';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(
            this.player.x * scaleX,
            this.player.y * scaleY,
            3, 0, Math.PI * 2
        );
        this.minimapCtx.fill();
        
        // Enemigos en minimapa
        this.minimapCtx.fillStyle = '#FF0000';
        this.enemies.forEach(enemy => {
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(
                enemy.x * scaleX,
                enemy.y * scaleY,
                2, 0, Math.PI * 2
            );
            this.minimapCtx.fill();
        });
    }

    shoot() {
        if (this.player.weapon && this.player.canShoot()) {
            const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
            const bullet = this.player.shoot(angle);
            if (bullet) {
                this.bullets.push(bullet);
                this.sounds.shoot.play();
                this.addParticle(this.player.x, this.player.y, 'muzzleFlash', '#ffa502');
            }
        }
    }

    aim() {
        this.player.isAiming = true;
    }

    pickupNearbyItem() {
        let itemPickedUp = false;
        
        // Verificar armas cercanas
        this.weapons.forEach((weapon, index) => {
            const distance = Math.sqrt(
                Math.pow(weapon.x - this.player.x, 2) + 
                Math.pow(weapon.y - this.player.y, 2)
            );
            
            if (distance < 60) {
                this.player.pickupWeapon(weapon);
                this.weapons.splice(index, 1);
                this.sounds.pickup.play();
                this.addParticle(weapon.x, weapon.y, 'pickup', '#ffa502');
                itemPickedUp = true;
            }
        });
        
        // Verificar objetos de curación cercanos
        this.items.forEach((item, index) => {
            const distance = Math.sqrt(
                Math.pow(item.x - this.player.x, 2) + 
                Math.pow(item.y - this.player.y, 2)
            );
            
            if (distance < 60) {
                this.player.useItem(item);
                this.items.splice(index, 1);
                this.sounds.pickup.play();
                this.addParticle(item.x, item.y, 'heal', '#2ed573');
                itemPickedUp = true;
            }
        });
        
        if (!itemPickedUp) {
            console.log('❌ No hay objetos cerca para recoger');
        }
    }

    showZoneWarning(show) {
        const warning = document.getElementById('zoneWarning');
        if (show) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }

    updateMatchTimer() {
        const elapsed = Math.floor((Date.now() - this.matchStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('matchTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateHUD() {
        document.getElementById('healthText').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('healthBar').style.width = Math.max(0, this.player.health) + '%';
        document.getElementById('playersAlive').textContent = this.playersAlive;
        document.getElementById('currentWeapon').textContent = this.player.weapon ? this.player.weapon.name : 'Ninguna';
        document.getElementById('ammoCount').textContent = this.player.weapon ? 
            (this.player.weapon.ammo === Infinity ? '∞' : this.player.weapon.currentAmmo) : '0';
        
        const inventory = this.player.inventory.length > 0 ? 
            this.player.inventory.map(item => item.name).join(', ') : 'Vacío';
        document.getElementById('inventoryItems').textContent = inventory;
    }

    gameOver(victory) {
        this.gameState = 'gameOver';
        this.showScreen('gameOverScreen');
        this.sounds.background.pause();
        
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const position = document.getElementById('finalPosition');
        const time = document.getElementById('survivalTime');
        const kills = document.getElementById('killCount');
        const damage = document.getElementById('damageDealt');
        const coins = document.getElementById('coinsEarned');
        const xp = document.getElementById('xpEarned');
        
        if (victory) {
            title.textContent = '🏆 ¡VICTORIA REAL!';
            message.textContent = '¡Eres el último sobreviviente de Bolivia!';
            position.textContent = '#1';
        } else {
            title.textContent = '💀 ELIMINADO';
            message.textContent = 'Has sido eliminado de la batalla';
            position.textContent = '#' + this.playersAlive;
        }
        
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        time.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        kills.textContent = this.player.kills;
        damage.textContent = this.player.damageDealt;
        
        // Calcular recompensas
        const baseCoins = victory ? 200 : 50;
        const killBonus = this.player.kills * 25;
        const survivalBonus = Math.floor(this.gameTime / 60) * 10;
        const totalCoins = baseCoins + killBonus + survivalBonus;
        
        const baseXP = victory ? 150 : 30;
        const xpBonus = this.player.kills * 15 + survivalBonus;
        const totalXP = baseXP + xpBonus;
        
        coins.textContent = `+${totalCoins}`;
        xp.textContent = `+${totalXP}`;
    }
}

// Clases mejoradas del juego
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 3;
        this.weapon = null;
        this.inventory = [];
        this.angle = 0;
        this.isAiming = false;
        this.kills = 0;
        this.damageDealt = 0;
        this.lastShotTime = 0;
    }

    update(keys) {
        let moveSpeed = this.speed;
        if (keys['shift']) moveSpeed *= 1.5; // Correr
        if (this.isAiming) moveSpeed *= 0.5; // Movimiento lento al apuntar
        
        if (keys['w'] || keys['arrowup']) this.y -= moveSpeed;
        if (keys['s'] || keys['arrowdown']) this.y += moveSpeed;
        if (keys['a'] || keys['arrowleft']) this.x -= moveSpeed;
        if (keys['d'] || keys['arrowright']) this.x += moveSpeed;
        
        // Mantener al jugador dentro del canvas
        this.x = Math.max(25, Math.min(this.x, window.innerWidth - 25));
        this.y = Math.max(25, Math.min(this.y, window.innerHeight - 25));
        
        // Reset aiming
        this.isAiming = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Sombra del jugador
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 2, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuerpo del jugador (campesino boliviano mejorado)
        ctx.fillStyle = '#D2691E'; // Color piel
        ctx.fillRect(-12, -18, 24, 36);
        
        // Poncho con patrón
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(-15, -12, 30, 24);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-15, -8, 30, 4);
        ctx.fillRect(-15, 0, 30, 4);
        
        // Cabeza
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(0, -25, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombrero tradicional
        ctx.fillStyle = '#654321';
        ctx.fillRect(-12, -35, 24, 12);
        ctx.fillRect(-8, -38, 16, 6);
        
        // Ojos
        ctx.fillStyle = '#000';
        ctx.fillRect(-4, -28, 2, 2);
        ctx.fillRect(2, -28, 2, 2);
        
        // Indicador de arma y dirección
        if (this.weapon) {
            ctx.strokeStyle = this.isAiming ? '#FF0000' : '#FFA500';
            ctx.lineWidth = this.isAiming ? 4 : 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.angle) * 30, Math.sin(this.angle) * 30);
            ctx.stroke();
            
            // Punto de mira cuando apunta
            if (this.isAiming) {
                ctx.strokeStyle = '#FF0000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(Math.cos(this.angle) * 40, Math.sin(this.angle) * 40, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
        
        // Barra de salud sobre el jugador
        this.drawHealthBar(ctx);
        
        // Nombre del jugador
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TÚ', this.x, this.y - 50);
    }

    drawHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 8;
        const x = this.x - barWidth / 2;
        const y = this.y - 45;
        
        // Fondo de la barra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        
        // Barra de salud
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#2ed573' : healthPercent > 0.3 ? '#ffa502' : '#ff4757';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
        
        // Borde de la barra
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
    }

    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    pickupWeapon(weapon) {
        this.weapon = weapon;
        console.log(`🔫 Arma equipada: ${weapon.name}`);
    }

    useItem(item) {
        if (item.category === 'healing') {
            this.heal(item.healing);
            console.log(`💚 Curación: +${item.healing} HP`);
        }
        this.inventory.push(item);
    }

    canShoot() {
        if (!this.weapon) return false;
        const now = Date.now();
        const fireRate = this.weapon.fireRate || 500; // ms entre disparos
        return now - this.lastShotTime > fireRate && this.weapon.currentAmmo > 0;
    }

    shoot(angle) {
        if (!this.canShoot()) return null;
        
        this.angle = angle;
        this.lastShotTime = Date.now();
        
        if (this.weapon.currentAmmo !== Infinity) {
            this.weapon.currentAmmo--;
        }
        
        return new Bullet(
            this.x + Math.cos(angle) * 25,
            this.y + Math.sin(angle) * 25,
            angle,
            this.weapon.damage,
            this.weapon.range
        );
    }

    addKill() {
        this.kills++;
        this.damageDealt += this.weapon ? this.weapon.damage : 50;
    }
}

class Enemy {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 1 + Math.random() * 0.5;
        this.targetX = x;
        this.targetY = y;
        this.lastTargetUpdate = 0;
        this.weapon = null;
        this.lastShotTime = 0;
        this.aggroRange = 150;
        this.isAggressive = Math.random() < 0.3;
    }

    update(player, safeZone, enemies) {
        // IA mejorada
        if (Date.now() - this.lastTargetUpdate > 3000) {
            this.updateTarget(player, safeZone, enemies);
            this.lastTargetUpdate = Date.now();
        }
        
        // Moverse hacia el objetivo
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        // Mantener dentro de los límites
        this.x = Math.max(25, Math.min(this.x, window.innerWidth - 25));
        this.y = Math.max(25, Math.min(this.y, window.innerHeight - 25));
    }

    updateTarget(player, safeZone, enemies) {
        const distanceToPlayer = Math.sqrt(
            Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2)
        );
        
        if (this.isAggressive && distanceToPlayer < this.aggroRange) {
            // Perseguir al jugador
            this.targetX = player.x + (Math.random() - 0.5) * 50;
            this.targetY = player.y + (Math.random() - 0.5) * 50;
        } else if (Math.random() < 0.8) {
            // Moverse hacia la zona segura
            const angle = Math.random() * Math.PI * 2;
            const radius = safeZone.radius * 0.7;
            this.targetX = safeZone.x + Math.cos(angle) * radius;
            this.targetY = safeZone.y + Math.sin(angle) * radius;
        } else {
            // Movimiento aleatorio
            this.targetX = this.x + (Math.random() - 0.5) * 200;
            this.targetY = this.y + (Math.random() - 0.5) * 200;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 2, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuerpo del enemigo
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-10, -15, 20, 30);
        
        // Ropa
        const colors = ['#FF6347', '#32CD32', '#4169E1', '#FFD700'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(-12, -10, 24, 20);
        
        // Cabeza
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombrero
        ctx.fillStyle = '#654321';
        ctx.fillRect(-10, -30, 20, 8);
        
        ctx.restore();
        
        // Barra de salud
        this.drawHealthBar(ctx);
        
        // Nombre del enemigo
        ctx.fillStyle = '#FF6B35';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - 40);
    }

    drawHealthBar(ctx) {
        const barWidth = 40;
        const barHeight = 6;
        const x = this.x - barWidth / 2;
        const y = this.y - 35;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#2ed573' : healthPercent > 0.3 ? '#ffa502' : '#ff4757';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    }
}

class Weapon {
    constructor(x, y, weaponData) {
        this.x = x;
        this.y = y;
        this.name = weaponData.name;
        this.damage = weaponData.damage;
        this.range = weaponData.range;
        this.ammo = weaponData.ammo;
        this.currentAmmo = weaponData.ammo;
        this.rarity = weaponData.rarity;
        this.fireRate = this.getFireRate();
        this.glowIntensity = 0;
    }

    getFireRate() {
        const rates = {
            'Escopeta': 800,
            'Honda': 400,
            'Machete': 300,
            'Dinamita': 1500,
            'Rifle Andino': 200
        };
        return rates[this.name] || 500;
    }

    getRarityColor() {
        const colors = {
            'common': '#FFFFFF',
            'uncommon': '#00FF00',
            'rare': '#0080FF',
            'epic': '#8000FF',
            'legendary': '#FF8000'
        };
        return colors[this.rarity] || '#FFFFFF';
    }

    draw(ctx) {
        this.glowIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        
        // Efecto de brillo según rareza
        const glowColor = this.getRarityColor();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10 + this.glowIntensity * 10;
        
        // Fondo del arma
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = 0.3 + this.glowIntensity * 0.3;
        ctx.fillRect(this.x - 12, this.y - 12, 24, 24);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Icono del arma
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        const icons = {
            'Escopeta': '🔫',
            'Honda': '🪃',
            'Machete': '🔪',
            'Dinamita': '🧨',
            'Rifle Andino': '🎯'
        };
        ctx.fillText(icons[this.name] || '?', this.x, this.y + 6);
        
        // Indicador de rareza
        ctx.fillStyle = glowColor;
        ctx.fillRect(this.x - 10, this.y + 10, 20, 3);
    }
}

class Item {
    constructor(x, y, itemData, category) {
        this.x = x;
        this.y = y;
        this.name = itemData.name;
        this.healing = itemData.healing;
        this.rarity = itemData.rarity;
        this.category = category;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    draw(ctx) {
        const bobAmount = Math.sin(Date.now() * 0.003 + this.bobOffset) * 3;
        const currentY = this.y + bobAmount;
        
        // Efecto de brillo
        ctx.shadowColor = '#2ed573';
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = '#2ed573';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(this.x - 8, currentY - 8, 16, 16);
        
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        
        // Icono del objeto
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        const icons = {
            'Mate de Coca': '🧉',
            'Botiquín Rural': '🏥',
            'Agua de Manantial': '💧',
            'Medicina Ancestral': '🌿'
        };
        ctx.fillText(icons[this.name] || '+', this.x, currentY + 4);
    }
}

class Bullet {
    constructor(x, y, angle, damage, range) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.range = range;
        this.speed = 8;
        this.distanceTraveled = 0;
        this.shouldRemove = false;
        this.trail = [];
    }

    update() {
        const deltaX = Math.cos(this.angle) * this.speed;
        const deltaY = Math.sin(this.angle) * this.speed;
        
        // Agregar posición actual al rastro
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) {
            this.trail.shift();
        }
        
        this.x += deltaX;
        this.y += deltaY;
        this.distanceTraveled += this.speed;
        
        // Verificar si debe ser removida
        if (this.distanceTraveled > this.range || 
            this.x < 0 || this.x > window.innerWidth || 
            this.y < 0 || this.y > window.innerHeight) {
            this.shouldRemove = true;
        }
    }

    draw(ctx) {
        // Dibujar rastro
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.trail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Dibujar bala
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Efecto de brillo
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle {
    constructor(x, y, type, color) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.shouldRemove = false;
        
        // Propiedades específicas por tipo
        switch (type) {
            case 'explosion':
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.size = Math.random() * 8 + 4;
                break;
            case 'muzzleFlash':
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.size = Math.random() * 6 + 3;
                this.decay = 0.1;
                break;
            case 'hit':
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = (Math.random() - 0.5) * 6;
                this.size = Math.random() * 4 + 2;
                break;
            case 'pickup':
                this.vx = 0;
                this.vy = -2;
                this.size = Math.random() * 3 + 2;
                break;
            case 'heal':
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -1;
                this.size = Math.random() * 4 + 2;
                break;
            default:
                this.vx = (Math.random() - 0.5) * 4;
                this.vy = (Math.random() - 0.5) * 4;
                this.size = Math.random() * 5 + 2;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // Aplicar gravedad a algunos tipos
        if (this.type === 'explosion' || this.type === 'hit') {
            this.vy += 0.2;
        }
        
        // Reducir velocidad
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        if (this.life <= 0) {
            this.shouldRemove = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class SafeZone {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.targetRadius = radius;
        this.shrinkSpeed = 0.5;
    }

    update(gameTime) {
        // Reducir la zona segura cada 45 segundos
        if (gameTime > 0 && gameTime % 45 < 0.1) {
            this.targetRadius *= 0.75;
        }
        
        // Animar la reducción
        if (this.radius > this.targetRadius) {
            this.radius -= this.shrinkSpeed;
        }
    }

    draw(ctx) {
        // Borde exterior con efecto pulsante
        const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        
        ctx.strokeStyle = `rgba(0, 255, 0, ${pulseIntensity})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Borde interior
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
}

class Storm {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.shrinkSpeed = 0.3;
        this.particles = [];
        this.generateStormParticles();
    }

    generateStormParticles() {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius;
            this.particles.push({
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: Math.random()
            });
        }
    }

    update() {
        this.radius -= this.shrinkSpeed;
        
        // Actualizar partículas de tormenta
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.01;
            
            if (particle.life <= 0) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.radius;
                particle.x = this.x + Math.cos(angle) * distance;
                particle.y = this.y + Math.sin(angle) * distance;
                particle.life = 1;
            }
        });
    }

    draw(ctx) {
        // Dibujar partículas de tormenta
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life * 0.5;
            ctx.fillStyle = '#800080';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        // Borde de la tormenta
        ctx.strokeStyle = '#800080';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Efecto de área peligrosa
        ctx.fillStyle = 'rgba(128, 0, 128, 0.1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.setLineDash([]);
    }

    isPlayerInStorm(player) {
        const distance = Math.sqrt(
            Math.pow(player.x - this.x, 2) + 
            Math.pow(player.y - this.y, 2)
        );
        return distance > this.radius;
    }
}

// Inicializar el juego cuando se carga la página
window.addEventListener('load', () => {
    new Game();
});

