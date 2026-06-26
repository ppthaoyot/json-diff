const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const legacyPath = path.join(root, "index.html");
const standalonePath = path.join(root, "pages", "json-diff.html");
const helperPath = path.join(root, "assets", "js", "shared", "json-diff-core.js");

function loadJsonDiffCore() {
  const code = fs.readFileSync(helperPath, "utf8");
  const context = {
    window: {},
    console
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return context.window.JsonDiffCore;
}

test("json diff pages expose line number and structure toggles", () => {
  const legacyHtml = fs.readFileSync(legacyPath, "utf8");
  const standaloneHtml = fs.readFileSync(standalonePath, "utf8");

  [legacyHtml, standaloneHtml].forEach((html) => {
    assert.match(html, /line-number-toggle/i);
    assert.match(html, /json-structure-toggle/i);
    assert.match(html, /json-tree-a|json-tree-panel-a/i);
    assert.match(html, /json-tree-b|json-tree-panel-b/i);
  });

  assert.doesNotMatch(legacyHtml, /json-tree-expand-all|tree-expand-all/i);
  assert.doesNotMatch(legacyHtml, /json-tree-collapse-all|tree-collapse-all/i);
  assert.match(standaloneHtml, /json-tree-expand-all|tree-expand-all/i);
  assert.match(standaloneHtml, /json-tree-collapse-all|tree-collapse-all/i);
});

test("shared json diff core exposes rendering helpers for side view and collapsible trees", () => {
  assert.ok(fs.existsSync(helperPath), "assets/js/shared/json-diff-core.js should exist");
  const core = loadJsonDiffCore();

  assert.equal(typeof core.diffFlat, "function");
  assert.equal(typeof core.renderSide, "function");
  assert.equal(typeof core.renderJsonTree, "function");
  assert.equal(typeof core.renderDiffTree, "function");
});

test("side-by-side rendering can hide line numbers", () => {
  const core = loadJsonDiffCore();
  const left = { user: { name: "Ann" }, score: 1 };
  const right = { user: { name: "Ann" }, score: 2 };
  const diff = core.diffFlat(left, right);

  const withLines = core.renderSide(left, right, diff, { showLineNumbers: true });
  const withoutLines = core.renderSide(left, right, diff, { showLineNumbers: false });

  assert.match(withLines, /class="ln"/i);
  assert.doesNotMatch(withoutLines, /class="ln"/i);
});

test("json tree rendering outputs collapsible nodes for nested objects", () => {
  const core = loadJsonDiffCore();
  const html = core.renderJsonTree({
    user: {
      profile: {
        name: "Ann"
      }
    },
    tags: ["a", "b"]
  }, { collapsed: false });

  assert.match(html, /data-tree-toggle/i);
  assert.match(html, /data-tree-node/i);
  assert.match(html, /profile/i);
  assert.match(html, /tags/i);
});

test("diff tree rendering groups nested changes and supports collapsed output", () => {
  const core = loadJsonDiffCore();
  const diff = core.diffFlat(
    { user: { name: "Ann", age: 20 } },
    { user: { name: "Ann", age: 21, role: "dev" } }
  );

  const html = core.renderDiffTree(diff, { collapsed: true });

  assert.match(html, /data-tree-toggle/i);
  assert.match(html, /user/i);
  assert.match(html, /age/i);
  assert.match(html, /role/i);
  assert.match(html, /is-collapsed/i);
});
