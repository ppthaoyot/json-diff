const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadDinoHarness() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const uiScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "ui.js"), "utf8");
  const storageScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "storage.js"), "utf8");
  const scriptMatch = html.match(/const dinoCanvas[\s\S]*?dinoCanvas\.addEventListener\("click", dinoJump\);/);
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
    moveTo() {},
    lineTo() {},
    stroke() {},
    clearRect() {},
    fillRect() {},
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
    "dino-char": { value: "👨‍💻" },
    "dino-speed": { value: "normal" }
  };

  const math = Object.create(Math);
  const context = {
    console,
    Math: math,
    document: {
      getElementById(id) {
        const el = elements[id];
        if (!el) throw new Error("Missing element: " + id);
        return el;
      },
      addEventListener() {}
    },
    window: { addEventListener() {} },
    requestAnimationFrame() {},
    localStorage: {
      getItem() { return "0"; },
      setItem() {}
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
        getState() {
          return {
            dinoHP,
            dinoInvincible,
            dinoDashTimer,
            dinoObstacles: dinoObstacles.map(function(obs) { return Object.assign({}, obs); }),
            floatingTexts: floatingTexts.map(function(ft) { return Object.assign({}, ft); })
          };
        },
        setState(next) {
          if (typeof next.dinoHP === "number") dinoHP = next.dinoHP;
          if (typeof next.dinoInvincible === "number") dinoInvincible = next.dinoInvincible;
          if (typeof next.dinoDashTimer === "number") dinoDashTimer = next.dinoDashTimer;
          if (Array.isArray(next.dinoObstacles)) dinoObstacles = next.dinoObstacles.map(function(obs) { return Object.assign({}, obs); });
          if (Array.isArray(next.floatingTexts)) floatingTexts = next.floatingTexts.map(function(ft) { return Object.assign({}, ft); });
          if (next.playerBox) {
            dinoPlayer.x = next.playerBox.x;
            dinoPlayer.y = next.playerBox.y;
            dinoPlayer.w = next.playerBox.w;
            dinoPlayer.h = next.playerBox.h;
          }
        }
      };
    `,
    context
  );

  return {
    api: context.__dinoTestApi,
    drawCalls,
    math
  };
}

test("spawned powerup pickup has a drawable hitbox", () => {
  const { api, math } = loadDinoHarness();
  const rolls = [0.1, 0.7];
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
        emoji: "❤️",
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
        emoji: "🚀",
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
