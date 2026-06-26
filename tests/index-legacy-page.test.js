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

test("legacy index styles Office Dino like a stage plus side panel", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /#mg-hub-dino\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*2fr\)\s*minmax\(300px,\s*1fr\)/i);
  assert.match(html, /\.dino-meta-panel\s*\{[\s\S]*grid-column:\s*2/i);
  assert.match(html, /\.dino-meta-panel\s*\{[\s\S]*grid-row:\s*2;/i);
  assert.doesNotMatch(html, /\.dino-meta-panel\s*\{[\s\S]*grid-row:\s*2\s*\/\s*span\s*2/i);
});

test("legacy minigame hub restores Office Dino as a grid after switching back from box game", () => {
  const html = fs.readFileSync(indexPath, "utf8");

  assert.match(html, /document\.getElementById\('mg-hub-dino'\)\.style\.display\s*=\s*\(game === 'dino'\)\s*\?\s*'grid'\s*:\s*'none'/i);
});
