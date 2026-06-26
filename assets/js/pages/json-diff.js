document.addEventListener("DOMContentLoaded", function() {
  var i18n = window.I18N;
  var mode = "side";
  var textareaA = document.getElementById("ta-a");
  var textareaB = document.getElementById("ta-b");
  var resultEl = document.getElementById("result");
  var summaryEl = document.getElementById("summary");
  var statusA = document.getElementById("sta-a");
  var statusB = document.getElementById("sta-b");

  document.querySelectorAll("[data-mode]").forEach(function(button) {
    button.addEventListener("click", function() {
      mode = button.getAttribute("data-mode");
      document.querySelectorAll("[data-mode]").forEach(function(item) {
        item.classList.toggle("active", item === button);
      });
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
  textareaA.addEventListener("input", onInput);
  textareaB.addEventListener("input", onInput);

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

  function flatten(obj, prefix, out) {
    prefix = prefix || "";
    out = out || {};
    if (obj === null || typeof obj !== "object") {
      out[prefix] = obj;
      return out;
    }
    if (Array.isArray(obj)) {
      obj.forEach(function(item, index) {
        flatten(item, prefix ? prefix + "[" + index + "]" : "[" + index + "]", out);
      });
      return out;
    }
    Object.keys(obj).forEach(function(key) {
      var path = prefix ? prefix + "." + key : key;
      if (obj[key] !== null && typeof obj[key] === "object") flatten(obj[key], path, out);
      else out[path] = obj[key];
    });
    return out;
  }

  function diffFlat(a, b) {
    var flatA = flatten(a);
    var flatB = flatten(b);
    var keys = {};
    Object.keys(flatA).forEach(function(key) { keys[key] = true; });
    Object.keys(flatB).forEach(function(key) { keys[key] = true; });
    var added = [];
    var removed = [];
    var changed = [];
    var same = [];
    Object.keys(keys).sort().forEach(function(key) {
      if (!(key in flatA)) added.push({ k: key, v: flatB[key] });
      else if (!(key in flatB)) removed.push({ k: key, v: flatA[key] });
      else if (JSON.stringify(flatA[key]) !== JSON.stringify(flatB[key])) changed.push({ k: key, old: flatA[key], nw: flatB[key] });
      else same.push({ k: key, v: flatA[key] });
    });
    return { added: added, removed: removed, changed: changed, same: same };
  }

  function toLines(obj) {
    return JSON.stringify(obj, null, 2).split("\n");
  }

  function renderSide(a, b, diff) {
    var linesA = toLines(a);
    var linesB = toLines(b);
    var flatA = flatten(a);
    var flatB = flatten(b);
    var changed = {};
    var added = {};
    var removed = {};

    diff.changed.forEach(function(item) { changed[item.k] = true; });
    diff.added.forEach(function(item) { added[item.k] = true; });
    diff.removed.forEach(function(item) { removed[item.k] = true; });

    function classify(lines, flatObj, isRight) {
      return lines.map(function(line) {
        var match = line.match(/^\s*"([^"]+)":/);
        if (!match) return { line: line, cls: "" };
        var rawKey = match[1];
        var matchedPath = Object.keys(flatObj).find(function(key) {
          return key === rawKey || key.endsWith("." + rawKey);
        });
        if (!matchedPath) return { line: line, cls: "" };
        if (isRight && added[matchedPath]) return { line: line, cls: "row-add" };
        if (!isRight && removed[matchedPath]) return { line: line, cls: "row-rem" };
        if (changed[matchedPath]) return { line: line, cls: "row-chg" };
        return { line: line, cls: "" };
      });
    }

    var classifiedA = classify(linesA, flatA, false);
    var classifiedB = classify(linesB, flatB, true);
    var maxLength = Math.max(classifiedA.length, classifiedB.length);
    var html = '<table class="diff-table"><tbody>';

    for (var index = 0; index < maxLength; index++) {
      var rowA = classifiedA[index] || { line: "", cls: "" };
      var rowB = classifiedB[index] || { line: "", cls: "" };
      var rowClass = rowB.cls || rowA.cls;
      var signA = rowA.cls === "row-rem" ? "-" : rowA.cls === "row-chg" ? "~" : "";
      var signB = rowB.cls === "row-add" ? "+" : rowB.cls === "row-chg" ? "~" : "";
      html += '<tr class="' + rowClass + '">';
      html += '<td class="ln">' + (index + 1) + "</td>";
      html += '<td class="sign">' + signA + "</td>";
      html += '<td class="code">' + esc(rowA.line) + "</td>";
      html += '<td class="ln">' + (index + 1) + "</td>";
      html += '<td class="sign">' + signB + "</td>";
      html += '<td class="code">' + esc(rowB.line) + "</td>";
      html += "</tr>";
    }

    return html + "</tbody></table>";
  }

  function renderTree(diff) {
    if (!diff.added.length && !diff.removed.length && !diff.changed.length && !diff.same.length) {
      return '<div class="empty-hint">' + esc(i18n.t("jsonDiff.empty")) + "</div>";
    }
    var html = '<div class="tree-view">';
    diff.added.forEach(function(item) {
      html += '<div class="tree-add"><strong class="tree-path">+ ' + esc(item.k) + '</strong><div class="tree-val">' + esc(JSON.stringify(item.v)) + "</div></div>";
    });
    diff.removed.forEach(function(item) {
      html += '<div class="tree-rem"><strong class="tree-path">- ' + esc(item.k) + '</strong><div class="tree-val">' + esc(JSON.stringify(item.v)) + "</div></div>";
    });
    diff.changed.forEach(function(item) {
      html += '<div class="tree-chg"><strong class="tree-path">~ ' + esc(item.k) + '</strong><div class="tree-val">' + esc(JSON.stringify(item.old)) + " -> " + esc(JSON.stringify(item.nw)) + "</div></div>";
    });
    diff.same.forEach(function(item) {
      html += '<div class="tree-same"><strong class="tree-path">= ' + esc(item.k) + '</strong><div class="tree-val">' + esc(JSON.stringify(item.v)) + "</div></div>";
    });
    return html + "</div>";
  }

  function renderList(diff) {
    if (!diff.added.length && !diff.removed.length && !diff.changed.length) {
      return '<div class="empty-hint">' + esc(i18n.t("jsonDiff.match")) + "</div>";
    }
    var html = '<div class="list-view">';
    diff.added.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-add list-badge">' + esc(i18n.t("jsonDiff.added")) + '</span><div class="list-content"><strong class="tree-path">' + esc(item.k) + '</strong><span class="list-new">' + esc(JSON.stringify(item.v)) + "</span></div></div>";
    });
    diff.removed.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-rem list-badge">' + esc(i18n.t("jsonDiff.removed")) + '</span><div class="list-content"><strong class="tree-path">' + esc(item.k) + '</strong><span class="list-old">' + esc(JSON.stringify(item.v)) + "</span></div></div>";
    });
    diff.changed.forEach(function(item) {
      html += '<div class="list-item"><span class="stat stat-chg list-badge">' + esc(i18n.t("jsonDiff.changed")) + '</span><div class="list-content"><strong class="tree-path">' + esc(item.k) + '</strong><span class="list-old">' + esc(JSON.stringify(item.old)) + '</span><span class="list-new">' + esc(JSON.stringify(item.nw)) + "</span></div></div>";
    });
    return html + "</div>";
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
      resultEl.innerHTML = '<div class="empty-hint">' + esc(i18n.t("jsonDiff.empty")) + "</div>";
      return;
    }
    if (!parsedA.ok || !parsedB.ok) {
      summaryEl.innerHTML = "";
      resultEl.innerHTML = '<div class="empty-hint">' + esc(i18n.t("jsonDiff.invalid")) + "</div>";
      return;
    }

    var diff = diffFlat(parsedA.val, parsedB.val);
    summaryEl.innerHTML =
      '<span class="stat stat-add">+ ' + esc(i18n.t("jsonDiff.added")) + " " + diff.added.length + "</span>" +
      '<span class="stat stat-rem">- ' + esc(i18n.t("jsonDiff.removed")) + " " + diff.removed.length + "</span>" +
      '<span class="stat stat-chg">~ ' + esc(i18n.t("jsonDiff.changed")) + " " + diff.changed.length + "</span>" +
      '<span class="stat stat-same">= ' + esc(i18n.t("jsonDiff.same")) + " " + diff.same.length + "</span>";

    if (mode === "side") resultEl.innerHTML = renderSide(parsedA.val, parsedB.val, diff);
    else if (mode === "tree") resultEl.innerHTML = renderTree(diff);
    else resultEl.innerHTML = renderList(diff);
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
    resultEl.innerHTML = '<div class="empty-hint">' + esc(i18n.t("jsonDiff.empty")) + "</div>";
  }

  window.addEventListener("i18n:updated", onInput);
  onInput();
});
