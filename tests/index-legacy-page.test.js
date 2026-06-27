const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const indexPath = path.join(__dirname, "..", "index.html");

test("legacy index uses an in-page minigame tab again", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /<button class="page-tab" id="ptab-minigame"[\s\S]*?onclick="switchPage\('minigame'\)"/i);
  assert.doesNotMatch(html, /id="ptab-minigame"[\s\S]*?href="pages\/office-dino\.html"/i);
});

test("legacy index keeps both local and global Office Dino leaderboards", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /Top 20 Office Dino/i);
  assert.match(html, /Global Top 20/i);
});

test("legacy index styles Office Dino as full-width gameplay with ranking below", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /#mg-hub-dino\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/i);
  assert.match(html, /\.dino-stage-panel\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1/i);
  assert.match(html, /\.dino-meta-panel\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1/i);
  assert.match(html, /\.dino-meta-panel\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/i);
  assert.match(html, /<form class="dino-player-form"[\s\S]*?<div class="dino-canvas-wrap">[\s\S]*?<div class="dino-controls">[\s\S]*?<div class="dino-meta-panel">/i);
  assert.doesNotMatch(html, /grid-template-columns:\s*minmax\(0,\s*2fr\)\s*minmax\(300px,\s*1fr\)/i);
});

test("legacy minigame hub restores Office Dino as a grid after switching back from box game", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /document\.getElementById\('mg-hub-dino'\)\.style\.display\s*=\s*\(game === 'dino'\)\s*\?\s*'grid'\s*:\s*'none'/i);
});

test("legacy Office Dino submits global scores with the selected speed mode", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /function getDinoCurrentSpeedMode\(\)/i);
  assert.match(html, /speedMode:\s*getDinoCurrentSpeedMode\(\)/i);
  assert.match(html, /syncDinoGlobalLeaderboard\(false\)/i);
});

test("legacy Office Dino ignores gameplay shortcuts while typing player name", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /function isDinoTypingTarget\(target\)/i);
  assert.match(html, /if\s*\(isDinoTypingTarget\(e\.target\)\)\s*return;/i);
});

test("legacy Office Dino speed presets are relaxed for easier early play", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /mode === "baby"[\s\S]*dinoConfig\.baseSpeed\s*=\s*2\.4[\s\S]*dinoConfig\.maxSpeed\s*=\s*5\.2/i);
  assert.match(html, /mode === "easy"[\s\S]*dinoConfig\.baseSpeed\s*=\s*3\.6[\s\S]*dinoConfig\.maxSpeed\s*=\s*8\.2/i);
  assert.match(html, /mode === "normal"[\s\S]*dinoConfig\.baseSpeed\s*=\s*4\.3[\s\S]*dinoConfig\.maxSpeed\s*=\s*10\.5/i);
  assert.match(html, /mode === "hard"[\s\S]*dinoConfig\.baseSpeed\s*=\s*5\.8[\s\S]*dinoConfig\.maxSpeed\s*=\s*14\.5/i);
});

test("legacy Office Dino exposes a share score card action after game over", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /id="dino-score-card"/i);
  assert.match(html, /onclick="copyDinoScoreCard\(\)"/i);
  assert.match(html, /function buildDinoScoreCardText\([^)]*\)/i);
});
