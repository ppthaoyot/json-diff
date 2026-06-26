const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const helperPath = path.join(__dirname, "..", "assets", "js", "shared", "global-leaderboard.js");
const appsScriptPath = path.join(__dirname, "..", "apps-script", "office-dino-leaderboard.gs");

test("global leaderboard helper exists and exposes core transport functions", () => {
  assert.ok(fs.existsSync(helperPath), "assets/js/shared/global-leaderboard.js should exist");
  const code = fs.readFileSync(helperPath, "utf8");

  assert.match(code, /function getDinoGlobalLeaderboardEndpoint/i);
  assert.match(code, /function loadDinoGlobalLeaderboard/i);
  assert.match(code, /function submitDinoGlobalLeaderboardEntry/i);
});

test("apps script backend exists with doGet and doPost handlers", () => {
  assert.ok(fs.existsSync(appsScriptPath), "apps-script/office-dino-leaderboard.gs should exist");
  const code = fs.readFileSync(appsScriptPath, "utf8");

  assert.match(code, /function doGet\(e\)/i);
  assert.match(code, /function doPost\(e\)/i);
  assert.match(code, /SpreadsheetApp/i);
  assert.match(code, /ContentService/i);
});
