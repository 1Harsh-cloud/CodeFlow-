# Preset HTML games (from Claude Sonnet - known to work well)
# When user prompts match, serve these instantly instead of API call

MARIO_PLATFORMER_HTML = r'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mario Platformer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(to bottom, #5c94fc, #4a7ae8); font-family: Arial, sans-serif; }
        #gameCanvas { border: 4px solid #2d2d2d; background: #87ceeb; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .game-over, .win-screen { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 40px; border-radius: 10px; text-align: center; display: none; }
        .game-over h1, .win-screen h1 { margin-bottom: 20px; font-size: 48px; }
        .game-over button, .win-screen button { padding: 10px 30px; font-size: 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .game-over button:hover, .win-screen button:hover { background: #45a049; }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div class="game-over" id="gameOver"><h1>Game Over!</h1><button onclick="restartGame()">Try Again</button></div>
    <div class="win-screen" id="winScreen"><h1>You Win!</h1><button onclick="restartGame()">Play Again</button></div>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const GRAVITY = 0.6, JUMP_FORCE = -12, MOVE_SPEED = 5, PLAYER_SIZE = 32;
        let gameRunning = true, score = 0;
        const player = { x: 100, y: 400, width: PLAYER_SIZE, height: PLAYER_SIZE, velocityX: 0, velocityY: 0, jumping: false, facingRight: true };
        const keys = {};
        window.addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space' && !player.jumping) { player.velocityY = JUMP_FORCE; player.jumping = true; } });
        window.addEventListener('keyup', (e) => { keys[e.code] = false; });
        const platforms = [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 200, y: 450, width: 150, height: 20 }, { x: 400, y: 350, width: 150, height: 20 },
            { x: 100, y: 250, width: 150, height: 20 }, { x: 500, y: 200, width: 150, height: 20 },
            { x: 650, y: 300, width: 100, height: 20 }
        ];
        const coins = [
            { x: 250, y: 410, collected: false }, { x: 450, y: 310, collected: false }, { x: 150, y: 210, collected: false },
            { x: 550, y: 160, collected: false }, { x: 680, y: 260, collected: false }, { x: 300, y: 500, collected: false },
            { x: 600, y: 500, collected: false }
        ];
        const goal = { x: 720, y: 250, width: 40, height: 60 };
        const enemies = [
            { x: 220, y: 420, width: 30, height: 30, speed: 2, direction: 1, minX: 200, maxX: 330 },
            { x: 420, y: 320, width: 30, height: 30, speed: 2, direction: 1, minX: 400, maxX: 530 }
        ];
        function drawPlayer() {
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(player.x, player.y, player.width, player.height);
            ctx.fillStyle = '#3498db'; ctx.fillRect(player.x + 4, player.y + 16, player.width - 8, player.height - 16);
            ctx.fillStyle = '#f0c896'; ctx.fillRect(player.x + 8, player.y + 4, player.width - 16, 12);
            ctx.fillStyle = '#000';
            if (player.facingRight) ctx.fillRect(player.x + 16, player.y + 8, 4, 4);
            else ctx.fillRect(player.x + 12, player.y + 8, 4, 4);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(player.x + 4, player.y + player.height - 4, 10, 4);
            ctx.fillRect(player.x + player.width - 14, player.y + player.height - 4, 10, 4);
        }
        function drawPlatforms() {
            platforms.forEach(p => {
                ctx.fillStyle = '#8B4513'; ctx.fillRect(p.x, p.y, p.width, p.height);
                ctx.fillStyle = '#228B22'; ctx.fillRect(p.x, p.y, p.width, 4);
            });
        }
        function drawCoins() {
            coins.forEach(c => {
                if (!c.collected) {
                    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#FFA500'; ctx.beginPath(); ctx.arc(c.x + 10, c.y + 10, 6, 0, Math.PI * 2); ctx.fill();
                }
            });
        }
        function drawGoal() {
            ctx.fillStyle = '#666'; ctx.fillRect(goal.x + 18, goal.y, 4, goal.height);
            ctx.fillStyle = '#FFD700'; ctx.beginPath();
            ctx.moveTo(goal.x + 22, goal.y); ctx.lineTo(goal.x + 40, goal.y + 10); ctx.lineTo(goal.x + 22, goal.y + 20);
            ctx.closePath(); ctx.fill();
        }
        function drawEnemies() {
            enemies.forEach(e => {
                ctx.fillStyle = '#8B0000'; ctx.fillRect(e.x, e.y, e.width, e.height);
                ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 6, e.y + 8, 6, 6); ctx.fillRect(e.x + 18, e.y + 8, 6, 6);
                ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 10, 3, 3); ctx.fillRect(e.x + 20, e.y + 10, 3, 3);
            });
        }
        function drawHUD() { ctx.fillStyle = '#000'; ctx.font = '24px Arial'; ctx.fillText('Coins: ' + score + '/' + coins.length, 10, 30); }
        function checkCollision(r1, r2) {
            return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
        }
        function updatePlayer() {
            if (keys['ArrowLeft']) { player.velocityX = -MOVE_SPEED; player.facingRight = false; }
            else if (keys['ArrowRight']) { player.velocityX = MOVE_SPEED; player.facingRight = true; }
            else player.velocityX = 0;
            player.velocityY += GRAVITY;
            player.x += player.velocityX; player.y += player.velocityY;
            player.jumping = true;
            platforms.forEach(p => {
                if (checkCollision(player, p)) {
                    if (player.velocityY > 0 && player.y + player.height - player.velocityY <= p.y) {
                        player.y = p.y - player.height; player.velocityY = 0; player.jumping = false;
                    } else if (player.velocityY < 0 && player.y - player.velocityY >= p.y + p.height) {
                        player.y = p.y + p.height; player.velocityY = 0;
                    }
                }
            });
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
            if (player.y > canvas.height) { gameRunning = false; document.getElementById('gameOver').style.display = 'block'; return; }
            coins.forEach(c => {
                if (!c.collected && checkCollision(player, { x: c.x, y: c.y, width: 20, height: 20 })) { c.collected = true; score++; }
            });
            if (checkCollision(player, goal)) { gameRunning = false; document.getElementById('winScreen').style.display = 'block'; return; }
            enemies.forEach(e => { if (checkCollision(player, e)) { gameRunning = false; document.getElementById('gameOver').style.display = 'block'; } });
        }
        function updateEnemies() {
            enemies.forEach(e => {
                e.x += e.speed * e.direction;
                if (e.x <= e.minX || e.x >= e.maxX) e.direction *= -1;
            });
        }
        function restartGame() {
            gameRunning = true; score = 0;
            player.x = 100; player.y = 400; player.velocityX = 0; player.velocityY = 0; player.jumping = false;
            coins.forEach(c => c.collected = false);
            document.getElementById('gameOver').style.display = 'none';
            document.getElementById('winScreen').style.display = 'none';
            gameLoop();
        }
        function gameLoop() {
            if (!gameRunning) return;
            ctx.fillStyle = '#87ceeb'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(100, 80, 30, 0, Math.PI * 2); ctx.arc(130, 80, 40, 0, Math.PI * 2); ctx.arc(160, 80, 30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(500, 120, 35, 0, Math.PI * 2); ctx.arc(535, 120, 45, 0, Math.PI * 2); ctx.arc(570, 120, 35, 0, Math.PI * 2); ctx.fill();
            updatePlayer(); updateEnemies();
            drawPlatforms(); drawCoins(); drawEnemies(); drawGoal(); drawPlayer(); drawHUD();
            requestAnimationFrame(gameLoop);
        }
        gameLoop();
    </script>
</body>
</html>'''
