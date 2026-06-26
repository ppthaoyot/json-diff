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

test("legacy index advertises a top 20 leaderboard and share actions", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /Top 20 Office Dino/i);
  assert.match(html, /copyDinoLeaderboard\(\)/i);
  assert.match(html, /importDinoLeaderboardFromPrompt\(\)/i);
});
