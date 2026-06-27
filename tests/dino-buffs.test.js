const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadDinoHarness() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const uiScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "ui.js"), "utf8");
  const storageScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "storage.js"), "utf8");
  const scriptMatch = html.match(/const dinoCanvas[\s\S]*?dinoCanvas\.addEventListener\("click", function\(\) \{[\s\S]*?\}\);/);
  if (!scriptMatch) {
    throw new Error("Office Dino script not found");
  }

  const drawCalls = [];
  const ctx2d = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    globalAlpha: 1,
    save() {},
    restore() {},
    beginPath() {},
    arc(x, y, radius) {
      drawCalls.push({ kind: "arc", x, y, radius });
    },
    fill() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    clearRect() {},
    fillRect(x, y, w, h) {
      drawCalls.push({ kind: "fillRect", x, y, w, h, fillStyle: this.fillStyle, globalAlpha: this.globalAlpha });
    },
    strokeRect() {},
    translate() {},
    scale() {},
    setLineDash() {},
    fillText(text, x, y) {
      drawCalls.push({ text, x, y });
    }
  };

  const elements = {
    "dino-game": {
      width: 900,
      height: 300,
      getContext: () => ctx2d,
      addEventListener() {}
    },
    "scoreText": { textContent: "" },
    "levelText": { textContent: "" },
    "page-minigame": { classList: { contains: () => true } },
    "mg-hub-dino": { style: { display: "block" } },
    "mg-hub-box": { style: { display: "none" } },
    "ptab-minigame": { addEventListener() {} },
    "dino-pause-btn": { textContent: "" },
    "dino-char": { value: "ðŸ‘¨â€ðŸ’»" },
    "dino-speed": { value: "normal" },
    "dino-player-name": { value: "" },
    "dino-player-start-overlay": { style: { display: "flex" } },
    "dino-current-player-name": { textContent: "" },
    "dino-leaderboard-list": { innerHTML: "" },
    "dino-leaderboard-empty": { style: { display: "block" } },
    "dino-global-leaderboard-list": { innerHTML: "" },
    "dino-global-leaderboard-empty": { style: { display: "block" } },
    "dino-global-leaderboard-status": { textContent: "" },
    "dino-global-leaderboard-title": { textContent: "" },
    "dino-score-card": { style: { display: "none" } },
    "dino-score-card-text": { textContent: "" }
  };

  const math = Object.create(Math);
  const store = new Map();
  const context = {
    console,
    Math: math,
    document: {
      getElementById(id) {
        const el = elements[id];
        if (!el) throw new Error("Missing element: " + id);
        return el;
      },
      querySelector() {
        return null;
      },
      addEventListener() {}
    },
    window: { addEventListener() {} },
    requestAnimationFrame() {},
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };

  vm.createContext(context);
  vm.runInContext(
    uiScript + "\n" +
      storageScript + "\n" +
      scriptMatch[0] +
      `
      globalThis.__dinoTestApi = {
        spawnDinoObstacle,
        checkDinoCollision,
        resetDinoGame,
        renderDino,
        updateDino,
        dinoJump,
        beginDinoRun,
        changeDinoChar,
        drawDinoObs,
        drawDinoBg,
        getDinoDifficultyTier,
        loadLeaderboard,
        getDinoPowerupLabels() {
          return dinoPowerupTypes.map(function(type) { return type.label; });
        },
        getState() {
          return {
            dinoState,
            dinoConfig: Object.assign({}, dinoConfig),
            dinoScore,
            dinoNextSpawn,
            dinoHP,
            dinoInvincible,
            dinoDashTimer,
            dinoJumpBufferTimer: typeof dinoJumpBufferTimer === "number" ? dinoJumpBufferTimer : 0,
            dinoShieldCharges: typeof dinoShieldCharges === "number" ? dinoShieldCharges : 0,
            dinoSlowTimer: typeof dinoSlowTimer === "number" ? dinoSlowTimer : 0,
            dinoWfhCooldownTimer: typeof dinoWfhCooldownTimer === "number" ? dinoWfhCooldownTimer : 0,
            dinoWfhSeenThisRun: typeof dinoWfhSeenThisRun === "boolean" ? dinoWfhSeenThisRun : false,
            dinoLastWfhScore: typeof dinoLastWfhScore === "number" ? dinoLastWfhScore : 0,
            dinoBossEvent: typeof dinoBossEvent === "object" && dinoBossEvent ? Object.assign({}, dinoBossEvent) : null,
            dinoTriggeredBossScores: typeof dinoTriggeredBossScores !== "undefined" ? Array.from(dinoTriggeredBossScores) : [],
            dinoPlayer: Object.assign({}, dinoPlayer),
            dinoObstacles: dinoObstacles.map(function(obs) { return Object.assign({}, obs); }),
            floatingTexts: floatingTexts.map(function(ft) { return Object.assign({}, ft); }),
            dinoMilestoneBanner: typeof dinoMilestoneBanner === "object" && dinoMilestoneBanner ? Object.assign({}, dinoMilestoneBanner) : null
          };
        },
        setState(next) {
          if (typeof next.dinoState === "string") dinoState = next.dinoState;
          if (typeof next.dinoScore === "number") dinoScore = next.dinoScore;
          if (typeof next.dinoNextSpawn === "number") dinoNextSpawn = next.dinoNextSpawn;
          if (typeof next.dinoHP === "number") dinoHP = next.dinoHP;
          if (typeof next.dinoInvincible === "number") dinoInvincible = next.dinoInvincible;
          if (typeof next.dinoDashTimer === "number") dinoDashTimer = next.dinoDashTimer;
          if (typeof next.dinoJumpBufferTimer === "number") dinoJumpBufferTimer = next.dinoJumpBufferTimer;
          if (typeof next.dinoShieldCharges === "number") dinoShieldCharges = next.dinoShieldCharges;
          if (typeof next.dinoSlowTimer === "number") dinoSlowTimer = next.dinoSlowTimer;
          if (typeof next.dinoWfhCooldownTimer === "number") dinoWfhCooldownTimer = next.dinoWfhCooldownTimer;
          if (typeof next.dinoWfhSeenThisRun === "boolean") dinoWfhSeenThisRun = next.dinoWfhSeenThisRun;
          if (typeof next.dinoLastWfhScore === "number") dinoLastWfhScore = next.dinoLastWfhScore;
          if (next.dinoBossEvent !== undefined) dinoBossEvent = next.dinoBossEvent;
          if (Array.isArray(next.dinoTriggeredBossScores)) dinoTriggeredBossScores = new Set(next.dinoTriggeredBossScores);
          if (typeof next.dinoCurrentPlayerName === "string") dinoCurrentPlayerName = next.dinoCurrentPlayerName;
          if (Array.isArray(next.dinoObstacles)) dinoObstacles = next.dinoObstacles.map(function(obs) { return Object.assign({}, obs); });
          if (Array.isArray(next.floatingTexts)) floatingTexts = next.floatingTexts.map(function(ft) { return Object.assign({}, ft); });
          if (next.dinoMilestoneBanner !== undefined) dinoMilestoneBanner = next.dinoMilestoneBanner;
          if (next.playerBox) {
            dinoPlayer.x = next.playerBox.x;
            dinoPlayer.y = next.playerBox.y;
            dinoPlayer.w = next.playerBox.w;
            dinoPlayer.h = next.playerBox.h;
            if (typeof next.playerBox.vy === "number") dinoPlayer.vy = next.playerBox.vy;
            if (typeof next.playerBox.grounded === "boolean") dinoPlayer.grounded = next.playerBox.grounded;
            if (typeof next.playerBox.ducking === "boolean") dinoPlayer.ducking = next.playerBox.ducking;
          }
        }
      };
    `,
    context
  );

  return {
    api: context.__dinoTestApi,
    elements,
    drawCalls,
    math
  };
}

test("spawned powerup pickup has a drawable hitbox", () => {
  const { api, math } = loadDinoHarness();
  api.setState({ dinoScore: 400 });
  const rolls = [0.1, 0.85];
  math.random = () => rolls.shift() ?? 0.5;

  api.spawnDinoObstacle();
  const state = api.getState();

  assert.equal(state.dinoObstacles.length, 1);
  assert.equal(state.dinoObstacles[0].label, "เติมพลัง");
  assert.equal(typeof state.dinoObstacles[0].w, "number");
  assert.equal(typeof state.dinoObstacles[0].h, "number");
  assert.ok(state.dinoObstacles[0].w > 0);
  assert.ok(state.dinoObstacles[0].h > 0);
});

test("WFH mode has extra weight in the powerup pool", () => {
  const { api } = loadDinoHarness();
  const labels = api.getDinoPowerupLabels();
  const wfhCount = labels.filter((label) => label === "WFH Mode").length;

  assert.ok(wfhCount >= 3);
});

test("WFH mode is guaranteed once after 1500 points if it has not appeared", () => {
  const { api, math } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoScore: 1600,
    dinoWfhSeenThisRun: false,
    dinoObstacles: []
  });
  const rolls = [0.01, 0.99, 0.5];
  math.random = () => rolls.shift() ?? 0.5;

  api.spawnDinoObstacle();
  let state = api.getState();

  assert.equal(state.dinoObstacles[0].label, "WFH Mode");
  assert.equal(state.dinoWfhSeenThisRun, true);
  assert.equal(state.dinoLastWfhScore, 1600);

  api.setState({ dinoObstacles: [] });
  const nextRolls = [0.01, 0.99, 0.5];
  math.random = () => nextRolls.shift() ?? 0.5;

  api.spawnDinoObstacle();
  state = api.getState();

  assert.notEqual(state.dinoObstacles[0].label, "WFH Mode");
});

test("early game keeps normal drop rate by spawning a regular obstacle instead of a powerup", () => {
  const { api, math } = loadDinoHarness();
  api.setState({ dinoScore: 0 });
  const rolls = [0.1, 0];
  math.random = () => rolls.shift() ?? 0;

  api.spawnDinoObstacle();
  const state = api.getState();

  assert.equal(state.dinoObstacles.length, 1);
  assert.equal(Boolean(state.dinoObstacles[0].isPowerup), false);
  assert.equal(Boolean(state.dinoObstacles[0].isSpecial), false);
});

test("special boost appears only after the run is deep enough", () => {
  const { api, math } = loadDinoHarness();
  api.setState({ dinoScore: 150 });
  const earlyRolls = [0.9, 0.01, 0];
  math.random = () => earlyRolls.shift() ?? 0;

  api.spawnDinoObstacle();
  let state = api.getState();
  assert.equal(Boolean(state.dinoObstacles[0].isSpecial), false);

  api.setState({ dinoScore: 900, dinoObstacles: [] });
  const lateRolls = [0.9, 0.01, 0];
  math.random = () => lateRolls.shift() ?? 0;

  api.spawnDinoObstacle();
  state = api.getState();
  assert.equal(Boolean(state.dinoObstacles[0].isSpecial), true);
});

test("energy refill pickup restores HP to full and shows feedback", () => {
  const { api } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoHP: 1,
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 46,
        h: 58,
        emoji: "â¤ï¸",
        label: "เติมพลัง",
        isPowerup: true,
        isSpecial: false
      }
    ]
  });

  api.checkDinoCollision();
  const state = api.getState();

  assert.equal(state.dinoHP, 3);
  assert.ok(state.floatingTexts.some((entry) => String(entry.text).includes("เติมพลัง")));
});

test("coffee heart pickup restores one HP with a readable coffee message", () => {
  const { api } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoHP: 2,
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 48,
        h: 52,
        emoji: "\u2615",
        label: "\u0e01\u0e32\u0e41\u0e1f\u0e40\u0e15\u0e34\u0e21\u0e43\u0e08",
        effect: "coffee-heal",
        isPowerup: true,
        isSpecial: false
      }
    ]
  });

  api.checkDinoCollision();
  const state = api.getState();

  assert.equal(state.dinoHP, 3);
  assert.ok(state.floatingTexts.some((entry) => String(entry.text).includes("\u0e01\u0e32\u0e41\u0e1f")));
});

test("meeting shield pickup blocks the next ordinary hit once", () => {
  const { api } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoHP: 3,
    dinoShieldCharges: 0,
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 48,
        h: 52,
        emoji: "\uD83D\uDEE1\uFE0F",
        label: "\u0e1b\u0e23\u0e30\u0e0a\u0e38\u0e21\u0e1a\u0e31\u0e07\u0e2b\u0e19\u0e49\u0e32",
        effect: "shield",
        isPowerup: true,
        isSpecial: false
      }
    ]
  });

  api.checkDinoCollision();
  let state = api.getState();
  assert.equal(state.dinoShieldCharges, 1);

  api.setState({
    dinoInvincible: 0,
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 48,
        h: 52,
        emoji: "\uD83D\uDCC4",
        label: "\u0e07\u0e32\u0e19",
        isPowerup: false,
        isSpecial: false
      }
    ]
  });

  api.checkDinoCollision();
  state = api.getState();

  assert.equal(state.dinoHP, 3);
  assert.equal(state.dinoShieldCharges, 0);
  assert.equal(state.dinoObstacles.length, 0);
});

test("WFH mode pickup slows obstacle movement for five seconds", () => {
  const { api } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 48,
        h: 52,
        emoji: "\uD83C\uDFE0",
        label: "WFH Mode",
        effect: "slow",
        isPowerup: true,
        isSpecial: false
      }
    ]
  });

  api.checkDinoCollision();
  let state = api.getState();
  assert.equal(state.dinoSlowTimer, 300);

  api.setState({
    dinoState: "running",
    dinoScore: 0,
    dinoNextSpawn: 999,
    dinoObstacles: [
      { x: 500, y: 177, w: 48, h: 52, emoji: "\uD83D\uDCC4", label: "\u0e07\u0e32\u0e19", isPowerup: false, isSpecial: false }
    ]
  });

  api.updateDino();
  state = api.getState();

  assert.ok(state.dinoObstacles[0].x > 496, "slow mode should move obstacles less than the normal 4.3px base speed");
  assert.equal(state.dinoSlowTimer, 299);
});

test("WFH mode renders a center overlay and adds a short clear lane after ending", () => {
  const { api, drawCalls } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({ dinoState: "running", dinoSlowTimer: 60, dinoNextSpawn: 999 });

  api.renderDino();
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("WFH MODE")));

  api.setState({ dinoState: "running", dinoSlowTimer: 1, dinoWfhCooldownTimer: 0, dinoNextSpawn: 0, dinoObstacles: [] });
  api.updateDino();
  let state = api.getState();

  assert.equal(state.dinoSlowTimer, 0);
  assert.ok(state.dinoWfhCooldownTimer > 0);
  assert.equal(state.dinoObstacles.length, 0);
  assert.ok(state.dinoNextSpawn >= 45);

  api.updateDino();
  state = api.getState();
  assert.equal(state.dinoObstacles.length, 0);
});

test("special pickup activates the immortal piercing buff and HUD text", () => {
  const { api, drawCalls } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoDashTimer: 0,
    dinoInvincible: 0,
    dinoObstacles: [
      {
        x: 80,
        y: 177,
        w: 46,
        h: 58,
        emoji: "ðŸš€",
        label: "ใบลาออก!",
        isPowerup: false,
        isSpecial: true
      }
    ]
  });

  api.checkDinoCollision();
  const state = api.getState();

  assert.ok(state.dinoDashTimer > 0);
  assert.ok(state.dinoInvincible > 0);

  api.renderDino();
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("อมตะทะลวงฟัน")));
});

test("powerups and special boosts render lightweight pixel pickup cues beyond ordinary obstacles", () => {
  const { api, drawCalls } = loadDinoHarness();

  api.drawDinoObs({ x: 100, y: 100, w: 48, h: 48, emoji: "❤️", label: "เติมพลัง", isPowerup: true, isSpecial: false, floating: false });
  api.drawDinoObs({ x: 200, y: 100, w: 48, h: 48, emoji: "🚀", label: "ใบลาออก!", isPowerup: false, isSpecial: true, floating: false });

  assert.ok(drawCalls.some((entry) => entry.kind === "fillRect"));
  assert.equal(drawCalls.some((entry) => entry.kind === "arc"), false);
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("BUFF")));
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("BOOST")));
});

test("office dino uses playful vacancy checkpoints and developer obstacle labels", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  [
    "ยังพอทำงานอยู่",
    "สลับจอหนีเก่ง",
    "ตีเนียนเข้าห้องน้ำ",
    "แอบหลับในส้วม",
    "รับเงินเดือนไปวันๆ",
    "วิญญาณสิงเก้าอี้",
    "ปรมาจารย์การอู้",
    "HR ถือซองขาวรอ",
    "ตำนานพนักงานไร้ตัวตน",
    "บริษัทขาดทุนเพราะคุณ",
    "ลูกรัก CEO",
    "พอมีเวลาหายใจ",
    "ว่างนิดหน่อย อย่าเพิ่งโยนงาน",
    "เริ่มชิว แต่ยังไม่ปลอดภัย",
    "ว่างมากจนเปิด YouTube ได้",
    "มาทำไม วันนี้น่าจะลา",
    "อยู่เฉยๆ ก็โดนงานหาเจอ",
    "ว่างระดับเสี่ยงถูกจับเข้าประชุม",
    "สงบผิดปกติ เดี๋ยวมีเรื่องแน่",
    "ว่างแบบ Production ยังไม่รู้ตัว",
    "นิพพานแห่ง Sprint"
  ].forEach((label) => assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));

  [
    "กระดาษ",
    "แฟ้มเอกสาร",
    "งานด่วน",
    "Excel พัง",
    "หัวหน้าด่า",
    "กาแฟหมด",
    "ลูกค้าโทร",
    "Bug Prod",
    "PM ตามงาน",
    "งานฝาก",
    "หักเงินเดือน",
    "เพื่อนโยนขี้",
    "Bug มรณะ",
    "Scope งอก",
    "Build Failed",
    "Meeting ซ้อน Meeting",
    "Hotfix ตอน 5 โมงเย็น",
    "Requirement ไม่ชัด",
    "Regression ถล่มเมือง",
    "Deadline บีบคอ",
    "Tech Debt ก้อนยักษ์",
    "Production Down"
  ].forEach((label) => assert.match(html, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
});

test("office dino background renders rotating excuse signs", () => {
  const { api, drawCalls } = loadDinoHarness();

  api.drawDinoBg();

  assert.ok(drawCalls.some((entry) => String(entry.text).includes("CPU สมองทำงาน 100%")));
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("Pending Motivation")));
});

function getActorPixelBounds(drawCalls) {
  const rects = drawCalls.filter((entry) =>
    entry.kind === "fillRect" &&
    entry.x >= 55 &&
    entry.x <= 150 &&
    entry.y >= 110 &&
    entry.y <= 240 &&
    entry.w <= 45 &&
    entry.h <= 26
  );

  assert.ok(rects.length >= 8);
  return {
    left: Math.min(...rects.map((entry) => entry.x)),
    top: Math.min(...rects.map((entry) => entry.y)),
    right: Math.max(...rects.map((entry) => entry.x + entry.w)),
    bottom: Math.max(...rects.map((entry) => entry.y + entry.h)),
    rects
  };
}

test("office dino player renders as pixel actor poses for run jump and duck", () => {
  const runHarness = loadDinoHarness();
  runHarness.api.setState({ dinoState: "running", dinoNextSpawn: 999, playerBox: { x: 80, y: 177, w: 46, h: 58, grounded: true, ducking: false } });
  runHarness.api.renderDino();
  const runBounds = getActorPixelBounds(runHarness.drawCalls);
  const runActorColors = new Set(runBounds.rects.map((entry) => entry.fillStyle));

  const jumpHarness = loadDinoHarness();
  jumpHarness.api.setState({ dinoState: "running", dinoNextSpawn: 999, playerBox: { x: 80, y: 145, w: 46, h: 58, grounded: false, ducking: false } });
  jumpHarness.api.renderDino();
  const jumpBounds = getActorPixelBounds(jumpHarness.drawCalls);

  const duckHarness = loadDinoHarness();
  duckHarness.api.setState({ dinoState: "running", dinoNextSpawn: 999, playerBox: { x: 80, y: 197, w: 62, h: 38, grounded: true, ducking: true } });
  duckHarness.api.renderDino();
  const duckBounds = getActorPixelBounds(duckHarness.drawCalls);
  const duckActorColors = new Set(duckBounds.rects.map((entry) => entry.fillStyle));

  assert.ok(jumpBounds.top < runBounds.top);
  assert.ok(duckBounds.bottom - duckBounds.top < runBounds.bottom - runBounds.top);
  assert.ok(duckBounds.right - duckBounds.left > runBounds.right - runBounds.left);
  assert.ok(runActorColors.has("#38bdf8"));
  assert.ok(runActorColors.has("#f8fafc"));
  assert.ok(runActorColors.has("#050505"));
  assert.ok(duckActorColors.has("#38bdf8"));
  assert.ok(duckActorColors.has("#f8fafc"));
  assert.ok(duckActorColors.has("#050505"));
});

test("office dino character dropdown changes the pixel actor skin palette", () => {
  const executiveHarness = loadDinoHarness();
  executiveHarness.elements["dino-char"].value = "executive";
  executiveHarness.api.changeDinoChar();
  executiveHarness.api.setState({ dinoState: "running", dinoNextSpawn: 999, playerBox: { x: 80, y: 177, w: 46, h: 58, grounded: true, ducking: false } });
  executiveHarness.api.renderDino();
  const executiveColors = new Set(getActorPixelBounds(executiveHarness.drawCalls).rects.map((entry) => entry.fillStyle));

  const generalHarness = loadDinoHarness();
  generalHarness.elements["dino-char"].value = "general";
  generalHarness.api.changeDinoChar();
  generalHarness.api.setState({ dinoState: "running", dinoNextSpawn: 999, playerBox: { x: 80, y: 177, w: 46, h: 58, grounded: true, ducking: false } });
  generalHarness.api.renderDino();
  const generalColors = new Set(getActorPixelBounds(generalHarness.drawCalls).rects.map((entry) => entry.fillStyle));

  assert.ok(executiveColors.has("#111827"));
  assert.ok(executiveColors.has("#ffffff"));
  assert.ok(generalColors.has("#22c55e"));
  assert.ok(generalColors.has("#dcfce7"));
  assert.notDeepEqual(Array.from(executiveColors).sort(), Array.from(generalColors).sort());
});

test("office dino only starts from the explicit start action", () => {
  const { api } = loadDinoHarness();

  api.setState({ dinoState: "ready" });
  api.dinoJump();
  let state = api.getState();
  assert.equal(state.dinoState, "ready");

  api.setState({ dinoState: "gameover" });
  api.dinoJump();
  state = api.getState();
  assert.equal(state.dinoState, "gameover");

  api.beginDinoRun();
  state = api.getState();
  assert.equal(state.dinoState, "running");
});

test("office dino collision game over saves and renders the local leaderboard", () => {
  const { api, elements } = loadDinoHarness();
  api.setState({
    dinoState: "running",
    dinoScore: 4321,
    dinoHP: 1,
    dinoInvincible: 0,
    dinoCurrentPlayerName: "Crash Tester",
    playerBox: { x: 80, y: 177, w: 46, h: 58, grounded: true, ducking: false },
    dinoObstacles: [
      { x: 80, y: 177, w: 46, h: 58, emoji: "\uD83D\uDCC4", label: "Paper", isPowerup: false, isSpecial: false }
    ]
  });

  api.checkDinoCollision();

  const state = api.getState();
  const rows = api.loadLeaderboard();
  assert.equal(state.dinoState, "gameover");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Crash Tester");
  assert.equal(rows[0].score, 4321);
  assert.equal(elements["dino-leaderboard-empty"].style.display, "none");
  assert.match(elements["dino-leaderboard-list"].innerHTML, /Crash Tester/);
  assert.match(elements["dino-leaderboard-list"].innerHTML, /4321/);
});

test("jump input buffers shortly before landing", () => {
  const { api } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoState: "running",
    dinoNextSpawn: 999,
    playerBox: {
      x: 80,
      y: 176,
      w: 46,
      h: 58,
      vy: 2,
      grounded: false,
      ducking: false
    }
  });

  api.dinoJump();
  let state = api.getState();
  assert.ok(state.dinoJumpBufferTimer > 0);

  api.updateDino();
  state = api.getState();

  assert.equal(state.dinoPlayer.grounded, false);
  assert.ok(state.dinoPlayer.vy < 0);
  assert.equal(state.dinoJumpBufferTimer, 0);
});

test("difficulty milestones render a cinematic center-screen banner", () => {
  const { api, drawCalls } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({ dinoState: "running", dinoScore: 9999, dinoNextSpawn: 999 });

  api.updateDino();
  let state = api.getState();

  assert.equal(state.dinoMilestoneBanner.tier, "rush");
  assert.match(state.dinoMilestoneBanner.title, /\u0e07\u0e32\u0e19\u0e16\u0e32\u0e42\u0e16\u0e21/);

  api.renderDino();
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("RUSH MODE")));
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("\u0e07\u0e32\u0e19\u0e16\u0e32\u0e42\u0e16\u0e21")));

  api.setState({ dinoState: "running", dinoScore: 14999, dinoNextSpawn: 999 });
  api.updateDino();
  state = api.getState();

  assert.equal(state.dinoMilestoneBanner.tier, "hell");
  assert.match(state.dinoMilestoneBanner.title, /\u0e19\u0e23\u0e01\u0e2d\u0e2d\u0e1f\u0e1f\u0e34\u0e28/);
});

test("boss work flood event triggers every 5000 points without repeating a checkpoint", () => {
  const { api, drawCalls } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({ dinoState: "running", dinoScore: 4999, dinoNextSpawn: 999 });

  api.updateDino();
  let state = api.getState();

  assert.equal(state.dinoBossEvent.score, 5000);
  assert.equal(state.dinoBossEvent.life, 600);
  assert.equal(JSON.stringify(state.dinoTriggeredBossScores), JSON.stringify([5000]));

  api.renderDino();
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("\u0e07\u0e32\u0e19\u0e16\u0e32\u0e42\u0e16\u0e21")));

  api.setState({ dinoBossEvent: null, dinoScore: 5001, dinoNextSpawn: 999 });
  api.updateDino();
  state = api.getState();

  assert.equal(state.dinoBossEvent, null);
  assert.equal(JSON.stringify(state.dinoTriggeredBossScores), JSON.stringify([5000]));
});

test("boss work flood event uses a gentle themed obstacle pool", () => {
  const { api, math } = loadDinoHarness();
  api.resetDinoGame();
  api.setState({
    dinoBossEvent: { score: 5000, life: 600, maxLife: 600 },
    dinoScore: 5200
  });
  const rolls = [0.9, 0, 0.9, 0.5];
  math.random = () => rolls.shift() ?? 0.5;

  api.spawnDinoObstacle();
  const state = api.getState();

  assert.equal(state.dinoObstacles[0].label, "\u0e07\u0e32\u0e19\u0e14\u0e48\u0e27\u0e19 x2");
  assert.ok(state.dinoNextSpawn >= 46, "boss event should stay readable and not spam obstacles");
});

test("ordinary obstacles render clear jump and duck action cues", () => {
  const { api, drawCalls } = loadDinoHarness();

  api.drawDinoObs({ x: 120, y: 180, w: 48, h: 52, emoji: "\uD83D\uDCC4", label: "\u0e07\u0e32\u0e19", isPowerup: false, isSpecial: false, floating: false });
  api.drawDinoObs({ x: 220, y: 120, w: 48, h: 52, emoji: "\uD83D\uDCC4", label: "\u0e07\u0e32\u0e19", isPowerup: false, isSpecial: false, floating: true });

  assert.ok(drawCalls.some((entry) => String(entry.text).includes("\u0e01\u0e23\u0e30\u0e42\u0e14\u0e14!")));
  assert.ok(drawCalls.some((entry) => String(entry.text).includes("\u0e2b\u0e21\u0e2d\u0e1a!")));
});

test("office dino stays gentle until 10000 and reaches hell at 15000 points", () => {
  const { api } = loadDinoHarness();

  api.setState({ dinoScore: 9999 });
  assert.equal(api.getDinoDifficultyTier().name, "normal");

  api.setState({ dinoScore: 10000 });
  assert.equal(api.getDinoDifficultyTier().name, "rush");

  api.setState({ dinoScore: 15000 });
  assert.equal(api.getDinoDifficultyTier().name, "hell");
});

test("late game can spawn controlled obstacle combos", () => {
  const { api, math } = loadDinoHarness();
  api.setState({ dinoScore: 15000, dinoObstacles: [] });
  const rolls = [0.9, 0.9, 0, 0.9, 0, 0.9, 0];
  math.random = () => rolls.shift() ?? 0.9;

  api.spawnDinoObstacle();
  const state = api.getState();

  assert.equal(state.dinoObstacles.length, 2);
  assert.ok(state.dinoObstacles[1].x > state.dinoObstacles[0].x);
  assert.equal(Boolean(state.dinoObstacles[0].isPowerup), false);
  assert.equal(Boolean(state.dinoObstacles[1].isPowerup), false);
  assert.ok(state.dinoNextSpawn <= 44);
});
