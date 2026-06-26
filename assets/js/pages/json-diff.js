document.addEventListener("DOMContentLoaded", function() {
  var i18n = window.I18N;
  var core = window.JsonDiffCore;
  var mode = "side";
  var showLineNumbers = true;
  var structureViewBySide = { a: false, b: false };
  var textareaA = document.getElementById("ta-a");
  var textareaB = document.getElementById("ta-b");
  var lineNumbersA = document.getElementById("line-numbers-a");
  var lineNumbersB = document.getElementById("line-numbers-b");
  var treePanelA = document.getElementById("json-tree-panel-a");
  var treePanelB = document.getElementById("json-tree-panel-b");
  var shellA = document.getElementById("json-editor-shell-a");
  var shellB = document.getElementById("json-editor-shell-b");
  var resultEl = document.getElementById("result");
  var summaryEl = document.getElementById("summary");
  var statusA = document.getElementById("sta-a");
  var statusB = document.getElementById("sta-b");
  var lineNumberToggle = document.getElementById("line-number-toggle");
  var expandAllButton = document.getElementById("json-tree-expand-all");
  var collapseAllButton = document.getElementById("json-tree-collapse-all");

  document.querySelectorAll("[data-mode]").forEach(function(button) {
    button.addEventListener("click", function() {
      mode = button.getAttribute("data-mode");
      document.querySelectorAll("[data-mode]").forEach(function(item) {
        item.classList.toggle("active", item === button);
      });
      syncTreeToolbar();
      onInput();
    });
  });

  document.querySelectorAll(".json-structure-toggle").forEach(function(button) {
    button.addEventListener("click", function() {
      var side = button.getAttribute("data-side");
      structureViewBySide[side] = !structureViewBySide[side];
      updateEditorShell(side);
      onInput();
    });
  });

  document.getElementById("load-example-btn").addEventListener("click", loadExample);
  document.getElementById("clear-json-btn").addEventListener("click", clearAll);
  document.getElementById("format-a-btn").addEventListener("click", function() { formatJSON("a"); });
  document.getElementById("format-b-btn").addEventListener("click", function() { formatJSON("b"); });
  document.getElementById("minify-a-btn").addEventListener("click", function() { minifyJSON("a"); });
  document.getElementById("minify-b-btn").addEventListener("click", function() { minifyJSON("b"); });
  document.getElementById("copy-a-btn").addEventListener("click", function() { copyJSON("a"); });
  document.getElementById("copy-b-btn").addEventListener("click", function() { copyJSON("b"); });
  document.getElementById("fix-a-btn").addEventListener("click", function() { autoFixJSON("a"); });
  document.getElementById("fix-b-btn").addEventListener("click", function() { autoFixJSON("b"); });

  [textareaA, textareaB].forEach(function(textarea) {
    textarea.addEventListener("input", onInput);
    textarea.addEventListener("scroll", function() {
      var gutter = textarea === textareaA ? lineNumbersA : lineNumbersB;
      gutter.scrollTop = textarea.scrollTop;
    });
  });

  lineNumberToggle.addEventListener("click", function() {
    showLineNumbers = !showLineNumbers;
    lineNumberToggle.classList.toggle("is-primary", showLineNumbers);
    updateLineNumberToggleLabel();
    updateEditorShell("a");
    updateEditorShell("b");
    onInput();
  });

  expandAllButton.addEventListener("click", function() {
    setTreeExpansion(document, false);
  });

  collapseAllButton.addEventListener("click", function() {
    setTreeExpansion(document, true);
  });

  document.addEventListener("click", function(event) {
    var toggle = event.target.closest("[data-tree-toggle]");
    if (!toggle) return;
    var node = toggle.closest("[data-tree-node]");
    if (!node) return;
    node.classList.toggle("is-collapsed");
    toggle.textContent = node.classList.contains("is-collapsed") ? "+" : "−";
    toggle.setAttribute("aria-expanded", String(!node.classList.contains("is-collapsed")));
  });

  function tryParse(value) {
    try {
      return { ok: true, val: JSON.parse(value.trim()) };
    } catch (error) {
      return { ok: false, err: error.message };
    }
  }

  function setStatus(element, ok) {
    if (!element) return;
    if (!ok) {
      element.textContent = i18n.t("jsonDiff.statusInvalid");
      element.className = "tool-status err";
      return;
    }
    element.textContent = i18n.t("jsonDiff.statusValid");
    element.className = "tool-status ok";
  }

  function updateLineNumbers(textarea, gutter) {
    var lineCount = Math.max(1, textarea.value.split("\n").length);
    var lines = [];
    for (var index = 1; index <= lineCount; index++) lines.push(String(index));
    gutter.textContent = lines.join("\n");
    gutter.scrollTop = textarea.scrollTop;
  }

  function updateLineNumberToggleLabel() {
    lineNumberToggle.textContent = i18n.t(showLineNumbers ? "jsonDiff.lineNumbersOn" : "jsonDiff.lineNumbersOff");
  }

  function updateStructureButton(side) {
    var button = document.getElementById("json-structure-toggle-" + side);
    var isStructure = structureViewBySide[side];
    button.textContent = i18n.t(isStructure ? "jsonDiff.rawView" : "jsonDiff.structureView");
    button.setAttribute("data-view", isStructure ? "structure" : "raw");
  }

  function updateEditorShell(side) {
    var shell = side === "a" ? shellA : shellB;
    shell.classList.toggle("is-structure", structureViewBySide[side]);
    shell.classList.toggle("is-line-numbers-hidden", !showLineNumbers);
    updateStructureButton(side);
  }

  function setTreeExpansion(scope, collapsed) {
    scope.querySelectorAll("[data-tree-node]").forEach(function(node) {
      if (!node.querySelector("[data-tree-toggle]")) return;
      node.classList.toggle("is-collapsed", collapsed);
      var toggle = node.querySelector("[data-tree-toggle]");
      if (toggle) {
        toggle.textContent = collapsed ? "+" : "−";
        toggle.setAttribute("aria-expanded", String(!collapsed));
      }
    });
  }

  function syncTreeToolbar() {
    var enabled = mode === "tree";
    expandAllButton.disabled = !enabled;
    collapseAllButton.disabled = !enabled;
  }

  function renderEditorTree(side, parsed) {
    var panel = side === "a" ? treePanelA : treePanelB;
    if (!structureViewBySide[side]) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    if (!parsed || !parsed.ok) {
      panel.innerHTML = '<div class="empty-hint">' + core.esc(i18n.t("jsonDiff.invalid")) + "</div>";
      return;
    }
    panel.innerHTML = core.renderJsonTree(parsed.val, { collapsed: false });
  }

  function formatJSON(side) {
    var textarea = document.getElementById("ta-" + side);
    if (!textarea.value.trim()) return;
    var parsed = tryParse(textarea.value.trim());
    if (!parsed.ok) {
      textarea.classList.add("invalid");
      return;
    }
    textarea.value = JSON.stringify(parsed.val, null, 2);
    textarea.classList.remove("invalid");
    onInput();
  }

  function minifyJSON(side) {
    var textarea = document.getElementById("ta-" + side);
    if (!textarea.value.trim()) return;
    var parsed = tryParse(textarea.value.trim());
    if (!parsed.ok) {
      textarea.classList.add("invalid");
      return;
    }
    textarea.value = JSON.stringify(parsed.val);
    textarea.classList.remove("invalid");
    onInput();
  }

  function copyJSON(side) {
    var textarea = document.getElementById("ta-" + side);
    if (!textarea.value) return;
    navigator.clipboard.writeText(textarea.value).then(function() {
      var button = document.getElementById("copy-" + side + "-btn");
      var original = button.textContent;
      button.textContent = i18n.t("common.copied");
      setTimeout(function() { button.textContent = original; }, 1200);
    });
  }

  function attemptFix(raw) {
    var value = raw;
    var fixes = [];
    value = value.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    value = value.replace(/\/\/[^\n\r]*/g, function() {
      fixes.push(i18n.t("jsonDiff.fixLineComments"));
      return "";
    });
    if (/\/\*[\s\S]*?\*\//.test(value)) {
      value = value.replace(/\/\*[\s\S]*?\*\//g, "");
      fixes.push(i18n.t("jsonDiff.fixBlockComments"));
    }
    if (/'/.test(value)) {
      value = value.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, function(_, inner) {
        return '"' + inner.replace(/"/g, '\\"') + '"';
      });
      fixes.push(i18n.t("jsonDiff.fixSingleQuotes"));
    }
    if (/[{,]\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/.test(value)) {
      value = value.replace(/([{,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, function(_, prefix, key) {
        return prefix + '"' + key + '":';
      });
      fixes.push(i18n.t("jsonDiff.fixObjectKeys"));
    }
    if (/,\s*[}\]]/.test(value)) {
      value = value.replace(/,(\s*[}\]])/g, "$1");
      fixes.push(i18n.t("jsonDiff.fixTrailingCommas"));
    }
    if (/\bundefined\b/.test(value)) {
      value = value.replace(/\bundefined\b/g, "null");
      fixes.push(i18n.t("jsonDiff.fixUndefined"));
    }
    if (/\b(True|False|None)\b/.test(value)) {
      value = value.replace(/\bTrue\b/g, "true").replace(/\bFalse\b/g, "false").replace(/\bNone\b/g, "null");
      fixes.push(i18n.t("jsonDiff.fixPython"));
    }
    if (/;\s*$/.test(value.trim())) {
      value = value.trim().replace(/;+$/, "");
      fixes.push(i18n.t("jsonDiff.fixSemicolons"));
    }
    var parsed = tryParse(value);
    if (parsed.ok) return { ok: true, fixed: value, fixes: fixes };
    return { ok: false, fixes: fixes, err: parsed.err };
  }

  function autoFixJSON(side) {
    var textarea = document.getElementById("ta-" + side);
    var value = textarea.value.trim();
    if (!value) return;
    if (tryParse(value).ok) {
      showToast(i18n.t("jsonDiff.toastAlreadyValidTitle"), i18n.t("jsonDiff.toastAlreadyValidBody"), "ok");
      return;
    }
    var fixed = attemptFix(value);
    if (!fixed.ok) {
      showToast(i18n.t("jsonDiff.toastFixFailTitle"), fixed.err || "Unknown parser error", "err");
      return;
    }
    textarea.value = JSON.stringify(JSON.parse(fixed.fixed), null, 2);
    showToast(i18n.t("jsonDiff.toastFixSuccessTitle"), fixed.fixes.join(", ") || i18n.t("jsonDiff.toastFixSuccessBody"), "fix");
    onInput();
  }

  function onInput() {
    var valueA = textareaA.value.trim();
    var valueB = textareaB.value.trim();
    var parsedA = valueA ? tryParse(valueA) : null;
    var parsedB = valueB ? tryParse(valueB) : null;

    updateLineNumbers(textareaA, lineNumbersA);
    updateLineNumbers(textareaB, lineNumbersB);
    renderEditorTree("a", parsedA);
    renderEditorTree("b", parsedB);

    if (valueA) {
      textareaA.classList.toggle("invalid", !parsedA.ok);
      setStatus(statusA, parsedA.ok);
    } else {
      textareaA.classList.remove("invalid");
      statusA.textContent = "";
    }
    if (valueB) {
      textareaB.classList.toggle("invalid", !parsedB.ok);
      setStatus(statusB, parsedB.ok);
    } else {
      textareaB.classList.remove("invalid");
      statusB.textContent = "";
    }

    if (!valueA || !valueB) {
      summaryEl.innerHTML = "";
      resultEl.innerHTML = '<div class="empty-hint">' + core.esc(i18n.t("jsonDiff.empty")) + "</div>";
      return;
    }
    if (!parsedA.ok || !parsedB.ok) {
      summaryEl.innerHTML = "";
      resultEl.innerHTML = '<div class="empty-hint">' + core.esc(i18n.t("jsonDiff.invalid")) + "</div>";
      return;
    }

    var diff = core.diffFlat(parsedA.val, parsedB.val);
    summaryEl.innerHTML =
      '<span class="stat stat-add">+ ' + core.esc(i18n.t("jsonDiff.added")) + " " + diff.added.length + "</span>" +
      '<span class="stat stat-rem">- ' + core.esc(i18n.t("jsonDiff.removed")) + " " + diff.removed.length + "</span>" +
      '<span class="stat stat-chg">~ ' + core.esc(i18n.t("jsonDiff.changed")) + " " + diff.changed.length + "</span>" +
      '<span class="stat stat-same">= ' + core.esc(i18n.t("jsonDiff.same")) + " " + diff.same.length + "</span>";

    if (mode === "side") resultEl.innerHTML = core.renderSide(parsedA.val, parsedB.val, diff, { showLineNumbers: showLineNumbers });
    else if (mode === "tree") resultEl.innerHTML = core.renderDiffTree(diff, { collapsed: false });
    else resultEl.innerHTML = renderList(diff);
  }

  function renderList(diff) {
    if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
      return '<div class="empty-hint">' + core.esc(i18n.t("jsonDiff.match")) + "</div>";
    }
    var html = '<div class="list-view">';
    diff.added.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-add list-badge">' + core.esc(i18n.t("jsonDiff.added")) + '</span><div class="list-content"><strong class="tree-path">' + core.esc(item.k) + '</strong><span class="list-new">' + core.esc(JSON.stringify(item.v)) + "</span></div></div>";
    });
    diff.removed.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-rem list-badge">' + core.esc(i18n.t("jsonDiff.removed")) + '</span><div class="list-content"><strong class="tree-path">' + core.esc(item.k) + '</strong><span class="list-old">' + core.esc(JSON.stringify(item.v)) + "</span></div></div>";
    });
    diff.changed.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-chg list-badge">' + core.esc(i18n.t("jsonDiff.changed")) + '</span><div class="list-content"><strong class="tree-path">' + core.esc(item.k) + '</strong><span class="list-old">' + core.esc(JSON.stringify(item.old)) + '</span><span class="list-new">' + core.esc(JSON.stringify(item.nw)) + "</span></div></div>";
    });
    return html + "</div>";
  }

  function loadExample() {
    textareaA.value = JSON.stringify({
      name: "Alice",
      age: 30,
      role: "developer",
      address: { city: "Bangkok", zip: "10110" },
      tags: ["javascript", "python"]
    }, null, 2);
    textareaB.value = JSON.stringify({
      name: "Alice",
      age: 31,
      role: "senior developer",
      address: { city: "Bangkok", zip: "10120", country: "Thailand" },
      tags: ["javascript", "python", "go"],
      email: "alice@example.com"
    }, null, 2);
    onInput();
  }

  function clearAll() {
    textareaA.value = "";
    textareaB.value = "";
    statusA.textContent = "";
    statusB.textContent = "";
    textareaA.classList.remove("invalid");
    textareaB.classList.remove("invalid");
    summaryEl.innerHTML = "";
    resultEl.innerHTML = '<div class="empty-hint">' + core.esc(i18n.t("jsonDiff.empty")) + "</div>";
    onInput();
  }

  window.addEventListener("i18n:updated", function() {
    updateLineNumberToggleLabel();
    updateStructureButton("a");
    updateStructureButton("b");
    onInput();
  });

  updateLineNumberToggleLabel();
  updateEditorShell("a");
  updateEditorShell("b");
  syncTreeToolbar();
  onInput();
});
