const dinoCanvas = document.getElementById("dino-game");
const dinoCtx = dinoCanvas.getContext("2d");

const dinoScoreText = document.getElementById("scoreText");
const dinoLevelText = document.getElementById("levelText");

const dW = dinoCanvas.width;
const dH = dinoCanvas.height;
const dinoGroundY = 235;

const dinoMaxHP = 3;
const dinoDashDuration = 240;
const dinoBuffLabel = "อมตะทะลวงฟัน";

const dinoConfig = {
  playerEmoji: "👨‍💻",
  gravity: 0.75,
  jumpPower: -14,
  baseSpeed: 5.5,
  maxSpeed: 14
};

let dinoState = "ready";
let dinoFrame = 0;
let dinoScore = 0;
let dinoHighScore = Number(localStorage.getItem("officeDinoHighScore") || 0);
let dinoSpeed = dinoConfig.baseSpeed;
let dinoNextSpawn = 90;
let dinoObstacles = [];
let dinoParticles = [];

let dinoHP = dinoMaxHP;
let dinoInvincible = 0;
let dinoDashTimer = 0;
let floatingTexts = [];
let dinoCurrentPlayerName = "";
let lastDinoHitReason = "";

const dinoPlayer = {
  x: 80,
  y: dinoGroundY - 58,
  w: 46,
  h: 58,
  vy: 0,
  grounded: true,
  ducking: false
};

const dinoObstacleTypes = [
  { emoji: "📄", label: "กระดาษ", w: 42, h: 48 },
  { emoji: "📁", label: "แฟ้มเอกสาร", w: 46, h: 54 },
  { emoji: "🔥", label: "งานด่วน", w: 46, h: 56 },
  { emoji: "📊", label: "Excel พัง", w: 52, h: 52 },
  { emoji: "💬", label: "หัวหน้าด่า", w: 56, h: 58 },
  { emoji: "☕", label: "กาแฟหมด", w: 46, h: 50 },
  { emoji: "📞", label: "ลูกค้าโทร", w: 50, h: 52 },
  { emoji: "🐞", label: "Bug Prod", w: 50, h: 52 },
  { emoji: "🧑‍💼", label: "PM ตามงาน", w: 62, h: 58 },
  { emoji: "📌", label: "งานฝาก", w: 46, h: 50 },
  { emoji: "💸", label: "หักเงินเดือน", w: 52, h: 52 },
  { emoji: "🤡", label: "เพื่อนโยนขี้", w: 56, h: 56 }
];

const dinoPowerupTypes = [
  { emoji: "🍵", label: "ชาไข่มุกต่อชีวิต" },
  { emoji: "🚽", label: "อู้ไปขี้" },
  { emoji: "🚬", label: "สูดอากาศแป๊บ" },
  { emoji: "❤️", label: "เติมพลัง" },
  { emoji: "💊", label: "พาราเซตามอล" }
];

const dinoSpecialTypes = [
  { emoji: "🚀", label: "ใบลาออก!" },
  { emoji: "🛵", label: "แว้นกลับบ้าน" },
  { emoji: "🏃", label: "หนีเจ้านาย" }
];

const dinoLevels = [
  { score: 0, text: "ยังพอทำงานอยู่" },
  { score: 50, text: "สลับจอหนีเก่ง" },
  { score: 120, text: "ตีเนียนเข้าห้องน้ำ" },
  { score: 250, text: "แอบหลับในส้วม" },
  { score: 450, text: "รับเงินเดือนไปวันๆ" },
  { score: 700, text: "วิญญาณสิงเก้าอี้" },
  { score: 1000, text: "ปรมาจารย์การอู้" },
  { score: 1400, text: "HR ถือซองขาวรอ" },
  { score: 1900, text: "ตำนานพนักงานไร้ตัวตน" },
  { score: 2500, text: "บริษัทขาดทุนเพราะคุณ" },
  { score: 3500, text: "ลูกรัก CEO" }
];

function normalizeDinoPickupType(type, kind) {
  const isPowerup = kind === "powerup";
  const labelDefaults = isPowerup ? {
    "ชาไข่มุกต่อชีวิต": { w: 46, h: 52, effect: "heal" },
    "อู้ไปขี้": { w: 48, h: 54, effect: "heal" },
    "สูดอากาศแป๊บ": { w: 46, h: 50, effect: "heal" },
    "เติมพลัง": { w: 48, h: 52, effect: "refill" },
    "พาราเซตามอล": { w: 46, h: 50, effect: "heal" }
  } : {
    "ใบลาออก!": { w: 50, h: 54, effect: "immortal-dash" },
    "แว้นกลับบ้าน": { w: 52, h: 54, effect: "immortal-dash" },
    "หนีเจ้านาย": { w: 48, h: 54, effect: "immortal-dash" }
  };
  const fallback = isPowerup
    ? { w: 46, h: 52, effect: "heal" }
    : { w: 50, h: 54, effect: "immortal-dash" };
  const preset = labelDefaults[type.label] || fallback;
  return {
    emoji: type.emoji,
    label: type.label,
    w: typeof type.w === "number" ? type.w : preset.w,
    h: typeof type.h === "number" ? type.h : preset.h,
    effect: type.effect || preset.effect
  };
}

function resolveDinoPlayerName() {
  const input = document.getElementById("dino-player-name");
  const label = document.getElementById("dino-current-player-name");
  const name = String(input.value || "").trim() || getDefaultPlayerName();
  input.value = name;
  dinoCurrentPlayerName = name;
  label.textContent = name;
  return name;
}

function beginDinoRun() {
  resolveDinoPlayerName();
  resetDinoGame();
}

function renderDinoLeaderboard() {
  const list = document.getElementById("dino-leaderboard-list");
  const empty = document.getElementById("dino-leaderboard-empty");
  if (!list || !empty) return;
  const rows = loadLeaderboard();
  empty.style.display = rows.length ? "none" : "block";
  list.innerHTML = rows.map(function(row, index) {
    return '<li class="dino-leaderboard-item">'
      + '<span class="dino-leaderboard-rank">#' + (index + 1) + '</span>'
      + '<span class="dino-leaderboard-name">' + esc(row.name) + '</span>'
      + '<span class="dino-leaderboard-score">' + row.score + "</span>"
      + "</li>";
  }).join("");
}

function renderDinoGlobalLeaderboard(rows, message) {
  const list = document.getElementById("dino-global-leaderboard-list");
  const empty = document.getElementById("dino-global-leaderboard-empty");
  const status = document.getElementById("dino-global-leaderboard-status");
  if (!list || !empty || !status) return;

  const normalizedRows = normalizeDinoGlobalLeaderboardRows(rows || []);
  status.textContent = message || (getDinoGlobalLeaderboardEndpoint() ? "Global leaderboard ready." : "Configure the Google Apps Script URL to start the shared leaderboard.");
  empty.style.display = normalizedRows.length ? "none" : "block";
  list.innerHTML = normalizedRows.map(function(row, index) {
    return '<li class="dino-leaderboard-item">'
      + '<span class="dino-leaderboard-rank">#' + (index + 1) + '</span>'
      + '<span class="dino-leaderboard-name">' + esc(row.name) + '</span>'
      + '<span class="dino-leaderboard-score">' + row.score + "</span>"
      + "</li>";
  }).join("");
}

function clearDinoLeaderboard() {
  localStorage.removeItem(dinoLeaderboardStorageKey);
  renderDinoLeaderboard();
}

function syncDinoGlobalLeaderboard(showToastOnError) {
  renderDinoGlobalLeaderboard([], "Loading global leaderboard...");
  return loadDinoGlobalLeaderboard().then(function(payload) {
    renderDinoGlobalLeaderboard(payload.rows, payload.message || "Global leaderboard updated.");
    return payload;
  }).catch(function(err) {
    renderDinoGlobalLeaderboard([], "Unable to load the global leaderboard.");
    if (showToastOnError) {
      showToast("Global leaderboard failed", String((err && err.message) || err || "unknown error"), "err");
    }
    throw err;
  });
}

function submitDinoGlobalScore(entry) {
  if (!getDinoGlobalLeaderboardEndpoint()) return Promise.resolve();
  renderDinoGlobalLeaderboard([], "Submitting score to the global leaderboard...");
  return submitDinoGlobalLeaderboardEntry(entry).then(function() {
    return syncDinoGlobalLeaderboard(false);
  }).then(function() {
    showToast("Global leaderboard updated", "Your score was submitted.", "ok");
  }).catch(function(err) {
    renderDinoGlobalLeaderboard([], "Unable to submit the score right now.");
    showToast("Global submit failed", String((err && err.message) || err || "unknown error"), "err");
  });
}

function onDinoGameOver() {
  const entry = {
    name: dinoCurrentPlayerName || getDefaultPlayerName(),
    score: dinoScore,
    level: getDinoLevel(),
    timestamp: Date.now()
  };
  saveLeaderboardEntry(entry);
  renderDinoLeaderboard();
  submitDinoGlobalScore(entry);
}

function changeDinoChar() {
  dinoConfig.playerEmoji = document.getElementById("dino-char").value;
}

function changeDinoSpeed() {
  const mode = document.getElementById("dino-speed").value;
  if (mode === "baby") { dinoConfig.baseSpeed = 3; dinoConfig.maxSpeed = 6.5; }
  else if (mode === "easy") { dinoConfig.baseSpeed = 4.5; dinoConfig.maxSpeed = 11; }
  else if (mode === "normal") { dinoConfig.baseSpeed = 5.5; dinoConfig.maxSpeed = 14; }
  else if (mode === "hard") { dinoConfig.baseSpeed = 7.5; dinoConfig.maxSpeed = 19; }
  resetDinoGame();
}

function resetDinoGame() {
  dinoState = "running";
  dinoFrame = 0;
  dinoScore = 0;
  dinoSpeed = dinoConfig.baseSpeed;
  dinoNextSpawn = 80;
  dinoObstacles = [];
  dinoParticles = [];
  dinoHP = dinoMaxHP;
  dinoInvincible = 0;
  dinoDashTimer = 0;
  floatingTexts = [];
  dinoPlayer.y = dinoGroundY - 58;
  dinoPlayer.vy = 0;
  dinoPlayer.grounded = true;
  dinoPlayer.ducking = false;
  dinoPlayer.h = 58;
  document.getElementById("dino-pause-btn").textContent = "⏸️ พักเบรก (Pause)";
}

function toggleDinoPause() {
  if (dinoState === "running") {
    dinoState = "paused";
    document.getElementById("dino-pause-btn").textContent = "▶️ ทำงานต่อ (Resume)";
  } else if (dinoState === "paused") {
    dinoState = "running";
    document.getElementById("dino-pause-btn").textContent = "⏸️ พักเบรก (Pause)";
  }
}

function getDinoLevel() {
  let current = dinoLevels[0];
  for (const level of dinoLevels) {
    if (dinoScore >= level.score) current = level;
  }
  return current.text;
}

function dinoJump() {
  if (dinoState === "ready" || dinoState === "gameover") {
    beginDinoRun();
    return;
  }
  if (dinoPlayer.grounded && !dinoPlayer.ducking) {
    dinoPlayer.vy = dinoConfig.jumpPower;
    dinoPlayer.grounded = false;
    for (let i = 0; i < 6; i++) {
      dinoParticles.push({
        x: dinoPlayer.x + 10,
        y: dinoGroundY - 8,
        vx: -Math.random() * 2,
        vy: -Math.random() * 2,
        life: 20
      });
    }
  }
}

function setDinoDuck(isDucking) {
  if (dinoState !== "running") return;
  dinoPlayer.ducking = isDucking && dinoPlayer.grounded;
  dinoPlayer.h = dinoPlayer.ducking ? 34 : 58;
  dinoPlayer.y = dinoGroundY - dinoPlayer.h;
}

function spawnDinoObstacle() {
  let powerupChance = 0.35 - dinoScore / 6000;
  if (powerupChance < 0.02) powerupChance = 0.02;
  const isPowerup = Math.random() < powerupChance && dinoScore > 50;
  let isSpecial = false;
  let type;
  if (isPowerup) {
    type = normalizeDinoPickupType(dinoPowerupTypes[Math.floor(Math.random() * dinoPowerupTypes.length)], "powerup");
  } else if (dinoScore > 400 && Math.random() < 0.08) {
    isSpecial = true;
    type = normalizeDinoPickupType(dinoSpecialTypes[Math.floor(Math.random() * dinoSpecialTypes.length)], "special");
  } else {
    type = dinoObstacleTypes[Math.floor(Math.random() * dinoObstacleTypes.length)];
  }
  const floating = !isPowerup && !isSpecial && Math.random() < 0.25 && dinoScore > 300;
  dinoObstacles.push({
    x: dW + 20,
    y: floating ? dinoGroundY - type.h - 44 : dinoGroundY - type.h,
    w: type.w,
    h: type.h,
    emoji: type.emoji,
    label: type.label,
    effect: type.effect || null,
    floating,
    isPowerup,
    isSpecial
  });
  dinoNextSpawn = 70 + Math.floor(Math.random() * 70);
  if (dinoScore > 800) dinoNextSpawn -= 15;
  if (dinoScore > 1600) dinoNextSpawn -= 15;
  dinoNextSpawn = Math.max(40, dinoNextSpawn);
}

function checkDinoCollision() {
  const pBox = { x: dinoPlayer.x + 8, y: dinoPlayer.y + 8, w: dinoPlayer.w - 16, h: dinoPlayer.h - 10 };
  for (let i = 0; i < dinoObstacles.length; i++) {
    const obs = dinoObstacles[i];
    const oBox = { x: obs.x + 6, y: obs.y + 6, w: obs.w - 12, h: obs.h - 8 };
    const hit = pBox.x < oBox.x + oBox.w && pBox.x + pBox.w > oBox.x && pBox.y < oBox.y + oBox.h && pBox.y + pBox.h > oBox.y;
    if (!hit) continue;

    if (obs.isPowerup) {
      const powerupEffect = obs.effect || (obs.label === "เติมพลัง" ? "refill" : "heal");
      if (powerupEffect === "refill") {
        const restored = dinoMaxHP - dinoHP;
        dinoHP = dinoMaxHP;
        if (restored > 0) {
          floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "เติมพลังเต็ม!", color: "#2ecc71", life: 45, maxLife: 45 });
        } else {
          dinoScore += 75;
          floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "พลังล้น! +75", color: "#f1c40f", life: 45, maxLife: 45 });
        }
      } else if (dinoHP < dinoMaxHP) {
        dinoHP++;
        floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "+1 พลัง!", color: "#2ecc71", life: 40, maxLife: 40 });
      } else {
        dinoScore += 50;
        floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "+50 แต้ม!", color: "#f1c40f", life: 40, maxLife: 40 });
      }
      dinoObstacles.splice(i, 1);
      i--;
    } else if (obs.isSpecial) {
      dinoDashTimer = dinoDashDuration;
      dinoInvincible = Math.max(dinoInvincible, dinoDashDuration);
      dinoScore += 100;
      floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "อมตะทะลวงฟัน!!", color: "#9b59b6", life: 50, maxLife: 50 });
      dinoObstacles.splice(i, 1);
      i--;
    } else if (dinoDashTimer > 0) {
      dinoScore += 30;
      floatingTexts.push({ x: obs.x, y: obs.y - 10, text: "กระเด็น!", color: "#e67e22", life: 30, maxLife: 30 });
      for (let p = 0; p < 5; p++) {
        dinoParticles.push({ x: obs.x + 10, y: obs.y + 10, vx: 2 + Math.random() * 4, vy: -5 + Math.random() * 4, life: 25 });
      }
      dinoObstacles.splice(i, 1);
      i--;
    } else if (dinoInvincible <= 0) {
      dinoHP--;
      dinoInvincible = 50;
      floatingTexts.push({ x: dinoPlayer.x, y: dinoPlayer.y - 20, text: "-1 จ๊ากก!", color: "#e74c3c", life: 40, maxLife: 40 });
      if (dinoHP <= 0) {
        dinoState = "gameover";
        if (dinoScore > dinoHighScore) {
          dinoHighScore = dinoScore;
          localStorage.setItem("officeDinoHighScore", String(dinoHighScore));
        }
        lastDinoHitReason = obs.label;
        onDinoGameOver();
        break;
      }
    }
  }
}

function updateDino() {
  if (dinoState !== "running") return;
  dinoFrame++;
  dinoScore += 1;
  dinoSpeed = Math.min(dinoConfig.maxSpeed, dinoConfig.baseSpeed + dinoScore / 350);
  if (dinoDashTimer > 0) {
    dinoSpeed += 6;
    dinoScore += 2;
    dinoDashTimer--;
    if (dinoFrame % 2 === 0) {
      dinoParticles.push({ x: dinoPlayer.x, y: dinoPlayer.y + dinoPlayer.h / 2, vx: -3 - Math.random() * 3, vy: (Math.random() - 0.5) * 2, life: 15 });
    }
  }
  dinoScoreText.textContent = dinoScore;
  dinoLevelText.textContent = getDinoLevel();
  dinoPlayer.vy += dinoConfig.gravity;
  dinoPlayer.y += dinoPlayer.vy;
  if (dinoPlayer.y + dinoPlayer.h >= dinoGroundY) {
    dinoPlayer.y = dinoGroundY - dinoPlayer.h;
    dinoPlayer.vy = 0;
    dinoPlayer.grounded = true;
  }
  dinoNextSpawn--;
  if (dinoNextSpawn <= 0) spawnDinoObstacle();
  for (const obs of dinoObstacles) obs.x -= dinoSpeed;
  dinoObstacles = dinoObstacles.filter((obs) => obs.x + obs.w > -40);
  for (const p of dinoParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  dinoParticles = dinoParticles.filter((p) => p.life > 0);
  if (dinoInvincible > 0) dinoInvincible--;
  for (const ft of floatingTexts) {
    ft.y -= 1;
    ft.life--;
  }
  floatingTexts = floatingTexts.filter((ft) => ft.life > 0);
  checkDinoCollision();
}

function drawDinoGround() {
  dinoCtx.strokeStyle = "#333";
  dinoCtx.lineWidth = 3;
  dinoCtx.beginPath();
  dinoCtx.moveTo(0, dinoGroundY);
  dinoCtx.lineTo(dW, dinoGroundY);
  dinoCtx.stroke();
  dinoCtx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const x = i * 55 - (dinoFrame * dinoSpeed) % 55;
    dinoCtx.beginPath();
    dinoCtx.moveTo(x, dinoGroundY + 10);
    dinoCtx.lineTo(x + 20, dinoGroundY + 10);
    dinoCtx.stroke();
  }
}

function drawDinoBg() {
  dinoCtx.font = "18px Tahoma";
  dinoCtx.fillStyle = "#ddd";
  const signs = ["OPEN OFFICE", "TODO", "ประชุม", "Deadline", "Coffee?"];
  for (let i = 0; i < signs.length; i++) {
    const x = 80 + i * 170 - ((dinoFrame * dinoSpeed * 0.25) % 170);
    dinoCtx.fillText(signs[i], x, 55 + (i % 2) * 28);
  }
}

function drawDinoPlayer() {
  dinoCtx.save();
  if (dinoInvincible > 0 && Math.floor(dinoFrame / 4) % 2 === 0) {
    dinoCtx.globalAlpha = 0.4;
  }
  dinoCtx.font = dinoPlayer.ducking ? "44px Tahoma" : "54px Tahoma";
  dinoCtx.textAlign = "center";
  dinoCtx.textBaseline = "middle";
  const bob = dinoPlayer.grounded ? Math.sin(dinoFrame / 5) * 2 : 0;
  if (dinoDashTimer > 0) {
    dinoCtx.shadowColor = "#9b59b6";
    dinoCtx.shadowBlur = 12;
    dinoCtx.shadowOffsetY = 0;
  } else {
    dinoCtx.shadowColor = "rgba(0,0,0,0.3)";
    dinoCtx.shadowBlur = 4;
    dinoCtx.shadowOffsetY = 2;
  }
  dinoCtx.fillText(dinoConfig.playerEmoji, dinoPlayer.x + dinoPlayer.w / 2, dinoPlayer.y + dinoPlayer.h / 2 + bob);
  dinoCtx.shadowColor = "transparent";
  dinoCtx.font = "bold 13px Tahoma";
  dinoCtx.fillStyle = "#2c3e50";
  dinoCtx.fillText("หนีงาน", dinoPlayer.x + dinoPlayer.w / 2, dinoPlayer.y - 12);
  dinoCtx.restore();
}

function drawDinoObs(obs) {
  dinoCtx.save();
  dinoCtx.font = "40px Tahoma";
  dinoCtx.textAlign = "center";
  dinoCtx.textBaseline = "middle";
  dinoCtx.shadowColor = "rgba(0,0,0,0.3)";
  dinoCtx.shadowBlur = 4;
  dinoCtx.shadowOffsetY = 2;
  dinoCtx.fillText(obs.emoji, obs.x + obs.w / 2, obs.y + obs.h / 2);
  dinoCtx.shadowColor = "transparent";
  dinoCtx.font = "bold 14px Tahoma";
  if (obs.isSpecial) dinoCtx.fillStyle = "#8e44ad";
  else if (obs.isPowerup) dinoCtx.fillStyle = "#27ae60";
  else dinoCtx.fillStyle = "#c0392b";
  dinoCtx.fillText(obs.label, obs.x + obs.w / 2, obs.y - 12);
  if (obs.floating) {
    dinoCtx.font = "bold 13px Tahoma";
    dinoCtx.fillStyle = "#e67e22";
    dinoCtx.fillText("หมอบ!", obs.x + obs.w / 2, obs.y + obs.h + 16);
  }
  dinoCtx.restore();
}

function drawDinoPickupAura(obs, palette) {
  const cx = obs.x + obs.w / 2;
  const cy = obs.y + obs.h / 2;
  const pulse = 1 + Math.sin(dinoFrame / 6 + cx / 40) * 0.08;
  const radius = Math.max(obs.w, obs.h) * 0.52 * pulse;
  dinoCtx.save();
  dinoCtx.beginPath();
  dinoCtx.globalAlpha = 0.22;
  dinoCtx.fillStyle = palette.glow;
  dinoCtx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
  dinoCtx.fill();
  dinoCtx.globalAlpha = 0.95;
  dinoCtx.lineWidth = 3;
  dinoCtx.strokeStyle = palette.ring;
  dinoCtx.beginPath();
  dinoCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  dinoCtx.stroke();
  if (obs.isSpecial) {
    dinoCtx.lineWidth = 2;
    dinoCtx.strokeStyle = palette.accent;
    dinoCtx.beginPath();
    dinoCtx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    dinoCtx.stroke();
    for (let i = 0; i < 3; i++) {
      const angle = dinoFrame / 10 + i * (Math.PI * 2 / 3);
      const sparkX = cx + Math.cos(angle) * (radius + 12);
      const sparkY = cy + Math.sin(angle) * (radius + 12);
      dinoCtx.fillStyle = palette.accent;
      dinoCtx.fillRect(sparkX - 2, sparkY - 2, 4, 4);
    }
  }
  dinoCtx.restore();
}

function drawDinoPickupBadge(obs, text, background, color) {
  const width = text === "BOOST" ? 54 : 46;
  const x = obs.x + obs.w / 2 - width / 2;
  const y = obs.y - 42;
  dinoCtx.save();
  dinoCtx.fillStyle = background;
  dinoCtx.globalAlpha = 0.95;
  dinoCtx.fillRect(x, y, width, 18);
  dinoCtx.globalAlpha = 1;
  dinoCtx.fillStyle = color;
  dinoCtx.font = "bold 11px Tahoma";
  dinoCtx.textAlign = "center";
  dinoCtx.textBaseline = "middle";
  dinoCtx.fillText(text, x + width / 2, y + 9);
  dinoCtx.restore();
}

function drawDinoObs(obs) {
  const palette = obs.isSpecial
    ? { glow: "rgba(155, 89, 182, 0.55)", ring: "#f7d774", accent: "#ffffff", label: "#8e44ad", badgeBg: "#2c0f3a", badgeText: "#fdf1a4" }
    : obs.isPowerup
      ? { glow: "rgba(46, 204, 113, 0.45)", ring: "#6ff7c8", accent: "#d9fff1", label: "#138d75", badgeBg: "#0f4734", badgeText: "#cbffe8" }
      : null;
  dinoCtx.save();
  dinoCtx.font = "40px Tahoma";
  dinoCtx.textAlign = "center";
  dinoCtx.textBaseline = "middle";
  if (palette) {
    drawDinoPickupAura(obs, palette);
  }
  dinoCtx.shadowColor = palette ? palette.glow : "rgba(0,0,0,0.3)";
  dinoCtx.shadowBlur = palette ? 18 : 4;
  dinoCtx.shadowOffsetY = 2;
  dinoCtx.fillText(obs.emoji, obs.x + obs.w / 2, obs.y + obs.h / 2);
  dinoCtx.shadowColor = "transparent";
  dinoCtx.font = "bold 14px Tahoma";
  if (obs.isSpecial) {
    drawDinoPickupBadge(obs, "BOOST", palette.badgeBg, palette.badgeText);
    dinoCtx.fillStyle = palette.label;
  } else if (obs.isPowerup) {
    drawDinoPickupBadge(obs, "BUFF", palette.badgeBg, palette.badgeText);
    dinoCtx.fillStyle = palette.label;
  } else {
    dinoCtx.fillStyle = "#c0392b";
  }
  dinoCtx.fillText(obs.label, obs.x + obs.w / 2, obs.y - 12);
  if (obs.floating) {
    dinoCtx.font = "bold 13px Tahoma";
    dinoCtx.fillStyle = "#e67e22";
    dinoCtx.fillText("à¸«à¸¡à¸­à¸š!", obs.x + obs.w / 2, obs.y + obs.h + 16);
  }
  dinoCtx.restore();
}

function drawDinoParticles() {
  dinoCtx.fillStyle = "#555";
  for (const p of dinoParticles) {
    dinoCtx.globalAlpha = p.life / 20;
    dinoCtx.fillRect(p.x, p.y, 3, 3);
  }
  dinoCtx.globalAlpha = 1;
}

function drawDinoBuffStatus() {
  if (dinoDashTimer <= 0 && dinoInvincible <= 0) return;
  dinoCtx.save();
  dinoCtx.font = "bold 14px Tahoma";
  dinoCtx.textAlign = "left";
  dinoCtx.fillStyle = "#8e44ad";
  dinoCtx.fillText(dinoBuffLabel + " " + (Math.max(dinoDashTimer, dinoInvincible) / 60).toFixed(1) + "s", 24, 52);
  dinoCtx.restore();
}

function drawDinoHud() {
  dinoCtx.fillStyle = "#333";
  dinoCtx.font = "16px Tahoma";
  dinoCtx.textAlign = "right";
  dinoCtx.fillText("HI " + dinoHighScore, dW - 24, 28);
  dinoCtx.fillText("SCORE " + dinoScore, dW - 24, 52);
  dinoCtx.textAlign = "left";
  let hearts = "";
  for (let i = 0; i < 3; i++) hearts += i < dinoHP ? "❤️" : "🖤";
  dinoCtx.fillText("พลัง: " + hearts, 24, 28);
  for (const ft of floatingTexts) {
    dinoCtx.save();
    dinoCtx.globalAlpha = ft.life / ft.maxLife;
    dinoCtx.font = "bold 18px Tahoma";
    dinoCtx.fillStyle = ft.color;
    dinoCtx.textAlign = "center";
    dinoCtx.shadowColor = "rgba(0,0,0,0.4)";
    dinoCtx.shadowBlur = 4;
    dinoCtx.shadowOffsetY = 2;
    dinoCtx.fillText(ft.text, ft.x + 20, ft.y);
    dinoCtx.restore();
  }
}

function drawDinoScreens() {
  if (dinoState === "ready") {
    dinoCtx.fillStyle = "rgba(255, 255, 255, 0.85)";
    dinoCtx.fillRect(0, 0, dW, dH);
    dinoCtx.fillStyle = "#2c3e50";
    dinoCtx.textAlign = "center";
    dinoCtx.shadowColor = "rgba(0,0,0,0.15)";
    dinoCtx.shadowBlur = 4;
    dinoCtx.font = "bold 36px Tahoma";
    dinoCtx.fillText("Office Dino", dW / 2, 95);
    dinoCtx.shadowColor = "transparent";
    dinoCtx.font = "bold 20px Tahoma";
    dinoCtx.fillStyle = "#34495e";
    dinoCtx.fillText("มนุษย์เงินเดือนผู้ต้องหลบงานเพื่อรักษาความว่าง", dW / 2, 135);
    dinoCtx.font = "bold 18px Tahoma";
    dinoCtx.fillStyle = "#e67e22";
    dinoCtx.fillText("กด Space หรือ ↑ เพื่อเริ่มเกม", dW / 2, 180);
    dinoCtx.fillText("เจอสิ่งกีดขวางลอย ให้กด ↓ เพื่อหมอบ", dW / 2, 210);
  } else if (dinoState === "gameover") {
    dinoCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
    dinoCtx.fillRect(0, 0, dW, dH);
    dinoCtx.fillStyle = "#c0392b";
    dinoCtx.textAlign = "center";
    dinoCtx.shadowColor = "rgba(192,57,43,0.3)";
    dinoCtx.shadowBlur = 8;
    dinoCtx.font = "bold 40px Tahoma";
    dinoCtx.fillText("หมดเวลาว่าง!", dW / 2, 85);
    dinoCtx.shadowColor = "transparent";
    dinoCtx.fillStyle = "#2c3e50";
    dinoCtx.font = "bold 22px Tahoma";
    dinoCtx.fillText("คุณพ่ายแพ้ให้กับ: " + lastDinoHitReason, dW / 2, 130);
    dinoCtx.font = "bold 18px Tahoma";
    dinoCtx.fillText("คะแนนความว่าง: " + dinoScore, dW / 2, 165);
    dinoCtx.fillText("ระดับสุดท้าย: " + getDinoLevel(), dW / 2, 195);
    dinoCtx.fillStyle = "#27ae60";
    dinoCtx.font = "bold 20px Tahoma";
    dinoCtx.fillText("กด R หรือ Space เพื่อเริ่มใหม่", dW / 2, 240);
  } else if (dinoState === "paused") {
    dinoCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
    dinoCtx.fillRect(0, 0, dW, dH);
    dinoCtx.fillStyle = "#fff";
    dinoCtx.textAlign = "center";
    dinoCtx.shadowColor = "rgba(0,0,0,0.5)";
    dinoCtx.shadowBlur = 10;
    dinoCtx.font = "bold 48px Tahoma";
    dinoCtx.fillText("PAUSED", dW / 2, dH / 2);
    dinoCtx.font = "bold 20px Tahoma";
    dinoCtx.fillText("กด P เพื่อลุยงานต่อ", dW / 2, dH / 2 + 40);
    dinoCtx.shadowColor = "transparent";
  }
}

function renderDino() {
  dinoCtx.clearRect(0, 0, dW, dH);
  drawDinoBg();
  drawDinoGround();
  drawDinoParticles();
  for (const obs of dinoObstacles) drawDinoObs(obs);
  drawDinoPlayer();
  drawDinoHud();
  drawDinoBuffStatus();
  drawDinoScreens();
}

function dinoLoop() {
  updateDino();
  renderDino();
  requestAnimationFrame(dinoLoop);
}

document.addEventListener("keydown", function(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    dinoJump();
  }
  if (e.code === "ArrowDown") {
    e.preventDefault();
    setDinoDuck(true);
  }
  if (e.code === "KeyR") resetDinoGame();
  if (e.code === "KeyP") toggleDinoPause();
});

document.addEventListener("keyup", function(e) {
  if (e.code === "ArrowDown") setDinoDuck(false);
});

dinoCanvas.addEventListener("click", dinoJump);

renderDinoLeaderboard();
renderDinoGlobalLeaderboard([], getDinoGlobalLeaderboardEndpoint() ? "Press sync to load the latest global board." : "Configure the Google Apps Script URL to start the shared leaderboard.");
if (getDinoGlobalLeaderboardEndpoint()) {
  syncDinoGlobalLeaderboard(false);
}
renderDino();
dinoLoop();
