/**
 * Preset HTML games - load instantly without API call.
 * Key must match presetKey in PlayPanel GAME_IDEAS.
 */
export const PRESET_GAMES = {
  flamingo: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flamingo Pond Adventure</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a0a2e; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Arial', sans-serif; }
canvas { display: block; border: 3px solid #4ecdc4; box-shadow: 0 0 30px rgba(78,205,196,0.5); }
</style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const WORLD_WIDTH = 3200;

let gameState = 'menu';
let score = 0;
let lives = 3;
let level = 1;
let cameraX = 0;
let particles = [];
let confetti = [];

const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });

const player = {
  x: 100, y: 300, w: 30, h: 50,
  vx: 0, vy: 0,
  onGround: false,
  facing: 1,
  frame: 0, frameTimer: 0, invincible: 0, legPhase: 0
};

let platforms = [];
let fish = [];
let crocodiles = [];
let bubbles = [];
let decorations = [];

function generateLevel() {
  platforms = [];
  fish = [];
  crocodiles = [];
  bubbles = [];
  decorations = [];

  platforms.push({ x: 50, y: 350, w: 200, h: 20, type: 'start' });

  let x = 300;
  for (let i = 0; i < 30; i++) {
    let w = 60 + Math.random() * 80;
    let y = 280 + Math.random() * 100;
    let gapX = 60 + Math.random() * 100;
    platforms.push({ x, y, w, h: 15, type: 'lily', bob: Math.random() * Math.PI * 2, bobSpeed: 0.02 + Math.random() * 0.01 });
    x += w + gapX;
  }
  platforms.push({ x: x + 50, y: 320, w: 200, h: 20, type: 'end' });

  for (let i = 0; i < 40; i++) {
    let p = platforms[1 + Math.floor(Math.random() * (platforms.length - 2))];
    fish.push({
      x: p.x + p.w / 2 + (Math.random() - 0.5) * 60,
      y: p.y - 30 - Math.random() * 50,
      w: 20, h: 14, collected: false,
      bob: Math.random() * Math.PI * 2, bobSpeed: 0.05
    });
  }

  for (let i = 0; i < 12; i++) {
    let p = platforms[2 + Math.floor(Math.random() * (platforms.length - 4))];
    crocodiles.push({
      x: p.x, y: p.y - 30, w: 60, h: 25,
      vx: 1 + Math.random() * 1.5,
      startX: p.x, endX: p.x + p.w - 60, platform: p,
      frame: 0, frameTimer: 0, jawOpen: 0, jawDir: 1
    });
  }

  for (let i = 0; i < 50; i++) {
    decorations.push({
      type: Math.random() > 0.5 ? 'flower' : 'reed',
      x: Math.random() * WORLD_WIDTH,
      y: 340 + Math.random() * 100,
      size: 5 + Math.random() * 10
    });
  }

  for (let i = 0; i < 30; i++) {
    bubbles.push({
      x: Math.random() * WORLD_WIDTH,
      y: 380 + Math.random() * 80,
      r: 2 + Math.random() * 5,
      speed: 0.3 + Math.random() * 0.5,
      alpha: 0.3 + Math.random() * 0.4
    });
  }

  player.x = 150;
  player.y = 280;
  player.vx = 0;
  player.vy = 0;
  cameraX = 0;
}

function spawnParticle(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      life: 1, decay: 0.03 + Math.random() * 0.03,
      size: 3 + Math.random() * 5, color
    });
  }
}

function spawnConfetti() {
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      color: \`hsl(\${Math.random() * 360}, 80%, 60%)\`,
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2, life: 1
    });
  }
}

function updateCamera() {
  let targetX = player.x - canvas.width / 2;
  targetX = Math.max(0, Math.min(targetX, WORLD_WIDTH - canvas.width));
  cameraX += (targetX - cameraX) * 0.1;
}

function getPlatformAt(px, py, pw, ph) {
  for (let p of platforms) {
    let py2 = p.y + (p.bob !== undefined ? Math.sin(p.bob) * 5 : 0);
    if (px + pw > p.x && px < p.x + p.w &&
        py + ph > py2 && py + ph < py2 + p.h + 15 && player.vy >= 0) {
      return { platform: p, y: py2 };
    }
  }
  return null;
}

function update() {
  if (gameState !== 'playing') return;

  if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -MOVE_SPEED; player.facing = -1; }
  else if (keys['ArrowRight'] || keys['KeyD']) { player.vx = MOVE_SPEED; player.facing = 1; }
  else player.vx *= 0.8;

  if ((keys['ArrowUp'] || keys['Space'] || keys['KeyW']) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    spawnParticle(player.x + player.w/2, player.y + player.h, '#4ecdc4', 5);
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));

  player.onGround = false;
  let result = getPlatformAt(player.x, player.y, player.w, player.h);
  if (result) {
    player.y = result.y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.legPhase += Math.abs(player.vx) * 0.15;

  if (player.y > 480 && player.invincible <= 0) loseLife();
  if (player.invincible > 0) player.invincible--;

  for (let p of platforms) { if (p.bob !== undefined) p.bob += p.bobSpeed; }

  for (let f of fish) {
    if (!f.collected) {
      f.bob += f.bobSpeed;
      if (Math.abs(player.x + player.w/2 - f.x) < 25 && Math.abs(player.y + player.h/2 - f.y) < 25) {
        f.collected = true;
        score += 10;
        spawnParticle(f.x, f.y, '#ffd700', 8);
      }
    }
  }

  for (let c of crocodiles) {
    c.x += c.vx;
    if (c.x <= c.startX || c.x + c.w >= c.endX + c.w) { c.vx *= -1; c.x = Math.max(c.startX, Math.min(c.endX, c.x)); }
    c.jawOpen += c.jawDir * 0.05;
    if (c.jawOpen >= 1 || c.jawOpen <= 0) c.jawDir *= -1;
    if (player.invincible <= 0 &&
        player.x + player.w > c.x + 5 && player.x < c.x + c.w - 5 &&
        player.y + player.h > c.y + 5 && player.y < c.y + c.h - 5) loseLife();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }

  for (let i = confetti.length - 1; i >= 0; i--) {
    let c = confetti[i];
    c.x += c.vx; c.y += c.vy; c.rot += c.rotSpeed; c.life -= 0.005;
    if (c.y > canvas.height + 20 || c.life <= 0) confetti.splice(i, 1);
  }

  for (let b of bubbles) { b.y -= b.speed; if (b.y < 350) b.y = 470; }

  let endP = platforms[platforms.length - 1];
  if (player.x + player.w > endP.x && player.x < endP.x + endP.w && player.onGround) {
    gameState = 'win';
    spawnConfetti();
  }
  updateCamera();
}

function loseLife() {
  lives--;
  player.invincible = 120;
  spawnParticle(player.x + player.w/2, player.y, '#ff6b6b', 15);
  if (lives <= 0) gameState = 'gameover';
  else { player.x = 100; player.y = 280; player.vx = 0; player.vy = 0; cameraX = 0; }
}

function drawBackground() {
  let sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
  sky.addColorStop(0, '#87CEEB'); sky.addColorStop(0.5, '#b0e0ff'); sky.addColorStop(1, '#d4f5ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  let cloudOffsets = [100, 300, 550, 720];
  for (let cx of cloudOffsets) {
    let scrolledX = (cx - cameraX * 0.3) % canvas.width;
    drawCloud(scrolledX, 60, 1);
    drawCloud((cx + 200 - cameraX * 0.2) % canvas.width, 90, 0.7);
  }

  let water = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
  water.addColorStop(0, '#2980b9'); water.addColorStop(0.3, '#1a6ba0'); water.addColorStop(1, '#0d4a73');
  ctx.fillStyle = water;
  ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    let wx = ((i * 120 - cameraX * 0.5) % canvas.width + canvas.width) % canvas.width;
    ctx.beginPath();
    ctx.moveTo(wx, canvas.height * 0.58);
    ctx.lineTo(wx + 60, canvas.height * 0.62);
    ctx.stroke();
  }

  for (let b of bubbles) {
    let bx = b.x - cameraX;
    if (bx < -10 || bx > canvas.width + 10) continue;
    ctx.beginPath();
    ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = \`rgba(255,255,255,\${b.alpha})\`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let d of decorations) {
    let dx = d.x - cameraX;
    if (dx < -20 || dx > canvas.width + 20) continue;
    if (d.type === 'reed') drawReed(dx, d.y, d.size);
    else drawFlower(dx, d.y, d.size);
  }
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.arc(30, -10, 30, 0, Math.PI * 2);
  ctx.arc(65, 0, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}

function drawReed(x, y, size) {
  ctx.strokeStyle = '#5d8a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x, y - size * 2);
  ctx.stroke();
  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.ellipse(x, y - size * 2, 3, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(x, y, size) {
  ctx.fillStyle = '#ff69b4';
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(i * Math.PI / 3);
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.5, size * 0.3, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatform(p) {
  let bobY = p.bob !== undefined ? Math.sin(p.bob) * 5 : 0;
  let px = p.x - cameraX;
  let py = p.y + bobY;
  if (px + p.w < 0 || px > canvas.width) return;

  if (p.type === 'lily' || p.type === 'start' || p.type === 'end') {
    let rx = p.w / 2;
    let ry = p.h * 1.2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px + rx + 4, py + ry + 4, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    let grad = ctx.createRadialGradient(px + rx, py, 2, px + rx, py + ry, rx);
    grad.addColorStop(0, '#6dbf3e'); grad.addColorStop(0.6, '#4a9e28'); grad.addColorStop(1, '#2d6e14');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(px + rx, py + ry * 0.5, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + rx, py);
    ctx.lineTo(px + rx, py + ry * 2);
    ctx.stroke();
    for (let v = -1; v <= 1; v += 2) {
      ctx.beginPath();
      ctx.moveTo(px + rx, py + ry * 0.5);
      ctx.lineTo(px + rx + v * rx * 0.9, py + ry * 1.5);
      ctx.stroke();
    }

    ctx.fillStyle = '#1a6ba0';
    ctx.beginPath();
    ctx.moveTo(px + rx, py);
    ctx.lineTo(px + rx - 8, py + 10);
    ctx.lineTo(px + rx + 8, py + 10);
    ctx.closePath();
    ctx.fill();

    if (p.type === 'end') {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(px + rx, py + ry * 0.5, rx + 5, ry + 3, 0, 0, Math.PI * 2);
      ctx.fill();
      drawStar(px + rx, py - 15, 12, '#ffd700');
    }
  }
}

function drawStar(x, y, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    let angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
    let x2 = x + Math.cos(angle) * r;
    let y2 = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x2, y2);
    else ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFish(f) {
  if (f.collected) return;
  let fx = f.x - cameraX;
  let fy = f.y + Math.sin(f.bob) * 4;
  if (fx < -30 || fx > canvas.width + 30) return;

  ctx.save();
  ctx.translate(fx, fy);
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-18, -7);
  ctx.lineTo(-18, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff8dc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, -5);
  ctx.lineTo(-3, 5);
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(6, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(7, -2.5, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrocodile(c) {
  let cx = c.x - cameraX;
  let cy = c.y;
  if (cx + c.w < -10 || cx > canvas.width + 10) return;

  ctx.save();
  ctx.translate(cx + c.w / 2, cy + c.h / 2);
  if (c.vx < 0) ctx.scale(-1, 1);

  let bodyGrad = ctx.createLinearGradient(-25, -10, 25, 10);
  bodyGrad.addColorStop(0, '#2d7a2d'); bodyGrad.addColorStop(0.5, '#3da03d'); bodyGrad.addColorStop(1, '#1a5c1a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2, 28, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2a6a2a';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(i * 8, -6, 3, Math.PI, 0);
    ctx.fill();
  }

  ctx.fillStyle = '#2d7a2d';
  ctx.beginPath();
  ctx.moveTo(25, 0);
  ctx.lineTo(40, -5);
  ctx.lineTo(40, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2a6a2a';
  ctx.fillRect(-18, 8, 8, 6);
  ctx.fillRect(10, 8, 8, 6);

  ctx.fillStyle = '#3da03d';
  ctx.beginPath();
  ctx.ellipse(-27, 0, 14, 9, -0.1, 0, Math.PI * 2);
  ctx.fill();

  let jawAngle = c.jawOpen * 0.3;
  ctx.fillStyle = '#ff4444';
  ctx.save();
  ctx.translate(-27, 2);
  ctx.rotate(jawAngle);
  ctx.beginPath();
  ctx.ellipse(0, 5, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let t = -8; t <= 8; t += 5) {
    ctx.beginPath();
    ctx.moveTo(t, 2);
    ctx.lineTo(t - 2, 8);
    ctx.lineTo(t + 2, 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-27, -2);
  ctx.rotate(-jawAngle);
  ctx.fillStyle = '#3da03d';
  ctx.beginPath();
  ctx.ellipse(0, -3, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(-20, -7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-20, -7, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlamingo() {
  let px = player.x - cameraX;
  let py = player.y;

  ctx.save();
  ctx.translate(px + player.w / 2, py + player.h);
  if (player.facing === -1) ctx.scale(-1, 1);

  if (player.invincible > 0 && Math.floor(player.invincible / 5) % 2 === 0) ctx.globalAlpha = 0.4;

  let legSwing = Math.sin(player.legPhase) * 10;
  ctx.strokeStyle = '#ff69b4';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.save();
  ctx.rotate((legSwing * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-4, -25);
  ctx.stroke();
  ctx.strokeStyle = '#ff8c69';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -25);
  ctx.lineTo(-12, -25);
  ctx.moveTo(-4, -25);
  ctx.lineTo(-4, -20);
  ctx.stroke();
  ctx.restore();

  if (!player.onGround || Math.abs(player.vx) > 0.5) {
    ctx.save();
    ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(4, -25);
    ctx.stroke();
    ctx.strokeStyle = '#ff8c69';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, -25);
    ctx.lineTo(12, -25);
    ctx.moveTo(4, -25);
    ctx.lineTo(4, -20);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.save();
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(3, -10);
    ctx.lineTo(10, -18);
    ctx.stroke();
    ctx.restore();
  }

  let bodyGrad = ctx.createRadialGradient(-2, -35, 3, 0, -38, 16);
  bodyGrad.addColorStop(0, '#ff9ec8'); bodyGrad.addColorStop(0.7, '#ff69b4'); bodyGrad.addColorStop(1, '#e05090');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -38, 13, 18, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e05090';
  ctx.beginPath();
  ctx.ellipse(10, -40, 6, 10, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ff69b4';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.quadraticCurveTo(8, -65, 5, -75);
  ctx.stroke();

  ctx.fillStyle = '#ffb6da';
  ctx.beginPath();
  ctx.arc(5, -77, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(14, -77);
  ctx.lineTo(25, -74);
  ctx.lineTo(22, -70);
  ctx.lineTo(14, -73);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(14, -77);
  ctx.lineTo(24, -75);
  ctx.lineTo(14, -73);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(10, -80, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(11, -81, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ff1493';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let f = -1; f <= 1; f++) {
    ctx.beginPath();
    ctx.moveTo(5 + f * 2, -86);
    ctx.lineTo(5 + f * 4, -95 + f * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticles() {
  for (let p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHUD() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 160, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🐟 Score: ' + score, 20, 35);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(180, 10, 120, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#ff69b4';
  ctx.fillText('❤️ x' + lives, 190, 35);

  let totalFish = fish.length;
  let collectedFish = fish.filter(f => f.collected).length;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 170, 10, 160, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'right';
  ctx.fillText(\`Fish: \${collectedFish}/\${totalFish}\`, canvas.width - 20, 35);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('← → Move | Space/↑ Jump | Reach the golden lily pad!', canvas.width / 2, canvas.height - 10);
}

function drawConfetti() {
  for (let c of confetti) {
    ctx.save();
    ctx.globalAlpha = c.life;
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.5);
    ctx.restore();
  }
}

function drawMenu() {
  ctx.fillStyle = 'rgba(0,20,50,0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let waterGrad = ctx.createLinearGradient(0, 350, 0, canvas.height);
  waterGrad.addColorStop(0, '#2980b9');
  waterGrad.addColorStop(1, '#0d4a73');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 360, canvas.width, 140);

  ctx.save();
  ctx.shadowColor = '#ff69b4';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ff69b4';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🦩 FLAMINGO POND', canvas.width / 2, 120);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('ADVENTURE', canvas.width / 2, 160);
  ctx.restore();

  ctx.fillStyle = '#b0e0ff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Collect fish • Avoid crocodiles • Reach the golden lily pad!', canvas.width / 2, 200);

  ctx.save();
  ctx.translate(canvas.width / 2, 290);
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff69b4';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.quadraticCurveTo(15, -50, 12, -65);
  ctx.stroke();
  ctx.fillStyle = '#ffb6da';
  ctx.beginPath();
  ctx.arc(12, -67, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff69b4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-4, 28);
  ctx.lineTo(-4, 55);
  ctx.moveTo(4, 28);
  ctx.lineTo(4, 55);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 100, 390, 200, 55, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('PRESS SPACE', canvas.width / 2, 424);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px Arial';
  ctx.fillText('Arrow Keys / WASD to move | Space to jump', canvas.width / 2, 470);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, 180);

  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText('A crocodile got you! 🐊', canvas.width / 2, 240);

  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('Score: ' + score, canvas.width / 2, 290);

  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 120, 330, 240, 55, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('PLAY AGAIN (Space)', canvas.width / 2, 363);
}

function drawWin() {
  drawConfetti();

  ctx.fillStyle = 'rgba(0,20,60,0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.shadowColor = '#ffd700';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 58px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 YOU WIN! 🎉', canvas.width / 2, 150);
  ctx.restore();

  ctx.fillStyle = '#ff69b4';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('The flamingo reached safety!', canvas.width / 2, 210);

  ctx.fillStyle = '#fff';
  ctx.font = '22px Arial';
  ctx.fillText('Final Score: ' + score, canvas.width / 2, 260);

  let totalFish = fish.length;
  let collectedFish = fish.filter(f => f.collected).length;
  ctx.fillStyle = '#b0e0ff';
  ctx.fillText(\`Fish Collected: \${collectedFish}/\${totalFish}\`, canvas.width / 2, 300);

  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 110, 340, 220, 55, 12);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('PLAY AGAIN (Space)', canvas.width / 2, 373);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'menu') {
    drawMenu();
    return;
  }

  drawBackground();
  for (let p of platforms) drawPlatform(p);
  for (let f of fish) drawFish(f);
  for (let c of crocodiles) drawCrocodile(c);
  drawFlamingo();
  drawParticles();
  drawHUD();

  if (gameState === 'gameover') drawGameOver();
  if (gameState === 'win') drawWin();
}

function handleMenuInput() {
  if (keys['Space'] || keys['Enter']) {
    keys['Space'] = false;
    keys['Enter'] = false;
    score = 0;
    lives = 3;
    generateLevel();
    gameState = 'playing';
  }
}

function gameLoop() {
  if (gameState === 'menu') {
    handleMenuInput();
    drawMenu();
  } else if (gameState === 'playing') {
    update();
    draw();
  } else if (gameState === 'gameover') {
    draw();
    if (keys['Space'] || keys['Enter']) {
      keys['Space'] = false;
      keys['Enter'] = false;
      score = 0;
      lives = 3;
      generateLevel();
      gameState = 'playing';
    }
  } else if (gameState === 'win') {
    if (Math.random() < 0.3) spawnConfetti();
    update();
    draw();
    if (keys['Space'] || keys['Enter']) {
      keys['Space'] = false;
      keys['Enter'] = false;
      score = 0;
      lives = 3;
      confetti = [];
      generateLevel();
      gameState = 'playing';
    }
  }

  requestAnimationFrame(gameLoop);
}

let touchStartX = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  let dx = e.touches[0].clientX - touchStartX;
  keys['ArrowLeft'] = dx < -20;
  keys['ArrowRight'] = dx > 20;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', e => {
  keys['ArrowLeft'] = false;
  keys['ArrowRight'] = false;
  keys['Space'] = true;
  setTimeout(() => keys['Space'] = false, 100);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('click', () => {
  if (gameState === 'menu' || gameState === 'gameover' || gameState === 'win') {
    keys['Space'] = true;
    setTimeout(() => keys['Space'] = false, 100);
  }
});

generateLevel();
gameLoop();
</script>
</body>
</html>`,

  snake: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Classic Snake</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
  }
  #gameContainer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  #header {
    display: flex;
    gap: 40px;
    align-items: center;
  }
  .stat-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 24px;
    text-align: center;
  }
  .stat-label {
    color: #888;
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .stat-value {
    color: #fff;
    font-size: 26px;
    font-weight: bold;
    letter-spacing: 1px;
  }
  #canvas {
    border-radius: 8px;
    display: block;
    box-shadow: 0 0 40px rgba(78, 205, 196, 0.3), 0 0 80px rgba(78, 205, 196, 0.1);
  }
  #controls {
    color: #555;
    font-size: 13px;
    letter-spacing: 1px;
  }
  #overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 30, 0.88);
    border-radius: 8px;
    z-index: 10;
    gap: 16px;
    backdrop-filter: blur(4px);
  }
  #overlay h1 {
    font-size: 52px;
    font-weight: 900;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #4ecdc4, #44cf6c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  #overlay .subtitle {
    color: #aaa;
    font-size: 16px;
    letter-spacing: 2px;
  }
  #overlay .final-score {
    color: #fff;
    font-size: 28px;
    font-weight: bold;
    margin: 8px 0;
  }
  #overlay .high-score-display {
    color: #f7d55e;
    font-size: 15px;
    letter-spacing: 1px;
  }
  #startBtn {
    margin-top: 12px;
    padding: 14px 48px;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: 2px;
    color: #1a1a2e;
    background: linear-gradient(135deg, #4ecdc4, #44cf6c);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: 0 4px 20px rgba(78, 205, 196, 0.4);
  }
  #startBtn:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 28px rgba(78, 205, 196, 0.6);
  }
  #startBtn:active { transform: scale(0.97); }
  .emoji { font-size: 48px; }
</style>
</head>
<body>
<div id="gameContainer">
  <div id="header">
    <div class="stat-box">
      <div class="stat-label">Score</div>
      <div class="stat-value" id="scoreDisplay">0</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Best</div>
      <div class="stat-value" id="highScoreDisplay">0</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Level</div>
      <div class="stat-value" id="levelDisplay">1</div>
    </div>
  </div>
  <canvas id="canvas"></canvas>
  <div id="controls">↑ ↓ ← → Arrow Keys to Move &nbsp;|&nbsp; P to Pause</div>
  <div id="overlay">
    <div class="emoji">🐍</div>
    <h1>SNAKE</h1>
    <div class="subtitle">Classic Edition</div>
    <button id="startBtn">START GAME</button>
    <div style="color:#666; font-size:12px; margin-top:4px;">Arrow Keys • Eat apples • Don't crash!</div>
  </div>
</div>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const scoreDisplay = document.getElementById('scoreDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const startBtn = document.getElementById('startBtn');

const COLS = 25;
const ROWS = 25;
const CELL = 22;
const W = COLS * CELL;
const H = ROWS * CELL;
canvas.width = W;
canvas.height = H;

overlay.style.width = W + 'px';
overlay.style.height = H + 'px';
overlay.style.top = '0';
overlay.style.left = '50%';
overlay.style.transform = 'translateX(-50%)';
overlay.style.marginTop = '0';

let snake, dir, nextDir, apple, score, highScore, level, gameLoop, particles, gameState, paused;
highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
highScoreDisplay.textContent = highScore;

function initGame() {
  snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  level = 1;
  paused = false;
  particles = [];
  placeApple();
  updateUI();
}

function placeApple() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  apple = pos;
}

function getSpeed() {
  return Math.max(60, 180 - (level - 1) * 15);
}

function updateUI() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
  levelDisplay.textContent = level;
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: x * CELL + CELL / 2,
      y: y * CELL + CELL / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.03 + Math.random() * 0.04,
      size: 3 + Math.random() * 4,
      color
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.97;
    p.life -= p.decay;
    p.size *= 0.97;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGrid() {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(W, y * CELL);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}

function drawSnake() {
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const isTail = i === snake.length - 1;
    const t = 1 - i / snake.length;

    const px = seg.x * CELL;
    const py = seg.y * CELL;
    const pad = isHead ? 1 : 2;
    const r = isHead ? 6 : 4;

    const g = ctx.createLinearGradient(px, py, px + CELL, py + CELL);
    if (isHead) {
      g.addColorStop(0, '#4ecdc4');
      g.addColorStop(1, '#44cf6c');
    } else {
      const brightness = 0.45 + t * 0.45;
      g.addColorStop(0, \`rgba(68, 207, 108, \${brightness})\`);
      g.addColorStop(1, \`rgba(78, 205, 196, \${brightness})\`);
    }

    ctx.fillStyle = g;
    roundRect(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, r);
    ctx.fill();

    if (isHead) {
      const eyeColor = '#fff';
      const pupilColor = '#1a1a2e';

      let eyeOffsets = [
        { x: 5, y: 5 },
        { x: 5, y: CELL - 9 }
      ];

      if (dir.x === 1) { eyeOffsets = [{ x: CELL - 9, y: 5 }, { x: CELL - 9, y: CELL - 9 }]; }
      else if (dir.x === -1) { eyeOffsets = [{ x: 5, y: 5 }, { x: 5, y: CELL - 9 }]; }
      else if (dir.y === -1) { eyeOffsets = [{ x: 5, y: 5 }, { x: CELL - 9, y: 5 }]; }
      else if (dir.y === 1) { eyeOffsets = [{ x: 5, y: CELL - 9 }, { x: CELL - 9, y: CELL - 9 }]; }

      eyeOffsets.forEach(e => {
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(px + e.x, py + e.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pupilColor;
        ctx.beginPath();
        ctx.arc(px + e.x + dir.x, py + e.y + dir.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowColor = '#4ecdc4';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
      ctx.lineWidth = 1;
      roundRect(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, r);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (!isHead) {
      ctx.fillStyle = \`rgba(255,255,255,\${t * 0.08})\`;
      roundRect(ctx, px + pad + 1, py + pad + 1, (CELL - pad * 2) * 0.5, 3, 2);
      ctx.fill();
    }
  });
}

function drawApple() {
  const px = apple.x * CELL + CELL / 2;
  const py = apple.y * CELL + CELL / 2;
  const r = CELL / 2 - 3;
  const time = Date.now() / 1000;
  const pulse = 1 + Math.sin(time * 3) * 0.06;

  ctx.save();
  ctx.translate(px, py);
  ctx.scale(pulse, pulse);

  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 12;

  const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, r);
  g.addColorStop(0, '#ff8e8e');
  g.addColorStop(0.5, '#ff4757');
  g.addColorStop(1, '#c0392b');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-2, -3, 3, 2, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(3, -r - 5, 2, -r - 7);
  ctx.stroke();

  ctx.fillStyle = '#44cf6c';
  ctx.beginPath();
  ctx.ellipse(3, -r - 4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPaused() {
  ctx.fillStyle = 'rgba(10, 10, 30, 0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', W / 2, H / 2);
  ctx.font = '16px Segoe UI, Arial';
  ctx.fillStyle = '#888';
  ctx.fillText('Press P to resume', W / 2, H / 2 + 40);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function render() {
  drawGrid();
  drawParticles();
  drawSnake();
  drawApple();
  updateParticles();
  if (paused) drawPaused();
}

let lastTime = 0;
let elapsed = 0;

function gameStep(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!paused) {
    elapsed += delta;
    if (elapsed >= getSpeed()) {
      elapsed = 0;
      update();
    }
  }

  render();

  if (gameState === 'playing') {
    requestAnimationFrame(gameStep);
  }
}

function update() {
  dir = { ...nextDir };

  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
    endGame();
    return;
  }

  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === apple.x && head.y === apple.y) {
    const points = level * 10;
    score += points;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
    }

    const applesEaten = Math.floor((snake.length - 3));
    level = Math.min(10, Math.floor(applesEaten / 5) + 1);

    spawnParticles(apple.x, apple.y, '#ff4757');
    spawnParticles(apple.x, apple.y, '#ff8e8e');
    placeApple();
    updateUI();
  } else {
    snake.pop();
  }
}

function endGame() {
  gameState = 'over';

  snake.forEach((s, i) => {
    setTimeout(() => {
      spawnParticles(s.x, s.y, '#4ecdc4');
    }, i * 20);
  });

  setTimeout(() => {
    showOverlay('gameover');
  }, 600);
}

function showOverlay(type) {
  overlay.innerHTML = '';
  if (type === 'start') {
    overlay.innerHTML = \`
      <div class="emoji">🐍</div>
      <h1>SNAKE</h1>
      <div class="subtitle">Classic Edition</div>
      <button id="startBtn">START GAME</button>
      <div style="color:#666; font-size:12px; margin-top:4px;">Arrow Keys • Eat apples • Don't crash!</div>
    \`;
  } else {
    const isNewBest = score >= highScore && score > 0;
    overlay.innerHTML = \`
      <div class="emoji">\${isNewBest ? '🏆' : '💀'}</div>
      <h1 style="font-size:38px; letter-spacing:3px;">\${isNewBest ? 'NEW BEST!' : 'GAME OVER'}</h1>
      <div class="final-score">Score: \${score}</div>
      <div class="high-score-display">🏆 Best: \${highScore}</div>
      <div style="color:#888; font-size:14px; margin:4px 0;">Level reached: \${level}</div>
      <button id="startBtn">PLAY AGAIN</button>
    \`;
  }
  overlay.style.display = 'flex';
  document.getElementById('startBtn').addEventListener('click', startGame);
}

function startGame() {
  overlay.style.display = 'none';
  initGame();
  gameState = 'playing';
  lastTime = 0;
  elapsed = 0;
  requestAnimationFrame(gameStep);
}

document.addEventListener('keydown', e => {
  if (gameState !== 'playing') return;

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      if (dir.y !== 1) nextDir = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      e.preventDefault();
      if (dir.y !== -1) nextDir = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (dir.x !== 1) nextDir = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (dir.x !== -1) nextDir = { x: 1, y: 0 };
      break;
    case 'p':
    case 'P':
      paused = !paused;
      if (!paused) { lastTime = 0; elapsed = 0; }
      break;
  }
});

gameState = 'idle';
drawGrid();
showOverlay('start');
</script>
</body>
</html>`,

  mario: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Super Platformer Bros</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; overflow: hidden; font-family: 'Arial', sans-serif; }
  #gameCanvas { border: 3px solid #e94560; border-radius: 4px; box-shadow: 0 0 30px rgba(233,69,96,0.5); }
  #ui { color: #fff; font-size: 13px; margin-top: 8px; opacity: 0.7; letter-spacing: 1px; }
</style>
</head>
<body>
<canvas id="gameCanvas" width="800" height="500"></canvas>
<div id="ui">← → Move &nbsp;|&nbsp; Space / ↑ Jump &nbsp;|&nbsp; Stomp Goombas to kill them &nbsp;|&nbsp; Collect all coins to win!</div>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.55;
const JUMP_FORCE = -13;
const PLAYER_SPEED = 4.5;
const TILE = 32;
const WORLD_W = 3200;
const WORLD_H = 500;

const platforms = [
  {x:0,    y:440, w:500,  h:60},
  {x:600,  y:440, w:400,  h:60},
  {x:1100, y:440, w:300,  h:60},
  {x:1500, y:440, w:500,  h:60},
  {x:2100, y:440, w:400,  h:60},
  {x:2600, y:440, w:600,  h:60},
  {x:200,  y:340, w:128, h:18},
  {x:420,  y:280, w:96,  h:18},
  {x:700,  y:320, w:128, h:18},
  {x:900,  y:260, w:96,  h:18},
  {x:1050, y:330, w:80,  h:18},
  {x:1200, y:370, w:128, h:18},
  {x:1400, y:290, w:96,  h:18},
  {x:1600, y:340, w:128, h:18},
  {x:1800, y:270, w:96,  h:18},
  {x:1950, y:320, w:80,  h:18},
  {x:2150, y:350, w:128, h:18},
  {x:2350, y:280, w:96,  h:18},
  {x:2500, y:340, w:128, h:18},
  {x:2700, y:290, w:96,  h:18},
  {x:2850, y:350, w:128, h:18},
  {x:3000, y:310, w:96,  h:18},
];

const coins = [];
(function() {
  const coinSpots = [
    [230,300],[270,300],[310,300],[450,240],[490,240],
    [730,280],[770,280],[930,220],[970,220],
    [1220,330],[1260,330],[1300,330],
    [1430,250],[1470,250],
    [1640,300],[1680,300],[1720,300],
    [1830,230],[1870,230],
    [1980,280],
    [2180,310],[2220,310],
    [2380,240],[2420,240],
    [2530,300],[2570,300],[2610,300],
    [2730,250],[2770,250],
    [2880,310],[2920,310],
    [3030,270],[3070,270],
    [150,410],[650,410],[1150,410],[1600,410],[2150,410],[2650,410],[2750,410]
  ];
  coinSpots.forEach(([x,y]) => coins.push({x, y, w:18, h:18, collected:false}));
})();

const goombas = [
  {x:300,  y:408, w:34, h:32, vx:1.2, alive:true, dir:1},
  {x:700,  y:408, w:34, h:32, vx:1.0, alive:true, dir:1},
  {x:1000, y:408, w:34, h:32, vx:1.3, alive:true, dir:1},
  {x:1600, y:408, w:34, h:32, vx:1.1, alive:true, dir:1},
  {x:1900, y:408, w:34, h:32, vx:1.4, alive:true, dir:1},
  {x:2200, y:408, w:34, h:32, vx:1.2, alive:true, dir:1},
  {x:2700, y:408, w:34, h:32, vx:1.0, alive:true, dir:1},
  {x:2900, y:408, w:34, h:32, vx:1.5, alive:true, dir:1},
  {x:750,  y:288, w:34, h:32, vx:1.0, alive:true, dir:1},
  {x:1650, y:308, w:34, h:32, vx:1.0, alive:true, dir:1},
];

const deadGoombas = [];
const particles = [];
const goal = {x: 3120, y: 240, w: 40, h: 200};

const player = {
  x: 60, y: 380, w: 30, h: 40,
  vx: 0, vy: 0, onGround: false, facing: 1,
  walkFrame: 0, walkTimer: 0, dead: false, invincible: 0,
};

let camX = 0;
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.code] = false);

let gameState = 'playing';
let score = 0;
let lives = 3;
let totalCoins = coins.length;
let confetti = [];

function rectOverlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function spawnParticles(x, y, color, n=12) {
  for(let i=0;i<n;i++) {
    const ang = (Math.PI*2/n)*i + Math.random()*0.3;
    const spd = 2+Math.random()*3;
    particles.push({
      x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 1,
      life: 1, maxLife: 1, color, r: 4+Math.random()*4
    });
  }
}

function spawnCoinParticle(x, y) {
  for(let i=0;i<8;i++) {
    particles.push({
      x, y, vx: (Math.random()-0.5)*4, vy: -3-Math.random()*3,
      life: 0.8, maxLife: 0.8, color:'#FFD700', r:3, text:true
    });
  }
}

function initConfetti() {
  confetti = [];
  for(let i=0;i<180;i++) {
    confetti.push({
      x: Math.random()*800, y: Math.random()*-500,
      vx: (Math.random()-0.5)*3, vy: 2+Math.random()*3,
      r: 5+Math.random()*8,
      color: \`hsl(\${Math.random()*360},90%,60%)\`,
      rot: Math.random()*Math.PI*2,
      rotV: (Math.random()-0.5)*0.2,
    });
  }
}

function update() {
  if(gameState !== 'playing') {
    if(gameState === 'win') {
      confetti.forEach(c => {
        c.x += c.vx; c.y += c.vy; c.rot += c.rotV;
        if(c.y > 510) { c.y = -20; c.x = Math.random()*800; }
      });
    }
    return;
  }

  if(!player.dead) {
    if(keys['ArrowLeft']||keys['KeyA']) { player.vx = -PLAYER_SPEED; player.facing=-1; }
    else if(keys['ArrowRight']||keys['KeyD']) { player.vx = PLAYER_SPEED; player.facing=1; }
    else { player.vx *= 0.8; }

    if((keys['Space']||keys['ArrowUp']||keys['KeyW']) && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }
  } else {
    player.vx = 0;
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  if(player.x < 0) player.x = 0;

  player.onGround = false;
  platforms.forEach(p => {
    if(rectOverlap(player, p)) {
      const ox = (player.x+player.w/2) - (p.x+p.w/2);
      const oy = (player.y+player.h/2) - (p.y+p.h/2);
      const hw = player.w/2 + p.w/2;
      const hh = player.h/2 + p.h/2;
      const dx = hw - Math.abs(ox);
      const dy = hh - Math.abs(oy);
      if(dx < dy) {
        player.x += ox>0 ? dx : -dx;
        player.vx = 0;
      } else {
        if(oy > 0) { player.y += dy; player.vy = Math.max(0, player.vy); }
        else { player.y -= dy; player.vy = 0; player.onGround = true; }
      }
    }
  });

  if(player.y > WORLD_H + 50) {
    playerDie();
    return;
  }

  if(Math.abs(player.vx) > 0.5 && player.onGround) {
    player.walkTimer++;
    if(player.walkTimer > 8) { player.walkFrame = (player.walkFrame+1)%4; player.walkTimer=0; }
  } else {
    player.walkFrame = 0;
  }

  if(player.invincible > 0) player.invincible--;

  coins.forEach(c => {
    if(!c.collected && rectOverlap(player, c)) {
      c.collected = true;
      score += 100;
      spawnCoinParticle(c.x - camX, c.y);
    }
  });

  if(coins.every(c=>c.collected) && rectOverlap(player, goal)) {
    gameState = 'win';
    initConfetti();
    return;
  }

  goombas.forEach(g => {
    if(!g.alive) return;
    g.x += g.vx * g.dir;

    let gOnGround = false;
    platforms.forEach(p => {
      if(rectOverlap(g, p)) {
        const ox = (g.x+g.w/2) - (p.x+p.w/2);
        const oy = (g.y+g.h/2) - (p.y+p.h/2);
        const hw = g.w/2 + p.w/2;
        const hh = g.h/2 + p.h/2;
        const dx = hw - Math.abs(ox);
        const dy = hh - Math.abs(oy);
        if(dx < dy) {
          g.dir *= -1;
          g.x += ox>0 ? dx : -dx;
        } else {
          if(oy > 0) { g.y += dy; }
          else { g.y -= dy; gOnGround = true; }
        }
      }
    });

    const onAnyPlatform = platforms.some(p =>
      g.x + g.w > p.x && g.x < p.x+p.w &&
      Math.abs((g.y+g.h) - p.y) < 8
    );
    if(!onAnyPlatform && gOnGround) g.dir *= -1;
    if(g.x < 0 || g.x+g.w > WORLD_W) g.dir *= -1;

    if(!player.dead && player.invincible === 0 && rectOverlap(player, g)) {
      if(player.vy > 0 && player.y+player.h < g.y + g.h*0.6) {
        g.alive = false;
        player.vy = -8;
        score += 200;
        deadGoombas.push({x:g.x, y:g.y, w:g.w, h:g.h, timer:40});
        spawnParticles(g.x+g.w/2 - camX, g.y+g.h/2, '#CC6600');
      } else {
        playerDie();
      }
    }
  });

  for(let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.03;
    if(p.life<=0) particles.splice(i,1);
  }

  for(let i=deadGoombas.length-1;i>=0;i--) {
    deadGoombas[i].timer--;
    if(deadGoombas[i].timer<=0) deadGoombas.splice(i,1);
  }

  camX = Math.max(0, Math.min(player.x - canvas.width/2 + player.w/2, WORLD_W - canvas.width));
}

function playerDie() {
  if(player.invincible > 0) return;
  lives--;
  spawnParticles(player.x+player.w/2 - camX, player.y+player.h/2, '#FF4444', 16);
  if(lives <= 0) {
    player.dead = true;
    setTimeout(()=>{ gameState='dead'; }, 800);
  } else {
    player.x=60; player.y=380; player.vx=0; player.vy=0;
    player.invincible = 120;
    camX=0;
  }
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#5c94fc');
  grad.addColorStop(1,'#a8d8f0');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const cloudPositions = [[100,60],[350,40],[620,80],[900,50],[1200,70],[1500,45],[1800,65],[2100,55],[2400,75],[2700,50]];
  cloudPositions.forEach(([cx,cy]) => {
    const sx = cx - camX * 0.3;
    if(sx > -120 && sx < canvas.width+120) drawCloud(sx, cy);
  });

  ctx.fillStyle = '#8ab4d4';
  for(let mi=0; mi<8; mi++) {
    const offX = mi*500 - (camX*0.5 % 500);
    drawMountain(offX, 380+mi*2, 180, 160);
  }
}

function drawCloud(x, y) {
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x,    y,    28,0,Math.PI*2);
  ctx.arc(x+35, y-12, 22,0,Math.PI*2);
  ctx.arc(x+65, y,    26,0,Math.PI*2);
  ctx.arc(x+30, y+5,  22,0,Math.PI*2);
  ctx.fill();
}

function drawMountain(x, y, w, h) {
  ctx.fillStyle='#7aa8c8';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x+w/2, y-h);
  ctx.lineTo(x+w, y);
  ctx.closePath();
  ctx.fill();
}

function drawPlatform(p) {
  const sx = p.x - camX;
  if(sx+p.w < 0 || sx > canvas.width) return;

  const isGround = p.h > 30;
  if(isGround) {
    const dirtGrad = ctx.createLinearGradient(0,p.y,0,p.y+p.h);
    dirtGrad.addColorStop(0,'#5d4037');
    dirtGrad.addColorStop(1,'#3e2723');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(sx, p.y+18, p.w, p.h-18);

    const grassGrad = ctx.createLinearGradient(0,p.y,0,p.y+18);
    grassGrad.addColorStop(0,'#66bb6a');
    grassGrad.addColorStop(1,'#388e3c');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(sx, p.y, p.w, 18);

    ctx.strokeStyle='#2e7d32';
    ctx.lineWidth=1;
    for(let i=0;i<p.w;i+=16) {
      ctx.beginPath();
      ctx.moveTo(sx+i+4, p.y+2);
      ctx.lineTo(sx+i+2, p.y+10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx+i+10, p.y+2);
      ctx.lineTo(sx+i+12, p.y+10);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(sx, p.y, p.w, p.h);
    ctx.fillStyle='#d35400';
    for(let bx=0;bx<p.w;bx+=32) {
      ctx.fillRect(sx+bx, p.y, 2, p.h);
    }
    ctx.fillRect(sx, p.y, p.w, 2);
    ctx.fillRect(sx, p.y+p.h-2, p.w, 2);
    ctx.fillStyle='rgba(255,255,255,0.25)';
    ctx.fillRect(sx, p.y, p.w, 5);
  }
}

function drawCoin(c) {
  if(c.collected) return;
  const sx = c.x - camX;
  if(sx < -20 || sx > canvas.width+20) return;
  const t = Date.now()/400;
  const scaleX = Math.abs(Math.cos(t + c.x*0.05));
  ctx.save();
  ctx.translate(sx+c.w/2, c.y+c.h/2);
  ctx.scale(scaleX, 1);

  const grad = ctx.createRadialGradient(-3,-3,2, 0,0,10);
  grad.addColorStop(0,'#fff59d');
  grad.addColorStop(0.5,'#FFD700');
  grad.addColorStop(1,'#f57f17');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0,0,9,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle='#f57f17';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(0,0,5,0,Math.PI*2);
  ctx.stroke();

  if(scaleX > 0.3) {
    ctx.fillStyle='#f57f17';
    ctx.font='bold 9px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('●',0,0);
  }
  ctx.restore();
}

function drawGoomba(g) {
  if(!g.alive) return;
  const sx = g.x - camX;
  if(sx+g.w < 0 || sx > canvas.width) return;
  const t = Date.now()/200;
  const legAnim = Math.sin(t + g.x*0.1) * 4 * Math.sign(g.vx*g.dir);

  const bodyGrad = ctx.createRadialGradient(sx+g.w/2-4,g.y+5,2, sx+g.w/2,g.y+g.h*0.5,g.w*0.7);
  bodyGrad.addColorStop(0,'#cc8844');
  bodyGrad.addColorStop(1,'#7b3f00');
  ctx.fillStyle=bodyGrad;
  ctx.beginPath();
  ctx.ellipse(sx+g.w/2, g.y+g.h*0.6, g.w*0.55, g.h*0.5, 0, 0, Math.PI*2);
  ctx.fill();

  const headGrad = ctx.createRadialGradient(sx+g.w/2-3,g.y+3,1, sx+g.w/2,g.y+12,14);
  headGrad.addColorStop(0,'#cc8844');
  headGrad.addColorStop(1,'#7b3f00');
  ctx.fillStyle=headGrad;
  ctx.beginPath();
  ctx.ellipse(sx+g.w/2, g.y+12, 15, 13, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(sx+g.w/2-6, g.y+10, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx+g.w/2+6, g.y+10, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='#1a0000';
  ctx.beginPath(); ctx.arc(sx+g.w/2-5, g.y+11, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(sx+g.w/2+7, g.y+11, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle='#1a0000'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(sx+g.w/2-10,g.y+6); ctx.lineTo(sx+g.w/2-3,g.y+8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx+g.w/2+10,g.y+6); ctx.lineTo(sx+g.w/2+3,g.y+8); ctx.stroke();

  ctx.fillStyle='white';
  ctx.beginPath(); ctx.moveTo(sx+g.w/2-5,g.y+20); ctx.lineTo(sx+g.w/2-2,g.y+24); ctx.lineTo(sx+g.w/2-8,g.y+24); ctx.fill();
  ctx.beginPath(); ctx.moveTo(sx+g.w/2+5,g.y+20); ctx.lineTo(sx+g.w/2+8,g.y+24); ctx.lineTo(sx+g.w/2+2,g.y+24); ctx.fill();

  ctx.fillStyle='#3e1a00';
  ctx.beginPath(); ctx.ellipse(sx+g.w/2-8+legAnim, g.y+g.h-4, 8, 5, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx+g.w/2+8-legAnim, g.y+g.h-4, 8, 5, -0.3, 0, Math.PI*2); ctx.fill();
}

function drawDeadGoomba(dg) {
  const sx = dg.x - camX;
  ctx.fillStyle='#7b3f00';
  ctx.fillRect(sx, dg.y+dg.h-8, dg.w, 8);
  ctx.fillStyle='#cc8844';
  ctx.beginPath();
  ctx.ellipse(sx+dg.w/2, dg.y+dg.h-8, dg.w*0.6, 7, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle='white';
  ctx.font='12px Arial'; ctx.textAlign='center';
  ctx.fillText('✕', sx+dg.w/2, dg.y+dg.h-10);
}

function drawPlayer() {
  if(player.dead) return;
  if(player.invincible > 0 && Math.floor(player.invincible/5)%2===0) return;

  const sx = player.x - camX;
  const sy = player.y;
  const f = player.facing;

  ctx.save();
  ctx.translate(sx + player.w/2, sy);

  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, player.h+2, 14, 5, 0, 0, Math.PI*2);
  ctx.fill();

  const legSwing = player.onGround ? Math.sin(player.walkFrame * Math.PI/2) * 6 : 0;
  ctx.fillStyle='#1565c0';
  ctx.fillRect(-10, player.h*0.55, 9, player.h*0.45 + legSwing*f);
  ctx.fillRect(1, player.h*0.55, 9, player.h*0.45 - legSwing*f);
  ctx.fillStyle='#5d2900';
  ctx.fillRect(-12, player.h - 4 + legSwing*f, 11, 7);
  ctx.fillRect(-1, player.h - 4 - legSwing*f, 11, 7);

  const bodyGrad = ctx.createLinearGradient(-10, player.h*0.2, 10, player.h*0.6);
  bodyGrad.addColorStop(0,'#ef5350');
  bodyGrad.addColorStop(1,'#b71c1c');
  ctx.fillStyle=bodyGrad;
  ctx.fillRect(-11, player.h*0.22, 22, player.h*0.42);

  ctx.fillStyle='#1565c0';
  ctx.fillRect(-9, player.h*0.35, 18, player.h*0.3);
  ctx.fillStyle='#FFD700';
  ctx.fillRect(-7, player.h*0.35, 5, 4);
  ctx.fillRect(2,  player.h*0.35, 5, 4);

  const armSwing = player.onGround ? legSwing : 0;
  ctx.fillStyle='#ef5350';
  ctx.fillRect(-16, player.h*0.24, 6, 14 + armSwing);
  ctx.fillRect(10,  player.h*0.24, 6, 14 - armSwing);
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(-13, player.h*0.24+14+armSwing, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(13,  player.h*0.24+14-armSwing, 4, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle='#ffcba4';
  ctx.fillRect(-5, player.h*0.18, 10, 8);

  const headGrad = ctx.createRadialGradient(-3,-4,2, 0, player.h*0.05, 14);
  headGrad.addColorStop(0,'#ffe0b2');
  headGrad.addColorStop(1,'#ffcba4');
  ctx.fillStyle=headGrad;
  ctx.beginPath();
  ctx.ellipse(0, player.h*0.08, 13, 12, 0, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle='#c62828';
  ctx.fillRect(-14, player.h*0.02-3, 28, 6);
  ctx.fillRect(-10, player.h*0.02-14, 20, 13);
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillRect(-8, player.h*0.02-12, 6, 5);

  ctx.fillStyle='#5d2900';
  ctx.beginPath(); ctx.arc(-4*f, player.h*0.12+3, 5, 0.2, Math.PI-0.2); ctx.fill();
  ctx.beginPath(); ctx.arc(4*f, player.h*0.12+3, 5, 0.2, Math.PI-0.2); ctx.fill();
  ctx.fillStyle='#1a0a00';
  ctx.beginPath(); ctx.arc(5*f, player.h*0.06, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle='white';
  ctx.beginPath(); ctx.arc(5*f+1, player.h*0.06-1, 1, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

function drawGoal() {
  const sx = goal.x - camX;
  if(sx < -60 || sx > canvas.width+20) return;

  ctx.fillStyle='#9e9e9e';
  ctx.fillRect(sx+18, goal.y, 4, goal.h);
  ctx.fillStyle='#43a047';
  ctx.beginPath();
  ctx.moveTo(sx+22, goal.y);
  ctx.lineTo(sx+22+40, goal.y+20);
  ctx.lineTo(sx+22, goal.y+40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle='#fff';
  ctx.font='bold 14px Arial';
  ctx.fillText('⭐', sx+26, goal.y+28);
  ctx.fillStyle='#FFD700';
  ctx.beginPath(); ctx.arc(sx+20, goal.y, 8, 0, Math.PI*2); ctx.fill();

  if(!coins.every(c=>c.collected)) {
    ctx.save();
    ctx.font='bold 13px Arial';
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.textAlign='center';
    ctx.fillText('Collect all coins!', sx+22, goal.y - 20);
    ctx.restore();
  }
}

function drawHUD() {
  ctx.fillStyle='rgba(0,0,0,0.55)';
  ctx.fillRect(0,0,canvas.width,48);

  ctx.fillStyle='#FFD700';
  ctx.font='bold 20px Arial';
  ctx.textAlign='left';
  ctx.fillText('⭐ ' + score, 16, 32);

  const collected = coins.filter(c=>c.collected).length;
  ctx.fillStyle='#FFD700';
  ctx.font='bold 18px Arial';
  ctx.textAlign='center';
  ctx.fillText('🪙 ' + collected + '/' + totalCoins, canvas.width/2, 30);

  ctx.fillStyle='#ff5252';
  ctx.textAlign='right';
  ctx.font='bold 18px Arial';
  let livesStr = '';
  for(let i=0;i<lives;i++) livesStr += '❤️ ';
  ctx.fillText(livesStr, canvas.width-16, 30);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life/p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

function drawGameOver() {
  ctx.fillStyle='rgba(0,0,0,0.75)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.textAlign='center';
  ctx.fillStyle='#ff5252';
  ctx.font='bold 72px Arial';
  ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 40);
  ctx.fillStyle='#fff';
  ctx.font='26px Arial';
  ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 20);
  ctx.font='20px Arial';
  ctx.fillStyle='#FFD700';
  ctx.fillText('Press Enter or Space to play again', canvas.width/2, canvas.height/2 + 65);
}

function drawWin() {
  confetti.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.r/2, -c.r/2, c.r, c.r);
    ctx.restore();
  });
  ctx.fillStyle='rgba(0,0,0,0.6)';
  ctx.fillRect(100, canvas.height/2-120, canvas.width-200, 220);
  ctx.textAlign='center';
  ctx.fillStyle='#FFD700';
  ctx.font='bold 62px Arial';
  ctx.fillText('YOU WIN! 🎉', canvas.width/2, canvas.height/2 - 40);
  ctx.fillStyle='#fff';
  ctx.font='28px Arial';
  ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 20);
  ctx.font='20px Arial';
  ctx.fillStyle='#a5d6a7';
  ctx.fillText('Press Enter or Space to play again', canvas.width/2, canvas.height/2 + 65);
}

function resetGame() {
  player.x=60; player.y=380; player.vx=0; player.vy=0;
  player.dead=false; player.onGround=false; player.invincible=0;
  player.walkFrame=0; player.walkTimer=0;
  score=0; lives=3; camX=0;
  coins.forEach(c=>c.collected=false);
  goombas.forEach((g,i)=>{
    const defaults=[
      {x:300,y:408},{x:700,y:408},{x:1000,y:408},{x:1600,y:408},{x:1900,y:408},
      {x:2200,y:408},{x:2700,y:408},{x:2900,y:408},{x:750,y:288},{x:1650,y:308}
    ];
    g.x=defaults[i].x; g.y=defaults[i].y;
    g.alive=true; g.dir=1;
  });
  deadGoombas.length=0; particles.length=0; confetti.length=0;
  gameState='playing';
}

document.addEventListener('keydown', e => {
  if((gameState==='dead'||gameState==='win') && (e.code==='Enter'||e.code==='Space')) {
    resetGame();
  }
});

function gameLoop() {
  update();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  platforms.forEach(drawPlatform);
  drawGoal();
  coins.forEach(drawCoin);
  deadGoombas.forEach(drawDeadGoomba);
  goombas.forEach(drawGoomba);
  drawPlayer();
  drawParticles();
  drawHUD();
  if(gameState==='dead') drawGameOver();
  if(gameState==='win') drawWin();
  requestAnimationFrame(gameLoop);
}

gameLoop();
</script>
</body>
</html>`,

  fox: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Forest Fox</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a0a00; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Arial', sans-serif; }
canvas { display: block; border: 2px solid #3d1a00; box-shadow: 0 0 30px rgba(255,140,0,0.3); }
</style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 550;

let gameState = 'menu';
let score = 0;
let lives = 3;
let level = 1;
let cameraX = 0;
let particles = [];
let confetti = [];

const keys = {};
document.addEventListener('keydown', e => { keys[e.code] = true; e.preventDefault && ['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && e.preventDefault(); });
document.addEventListener('keyup', e => { keys[e.code] = false; });

const WORLD_WIDTH = 5000;
const GRAVITY = 0.6;
const BERRY_TARGET = 30;

let player = {};
function resetPlayer() {
  player = {
    x: 150, y: 300, vx: 0, vy: 0, w: 38, h: 32,
    onGround: false, jumping: false, facing: 1, invincible: 0,
    animFrame: 0, animTimer: 0, tailWag: 0, running: false
  };
}

let platforms = [];
let berries = [];
let wolves = [];
let trees = [];
let clouds = [];
let leaves = [];

function generateLevel() {
  platforms = [];
  berries = [];
  wolves = [];
  trees = [];
  clouds = [];

  for (let x = 0; x < WORLD_WIDTH; x += 180) {
    let gap = (x > 300) ? Math.random() * 60 + 20 : 0;
    platforms.push({ x: x + gap, y: 480, w: 180 - gap - 5, h: 40, type: 'ground' });
  }

  const treePlatformData = [
    { x: 300, y: 370, w: 120, h: 20 }, { x: 500, y: 280, w: 100, h: 20 },
    { x: 680, y: 340, w: 110, h: 20 }, { x: 850, y: 250, w: 130, h: 20 },
    { x: 1050, y: 320, w: 110, h: 20 }, { x: 1220, y: 200, w: 120, h: 20 },
    { x: 1400, y: 310, w: 130, h: 20 }, { x: 1600, y: 240, w: 115, h: 20 },
    { x: 1800, y: 350, w: 120, h: 20 }, { x: 1980, y: 270, w: 110, h: 20 },
    { x: 2150, y: 200, w: 130, h: 20 }, { x: 2350, y: 310, w: 120, h: 20 },
    { x: 2520, y: 240, w: 115, h: 20 }, { x: 2700, y: 350, w: 130, h: 20 },
    { x: 2900, y: 220, w: 120, h: 20 }, { x: 3100, y: 300, w: 110, h: 20 },
    { x: 3280, y: 180, w: 130, h: 20 }, { x: 3480, y: 280, w: 120, h: 20 },
    { x: 3650, y: 350, w: 115, h: 20 }, { x: 3850, y: 210, w: 130, h: 20 },
    { x: 4050, y: 310, w: 120, h: 20 }, { x: 4250, y: 240, w: 110, h: 20 },
    { x: 4450, y: 350, w: 130, h: 20 }, { x: 4650, y: 200, w: 120, h: 20 },
    { x: 4820, y: 300, w: 100, h: 20 },
  ];

  treePlatformData.forEach(p => {
    platforms.push({ ...p, type: 'tree' });
    trees.push({ x: p.x + p.w / 2 - 15, y: p.y, h: 520 - p.y, w: 30 });
  });

  for (let i = 0; i < 80; i++) {
    trees.push({
      x: Math.random() * WORLD_WIDTH,
      y: 380 + Math.random() * 20,
      h: 100 + Math.random() * 80,
      w: 20 + Math.random() * 20,
      bg: true
    });
  }

  for (let i = 0; i < 30; i++) {
    clouds.push({
      x: Math.random() * WORLD_WIDTH,
      y: 40 + Math.random() * 120,
      w: 80 + Math.random() * 100,
      h: 35 + Math.random() * 25,
      speed: 0.2 + Math.random() * 0.3
    });
  }

  treePlatformData.forEach(p => {
    let count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      berries.push({
        x: p.x + 20 + Math.random() * (p.w - 40),
        y: p.y - 18,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  });
  for (let i = 0; i < 15; i++) {
    berries.push({
      x: 200 + Math.random() * (WORLD_WIDTH - 400),
      y: 462,
      collected: false,
      bobOffset: Math.random() * Math.PI * 2
    });
  }

  const wolfPositions = [
    { x: 600, patrol: [550, 750] }, { x: 900, patrol: [850, 1050] },
    { x: 1300, patrol: [1200, 1450] }, { x: 1700, patrol: [1600, 1900] },
    { x: 2100, patrol: [2000, 2250] }, { x: 2500, patrol: [2400, 2700] },
    { x: 2900, patrol: [2800, 3100] }, { x: 3300, patrol: [3200, 3500] },
    { x: 3700, patrol: [3600, 3900] }, { x: 4100, patrol: [4000, 4300] },
    { x: 4500, patrol: [4400, 4700] },
  ];

  wolfPositions.forEach(w => {
    wolves.push({
      x: w.x, y: 448, vx: 1.2, vy: 0, w: 48, h: 36,
      patrol: w.patrol, facing: 1, animFrame: 0, animTimer: 0, howlTimer: 0
    });
  });
}

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 5 - 1,
      r: Math.random() * 5 + 2,
      color,
      life: 1,
      decay: 0.03 + Math.random() * 0.02
    });
  }
}

function spawnConfetti() {
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 1,
      r: Math.random() * 8 + 4,
      color: ['#ff6b6b','#ffd700','#6bff6b','#6bb5ff','#ff6bff','#ff9f6b'][Math.floor(Math.random()*6)],
      spin: (Math.random() - 0.5) * 0.15,
      angle: Math.random() * Math.PI * 2,
      life: 1,
      decay: 0.003
    });
  }
}

function checkPlatformCollision(obj) {
  obj.onGround = false;
  for (let p of platforms) {
    if (obj.x + obj.w > p.x && obj.x < p.x + p.w &&
        obj.y + obj.h > p.y && obj.y + obj.h < p.y + p.h + obj.vy + 2 &&
        obj.vy >= 0) {
      obj.y = p.y - obj.h;
      obj.vy = 0;
      obj.onGround = true;
    }
  }
}

let time = 0;

function updateGame() {
  time++;

  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x > WORLD_WIDTH) c.x = -c.w;
  });

  const speed = 4.5;
  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = -speed;
    player.facing = -1;
    player.running = true;
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = speed;
    player.facing = 1;
    player.running = true;
  } else {
    player.vx *= 0.8;
    player.running = false;
  }

  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
    player.vy = -13;
    player.onGround = false;
    spawnParticles(player.x + player.w / 2, player.y + player.h, '#8B4513', 4);
  }

  player.vy += GRAVITY;
  if (player.vy > 18) player.vy = 18;

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD_WIDTH) player.x = WORLD_WIDTH - player.w;

  checkPlatformCollision(player);

  if (player.y > 600) {
    loseLife();
    return;
  }

  player.animTimer++;
  if (player.running && player.onGround) {
    if (player.animTimer > 6) { player.animFrame = (player.animFrame + 1) % 4; player.animTimer = 0; }
  } else {
    player.animFrame = 0;
  }
  player.tailWag = Math.sin(time * 0.1) * 0.3;

  cameraX = player.x - canvas.width / 2 + player.w / 2;
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));

  berries.forEach(b => {
    if (!b.collected) {
      let bx = b.x - 10, by = b.y - 10 + Math.sin(time * 0.05 + b.bobOffset) * 3;
      if (player.x < bx + 20 && player.x + player.w > bx &&
          player.y < by + 20 && player.y + player.h > by) {
        b.collected = true;
        score++;
        spawnParticles(b.x, b.y, '#cc0033', 10);
        spawnParticles(b.x, b.y, '#ff6666', 5);
        if (score >= BERRY_TARGET) {
          gameState = 'win';
          spawnConfetti();
        }
      }
    }
  });

  wolves.forEach(w => {
    w.x += w.vx;
    if (w.x < w.patrol[0]) { w.vx = Math.abs(w.vx); w.facing = 1; }
    if (w.x > w.patrol[1]) { w.vx = -Math.abs(w.vx); w.facing = -1; }

    w.animTimer++;
    if (w.animTimer > 8) { w.animFrame = (w.animFrame + 1) % 2; w.animTimer = 0; }

    if (player.invincible <= 0) {
      if (player.x + player.w > w.x && player.x < w.x + w.w &&
          player.y + player.h > w.y && player.y < w.y + w.h) {
        loseLife();
      }
    }
  });

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= p.decay;
  });
  particles = particles.filter(p => p.life > 0);

  confetti.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    c.angle += c.spin;
    c.life -= c.decay;
  });
  confetti = confetti.filter(c => c.life > 0);

  if (player.invincible > 0) player.invincible--;
}

function loseLife() {
  lives--;
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff4400', 15);
  if (lives <= 0) {
    gameState = 'gameover';
  } else {
    player.invincible = 120;
    player.x = 150;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;
  }
}

function drawBackground() {
  let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#1a3a00');
  skyGrad.addColorStop(0.5, '#2d6b00');
  skyGrad.addColorStop(1, '#4a8c1a');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawClouds() {
  ctx.save();
  clouds.forEach(c => {
    let cx = c.x - cameraX;
    if (cx > -200 && cx < canvas.width + 200) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.ellipse(cx + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + c.w * 0.3, c.y + c.h * 0.4, c.w * 0.3, c.h * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + c.w * 0.7, c.y + c.h * 0.4, c.w * 0.28, c.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawTree(t) {
  let tx = t.x - cameraX;
  if (tx > -200 && tx < canvas.width + 200) {
    if (t.bg) {
      ctx.fillStyle = '#1a4d00';
      ctx.fillRect(tx + t.w * 0.4, t.y, t.w * 0.2, t.h);
      ctx.fillStyle = '#1f5c00';
      ctx.beginPath();
      ctx.moveTo(tx + t.w / 2, t.y - t.h * 0.5);
      ctx.lineTo(tx, t.y + t.h * 0.3);
      ctx.lineTo(tx + t.w, t.y + t.h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx + t.w / 2, t.y - t.h * 0.7);
      ctx.lineTo(tx + t.w * 0.1, t.y + t.h * 0.1);
      ctx.lineTo(tx + t.w * 0.9, t.y + t.h * 0.1);
      ctx.closePath();
      ctx.fill();
    } else {
      let trunkGrad = ctx.createLinearGradient(tx, 0, tx + t.w, 0);
      trunkGrad.addColorStop(0, '#3d1a00');
      trunkGrad.addColorStop(0.4, '#6b3300');
      trunkGrad.addColorStop(1, '#3d1a00');
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(tx, t.y, t.w, t.h);
      ctx.strokeStyle = '#2a1000';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(tx + 5 + i * 7, t.y);
        ctx.lineTo(tx + 3 + i * 7, t.y + t.h);
        ctx.stroke();
      }
    }
  }
}

function drawPlatform(p) {
  let px = p.x - cameraX;
  if (px > -200 && px < canvas.width + 200) {
    if (p.type === 'ground') {
      let groundGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      groundGrad.addColorStop(0, '#4a7c00');
      groundGrad.addColorStop(0.15, '#2d5c00');
      groundGrad.addColorStop(1, '#1a3d00');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = '#6aaf00';
      ctx.fillRect(px, p.y, p.w, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(px + 10 + i * 30, p.y + 10, 8, 4);
        ctx.fillRect(px + 20 + i * 30, p.y + 20, 6, 3);
      }
    } else {
      let platGrad = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
      platGrad.addColorStop(0, '#5a8c2a');
      platGrad.addColorStop(1, '#3d6600');
      ctx.fillStyle = platGrad;
      ctx.beginPath();
      ctx.roundRect(px, p.y, p.w, p.h, 5);
      ctx.fill();
      ctx.strokeStyle = '#2d5c00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px, p.y, p.w, p.h, 5);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(px + i * 25, p.y + 2);
        ctx.lineTo(px + i * 25 + 15, p.y + p.h - 2);
        ctx.stroke();
      }
    }
  }
}

function drawBerry(b) {
  if (b.collected) return;
  let bx = b.x - cameraX;
  if (bx > -30 && bx < canvas.width + 30) {
    let bob = Math.sin(time * 0.05 + b.bobOffset) * 3;
    let by = b.y - 10 + bob;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff3366';
    ctx.fillStyle = '#cc0033';
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(bx - 3, by - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2d8a00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, by - 9);
    ctx.lineTo(bx + 2, by - 14);
    ctx.stroke();

    ctx.fillStyle = '#3aad00';
    ctx.beginPath();
    ctx.ellipse(bx + 5, by - 14, 5, 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFox() {
  ctx.save();
  let fx = player.x - cameraX;
  let fy = player.y;
  let alpha = player.invincible > 0 ? (Math.floor(player.invincible / 6) % 2 === 0 ? 0.4 : 1) : 1;
  ctx.globalAlpha = alpha;
  ctx.save();
  ctx.translate(fx + player.w / 2, fy + player.h / 2);
  ctx.scale(player.facing, 1);

  ctx.save();
  ctx.translate(-12, 5);
  ctx.rotate(player.tailWag + (player.running ? Math.sin(time * 0.3) * 0.4 : 0));
  ctx.fillStyle = '#cc5500';
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-8, -3, 8, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#e06000';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5c87a';
  ctx.beginPath();
  ctx.ellipse(4, 4, 8, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cc5500';
  let legAnim = player.onGround && player.running ? Math.sin(time * 0.4) * 5 : 0;
  ctx.fillRect(-8, 8, 7, 10 + Math.max(0, legAnim));
  ctx.fillRect(-2, 8, 7, 10 - Math.max(0, legAnim));
  ctx.fillStyle = '#f5c87a';
  ctx.fillRect(-9, 17 + Math.max(0, legAnim), 8, 4);
  ctx.fillRect(-3, 17 - Math.max(0, legAnim), 8, 4);

  ctx.fillStyle = '#e06000';
  ctx.beginPath();
  ctx.ellipse(12, -8, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5c87a';
  ctx.beginPath();
  ctx.ellipse(20, -5, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.ellipse(25, -5, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(16, -10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d1a00';
  ctx.beginPath();
  ctx.arc(17, -10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(18, -11, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cc5500';
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.lineTo(3, -32);
  ctx.lineTo(16, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff8888';
  ctx.beginPath();
  ctx.moveTo(9, -19);
  ctx.lineTo(5, -29);
  ctx.lineTo(15, -23);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

function drawWolf(w) {
  let wx = w.x - cameraX;
  if (wx < -100 || wx > canvas.width + 100) return;
  ctx.save();
  ctx.translate(wx + w.w / 2, w.y + w.h / 2);
  ctx.scale(w.facing, 1);

  ctx.fillStyle = '#666666';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#444444';
  ctx.beginPath();
  ctx.ellipse(-5, -3, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#555555';
  ctx.save();
  ctx.translate(-18, -2);
  ctx.rotate(Math.sin(time * 0.12) * 0.3 - 0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  let legA = w.animFrame * 8;
  ctx.fillStyle = '#555555';
  ctx.fillRect(-12, 8, 8, 12 + (w.animFrame === 0 ? 2 : -2));
  ctx.fillRect(-5, 8, 8, 12 - (w.animFrame === 0 ? 2 : -2));
  ctx.fillRect(3, 8, 8, 12 + (w.animFrame === 0 ? 2 : -2));
  ctx.fillRect(10, 8, 8, 12 - (w.animFrame === 0 ? 2 : -2));
  ctx.fillStyle = '#444444';
  ctx.fillRect(-13, 18 + (w.animFrame === 0 ? 2 : -2), 9, 4);
  ctx.fillRect(-6, 18 - (w.animFrame === 0 ? 2 : -2), 9, 4);
  ctx.fillRect(2, 18 + (w.animFrame === 0 ? 2 : -2), 9, 4);
  ctx.fillRect(9, 18 - (w.animFrame === 0 ? 2 : -2), 9, 4);

  ctx.fillStyle = '#6a6a6a';
  ctx.beginPath();
  ctx.ellipse(18, -8, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#555555';
  ctx.beginPath();
  ctx.ellipse(27, -5, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(32, -5, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(21, -11, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cc0000';
  ctx.beginPath();
  ctx.arc(22, -11, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff0000';
  ctx.fillStyle = '#ff4400';
  ctx.beginPath();
  ctx.arc(22, -11, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#666666';
  ctx.beginPath();
  ctx.moveTo(10, -17);
  ctx.lineTo(6, -30);
  ctx.lineTo(18, -22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, -18);
  ctx.lineTo(18, -30);
  ctx.lineTo(28, -22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(11, -19);
  ctx.lineTo(8, -27);
  ctx.lineTo(17, -23);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 180, 50, 8);
  ctx.fill();

  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#ff3366';
  ctx.fillStyle = '#cc0033';
  ctx.beginPath();
  ctx.arc(32, 35, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ff4466';
  ctx.beginPath();
  ctx.arc(32, 35, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(29, 32, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(\`\${score} / \${BERRY_TARGET}\`, 50, 43);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(200, 10, 140, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('Lives:', 215, 40);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lives ? '#ff6b00' : '#444444';
    ctx.beginPath();
    ctx.arc(295 + i * 22, 35, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 100, 15, 200, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#cc0033';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 99, 16, (score / BERRY_TARGET) * 198, 16, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(\`\${Math.round(score / BERRY_TARGET * 100)}% Complete\`, canvas.width / 2, 29);
  ctx.textAlign = 'left';

  ctx.restore();
}

function drawControls() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 240, canvas.height - 45, 235, 38, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '13px Arial';
  ctx.fillText('← → / WASD: Move   ↑ / Space: Jump', canvas.width - 233, canvas.height - 21);
  ctx.restore();
}

function drawMenuScreen() {
  let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#0d2600');
  skyGrad.addColorStop(1, '#1a4d00');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = \`rgba(10,30,0,\${0.6 + i * 0.03})\`;
    let tx = 30 + i * 80;
    ctx.fillRect(tx + 15, 300, 20, 250);
    ctx.beginPath();
    ctx.moveTo(tx + 25, 150);
    ctx.lineTo(tx, 320);
    ctx.lineTo(tx + 50, 320);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx + 25, 200);
    ctx.lineTo(tx - 10, 350);
    ctx.lineTo(tx + 60, 350);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#2d5c00';
  ctx.fillRect(0, 480, canvas.width, 70);
  ctx.fillStyle = '#4a8c00';
  ctx.fillRect(0, 480, canvas.width, 8);

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 220, 60, 440, 180, 15);
  ctx.fill();

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff6600';
  ctx.fillStyle = '#ff9900';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🦊 FOREST FOX', canvas.width / 2, 160);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ccff99';
  ctx.font = '22px Arial';
  ctx.fillText('Collect 30 berries, avoid the wolves!', canvas.width / 2, 205);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 200, 280, 400, 120, 12);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('← → / WASD : Move', canvas.width / 2, 315);
  ctx.fillText('↑ / Space : Jump', canvas.width / 2, 345);
  ctx.fillText('🍓 Collect berries    🐺 Avoid wolves', canvas.width / 2, 378);
  ctx.restore();

  let pulse = Math.sin(time * 0.07) * 0.1 + 0.9;
  ctx.save();
  ctx.translate(canvas.width / 2, 450);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.roundRect(-100, -25, 200, 50, 12);
  ctx.fill();
  ctx.strokeStyle = '#ff9900';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-100, -25, 200, 50, 12);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PRESS SPACE', 0, 9);
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(80,0,0,0.8)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 220, canvas.height / 2 - 150, 440, 300, 15);
  ctx.fill();
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 220, canvas.height / 2 - 150, 440, 300, 15);
  ctx.stroke();

  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff0000';
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(\`Berries: \${score} / \${BERRY_TARGET}\`, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#ff8866';
  ctx.font = '20px Arial';
  ctx.fillText('The wolves caught you!', canvas.width / 2, canvas.height / 2 + 45);

  let pulse = Math.sin(time * 0.08) * 0.1 + 0.9;
  ctx.translate(canvas.width / 2, canvas.height / 2 + 110);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.roundRect(-110, -22, 220, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('SPACE to Play Again', 0, 8);
  ctx.restore();
}

function drawWinScreen() {
  confetti.forEach(c => {
    ctx.save();
    ctx.globalAlpha = c.life;
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.r / 2, -c.r / 2, c.r, c.r * 1.5);
    ctx.restore();
  });

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(0,60,0,0.85)';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 230, canvas.height / 2 - 170, 460, 340, 18);
  ctx.fill();
  ctx.strokeStyle = '#66ff66';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 230, canvas.height / 2 - 170, 460, 340, 18);
  ctx.stroke();

  ctx.shadowBlur = 25;
  ctx.shadowColor = '#00ff00';
  ctx.fillStyle = '#66ff00';
  ctx.font = 'bold 58px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🎉 YOU WIN! 🎉', canvas.width / 2, canvas.height / 2 - 85);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Arial';
  ctx.fillText('All berries collected!', canvas.width / 2, canvas.height / 2 - 30);

  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 32px Arial';
  ctx.fillText(\`🍓 \${score} / \${BERRY_TARGET} Berries\`, canvas.width / 2, canvas.height / 2 + 20);

  ctx.fillStyle = '#99ffaa';
  ctx.font = '20px Arial';
  ctx.fillText('The forest fox is safe!', canvas.width / 2, canvas.height / 2 + 65);

  let pulse = Math.sin(time * 0.08) * 0.1 + 0.9;
  ctx.translate(canvas.width / 2, canvas.height / 2 + 130);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#22aa00';
  ctx.beginPath();
  ctx.roundRect(-110, -22, 220, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('SPACE to Play Again', 0, 8);
  ctx.restore();
}

function startGame() {
  score = 0;
  lives = 3;
  cameraX = 0;
  particles = [];
  confetti = [];
  time = 0;
  resetPlayer();
  generateLevel();
  gameState = 'playing';
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'menu') {
    time++;
    drawMenuScreen();
    if (keys['Space'] || keys['Enter']) {
      startGame();
    }
  } else if (gameState === 'playing') {
    updateGame();
    drawBackground();
    drawClouds();

    trees.filter(t => t.bg).forEach(drawTree);

    platforms.filter(p => p.type === 'ground').forEach(drawPlatform);

    trees.filter(t => !t.bg).forEach(drawTree);

    platforms.filter(p => p.type === 'tree').forEach(drawPlatform);

    berries.forEach(drawBerry);

    wolves.forEach(drawWolf);

    drawFox();

    drawParticles();

    drawHUD();
    drawControls();

  } else if (gameState === 'gameover') {
    time++;
    drawBackground();
    drawGameOver();
    if (keys['Space'] || keys['Enter']) {
      startGame();
    }
  } else if (gameState === 'win') {
    time++;
    if (time % 30 === 0) spawnConfetti();
    confetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.spin;
      c.life -= c.decay;
    });
    confetti = confetti.filter(c => c.life > 0);
    drawBackground();
    drawWinScreen();
    if (keys['Space'] || keys['Enter']) {
      startGame();
    }
  }

  requestAnimationFrame(gameLoop);
}

generateLevel();
gameLoop();
</script>
</body>
</html>`,

  fish: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ocean Feast - Fish Game</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'Arial', sans-serif; }
  canvas { display: block; cursor: none; }
</style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 900;
canvas.height = 600;

const STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2, WIN: 3 };
let gameState = STATE.MENU;

const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('click', () => {
  if (gameState === STATE.MENU || gameState === STATE.GAMEOVER || gameState === STATE.WIN) initGame();
});

let particles = [];
function addParticle(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
      life: 1, decay: 0.04 + Math.random() * 0.04,
      size: 2 + Math.random() * 4, color
    });
  }
}

let bubbles = [];
function initBubbles() {
  for (let i = 0; i < 30; i++) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 2 + Math.random() * 6,
      speed: 0.3 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2
    });
  }
}

let confetti = [];
function spawnConfetti() {
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      w: 8 + Math.random() * 8, h: 4 + Math.random() * 4,
      color: \`hsl(\${Math.random() * 360},90%,60%)\`
    });
  }
}

let player;
function createPlayer() {
  return {
    x: canvas.width / 2, y: canvas.height / 2,
    vx: 0, vy: 0, size: 18, score: 0, lives: 3, invincible: 0,
    tailWag: 0, facing: 1, trail: []
  };
}

let planktons = [];
function spawnPlankton() {
  const types = [
    { color: '#7fff7f', glow: '#00ff00', points: 1, size: 5 },
    { color: '#ffff7f', glow: '#ffff00', points: 2, size: 7 },
    { color: '#ff9f7f', glow: '#ff6600', points: 5, size: 9 },
    { color: '#df9fff', glow: '#cc44ff', points: 10, size: 6 }
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  return {
    x: 30 + Math.random() * (canvas.width - 60),
    y: 30 + Math.random() * (canvas.height - 60),
    size: t.size, color: t.color, glow: t.glow, points: t.points,
    pulse: Math.random() * Math.PI * 2,
    floatOffset: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4
  };
}

let sharks = [];
function createShark(difficulty) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = -80; y = Math.random() * canvas.height; }
  else if (edge === 1) { x = canvas.width + 80; y = Math.random() * canvas.height; }
  else if (edge === 2) { x = Math.random() * canvas.width; y = -80; }
  else { x = Math.random() * canvas.width; y = canvas.height + 80; }
  const speed = 1.2 + difficulty * 0.3 + Math.random() * 0.8;
  return {
    x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
    size: 45 + Math.random() * 20, speed,
    tailWag: Math.random() * Math.PI * 2, facing: 1, aggro: false, aggroTimer: 0
  };
}

let seaweeds = [];
function initSeaweeds() {
  for (let i = 0; i < 12; i++) {
    seaweeds.push({
      x: Math.random() * canvas.width,
      segments: 5 + Math.floor(Math.random() * 4),
      color: \`hsl(\${120 + Math.random() * 30}, 70%, \${30 + Math.random() * 20}%)\`,
      phase: Math.random() * Math.PI * 2,
      segLen: 20 + Math.random() * 10
    });
  }
}

let planktonTarget = 80;
let score = 0;
let difficulty = 0;
let sharkSpawnTimer = 0;
let planktonTimer = 0;
let frameCount = 0;
let scorePopups = [];

function initGame() {
  player = createPlayer();
  planktons = [];
  sharks = [];
  particles = [];
  confetti = [];
  scorePopups = [];
  score = 0;
  difficulty = 0;
  sharkSpawnTimer = 0;
  planktonTimer = 0;
  frameCount = 0;
  initBubbles();
  initSeaweeds();
  for (let i = 0; i < 20; i++) planktons.push(spawnPlankton());
  for (let i = 0; i < 2; i++) sharks.push(createShark(0));
  gameState = STATE.PLAYING;
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001440');
  grad.addColorStop(0.5, '#002868');
  grad.addColorStop(1, '#001030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const rx = 100 + i * 160;
    const grd = ctx.createRadialGradient(rx, -50, 0, rx, 200, 300);
    grd.addColorStop(0, 'rgba(100,200,255,0.04)');
    grd.addColorStop(1, 'rgba(100,200,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(rx - 60, -50);
    ctx.lineTo(rx + 60, -50);
    ctx.lineTo(rx + 120 + Math.sin(frameCount * 0.005 + i) * 20, canvas.height);
    ctx.lineTo(rx - 120 + Math.sin(frameCount * 0.005 + i) * 20, canvas.height);
    ctx.fill();
  }
  ctx.restore();
  const sandGrad = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
  sandGrad.addColorStop(0, '#c2a44a');
  sandGrad.addColorStop(1, '#a08030');
  ctx.fillStyle = sandGrad;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 60);
  for (let x = 0; x <= canvas.width; x += 40) {
    ctx.lineTo(x, canvas.height - 60 + Math.sin(x * 0.05 + frameCount * 0.01) * 8);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();
}

function drawSeaweeds() {
  seaweeds.forEach(sw => {
    ctx.save();
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    let bx = sw.x, by = canvas.height - 60;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    for (let s = 0; s < sw.segments; s++) {
      const t = s / sw.segments;
      const wave = Math.sin(frameCount * 0.02 + sw.phase + s * 0.8) * (15 + s * 3);
      const nx = bx + wave;
      const ny = by - sw.segLen;
      ctx.lineTo(nx, ny);
      bx = nx; by = ny;
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawBubbles() {
  bubbles.forEach(b => {
    b.y -= b.speed;
    b.wobble += 0.05;
    b.x += Math.sin(b.wobble) * 0.5;
    if (b.y < -20) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
    ctx.save();
    ctx.strokeStyle = 'rgba(150,220,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(150,220,255,0.1)';
    ctx.fill();
    ctx.restore();
  });
}

function drawFish(x, y, size, facing, tailWag, color1, color2, eyeColor, bodyColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = color2;
  ctx.beginPath();
  const tw = Math.sin(tailWag) * 0.3;
  ctx.moveTo(-size * 0.6, 0);
  ctx.lineTo(-size * 1.4, -size * 0.7 + tw * size * 0.5);
  ctx.lineTo(-size * 1.1, 0);
  ctx.lineTo(-size * 1.4, size * 0.7 - tw * size * 0.5);
  ctx.closePath();
  ctx.fill();
  const bodyGrad = ctx.createRadialGradient(0, -size * 0.1, size * 0.1, 0, 0, size);
  bodyGrad.addColorStop(0, color1);
  bodyGrad.addColorStop(1, color2);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.1, -size * 0.1, size * 0.3, size * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.1, -size * 0.5);
  ctx.lineTo(size * 0.3, -size * 0.9);
  ctx.lineTo(size * 0.5, -size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size * 0.5, -size * 0.1, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = eyeColor || '#222';
  ctx.beginPath();
  ctx.arc(size * 0.55, -size * 0.1, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(size * 0.58, -size * 0.13, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(size * 0.75, 0, size * 0.1, 0.2, 0.8);
  ctx.stroke();
  ctx.restore();
}

function drawPlayerFish() {
  if (player.invincible > 0 && Math.floor(frameCount / 5) % 2 === 0) return;
  player.trail.forEach((t, i) => {
    const alpha = i / player.trail.length * 0.3;
    ctx.fillStyle = \`rgba(100,200,255,\${alpha})\`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, player.size * 0.3 * (i / player.trail.length), 0, Math.PI * 2);
    ctx.fill();
  });
  const s = player.size;
  if (s > 25) { ctx.save(); ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15; }
  const color1 = s > 40 ? '#ff8800' : s > 30 ? '#ff4488' : '#4488ff';
  const color2 = s > 40 ? '#cc5500' : s > 30 ? '#aa2266' : '#2255aa';
  drawFish(player.x, player.y, s, player.facing, player.tailWag, color1, color2, '#4488ff', null);
  if (s > 25) ctx.restore();
}

function drawShark(shark) {
  const s = shark.size;
  ctx.save();
  ctx.translate(shark.x, shark.y);
  ctx.scale(shark.facing, 1);
  if (shark.aggro) { ctx.shadowColor = '#ff2200'; ctx.shadowBlur = 20; }
  ctx.fillStyle = '#4a7a8a';
  ctx.beginPath();
  const tw = Math.sin(shark.tailWag) * 0.4;
  ctx.moveTo(-s * 0.55, 0);
  ctx.lineTo(-s * 1.3, -s * 0.6 + tw * s * 0.3);
  ctx.lineTo(-s * 1.0, 0);
  ctx.lineTo(-s * 1.3, s * 0.6 - tw * s * 0.3);
  ctx.closePath();
  ctx.fill();
  const bodyGrad = ctx.createRadialGradient(0, 0, s * 0.1, 0, 0, s);
  bodyGrad.addColorStop(0, '#7ab8c8');
  bodyGrad.addColorStop(1, '#3a6878');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(220,240,245,0.6)';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.75, s * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a6878';
  ctx.beginPath();
  ctx.moveTo(s * 0.1, -s * 0.4);
  ctx.lineTo(s * 0.5, -s * 0.9);
  ctx.lineTo(s * 0.7, -s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(s * 0.6, -s * 0.08, s * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(s * 0.63, -s * 0.1, s * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  for (let t = 0; t < 3; t++) {
    ctx.beginPath();
    ctx.moveTo(s * 0.8 - t * s * 0.08, s * 0.02);
    ctx.lineTo(s * 0.85 - t * s * 0.08, s * 0.12);
    ctx.lineTo(s * 0.75 - t * s * 0.08, s * 0.02);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlankton(p) {
  const pulse = Math.sin(p.pulse) * 0.15 + 1;
  const floatY = Math.sin(p.floatOffset + frameCount * 0.03) * 3;
  ctx.save();
  ctx.shadowColor = p.glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  const spikes = 5;
  const outerR = p.size * pulse;
  const innerR = p.size * 0.4 * pulse;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI / spikes) - Math.PI / 2;
    if (i === 0) ctx.moveTo(p.x + r * Math.cos(angle), p.y + floatY + r * Math.sin(angle));
    else ctx.lineTo(p.x + r * Math.cos(angle), p.y + floatY + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  p.pulse += 0.05;
  p.floatOffset += 0.02;
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 200, 60, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('SCORE', 20, 28);
  ctx.font = 'bold 26px Arial';
  ctx.fillStyle = '#7fffdd';
  ctx.fillText(score, 20, 56);
  ctx.restore();
  ctx.save();
  for (let i = 0; i < player.lives; i++) {
    ctx.fillStyle = '#ff4488';
    ctx.beginPath();
    ctx.arc(220 + i * 30, 35, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  const growTarget = 60;
  const progress = (player.size - 18) / (growTarget - 18);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(10, 80, 200, 20, 8);
  ctx.fill();
  const barGrad = ctx.createLinearGradient(10, 80, 210, 80);
  barGrad.addColorStop(0, '#4488ff');
  barGrad.addColorStop(1, '#ff8800');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(10, 80, Math.min(200 * progress, 200), 20, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '11px Arial';
  ctx.fillText('GROWTH', 15, 94);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(\`Eat \${planktonTarget} plankton to win!\`, canvas.width - 10, 25);
  ctx.fillText(\`Plankton eaten: \${Math.max(0, score)}\`, canvas.width - 10, 42);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / Arrow Keys or Mouse to swim • Eat plankton • Avoid sharks!', canvas.width / 2, canvas.height - 8);
  ctx.restore();
}

function drawScorePopups() {
  scorePopups.forEach((p, i) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.font = \`bold \${p.size}px Arial\`;
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
    p.y -= 1.5;
    p.life -= 0.025;
  });
  scorePopups = scorePopups.filter(p => p.life > 0);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.vx *= 0.97;
    p.vy *= 0.97;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawMenuScreen() {
  drawBackground();
  drawSeaweeds();
  drawBubbles();
  const t = frameCount * 0.02;
  drawFish(100 + Math.sin(t) * 40, 200 + Math.cos(t * 0.7) * 30, 20, Math.sign(Math.cos(t)) || 1, t * 5, '#4488ff', '#2255aa', '#4488ff', null);
  drawFish(750 + Math.sin(t + 2) * 50, 380 + Math.cos(t * 0.9) * 25, 16, -1, t * 4, '#ff4488', '#aa2266', '#4488ff', null);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 70px Arial';
  ctx.fillText('OCEAN FEAST', canvas.width / 2, 180);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('Eat plankton to grow — Avoid the sharks!', canvas.width / 2, 225);
  ctx.fillStyle = 'rgba(180,230,255,0.9)';
  ctx.font = '18px Arial';
  ctx.fillText('🎮 WASD / Arrow Keys or move your Mouse to swim', canvas.width / 2, 295);
  ctx.fillText('⭐ Eat glowing plankton to grow bigger and score points', canvas.width / 2, 325);
  ctx.fillText('🦈 Dodge the sharks — they\\'ll eat you alive!', canvas.width / 2, 355);
  ctx.fillText('🏆 Eat 80 plankton to win!', canvas.width / 2, 385);
  const pulse = Math.sin(frameCount * 0.06) * 0.15 + 1;
  ctx.save();
  ctx.translate(canvas.width / 2, 450);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#00ccff';
  ctx.shadowColor = '#00ccff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(-130, -25, 260, 50, 25);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#001030';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('CLICK TO PLAY', 0, 8);
  ctx.restore();
  ctx.restore();
}

function drawGameOverScreen() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ff4400';
  ctx.font = 'bold 72px Arial';
  ctx.fillText('GAME OVER', canvas.width / 2, 220);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(\`Final Score: \${score}\`, canvas.width / 2, 290);
  ctx.fillStyle = 'rgba(200,230,255,0.8)';
  ctx.font = '20px Arial';
  ctx.fillText('The sharks got you...', canvas.width / 2, 340);
  const pulse = Math.sin(frameCount * 0.08) * 0.1 + 1;
  ctx.save();
  ctx.translate(canvas.width / 2, 420);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ff4400';
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.roundRect(-130, -25, 260, 50, 25);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('TRY AGAIN', 0, 8);
  ctx.restore();
  ctx.restore();
}

function drawWinScreen() {
  confetti.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.rotSpeed;
    c.vx *= 0.99;
    if (c.y > canvas.height + 20) c.y = -20;
  });
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,30,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 72px Arial';
  ctx.fillText('YOU WIN! 🏆', canvas.width / 2, 200);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 30px Arial';
  ctx.fillText(\`Final Score: \${score}\`, canvas.width / 2, 270);
  ctx.fillStyle = '#7fffdd';
  ctx.font = '22px Arial';
  ctx.fillText('You grew into a magnificent fish!', canvas.width / 2, 320);
  ctx.fillText('The ocean is yours to rule! 🐟', canvas.width / 2, 355);
  const pulse = Math.sin(frameCount * 0.08) * 0.1 + 1;
  ctx.save();
  ctx.translate(canvas.width / 2, 430);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffdd00';
  ctx.shadowColor = '#ffdd00';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.roundRect(-130, -25, 260, 50, 25);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#001030';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('PLAY AGAIN', 0, 8);
  ctx.restore();
  ctx.restore();
}

function updatePlayer() {
  const speed = 3.5;
  let targetVx = 0, targetVy = 0;
  if (keys['KeyA'] || keys['ArrowLeft']) targetVx -= speed;
  if (keys['KeyD'] || keys['ArrowRight']) targetVx += speed;
  if (keys['KeyW'] || keys['ArrowUp']) targetVy -= speed;
  if (keys['KeyS'] || keys['ArrowDown']) targetVy += speed;
  if (targetVx === 0 && targetVy === 0) {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 15) {
      const s = Math.min(speed, dist * 0.06);
      targetVx = (dx / dist) * s;
      targetVy = (dy / dist) * s;
    }
  }
  player.vx += (targetVx - player.vx) * 0.15;
  player.vy += (targetVy - player.vy) * 0.15;
  player.x += player.vx;
  player.y += player.vy;
  const margin = player.size;
  player.x = Math.max(margin, Math.min(canvas.width - margin, player.x));
  player.y = Math.max(margin, Math.min(canvas.height - 70 - margin, player.y));
  if (Math.abs(player.vx) > 0.1) player.facing = player.vx > 0 ? 1 : -1;
  player.tailWag += 0.15 + Math.sqrt(player.vx * player.vx + player.vy * player.vy) * 0.05;
  player.trail.push({ x: player.x, y: player.y });
  if (player.trail.length > 12) player.trail.shift();
  if (player.invincible > 0) player.invincible--;
}

function updatePlankton() {
  planktonTimer++;
  if (planktonTimer > 60 && planktons.length < 30) {
    planktons.push(spawnPlankton());
    planktonTimer = 0;
  }
  planktons.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx += (Math.random() - 0.5) * 0.05;
    p.vy += (Math.random() - 0.5) * 0.05;
    p.vx = Math.max(-0.6, Math.min(0.6, p.vx));
    p.vy = Math.max(-0.6, Math.min(0.6, p.vy));
    if (p.x < 20 || p.x > canvas.width - 20) p.vx *= -1;
    if (p.y < 20 || p.y > canvas.height - 80) p.vy *= -1;
  });
  const eatRadius = player.size * 0.9;
  planktons = planktons.filter(p => {
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < eatRadius + p.size) {
      score += p.points;
      player.size = Math.min(60, player.size + 0.25);
      addParticle(p.x, p.y, p.glow, 8);
      scorePopups.push({
        x: p.x, y: p.y - 10, text: \`+\${p.points}\`,
        life: 1, size: 14 + p.points * 2, color: p.glow
      });
      if (score >= planktonTarget) {
        gameState = STATE.WIN;
        spawnConfetti();
      }
      return false;
    }
    return true;
  });
}

function updateSharks() {
  sharkSpawnTimer++;
  difficulty = Math.floor(score / 15);
  const maxSharks = Math.min(6, 2 + difficulty);
  if (sharkSpawnTimer > Math.max(180 - difficulty * 10, 80) && sharks.length < maxSharks) {
    sharks.push(createShark(difficulty));
    sharkSpawnTimer = 0;
  }
  sharks.forEach(shark => {
    shark.tailWag += 0.1;
    const dx = player.x - shark.x;
    const dy = player.y - shark.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const aggroRange = 200 + difficulty * 20;
    if (dist < aggroRange) {
      shark.aggro = true;
      shark.aggroTimer = 120;
    }
    if (shark.aggroTimer > 0) shark.aggroTimer--;
    else shark.aggro = false;
    if (shark.aggro) {
      const speed = shark.speed;
      shark.vx += (dx / dist) * speed * 0.08;
      shark.vy += (dy / dist) * speed * 0.08;
    } else {
      shark.vx += (Math.random() - 0.5) * 0.2;
      shark.vy += (Math.random() - 0.5) * 0.2;
    }
    const sv = Math.sqrt(shark.vx * shark.vx + shark.vy * shark.vy);
    const maxSpeed = shark.aggro ? shark.speed : shark.speed * 0.5;
    if (sv > maxSpeed) {
      shark.vx = (shark.vx / sv) * maxSpeed;
      shark.vy = (shark.vy / sv) * maxSpeed;
    }
    shark.x += shark.vx;
    shark.y += shark.vy;
    if (Math.abs(shark.vx) > 0.1) shark.facing = shark.vx > 0 ? 1 : -1;
    if (shark.x < -shark.size * 2) shark.x = canvas.width + shark.size;
    if (shark.x > canvas.width + shark.size * 2) shark.x = -shark.size;
    if (shark.y < -shark.size * 2) shark.y = canvas.height + shark.size;
    if (shark.y > canvas.height + shark.size * 2) shark.y = -shark.size;
    if (player.invincible <= 0 && dist < shark.size * 0.7 + player.size * 0.6) {
      player.lives--;
      player.invincible = 120;
      player.size = Math.max(18, player.size - 3);
      addParticle(player.x, player.y, '#ff4400', 15);
      scorePopups.push({
        x: player.x, y: player.y - 20, text: 'OUCH!',
        life: 1, size: 22, color: '#ff4400'
      });
      if (player.lives <= 0) gameState = STATE.GAMEOVER;
    }
  });
}

function gameLoop() {
  frameCount++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === STATE.MENU) {
    frameCount++;
    drawMenuScreen();
  } else if (gameState === STATE.PLAYING) {
    drawBackground();
    drawSeaweeds();
    drawBubbles();
    planktons.forEach(drawPlankton);
    sharks.forEach(drawShark);
    drawPlayerFish();
    drawParticles();
    drawScorePopups();
    drawHUD();
  } else if (gameState === STATE.GAMEOVER) {
    drawBackground();
    drawSeaweeds();
    drawBubbles();
    drawGameOverScreen();
  } else if (gameState === STATE.WIN) {
    drawBackground();
    drawSeaweeds();
    drawBubbles();
    drawWinScreen();
  }
  if (gameState === STATE.PLAYING) {
    updatePlayer();
    updatePlankton();
    updateSharks();
  }
  requestAnimationFrame(gameLoop);
}

initBubbles();
initSeaweeds();
gameLoop();
</script>
</body>
</html>`,

  breakout: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Breakout Blitz</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a1a; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
  #gameContainer { position: relative; }
  canvas { display: block; border: 2px solid #334; border-radius: 4px; box-shadow: 0 0 40px rgba(80,120,255,0.3); }
</style>
</head>
<body>
<div id="gameContainer">
  <canvas id="gameCanvas"></canvas>
</div>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 620;

const W = canvas.width;
const H = canvas.height;

const STATE_START = 'start';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';
const STATE_GAMEOVER = 'gameover';
const STATE_WIN = 'win';

let gameState = STATE_START;
let score = 0;
let lives = 3;
let level = 1;
let highScore = 0;
let animFrame;

let particles = [];
let confetti = [];
let stars = [];

const paddle = {
  width: 90, height: 12, x: W / 2 - 45, y: H - 40,
  speed: 7, color: '#5af', dx: 0
};

const ball = {
  x: W / 2, y: H - 60, radius: 8, dx: 4, dy: -4, speed: 5,
  attached: true, trail: []
};

const BRICK_ROWS = 7;
const BRICK_COLS = 10;
const BRICK_W = 42;
const BRICK_H = 18;
const BRICK_PAD = 4;
const BRICK_OFFSET_X = 15;
const BRICK_OFFSET_Y = 60;

let bricks = [];

const BRICK_COLORS = [
  { fill: '#ff4466', stroke: '#ff8899', pts: 7 },
  { fill: '#ff7733', stroke: '#ffaa66', pts: 6 },
  { fill: '#ffcc00', stroke: '#ffe066', pts: 5 },
  { fill: '#44dd55', stroke: '#88ee88', pts: 4 },
  { fill: '#22bbff', stroke: '#77ddff', pts: 3 },
  { fill: '#8844ff', stroke: '#bb88ff', pts: 2 },
  { fill: '#ff44cc', stroke: '#ff88ee', pts: 1 }
];

let powerUps = [];
const PU_TYPES = ['wide', 'fast', 'slow', 'life', 'multi'];
let extraBalls = [];

const keys = {};
let mouseX = W / 2;
let usingMouse = false;

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleAction(); }
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.preventDefault();
  if (e.code === 'KeyP') {
    if (gameState === STATE_PLAYING) gameState = STATE_PAUSED;
    else if (gameState === STATE_PAUSED) gameState = STATE_PLAYING;
  }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  usingMouse = true;
});
canvas.addEventListener('click', () => handleAction());
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  mouseX = e.touches[0].clientX - rect.left;
  usingMouse = true;
}, { passive: false });
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  mouseX = e.touches[0].clientX - rect.left;
  usingMouse = true;
  handleAction();
}, { passive: false });

function handleAction() {
  if (gameState === STATE_START) startGame();
  else if (gameState === STATE_PLAYING) { if (ball.attached) launchBall(); }
  else if (gameState === STATE_GAMEOVER || gameState === STATE_WIN) {
    resetAll();
    gameState = STATE_START;
  }
}

function initStars() {
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3, alpha: Math.random(),
      speed: Math.random() * 0.3 + 0.1
    });
  }
}

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const colorIdx = r % BRICK_COLORS.length;
      const hp = (r < 2) ? 2 : 1;
      bricks.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD),
        w: BRICK_W, h: BRICK_H, hp, maxHp: hp, colorIdx, alive: true, shake: 0
      });
    }
  }
}

function startGame() {
  score = 0; lives = 3; level = 1;
  particles = []; confetti = []; powerUps = []; extraBalls = [];
  initBricks();
  resetBall();
  paddle.width = 90;
  gameState = STATE_PLAYING;
}

function resetBall() {
  ball.x = paddle.x + paddle.width / 2;
  ball.y = paddle.y - ball.radius - 2;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
  ball.dx = Math.cos(angle) * ball.speed;
  ball.dy = Math.sin(angle) * ball.speed;
  ball.attached = true;
  ball.trail = [];
  extraBalls = [];
}

function launchBall() {
  if (!ball.attached) return;
  ball.attached = false;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
  ball.dx = Math.cos(angle) * ball.speed;
  ball.dy = Math.sin(angle) * ball.speed;
}

function resetAll() {
  particles = []; confetti = []; powerUps = []; extraBalls = [];
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed,
      r: Math.random() * 4 + 2, alpha: 1, color, life: 1
    });
  }
}

function spawnConfetti() {
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * W, y: -10 - Math.random() * 50,
      dx: (Math.random() - 0.5) * 3, dy: Math.random() * 3 + 1,
      r: Math.random() * 6 + 3,
      color: \`hsl(\${Math.random() * 360},90%,60%)\`,
      rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 1, shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }
}

function spawnPowerUp(x, y) {
  if (Math.random() > 0.25) return;
  const type = PU_TYPES[Math.floor(Math.random() * PU_TYPES.length)];
  powerUps.push({ x: x - 15, y, w: 30, h: 14, dy: 1.5, type, alpha: 1 });
}

function applyPowerUp(type) {
  if (type === 'wide') {
    paddle.width = Math.min(paddle.width + 30, 160);
    setTimeout(() => { paddle.width = Math.max(paddle.width - 30, 60); }, 8000);
  } else if (type === 'slow') {
    const factor = 0.7;
    ball.dx *= factor; ball.dy *= factor;
    extraBalls.forEach(b => { b.dx *= factor; b.dy *= factor; });
    setTimeout(() => {
      const inv = 1 / factor;
      ball.dx *= inv; ball.dy *= inv;
      extraBalls.forEach(b => { b.dx *= inv; b.dy *= inv; });
    }, 6000);
  } else if (type === 'fast') spawnParticles(W/2, H/2, '#ff4', 10);
  else if (type === 'life') lives = Math.min(lives + 1, 5);
  else if (type === 'multi') {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = ball.speed;
      extraBalls.push({
        x: ball.x, y: ball.y, dx: Math.cos(angle) * spd, dy: Math.sin(angle) * spd,
        radius: ball.radius, trail: []
      });
    }
  }
}

function PU_COLOR(type) {
  const map = { wide: '#22ffcc', fast: '#ff6622', slow: '#6688ff', life: '#ff4488', multi: '#ffdd22' };
  return map[type] || '#fff';
}
function PU_LABEL(type) {
  const map = { wide: 'WIDE', fast: 'FAST', slow: 'SLOW', life: '+1UP', multi: 'MULTI' };
  return map[type] || '?';
}

function movePaddle() {
  if (usingMouse) paddle.x = mouseX - paddle.width / 2;
  else {
    if (keys['ArrowLeft']) paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;
  }
  paddle.x = Math.max(0, Math.min(W - paddle.width, paddle.x));
  if (ball.attached) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius - 2;
  }
}

function moveBallObj(b) {
  b.trail.push({ x: b.x, y: b.y });
  if (b.trail.length > 10) b.trail.shift();
  b.x += b.dx; b.y += b.dy;
}

function collideBallWalls(b) {
  if (b.x - b.radius < 0) { b.x = b.radius; b.dx = Math.abs(b.dx); }
  if (b.x + b.radius > W) { b.x = W - b.radius; b.dx = -Math.abs(b.dx); }
  if (b.y - b.radius < 0) { b.y = b.radius; b.dy = Math.abs(b.dy); }
}

function collideBallPaddle(b) {
  if (b.dy > 0 && b.x + b.radius > paddle.x && b.x - b.radius < paddle.x + paddle.width &&
      b.y + b.radius > paddle.y && b.y - b.radius < paddle.y + paddle.height) {
    b.y = paddle.y - b.radius;
    const hitX = (b.x - paddle.x) / paddle.width;
    const angle = (hitX - 0.5) * Math.PI * 0.75;
    const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
    b.dx = Math.sin(angle) * spd;
    b.dy = -Math.abs(Math.cos(angle) * spd);
    spawnParticles(b.x, b.y, '#5af', 5);
  }
}

function collideBallBricks(b) {
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (!brick.alive) continue;
    const bx = brick.x, by = brick.y, bw = brick.w, bh = brick.h;
    if (b.x + b.radius > bx && b.x - b.radius < bx + bw &&
        b.y + b.radius > by && b.y - b.radius < by + bh) {
      const overlapLeft = (b.x + b.radius) - bx;
      const overlapRight = (bx + bw) - (b.x - b.radius);
      const overlapTop = (b.y + b.radius) - by;
      const overlapBottom = (by + bh) - (b.y - b.radius);
      const minH = Math.min(overlapLeft, overlapRight);
      const minV = Math.min(overlapTop, overlapBottom);
      if (minH < minV) b.dx = -b.dx;
      else b.dy = -b.dy;
      brick.hp--;
      brick.shake = 5;
      const col = BRICK_COLORS[brick.colorIdx];
      if (brick.hp <= 0) {
        brick.alive = false;
        score += col.pts * 10 * level;
        spawnParticles(bx + bw / 2, by + bh / 2, col.fill, 12);
        spawnPowerUp(bx + bw / 2, by + bh / 2);
      } else spawnParticles(bx + bw / 2, by + bh / 2, col.fill, 5);
      break;
    }
  }
}

function updateParticles() {
  particles = particles.filter(p => p.alpha > 0.01);
  particles.forEach(p => {
    p.x += p.dx; p.y += p.dy; p.dy += 0.08; p.alpha -= 0.025; p.r *= 0.97;
  });
}

function updateConfetti() {
  confetti.forEach(c => {
    c.x += c.dx; c.y += c.dy; c.rot += c.rotSpeed; c.dy += 0.02;
    if (c.y > H + 20) { c.y = -10; c.x = Math.random() * W; c.dy = Math.random() * 3 + 1; }
  });
}

function updatePowerUps() {
  powerUps = powerUps.filter(p => p.y < H + 20 && p.alpha > 0.01);
  powerUps.forEach(p => {
    p.y += p.dy;
    if (p.y + p.h > paddle.y && p.x + p.w > paddle.x && p.x < paddle.x + paddle.width && p.y < paddle.y + paddle.height) {
      applyPowerUp(p.type);
      spawnParticles(p.x + p.w/2, p.y, PU_COLOR(p.type), 15);
      p.alpha = 0;
    }
  });
}

function checkWin() { return bricks.every(b => !b.alive); }
function checkLost(b) { return b.y - b.radius > H; }

function update() {
  if (gameState !== STATE_PLAYING) return;
  stars.forEach(s => {
    s.y += s.speed; if (s.y > H) s.y = 0;
    s.alpha = 0.3 + Math.sin(Date.now() * 0.002 + s.x) * 0.2;
  });
  movePaddle();
  if (!ball.attached) {
    moveBallObj(ball);
    collideBallWalls(ball);
    collideBallPaddle(ball);
    collideBallBricks(ball);
    for (let i = extraBalls.length - 1; i >= 0; i--) {
      const eb = extraBalls[i];
      moveBallObj(eb);
      collideBallWalls(eb);
      collideBallPaddle(eb);
      collideBallBricks(eb);
      if (checkLost(eb)) extraBalls.splice(i, 1);
    }
    if (checkLost(ball)) {
      lives--;
      spawnParticles(ball.x, H - 20, '#f44', 20);
      if (lives <= 0) {
        if (score > highScore) highScore = score;
        gameState = STATE_GAMEOVER;
      } else resetBall();
    }
  }
  updatePowerUps();
  updateParticles();
  if (gameState === STATE_WIN) updateConfetti();
  bricks.forEach(b => { if (b.shake > 0) b.shake--; });
  if (checkWin()) {
    if (score > highScore) highScore = score;
    gameState = STATE_WIN;
    spawnConfetti();
  }
}

function drawStars() {
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2a');
  grad.addColorStop(1, '#050510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  drawStars();
}

function drawPaddle() {
  const px = paddle.x, py = paddle.y, pw = paddle.width, ph = paddle.height;
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#5af';
  const grad = ctx.createLinearGradient(px, py, px, py + ph);
  grad.addColorStop(0, '#88ccff');
  grad.addColorStop(1, '#2266bb');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 6);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.roundRect(px + 4, py + 2, pw - 8, 4, 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawBallObj(b) {
  for (let i = 0; i < b.trail.length; i++) {
    const t = b.trail[i];
    const alpha = (i / b.trail.length) * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#aaddff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, b.radius * (i / b.trail.length), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#aaddff';
  const grad = ctx.createRadialGradient(b.x - 2, b.y - 2, 1, b.x, b.y, b.radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#aaddff');
  grad.addColorStop(1, '#4488cc');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function lighten(hex, amt) {
  let num = parseInt(hex.slice(1), 16);
  let r = Math.min(255, (num >> 16) + amt);
  let g = Math.min(255, ((num >> 8) & 0xff) + amt);
  let b = Math.min(255, (num & 0xff) + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

function drawBricks() {
  bricks.forEach(brick => {
    if (!brick.alive) return;
    const col = BRICK_COLORS[brick.colorIdx];
    const sx = brick.shake > 0 ? (Math.random() - 0.5) * 3 : 0;
    const sy = brick.shake > 0 ? (Math.random() - 0.5) * 3 : 0;
    const x = brick.x + sx, y = brick.y + sy;
    const ratio = brick.hp / brick.maxHp;
    ctx.shadowBlur = 8;
    ctx.shadowColor = col.fill;
    const grad = ctx.createLinearGradient(x, y, x, y + brick.h);
    grad.addColorStop(0, lighten(col.fill, 30));
    grad.addColorStop(1, col.fill);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, brick.w, brick.h, 3);
    ctx.fill();
    if (ratio < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(x, y, brick.w, brick.h, 3);
      ctx.fill();
    }
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, brick.w, brick.h, 3);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 2, brick.w - 6, 4, 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawConfetti() {
  confetti.forEach(c => {
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.fillStyle = c.color;
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    if (c.shape === 'rect') ctx.fillRect(-c.r / 2, -c.r / 2, c.r, c.r * 0.5);
    else { ctx.beginPath(); ctx.arc(0, 0, c.r / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });
}

function drawPowerUps() {
  powerUps.forEach(p => {
    if (p.alpha <= 0) return;
    ctx.globalAlpha = p.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = PU_COLOR(p.type);
    ctx.fillStyle = PU_COLOR(p.type);
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 4);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.w, p.h, 4);
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 8px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(PU_LABEL(p.type), p.x + p.w / 2, p.y + p.h / 2);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  });
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Segoe UI';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', 15, 10);
  ctx.fillStyle = '#5af';
  ctx.font = 'bold 20px Segoe UI';
  ctx.fillText(score, 15, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL ' + level, W / 2, 10);
  ctx.textAlign = 'right';
  ctx.fillText('BEST', W - 15, 10);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px Segoe UI';
  ctx.fillText(highScore, W - 15, 28);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4488';
  ctx.font = '14px Segoe UI';
  for (let i = 0; i < lives; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 - (lives - 1) * 10 + i * 20, 55, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff4488';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (ball.attached && gameState === STATE_PLAYING) {
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    ctx.fillStyle = '#fff';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Press SPACE or click to launch', W / 2, H - 20);
    ctx.globalAlpha = 1;
  }
}

function drawOverlay(title, subtitle, sub2, color) {
  ctx.fillStyle = 'rgba(0,0,10,0.75)';
  ctx.fillRect(0, 0, W, H);
  const pw = 340, ph = 220;
  const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  ctx.fillStyle = 'rgba(10,10,40,0.95)';
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 16);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold 40px Segoe UI';
  ctx.fillText(title, W / 2, py + 60);
  ctx.fillStyle = '#cde';
  ctx.font = '18px Segoe UI';
  ctx.fillText(subtitle, W / 2, py + 110);
  if (sub2) {
    ctx.fillStyle = '#88aacc';
    ctx.font = '14px Segoe UI';
    ctx.fillText(sub2, W / 2, py + 140);
  }
  ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  ctx.fillStyle = '#fff';
  ctx.font = '16px Segoe UI';
  ctx.fillText('Click or press SPACE to continue', W / 2, py + 185);
  ctx.globalAlpha = 1;
}

function drawStartScreen() {
  ctx.fillStyle = 'rgba(0,0,10,0.6)';
  ctx.fillRect(0, 0, W, H);
  const pw = 380, ph = 280;
  const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
  ctx.fillStyle = 'rgba(10,10,40,0.95)';
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 16);
  ctx.fill();
  ctx.strokeStyle = '#5af';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#5af';
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 16);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5af';
  ctx.font = 'bold 48px Segoe UI';
  ctx.fillText('BREAKOUT', W / 2, py + 55);
  ctx.fillStyle = '#ff4488';
  ctx.font = 'bold 24px Segoe UI';
  ctx.fillText('BLITZ', W / 2, py + 95);
  ctx.fillStyle = '#aabbcc';
  ctx.font = '14px Segoe UI';
  ctx.fillText('← → or Mouse to move paddle', W / 2, py + 140);
  ctx.fillText('SPACE / Click to launch ball', W / 2, py + 162);
  ctx.fillText('P to pause', W / 2, py + 184);
  if (highScore > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px Segoe UI';
    ctx.fillText('Best: ' + highScore, W / 2, py + 215);
  }
  ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Segoe UI';
  ctx.fillText('Click or press SPACE to Start', W / 2, py + 248);
  ctx.globalAlpha = 1;
}

function drawPausedScreen() {
  ctx.fillStyle = 'rgba(0,0,10,0.6)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px Segoe UI';
  ctx.fillText('PAUSED', W / 2, H / 2);
  ctx.font = '16px Segoe UI';
  ctx.fillStyle = '#aab';
  ctx.fillText('Press P to resume', W / 2, H / 2 + 40);
}

function draw() {
  drawBackground();
  if (gameState === STATE_WIN) drawConfetti();
  drawBricks();
  drawPowerUps();
  drawParticles();
  if (gameState !== STATE_START) {
    drawPaddle();
    drawBallObj(ball);
    extraBalls.forEach(b => drawBallObj(b));
  }
  drawHUD();
  if (gameState === STATE_START) drawStartScreen();
  else if (gameState === STATE_PAUSED) drawPausedScreen();
  else if (gameState === STATE_GAMEOVER) drawOverlay('GAME OVER', 'Score: ' + score, 'Best: ' + highScore, '#ff4455');
  else if (gameState === STATE_WIN) {
    updateConfetti();
    drawOverlay('YOU WIN!', 'Score: ' + score, 'New Best: ' + highScore, '#44ff88');
  }
}

function gameLoop() {
  update();
  draw();
  animFrame = requestAnimationFrame(gameLoop);
}

initStars();
initBricks();
resetBall();
gameLoop();

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}
</script>
</body>
</html>`,

  racing: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Speed Rush - Racing Game</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
  }
  canvas {
    display: block;
    image-rendering: pixelated;
  }
</style>
</head>
<body>
<canvas id="gameCanvas"></canvas>
<script>
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 480;
canvas.height = 700;

// Game states
const STATE = { MENU: 'menu', PLAYING: 'playing', GAMEOVER: 'gameover', WIN: 'win' };
let gameState = STATE.MENU;

// Game variables
let score = 0;
let highScore = 0;
let speed = 4;
let frameCount = 0;
let lives = 3;
let invincible = 0;
let lastTime = 0;
let animationId;

// Track
const ROAD_LEFT = 80;
const ROAD_RIGHT = 400;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const LANE_COUNT = 4;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

function getLaneX(lane) {
  return ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
}

// Road markings
let roadLines = [];
for (let i = 0; i < 15; i++) {
  roadLines.push({ y: i * 60 });
}

// Particles
let particles = [];
let confetti = [];

// Car (player)
let player = {
  x: getLaneX(1),
  targetX: getLaneX(1),
  y: 560,
  width: 38,
  height: 65,
  lane: 1,
  moving: false
};

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 60;

// Coins
let coins = [];
let coinTimer = 0;

// Background scenery
let scenery = [];
for (let i = 0; i < 10; i++) {
  scenery.push({
    x: Math.random() < 0.5 ? Math.random() * 70 : ROAD_RIGHT + Math.random() * 70,
    y: Math.random() * canvas.height,
    type: Math.floor(Math.random() * 3),
    scale: 0.5 + Math.random() * 0.8
  });
}

// Input
let keys = {};
let keyPressed = {};

document.addEventListener('keydown', (e) => {
  if (!keys[e.code]) {
    keyPressed[e.code] = true;
  }
  keys[e.code] = true;
  e.preventDefault();
});
document.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Touch controls
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 30) {
    if (dx > 0 && player.lane < LANE_COUNT - 1) moveLane(1);
    else if (dx < 0 && player.lane > 0) moveLane(-1);
  }
  touchStartX = null;
});

function moveLane(dir) {
  let newLane = player.lane + dir;
  if (newLane >= 0 && newLane < LANE_COUNT) {
    player.lane = newLane;
    player.targetX = getLaneX(newLane);
    player.moving = true;
  }
}

function spawnObstacle() {
  let usedLanes = new Set();
  let occupied = obstacles.filter(o => o.y < -o.height && o.y > -200);
  occupied.forEach(o => usedLanes.add(o.lane));

  let availableLanes = [];
  for (let i = 0; i < LANE_COUNT; i++) {
    availableLanes.push(i);
  }
  for (let i = availableLanes.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]];
  }

  let count = Math.random() < 0.4 ? 2 : 1;
  if (speed > 10) count = Math.random() < 0.5 ? 2 : 1;

  let chosenLanes = availableLanes.slice(0, Math.min(count, LANE_COUNT - 1));
  let types = ['car', 'truck', 'cone', 'oil'];

  chosenLanes.forEach(lane => {
    let type = types[Math.floor(Math.random() * types.length)];
    let h = type === 'truck' ? 90 : (type === 'cone' ? 35 : (type === 'oil' ? 40 : 65));
    let w = type === 'truck' ? 42 : (type === 'cone' ? 30 : (type === 'oil' ? 40 : 36));
    obstacles.push({
      lane,
      x: getLaneX(lane),
      y: -h - 20,
      width: w,
      height: h,
      type,
      color: type === 'car' ? randomCarColor() : (type === 'truck' ? '#e74c3c' : '#f39c12'),
      speed: speed * (0.8 + Math.random() * 0.4)
    });
  });
}

function randomCarColor() {
  const colors = ['#e74c3c','#3498db','#2ecc71','#9b59b6','#f39c12','#1abc9c','#e67e22'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnCoin() {
  let lane = Math.floor(Math.random() * LANE_COUNT);
  coins.push({
    lane,
    x: getLaneX(lane),
    y: -20,
    radius: 12,
    spin: 0,
    collected: false
  });
}

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 2,
      life: 1,
      decay: 0.04 + Math.random() * 0.04,
      size: 3 + Math.random() * 5,
      color
    });
  }
}

function checkCollision(a, b) {
  return Math.abs(a.x - b.x) < (a.width / 2 + b.width / 2) * 0.75 &&
         Math.abs(a.y - b.y) < (a.height / 2 + b.height / 2) * 0.75;
}

function checkCoinCollision(coin) {
  return Math.abs(player.x - coin.x) < (player.width / 2 + coin.radius) &&
         Math.abs(player.y - coin.y) < (player.height / 2 + coin.radius);
}

function drawBackground() {
  let sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#1a1a2e');
  sky.addColorStop(1, '#16213e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, ROAD_LEFT, canvas.height);
  ctx.fillRect(ROAD_RIGHT, 0, canvas.width - ROAD_RIGHT, canvas.height);

  ctx.strokeStyle = '#1f4a1f';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    let gx = 10 + i * 13;
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    let gx = ROAD_RIGHT + 10 + i * 13;
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, canvas.height);
    ctx.stroke();
  }

  let roadGrad = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_RIGHT, 0);
  roadGrad.addColorStop(0, '#2c2c2c');
  roadGrad.addColorStop(0.5, '#333333');
  roadGrad.addColorStop(1, '#2c2c2c');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, canvas.height);

  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(ROAD_LEFT, 0, 5, canvas.height);
  ctx.fillRect(ROAD_RIGHT - 5, 0, 5, canvas.height);

  ctx.fillStyle = '#ffffff';
  for (let lane = 1; lane < LANE_COUNT; lane++) {
    let lx = ROAD_LEFT + lane * LANE_WIDTH;
    roadLines.forEach(line => {
      ctx.fillRect(lx - 2, line.y, 4, 30);
    });
  }

  scenery.forEach(s => drawScenery(s));
}

function drawScenery(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.scale(s.scale, s.scale);
  if (s.type === 0) {
    ctx.fillStyle = '#2d4a1e';
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(-20, 10);
    ctx.lineTo(20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a3a0a';
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(-15, -10);
    ctx.lineTo(15, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-5, 10, 10, 20);
  } else if (s.type === 1) {
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(-15, -50, 30, 60);
    ctx.fillStyle = '#f1c40f';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        if (Math.random() > 0.3) {
          ctx.fillRect(-10 + j * 14, -45 + i * 16, 8, 10);
        }
      }
    }
  } else {
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, 3, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-10, 4, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCar(x, y, w, h, color, isPlayer, invTimer) {
  ctx.save();
  ctx.translate(x, y);
  if (isPlayer) {
    if (invTimer > 0 && Math.floor(invTimer / 5) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 20;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w/2, -h/2, w, h, 6);
  ctx.fill();
  ctx.fillStyle = isPlayer ? '#1a6aa8' : shadeColor(color, -30);
  ctx.beginPath();
  ctx.roundRect(-w/2 + 4, -h/2 + 10, w - 8, h * 0.4, 4);
  ctx.fill();
  ctx.fillStyle = isPlayer ? 'rgba(150,220,255,0.8)' : 'rgba(150,220,255,0.5)';
  ctx.beginPath();
  ctx.roundRect(-w/2 + 6, -h/2 + 12, w - 12, 16, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,220,255,0.5)';
  ctx.beginPath();
  ctx.roundRect(-w/2 + 6, -h/2 + 30, w - 12, 12, 3);
  ctx.fill();
  ctx.fillStyle = isPlayer ? '#fff9c4' : '#ffdddd';
  ctx.shadowBlur = isPlayer ? 15 : 8;
  ctx.shadowColor = isPlayer ? '#ffff00' : '#ffaaaa';
  ctx.beginPath();
  ctx.ellipse(-w/2 + 6, -h/2 + 6, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w/2 - 6, -h/2 + 6, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 8;
  ctx.fillStyle = isPlayer ? '#ff4444' : '#aa3333';
  ctx.shadowColor = '#ff0000';
  ctx.beginPath();
  ctx.ellipse(-w/2 + 5, h/2 - 6, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w/2 - 5, h/2 - 6, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, -h/4, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, -h/4, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, h/4, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, h/4, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, -h/4, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, -h/4, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, h/4, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, h/4, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  if (isPlayer) {
    let flameH = 15 + Math.sin(frameCount * 0.3) * 5;
    let grad = ctx.createLinearGradient(0, h/2, 0, h/2 + flameH);
    grad.addColorStop(0, '#ff8800');
    grad.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff4400';
    ctx.beginPath();
    ctx.moveTo(-8, h/2);
    ctx.lineTo(0, h/2 + flameH);
    ctx.lineTo(8, h/2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, h/2);
    ctx.lineTo(0, h/2 + flameH * 0.7);
    ctx.lineTo(5, h/2);
    ctx.closePath();
    ctx.fillStyle = '#ffff00';
    ctx.fill();
  }
  ctx.restore();
}

function drawTruck(x, y, w, h, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w/2, -h/2, w, h, 4);
  ctx.fill();
  ctx.fillStyle = shadeColor(color, -20);
  ctx.beginPath();
  ctx.roundRect(-w/2 + 3, -h/2 + 5, w - 6, 25, 3);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,220,255,0.6)';
  ctx.beginPath();
  ctx.roundRect(-w/2 + 5, -h/2 + 7, w - 10, 14, 2);
  ctx.fill();
  ctx.fillStyle = '#ffd700';
  ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
  ctx.beginPath(); ctx.ellipse(-w/2 + 5, -h/2 + 5, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 - 5, -h/2 + 5, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, -h/3, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, -h/3, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, h/3, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, h/3, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, -h/3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, -h/3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-w/2 - 3, h/3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w/2 + 3, h/3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCone(x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff8800';
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.moveTo(0, -h/2);
  ctx.lineTo(-w/2, h/2);
  ctx.lineTo(w/2, h/2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillRect(-w/2 + 4, -2, w - 8, 5);
  ctx.fillRect(-w/2 + 8, -h/2 + 14, w - 16, 4);
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(-w/2 - 3, h/2 - 5, w + 6, 5);
  ctx.restore();
}

function drawOil(x, y, w, h) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#8800ff';
  ctx.fillStyle = 'rgba(80,0,120,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
  ctx.fill();
  let oilGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w/2);
  oilGrad.addColorStop(0, 'rgba(255,0,255,0.4)');
  oilGrad.addColorStop(0.4, 'rgba(0,200,255,0.3)');
  oilGrad.addColorStop(0.8, 'rgba(0,255,100,0.2)');
  oilGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = oilGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, w/2, h/2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoin(coin) {
  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#f1c40f';
  let scaleX = Math.abs(Math.cos(coin.spin));
  ctx.scale(scaleX, 1);
  ctx.beginPath();
  ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
  let grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, coin.radius);
  grad.addColorStop(0, '#ffd700');
  grad.addColorStop(0.6, '#f1c40f');
  grad.addColorStop(1, '#b8860b');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0);
  ctx.restore();
}

function shadeColor(hex, percent) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, Math.min(255, r + percent));
  g = Math.max(0, Math.min(255, g + percent));
  b = Math.max(0, Math.min(255, b + percent));
  return '#' + [r,g,b].map(c => c.toString(16).padStart(2,'0')).join('');
}

function drawUI() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 150, 80, 10);
  ctx.fill();
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 20, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(score, 20, 55);
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '11px Arial';
  ctx.fillText('BEST: ' + highScore, 20, 80);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 160, 10, 150, 80, 10);
  ctx.fill();
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('SPEED', canvas.width - 20, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText(Math.floor(speed * 25) + ' km/h', canvas.width - 20, 55);
  let maxSpeed = 25;
  let speedPct = Math.min((speed - 4) / (maxSpeed - 4), 1);
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.roundRect(canvas.width - 155, 62, 135, 10, 5);
  ctx.fill();
  let barGrad = ctx.createLinearGradient(canvas.width - 155, 0, canvas.width - 20, 0);
  barGrad.addColorStop(0, '#2ecc71');
  barGrad.addColorStop(0.5, '#f39c12');
  barGrad.addColorStop(1, '#e74c3c');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(canvas.width - 155, 62, 135 * speedPct, 10, 5);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lives ? '#e74c3c' : '#444';
    ctx.shadowBlur = i < lives ? 8 : 0;
    ctx.shadowColor = '#e74c3c';
    drawHeart(canvas.width / 2 - 35 + i * 35, 30);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('← → Arrow Keys to Move', canvas.width / 2, canvas.height - 10);
}

function drawHeart(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.8, 0.8);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-15, -10, -25, 0, -15, 12);
  ctx.lineTo(0, 25);
  ctx.lineTo(15, 12);
  ctx.bezierCurveTo(25, 0, 15, -10, 0, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMenu() {
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(1, '#0d1a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, canvas.height);
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, ROAD_LEFT, canvas.height);
  ctx.fillRect(ROAD_RIGHT, 0, canvas.width - ROAD_RIGHT, canvas.height);
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#00aaff';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SPEED', canvas.width / 2, 180);
  ctx.fillStyle = '#f1c40f';
  ctx.shadowColor = '#f1c40f';
  ctx.fillText('RUSH', canvas.width / 2, 245);
  ctx.restore();
  drawCar(canvas.width/2, 350, 38, 65, '#3498db', false, 0);
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#2ecc71';
  let btnGrad = ctx.createLinearGradient(canvas.width/2 - 90, 420, canvas.width/2 + 90, 460);
  btnGrad.addColorStop(0, '#27ae60');
  btnGrad.addColorStop(1, '#2ecc71');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(canvas.width/2 - 90, 420, 180, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PLAY NOW', canvas.width/2, 452);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('← → Arrow Keys to Change Lanes', canvas.width/2, 510);
  ctx.fillText('Dodge obstacles and collect coins!', canvas.width/2, 535);
  ctx.fillText('Speed increases over time', canvas.width/2, 560);
  if (highScore > 0) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Best Score: ' + highScore, canvas.width/2, 600);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '12px Arial';
  ctx.fillText('Press SPACE or ENTER or Click to Start', canvas.width/2, canvas.height - 20);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#e74c3c';
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 52px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width/2, 250);
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Score: ' + score, canvas.width/2, 310);
  if (score >= highScore) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🏆 NEW HIGH SCORE!', canvas.width/2, 345);
  } else {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.fillText('Best: ' + highScore, canvas.width/2, 345);
  }
  ctx.save();
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#3498db';
  let btnGrad = ctx.createLinearGradient(canvas.width/2 - 90, 390, canvas.width/2 + 90, 430);
  btnGrad.addColorStop(0, '#2980b9');
  btnGrad.addColorStop(1, '#3498db');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(canvas.width/2 - 90, 390, 180, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('PLAY AGAIN', canvas.width/2, 422);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Arial';
  ctx.fillText('Press SPACE or Click to Restart', canvas.width/2, 470);
}

function resetGame() {
  score = 0;
  speed = 4;
  frameCount = 0;
  lives = 3;
  invincible = 0;
  obstacles = [];
  coins = [];
  particles = [];
  obstacleTimer = 0;
  obstacleInterval = 60;
  player.lane = 1;
  player.x = getLaneX(1);
  player.targetX = getLaneX(1);
  player.moving = false;
  gameState = STATE.PLAYING;
}

function update(dt) {
  frameCount++;
  roadLines.forEach(line => {
    line.y += speed;
    if (line.y > canvas.height) line.y -= 15 * 60;
  });
  scenery.forEach(s => {
    s.y += speed * 0.6;
    if (s.y > canvas.height + 80) {
      s.y = -80;
      s.x = Math.random() < 0.5 ? Math.random() * 60 : ROAD_RIGHT + Math.random() * 60;
      s.type = Math.floor(Math.random() * 3);
      s.scale = 0.5 + Math.random() * 0.8;
    }
  });
  if (keyPressed['ArrowLeft'] || keyPressed['KeyA']) {
    if (player.lane > 0) moveLane(-1);
  }
  if (keyPressed['ArrowRight'] || keyPressed['KeyD']) {
    if (player.lane < LANE_COUNT - 1) moveLane(1);
  }
  keyPressed = {};
  let dx = player.targetX - player.x;
  player.x += dx * 0.2;
  if (Math.abs(dx) < 0.5) {
    player.x = player.targetX;
    player.moving = false;
  }
  speed = Math.min(4 + frameCount * 0.003, 25);
  obstacleTimer++;
  obstacleInterval = Math.max(25, 60 - speed * 1.5);
  if (obstacleTimer >= obstacleInterval) {
    obstacleTimer = 0;
    spawnObstacle();
  }
  coinTimer++;
  if (coinTimer >= 90) {
    coinTimer = 0;
    if (Math.random() < 0.7) spawnCoin();
  }
  obstacles = obstacles.filter(o => o.y < canvas.height + 200);
  obstacles.forEach(o => {
    o.y += speed + 1;
    if (invincible <= 0 && checkCollision(
      { x: player.x, y: player.y, width: player.width, height: player.height },
      { x: o.x, y: o.y, width: o.width, height: o.height }
    )) {
      lives--;
      invincible = 90;
      createParticles(player.x, player.y, '#e74c3c', 20);
      if (lives <= 0) {
        if (score > highScore) highScore = score;
        gameState = STATE.GAMEOVER;
      }
    }
  });
  if (invincible > 0) invincible--;
  coins = coins.filter(c => !c.collected && c.y < canvas.height + 30);
  coins.forEach(c => {
    c.y += speed * 0.9;
    c.spin += 0.1;
    if (!c.collected && checkCoinCollision(c)) {
      c.collected = true;
      score += 10;
      createParticles(c.x, c.y, '#f1c40f', 10);
    }
  });
  if (frameCount % 30 === 0) score++;
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= p.decay;
    p.vx *= 0.95;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === STATE.MENU) {
    drawMenu();
    return;
  }
  if (gameState === STATE.PLAYING || gameState === STATE.GAMEOVER) {
    drawBackground();
    coins.forEach(c => {
      if (!c.collected) drawCoin(c);
    });
    obstacles.forEach(o => {
      if (o.type === 'truck') drawTruck(o.x, o.y, o.width, o.height, o.color);
      else if (o.type === 'cone') drawCone(o.x, o.y, o.width, o.height);
      else if (o.type === 'oil') drawOil(o.x, o.y, o.width, o.height);
      else drawCar(o.x, o.y, o.width, o.height, o.color, false, 0);
    });
    drawCar(player.x, player.y, player.width, player.height, '#3498db', true, invincible);
    drawParticles();
    drawUI();
    if (gameState === STATE.GAMEOVER) {
      drawGameOver();
    }
  }
}

function gameLoop(timestamp) {
  let dt = timestamp - lastTime;
  lastTime = timestamp;
  if (gameState === STATE.PLAYING) {
    update(dt);
  }
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  if (gameState === STATE.MENU) {
    if (mx > canvas.width/2 - 90 && mx < canvas.width/2 + 90 && my > 420 && my < 470) {
      resetGame();
    }
  } else if (gameState === STATE.GAMEOVER) {
    if (mx > canvas.width/2 - 90 && mx < canvas.width/2 + 90 && my > 390 && my < 440) {
      resetGame();
    }
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.code === 'Space' || e.code === 'Enter') && gameState === STATE.MENU) {
    resetGame();
  }
  if ((e.code === 'Space' || e.code === 'Enter') && gameState === STATE.GAMEOVER) {
    resetGame();
  }
});

requestAnimationFrame(gameLoop);

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}
</script>
</body>
</html>`
}
