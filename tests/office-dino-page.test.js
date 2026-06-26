const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const officeDinoPagePath = path.join(__dirname, "..", "pages", "office-dino.html");
const officeDinoScriptPath = path.join(__dirname, "..", "assets", "js", "pages", "office-dino.js");
const officeDinoCssPath = path.join(__dirname, "..", "assets", "css", "pages", "office-dino.css");
const globalLeaderboardScriptPath = path.join(__dirname, "..", "assets", "js", "shared", "global-leaderboard.js");

test("office dino has its own standalone page shell", () => {
  assert.ok(fs.existsSync(officeDinoPagePath), "pages/office-dino.html should exist");
  const html = fs.readFileSync(officeDinoPagePath, "utf8");

  assert.match(html, /<title>[\s\S]*Office Dino/i);
  assert.match(html, /<canvas[^>]+id="dino-game"/i);
  assert.match(html, /id="dino-player-name"/i);
  assert.match(html, /id="dino-leaderboard-list"/i);
  assert.match(html, /id="dino-global-leaderboard-list"/i);
});

test("office dino page loads shared and page-specific assets", () => {
  assert.ok(fs.existsSync(officeDinoScriptPath), "assets/js/pages/office-dino.js should exist");
  assert.ok(fs.existsSync(officeDinoCssPath), "assets/css/pages/office-dino.css should exist");
  assert.ok(fs.existsSync(globalLeaderboardScriptPath), "assets/js/shared/global-leaderboard.js should exist");
  const html = fs.readFileSync(officeDinoPagePath, "utf8");

  assert.match(html, /assets\/css\/base\.css/i);
  assert.match(html, /assets\/css\/layout\.css/i);
  assert.match(html, /assets\/css\/components\.css/i);
  assert.match(html, /assets\/css\/pages\/office-dino\.css/i);
  assert.match(html, /assets\/js\/shared\/ui\.js/i);
  assert.match(html, /assets\/js\/shared\/storage\.js/i);
  assert.match(html, /assets\/js\/shared\/global-leaderboard\.js/i);
  assert.match(html, /assets\/js\/pages\/office-dino\.js/i);
});

test("main index keeps Office Dino inside the legacy single-page flow", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /id="ptab-minigame"[\s\S]*?switchPage\('minigame'\)/i);
  assert.doesNotMatch(html, /id="ptab-minigame"[\s\S]*?href="pages\/office-dino\.html"/i);
});
