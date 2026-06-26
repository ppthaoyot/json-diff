const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadLeaderboardHarness() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const uiScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "ui.js"), "utf8");
  const storageScript = fs.readFileSync(path.join(__dirname, "..", "assets", "js", "shared", "storage.js"), "utf8");
  const scriptMatch = html.match(/const dinoCanvas[\s\S]*?dinoCanvas\.addEventListener\("click", dinoJump\);/);
  if (!scriptMatch) {
    throw new Error("Office Dino script not found");
  }

  const store = new Map();
  const ctx2d = {
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    clearRect() {},
    fillRect() {},
    fillText() {}
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
    "dino-speed": { value: "normal" },
    "dino-player-name": { value: "" },
    "dino-current-player-name": { textContent: "" },
    "dino-leaderboard-list": { innerHTML: "" },
    "dino-leaderboard-empty": { style: { display: "block" } }
  };

  const context = {
    console,
    Math,
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
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      }
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
      globalThis.__leaderboardTestApi = {
        getDefaultPlayerName,
        saveLeaderboardEntry,
        loadLeaderboard,
        beginDinoRun: typeof beginDinoRun === "function" ? beginDinoRun : undefined,
        getCurrentPlayerName() {
          return typeof dinoCurrentPlayerName === "string" ? dinoCurrentPlayerName : "";
        }
      };
    `,
    context
  );

  return {
    api: context.__leaderboardTestApi,
    elements
  };
}

test("getDefaultPlayerName returns a non-empty funny fallback name", () => {
  const { api } = loadLeaderboardHarness();
  const name = api.getDefaultPlayerName();
  assert.equal(typeof name, "string");
  assert.ok(name.trim().length > 0);
});

test("saveLeaderboardEntry keeps only the top 100 scores in descending order", () => {
  const { api } = loadLeaderboardHarness();
  for (let i = 0; i < 105; i++) {
    api.saveLeaderboardEntry({
      name: "Player " + i,
      score: i,
      level: "Test",
      timestamp: 1000 + i
    });
  }

  const rows = api.loadLeaderboard();
  assert.equal(rows.length, 100);
  assert.equal(rows[0].score, 104);
  assert.equal(rows[99].score, 5);
});

test("players with the same score keep earlier timestamps first", () => {
  const { api } = loadLeaderboardHarness();
  api.saveLeaderboardEntry({ name: "Late", score: 500, level: "L1", timestamp: 200 });
  api.saveLeaderboardEntry({ name: "Early", score: 500, level: "L1", timestamp: 100 });

  const rows = api.loadLeaderboard();
  assert.equal(rows[0].name, "Early");
  assert.equal(rows[1].name, "Late");
});

test("beginDinoRun uses a funny default name when the player leaves the field empty", () => {
  const { api, elements } = loadLeaderboardHarness();
  elements["dino-player-name"].value = "";
  elements["dino-current-player-name"].textContent = "";

  api.beginDinoRun();

  assert.ok(api.getCurrentPlayerName().trim().length > 0);
  assert.equal(elements["dino-player-name"].value, api.getCurrentPlayerName());
  assert.equal(elements["dino-current-player-name"].textContent, api.getCurrentPlayerName());
});
