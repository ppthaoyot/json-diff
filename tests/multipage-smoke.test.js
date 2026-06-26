const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const pagesDir = path.join(root, "pages");

const pageChecks = [
  { file: "json-diff.html", script: "json-diff.js", title: /JSON Diff/i },
  { file: "base64-encode.html", script: "base64-encode.js", title: /Base64 Encode/i },
  { file: "base64-decode.html", script: "base64-decode.js", title: /Base64 Decode/i },
  { file: "thai-id.html", script: "thai-id.js", title: /Thai ID/i },
  { file: "lucky.html", script: "lucky.js", title: /Lucky Draw/i }
];

test("landing page exists and links to all standalone pages", () => {
  const landingPath = path.join(pagesDir, "index.html");
  assert.ok(fs.existsSync(landingPath), "pages/index.html should exist");
  const html = fs.readFileSync(landingPath, "utf8");

  [
    "json-diff.html",
    "base64-encode.html",
    "base64-decode.html",
    "thai-id.html",
    "lucky.html",
    "office-dino.html",
    "../index.html"
  ].forEach((href) => {
    assert.match(html, new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  });
});

test("each standalone tool page loads shared assets and its page script", () => {
  pageChecks.forEach(({ file, script, title }) => {
    const pagePath = path.join(pagesDir, file);
    assert.ok(fs.existsSync(pagePath), `${file} should exist`);
    const html = fs.readFileSync(pagePath, "utf8");

    assert.match(html, title);
    assert.match(html, /assets\/css\/base\.css/i);
    assert.match(html, /assets\/css\/layout\.css/i);
    assert.match(html, /assets\/css\/components\.css/i);
    assert.match(html, /assets\/css\/pages\/tools\.css/i);
    assert.match(html, /assets\/js\/shared\/ui\.js/i);
    assert.match(html, /assets\/js\/shared\/storage\.js/i);
    assert.match(html, new RegExp("assets\\/js\\/pages\\/" + script.replace(".", "\\."), "i"));
  });
});

test("seo support files reference the expected standalone URLs", () => {
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

  assert.match(robots, /Sitemap:\s*\/sitemap\.xml/i);
  [
    "/pages/index.html",
    "/pages/json-diff.html",
    "/pages/base64-encode.html",
    "/pages/base64-decode.html",
    "/pages/thai-id.html",
    "/pages/lucky.html",
    "/pages/office-dino.html"
  ].forEach((url) => {
    assert.match(sitemap, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  });
});
