// Battle Royale Bolivia - Juego JavaScript
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = 'menu'; // menu, playing, gameOver
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.weapons = [];
        this.safeZone = null;
        this.storm = null;
        this.gameTime = 0;
        this.playersAlive = 30;
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('startScreen');
    }

    setupEventListeners() {
        // Botones del menú
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('instructionsBtn').addEventListener('click', () => this.showInstructions());
        document.getElementById('backBtn').addEventListener('click', () => this.showScreen('startScreen'));
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showScreen('startScreen'));

        // Controles del teclado
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'e') this.pickupNearbyItem();
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
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.clicked = false;
            }
        });

        // Controles móviles
        this.setupMobileControls();
    }

    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const shootBtn = document.getElementById('shootBtn');
        const pickupBtn = document.getElementById('pickupBtn');
        const runBtn = document.getElementById('runBtn');

        // Joystick virtual
        let joystickActive = false;
        let joystickCenter = { x: 0, y: 0 };

        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            const rect = joystick.getBoundingClientRect();
            joystickCenter.x = rect.left + rect.width / 2;
            joystickCenter.y = rect.top + rect.height / 2;
        });

        document.addEventListener('touchmove', (e) => {
            if (joystickActive && e.touches.length > 0) {
                e.preventDefault();
                const touch = e.touches[0];
                const deltaX = touch.clientX - joystickCenter.x;
                const deltaY = touch.clientY - joystickCenter.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const maxDistance = 30;

                if (distance > maxDistance) {
                    const angle = Math.atan2(deltaY, deltaX);
                    deltaX = Math.cos(angle) * maxDistance;
                    deltaY = Math.sin(angle) * maxDistance;
                }

                const knob = joystick.querySelector('.joystick-knob');
                knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

                // Simular teclas WASD
                this.keys['w'] = deltaY < -10;
                this.keys['s'] = deltaY > 10;
                this.keys['a'] = deltaX < -10;
                this.keys['d'] = deltaX > 10;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (joystickActive) {
                joystickActive = false;
                const knob = joystick.querySelector('.joystick-knob');
                knob.style.transform = 'translate(-50%, -50%)';
                this.keys['w'] = this.keys['s'] = this.keys['a'] = this.keys['d'] = false;
            }
        });

        // Botones de acción
        shootBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shoot();
        });

        pickupBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pickupNearbyItem();
        });

        runBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.keys['shift'] = true;
        });

        runBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.keys['shift'] = false;
        });
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    }

    showInstructions() {
        this.showScreen('instructionsScreen');
    }

    startGame() {
        this.gameState = 'playing';
        this.showScreen('gameScreen');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Ajustar canvas al tamaño de la ventana
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.initializeGame();
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
        this.updateHUD();
    }

    generateEnemies() {
        this.enemies = [];
        for (let i = 0; i < 29; i++) { // 29 enemigos + 1 jugador = 30 total
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.enemies.push(new Enemy(x, y));
        }
    }

    generateItems() {
        this.items = [];
        this.weapons = [];
        
        // Generar armas
        const weaponTypes = ['Escopeta', 'Honda', 'Machete', 'Dinamita'];
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const type = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
            this.weapons.push(new Weapon(x, y, type));
        }
        
        // Generar objetos de curación
        const healingItems = ['Mate de Coca', 'Botiquín Rural', 'Agua de Manantial'];
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const type = healingItems[Math.floor(Math.random() * healingItems.length)];
            this.items.push(new Item(x, y, type, 'healing'));
        }
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;

        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.gameTime += 1/60; // Asumiendo 60 FPS
        
        // Actualizar jugador
        this.player.update(this.keys);
        
        // Actualizar enemigos
        this.enemies.forEach(enemy => {
            enemy.update(this.player, this.safeZone);
        });
        
        // Actualizar zona segura y tormenta
        this.storm.update();
        this.safeZone.update(this.gameTime);
        
        // Verificar colisiones con la tormenta
        if (this.storm.isPlayerInStorm(this.player)) {
            this.player.takeDamage(1);
            this.showZoneWarning(true);
        } else {
            this.showZoneWarning(false);
        }
        
        // Verificar si el jugador murió
        if (this.player.health <= 0) {
            this.gameOver(false);
        }
        
        // Simular eliminación de enemigos
        if (Math.random() < 0.01 && this.enemies.length > 1) {
            this.enemies.splice(Math.floor(Math.random() * this.enemies.length), 1);
            this.playersAlive--;
        }
        
        // Verificar victoria
        if (this.playersAlive <= 1) {
            this.gameOver(true);
        }
        
        this.updateHUD();
    }

    render() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar fondo (paisaje rural boliviano)
        this.drawBackground();
        
        // Dibujar zona segura y tormenta
        this.storm.draw(this.ctx);
        this.safeZone.draw(this.ctx);
        
        // Dibujar objetos
        this.weapons.forEach(weapon => weapon.draw(this.ctx));
        this.items.forEach(item => item.draw(this.ctx));
        
        // Dibujar enemigos
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Dibujar jugador
        this.player.draw(this.ctx);
    }

    drawBackground() {
        // Cielo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98FB98');
        gradient.addColorStop(1, '#8B4513');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar elementos del paisaje rural
        this.drawRuralElements();
    }

    drawRuralElements() {
        // Casas de adobe (rectángulos marrones)
        this.ctx.fillStyle = '#8B4513';
        for (let i = 0; i < 5; i++) {
            const x = (i * this.canvas.width / 5) + Math.random() * 100;
            const y = this.canvas.height - 100 - Math.random() * 50;
            this.ctx.fillRect(x, y, 60, 40);
            
            // Techo
            this.ctx.fillStyle = '#654321';
            this.ctx.fillRect(x - 5, y - 10, 70, 15);
            this.ctx.fillStyle = '#8B4513';
        }
        
        // Árboles (círculos verdes con troncos)
        this.ctx.fillStyle = '#228B22';
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.canvas.width;
            const y = this.canvas.height - 80 - Math.random() * 100;
            
            // Tronco
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(x - 5, y, 10, 30);
            
            // Copa
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Caminos de tierra
        this.ctx.fillStyle = '#D2691E';
        this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 20);
        this.ctx.fillRect(this.canvas.width / 2 - 10, 0, 20, this.canvas.height);
    }

    shoot() {
        if (this.player.weapon) {
            // Crear proyectil hacia la posición del mouse
            const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
            this.player.shoot(angle);
            
            // Verificar impactos en enemigos
            this.enemies.forEach((enemy, index) => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - this.player.x, 2) + 
                    Math.pow(enemy.y - this.player.y, 2)
                );
                
                if (distance < 100) { // Rango de disparo
                    this.enemies.splice(index, 1);
                    this.playersAlive--;
                }
            });
        }
    }

    pickupNearbyItem() {
        // Verificar armas cercanas
        this.weapons.forEach((weapon, index) => {
            const distance = Math.sqrt(
                Math.pow(weapon.x - this.player.x, 2) + 
                Math.pow(weapon.y - this.player.y, 2)
            );
            
            if (distance < 50) {
                this.player.pickupWeapon(weapon);
                this.weapons.splice(index, 1);
            }
        });
        
        // Verificar objetos de curación cercanos
        this.items.forEach((item, index) => {
            const distance = Math.sqrt(
                Math.pow(item.x - this.player.x, 2) + 
                Math.pow(item.y - this.player.y, 2)
            );
            
            if (distance < 50) {
                this.player.useItem(item);
                this.items.splice(index, 1);
            }
        });
    }

    showZoneWarning(show) {
        const warning = document.getElementById('zoneWarning');
        if (show) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }

    updateHUD() {
        document.getElementById('healthText').textContent = Math.max(0, Math.floor(this.player.health));
        document.getElementById('healthBar').style.width = Math.max(0, this.player.health) + '%';
        document.getElementById('playersAlive').textContent = this.playersAlive;
        document.getElementById('currentWeapon').textContent = this.player.weapon ? this.player.weapon.type : 'Ninguna';
        
        const inventory = this.player.inventory.length > 0 ? 
            this.player.inventory.map(item => item.type).join(', ') : 'Vacío';
        document.getElementById('inventoryItems').textContent = inventory;
    }

    gameOver(victory) {
        this.gameState = 'gameOver';
        this.showScreen('gameOverScreen');
        
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        const position = document.getElementById('finalPosition');
        const time = document.getElementById('survivalTime');
        
        if (victory) {
            title.textContent = '🏆 ¡Victoria!';
            message.textContent = '¡Eres el último sobreviviente!';
            position.textContent = '#1';
        } else {
            title.textContent = '💀 Eliminado';
            message.textContent = 'Has sido eliminado de la partida';
            position.textContent = '#' + this.playersAlive;
        }
        
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        time.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Clases del juego
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.speed = 3;
        this.weapon = null;
        this.inventory = [];
        this.angle = 0;
    }

    update(keys) {
        let moveSpeed = this.speed;
        if (keys['shift']) moveSpeed *= 1.5; // Correr
        
        if (keys['w'] || keys['arrowup']) this.y -= moveSpeed;
        if (keys['s'] || keys['arrowdown']) this.y += moveSpeed;
        if (keys['a'] || keys['arrowleft']) this.x -= moveSpeed;
        if (keys['d'] || keys['arrowright']) this.x += moveSpeed;
        
        // Mantener al jugador dentro del canvas
        this.x = Math.max(20, Math.min(this.x, window.innerWidth - 20));
        this.y = Math.max(20, Math.min(this.y, window.innerHeight - 20));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Cuerpo del jugador (campesino boliviano)
        ctx.fillStyle = '#8B4513'; // Color piel
        ctx.fillRect(-10, -15, 20, 30);
        
        // Poncho
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(-12, -10, 24, 20);
        
        // Cabeza
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Sombrero
        ctx.fillStyle = '#654321';
        ctx.fillRect(-10, -30, 20, 8);
        
        // Indicador de dirección
        if (this.weapon) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.angle) * 25, Math.sin(this.angle) * 25);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Barra de salud sobre el jugador
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x - 20, this.y - 40, 40, 6);
        ctx.fillStyle = this.health > 50 ? '#00FF00' : this.health > 25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(this.x - 20, this.y - 40, (this.health / 100) * 40, 6);
    }

    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
    }

    pickupWeapon(weapon) {
        this.weapon = weapon;
    }

    useItem(item) {
        if (item.category === 'healing') {
            this.health = Math.min(100, this.health + 25);
        }
        this.inventory.push(item);
    }

    shoot(angle) {
        this.angle = angle;
        // Aquí se podría agregar lógica de proyectiles
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 100;
        this.speed = 1 + Math.random();
        this.targetX = x;
        this.targetY = y;
        this.lastTargetUpdate = 0;
    }

    update(player, safeZone) {
        // IA simple: moverse hacia la zona segura o alejarse del jugador
        if (Date.now() - this.lastTargetUpdate > 2000) {
            if (Math.random() < 0.7) {
                // Moverse hacia la zona segura
                this.targetX = safeZone.x + (Math.random() - 0.5) * safeZone.radius;
                this.targetY = safeZone.y + (Math.random() - 0.5) * safeZone.radius;
            } else {
                // Moverse aleatoriamente
                this.targetX = this.x + (Math.random() - 0.5) * 200;
                this.targetY = this.y + (Math.random() - 0.5) * 200;
            }
            this.lastTargetUpdate = Date.now();
        }
        
        // Moverse hacia el objetivo
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Cuerpo del enemigo (similar al jugador pero diferente color)
        ctx.fillStyle = '#654321';
        ctx.fillRect(-8, -12, 16, 24);
        
        // Cabeza
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, -16, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Weapon {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.damage = this.getDamage(type);
    }

    getDamage(type) {
        const damages = {
            'Escopeta': 80,
            'Honda': 40,
            'Machete': 60,
            'Dinamita': 100
        };
        return damages[type] || 30;
    }

    draw(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - 8, this.y - 8, 16, 16);
        
        // Icono del arma
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const icons = {
            'Escopeta': '🔫',
            'Honda': '🪃',
            'Machete': '🔪',
            'Dinamita': '🧨'
        };
        ctx.fillText(icons[this.type] || '?', this.x, this.y + 4);
    }
}

class Item {
    constructor(x, y, type, category) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.category = category;
    }

    draw(ctx) {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
        
        // Icono del objeto
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const icons = {
            'Mate de Coca': '🧉',
            'Botiquín Rural': '🏥',
            'Agua de Manantial': '💧'
        };
        ctx.fillText(icons[this.type] || '+', this.x, this.y + 3);
    }
}

class SafeZone {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.targetRadius = radius;
    }

    update(gameTime) {
        // Reducir la zona segura cada 30 segundos
        if (gameTime > 0 && gameTime % 30 < 0.1) {
            this.targetRadius *= 0.8;
        }
        
        // Animar la reducción
        if (this.radius > this.targetRadius) {
            this.radius -= 1;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

class Storm {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    update() {
        // La tormenta se mueve lentamente hacia el centro
        this.radius -= 0.2;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(128, 0, 128, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#800080';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
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

