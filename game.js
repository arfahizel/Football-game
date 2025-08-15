const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;

const playerRadius = 20;
const ballRadius = 10;
const playerSpeed = 6;
const ballMaxSpeed = 15;
const ballFriction = 0.97;

const goalWidth = 20;
const goalHeight = 250;
const goalTop = (height - goalHeight) / 2;

let player1Score = 0;
let player2Score = 0;
const gameDuration = 120; // seconds
let timeLeft = gameDuration;
let gameRunning = false;
let timerInterval = null;

const player1ScoreEl = document.getElementById('player1Score');
const player2ScoreEl = document.getElementById('player2Score');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restartBtn');

// Player objects
const player1 = {
  x: 150,
  y: height / 2,
  dx: 0,
  dy: 0,
  radius: playerRadius,
  color: '#ffd700',
  keys: { up: false, down: false, left: false, right: false }
};

const player2 = {
  x: width - 150,
  y: height / 2,
  dx: 0,
  dy: 0,
  radius: playerRadius,
  color: '#ff4500',
  keys: { up: false, down: false, left: false, right: false }
};

// Ball object
const ball = {
  x: width / 2,
  y: height / 2,
  speedX: 0,
  speedY: 0,
  radius: ballRadius,
  color: '#fff',
};

function drawField() {
  // Green background
  ctx.fillStyle = '#006400';
  ctx.fillRect(0, 0, width, height);

  // White midline
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
  ctx.stroke();

  // Left goal area (yellow)
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(0, goalTop, goalWidth, goalHeight);

  // Right goal area (yellow)
  ctx.fillRect(width - goalWidth, goalTop, goalWidth, goalHeight);
}

function drawCircle(obj) {
  ctx.fillStyle = obj.color;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
  ctx.fill();
}

function movePlayer(player) {
  player.dx = 0;
  player.dy = 0;

  if (player.keys.up) player.dy = -playerSpeed;
  if (player.keys.down) player.dy = playerSpeed;
  if (player.keys.left) player.dx = -playerSpeed;
  if (player.keys.right) player.dx = playerSpeed;

  let newX = player.x + player.dx;
  let newY = player.y + player.dy;

  // Restrict players inside canvas (no half restriction)
  if (newX - player.radius < 0) newX = player.radius;
  if (newX + player.radius > width) newX = width - player.radius;
  if (newY - player.radius < 0) newY = player.radius;
  if (newY + player.radius > height) newY = height - player.radius;

  player.x = newX;
  player.y = newY;
}

function circleCollision(c1, c2) {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  return Math.sqrt(dx * dx + dy * dy) < c1.radius + c2.radius;
}

function handleBallCollision(player) {
  if (!circleCollision(ball, player)) return;

  // Vector from player center to ball center
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;

  // Normalize
  const nx = dx / dist;
  const ny = dy / dist;

  // Relative velocity between ball and player
  const relVelX = ball.speedX - player.dx;
  const relVelY = ball.speedY - player.dy;

  // Velocity along the normal
  const velAlongNormal = relVelX * nx + relVelY * ny;

  if (velAlongNormal > 0) return; // Moving away, no collision response needed

  // Bounce factor - how hard ball gets hit
  const bounce = 1.7;

  // New ball speed after collision
  ball.speedX = player.dx + (-velAlongNormal * nx * bounce);
  ball.speedY = player.dy + (-velAlongNormal * ny * bounce);

  // Push ball out of player to avoid sticking
  const overlap = player.radius + ball.radius - dist;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  // Clamp speed so ball doesn't go crazy fast
  let speed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
  if (speed > ballMaxSpeed) {
    ball.speedX = (ball.speedX / speed) * ballMaxSpeed;
    ball.speedY = (ball.speedY / speed) * ballMaxSpeed;
  }
}

function updateBall() {
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  ball.speedX *= ballFriction;
  ball.speedY *= ballFriction;

  // Bounce off top and bottom walls
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.speedY = -ball.speedY;
  }
  if (ball.y + ball.radius > height) {
    ball.y = height - ball.radius;
    ball.speedY = -ball.speedY;
  }

  // Check for goals
  // Left goal
  if (ball.x - ball.radius < 0) {
    if (ball.y > goalTop && ball.y < goalTop + goalHeight) {
      // Player 2 scores
      player2Score++;
      resetPositions();
    } else {
      ball.x = ball.radius;
      ball.speedX = -ball.speedX;
    }
  }

  // Right goal
  if (ball.x + ball.radius > width) {
    if (ball.y > goalTop && ball.y < goalTop + goalHeight) {
      // Player 1 scores
      player1Score++;
      resetPositions();
    } else {
      ball.x = width - ball.radius;
      ball.speedX = -ball.speedX;
    }
  }
}

function resetPositions() {
  // Reset players
  player1.x = 150;
  player1.y = height / 2;
  player1.dx = 0;
  player1.dy = 0;

  player2.x = width - 150;
  player2.y = height / 2;
  player2.dx = 0;
  player2.dy = 0;

  // Reset ball
  ball.x = width / 2;
  ball.y = height / 2;
  ball.speedX = 0;
  ball.speedY = 0;
}

function updateUI() {
  player1ScoreEl.textContent = `Player 1: ${player1Score}`;
  player2ScoreEl.textContent = `Player 2: ${player2Score}`;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerEl.textContent = `Time Left: ${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

function gameLoop() {
  if (!gameRunning) return;

  movePlayer(player1);
  movePlayer(player2);

  handleBallCollision(player1);
  handleBallCollision(player2);

  updateBall();

  ctx.clearRect(0, 0, width, height);
  drawField();

  drawCircle(player1);
  drawCircle(player2);
  drawCircle(ball);

  updateUI();

  requestAnimationFrame(gameLoop);
}

function startTimer() {
  timeLeft = gameDuration;
  updateUI();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateUI();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  alert(`Game Over!\nFinal Score\nPlayer 1: ${player1Score}\nPlayer 2: ${player2Score}`);
}

function startGame() {
  player1Score = 0;
  player2Score = 0;
  resetPositions();
  gameRunning = true;
  startTimer();
  gameLoop();
}

// Keyboard controls
window.addEventListener('keydown', e => {
  if (!gameRunning) return;
  switch (e.key.toLowerCase()) {
    // Player 1 controls - WASD
    case 'w': player1.keys.up = true; break;
    case 'a': player1.keys.left = true; break;
    case 's': player1.keys.down = true; break;
    case 'd': player1.keys.right = true; break;

    // Player 2 controls - Arrow keys
    case 'arrowup': player2.keys.up = true; break;
    case 'arrowleft': player2.keys.left = true; break;
    case 'arrowdown': player2.keys.down = true; break;
    case 'arrowright': player2.keys.right = true; break;
  }
});

window.addEventListener('keyup', e => {
  switch (e.key.toLowerCase()) {
    // Player 1 controls - WASD
    case 'w': player1.keys.up = false; break;
    case 'a': player1.keys.left = false; break;
    case 's': player1.keys.down = false; break;
    case 'd': player1.keys.right = false; break;

    // Player 2 controls - Arrow keys
    case 'arrowup': player2.keys.up = false; break;
    case 'arrowleft': player2.keys.left = false; break;
    case 'arrowdown': player2.keys.down = false; break;
    case 'arrowright': player2.keys.right = false; break;
  }
});

restartBtn.addEventListener('click', () => {
  startGame();
});

// Start game on load
startGame();
