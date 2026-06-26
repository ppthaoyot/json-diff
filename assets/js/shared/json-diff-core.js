(function(global) {
  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function renderSide(a, b, diff, options) {
    options = options || {};
    var showLineNumbers = options.showLineNumbers !== false;
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
      if (showLineNumbers) html += '<td class="ln">' + (index + 1) + "</td>";
      html += '<td class="sign">' + signA + "</td>";
      html += '<td class="code">' + esc(rowA.line) + "</td>";
      if (showLineNumbers) html += '<td class="ln">' + (index + 1) + "</td>";
      html += '<td class="sign">' + signB + "</td>";
      html += '<td class="code">' + esc(rowB.line) + "</td>";
      html += "</tr>";
    }

    return html + "</tbody></table>";
  }

  function segmentPath(path) {
    var parts = [];
    String(path || "").replace(/([^[.\]]+)|\[(\d+)\]/g, function(_, key, index) {
      parts.push(index !== undefined ? "[" + index + "]" : key);
      return _;
    });
    return parts;
  }

  function stringifyValue(value) {
    return esc(JSON.stringify(value));
  }

  function buildValueTree(value, label) {
    var node = {
      key: label,
      kind: Array.isArray(value) ? "array" : value === null ? "primitive" : typeof value === "object" ? "object" : "primitive",
      value: value,
      children: []
    };
    if (node.kind === "object") {
      Object.keys(value).forEach(function(key) {
        node.children.push(buildValueTree(value[key], key));
      });
    } else if (node.kind === "array") {
      value.forEach(function(item, index) {
        node.children.push(buildValueTree(item, "[" + index + "]"));
      });
    }
    return node;
  }

  function renderValueTreeNode(node, depth, collapsed) {
    var hasChildren = node.kind === "object" || node.kind === "array";
    var summary = "";
    if (node.kind === "object") summary = "{ " + node.children.length + " }";
    else if (node.kind === "array") summary = "[ " + node.children.length + " ]";
    var rowClass = "json-tree-row";
    var html = '<div class="json-tree-node' + (collapsed && hasChildren ? " is-collapsed" : "") + '" data-tree-node>';
    html += '<div class="' + rowClass + '" style="--tree-depth:' + depth + ';">';
    if (hasChildren) {
      html += '<button class="json-tree-toggle-btn" type="button" data-tree-toggle aria-expanded="' + (!collapsed) + '">' + (collapsed ? "+" : "−") + "</button>";
    } else {
      html += '<span class="json-tree-toggle-spacer"></span>';
    }
    if (typeof node.key === "string" && node.key.length) {
      html += '<span class="json-tree-key">' + esc(node.key) + "</span>";
      html += '<span class="json-tree-sep">:</span>';
    }
    if (hasChildren) {
      html += '<span class="json-tree-summary">' + esc(summary) + "</span>";
    } else {
      html += '<span class="json-tree-value">' + stringifyValue(node.value) + "</span>";
    }
    html += "</div>";
    if (hasChildren) {
      html += '<div class="json-tree-children" data-tree-children>';
      node.children.forEach(function(child) {
        html += renderValueTreeNode(child, depth + 1, collapsed);
      });
      html += "</div>";
    }
    html += "</div>";
    return html;
  }

  function renderJsonTree(value, options) {
    options = options || {};
    var root = buildValueTree(value, options.rootLabel || "");
    var html = '<div class="json-tree-view" data-tree-scope="value">';
    if (root.kind === "primitive") {
      html += renderValueTreeNode(root, 0, false);
    } else {
      root.children.forEach(function(child) {
        html += renderValueTreeNode(child, 0, !!options.collapsed);
      });
    }
    return html + "</div>";
  }

  function ensureDiffBranch(root, parts) {
    var branch = root;
    parts.forEach(function(part) {
      if (!branch.children[part]) {
        branch.children[part] = {
          key: part,
          type: "branch",
          children: {},
          order: []
        };
        branch.order.push(part);
      }
      branch = branch.children[part];
    });
    return branch;
  }

  function insertLeaf(root, path, payload) {
    var parts = segmentPath(path);
    var leafKey = parts.pop();
    var branch = ensureDiffBranch(root, parts);
    if (!branch.children[leafKey]) branch.order.push(leafKey);
    branch.children[leafKey] = {
      key: leafKey,
      type: "leaf",
      status: payload.status,
      value: payload.value,
      old: payload.old,
      nw: payload.nw
    };
  }

  function diffTreeModel(diff) {
    var root = { type: "branch", children: {}, order: [] };
    diff.added.forEach(function(item) {
      insertLeaf(root, item.k, { status: "add", value: item.v });
    });
    diff.removed.forEach(function(item) {
      insertLeaf(root, item.k, { status: "rem", value: item.v });
    });
    diff.changed.forEach(function(item) {
      insertLeaf(root, item.k, { status: "chg", old: item.old, nw: item.nw });
    });
    diff.same.forEach(function(item) {
      insertLeaf(root, item.k, { status: "same", value: item.v });
    });
    return root;
  }

  function renderDiffBranch(node, depth, collapsed) {
    var keys = node.order || Object.keys(node.children);
    var html = "";
    keys.forEach(function(key) {
      var child = node.children[key];
      if (!child) return;
      if (child.type === "leaf") {
        var leafClass = child.status === "add" ? "tree-add" : child.status === "rem" ? "tree-rem" : child.status === "chg" ? "tree-chg" : "tree-same";
        html += '<div class="json-tree-node" data-tree-node>';
        html += '<div class="json-tree-row ' + leafClass + '" style="--tree-depth:' + depth + ';">';
        html += '<span class="json-tree-toggle-spacer"></span>';
        html += '<span class="json-tree-key">' + esc(child.key) + '</span><span class="json-tree-sep">:</span>';
        if (child.status === "chg") {
          html += '<span class="json-tree-value">' + stringifyValue(child.old) + ' → ' + stringifyValue(child.nw) + "</span>";
        } else {
          html += '<span class="json-tree-value">' + stringifyValue(child.value) + "</span>";
        }
        html += "</div></div>";
      } else {
        html += '<div class="json-tree-node' + (collapsed ? " is-collapsed" : "") + '" data-tree-node>';
        html += '<div class="json-tree-row" style="--tree-depth:' + depth + ';">';
        html += '<button class="json-tree-toggle-btn" type="button" data-tree-toggle aria-expanded="' + (!collapsed) + '">' + (collapsed ? "+" : "−") + "</button>";
        html += '<span class="json-tree-key">' + esc(child.key) + '</span><span class="json-tree-sep">:</span>';
        html += '<span class="json-tree-summary">{ ' + Object.keys(child.children).length + ' }</span>';
        html += "</div>";
        html += '<div class="json-tree-children" data-tree-children>' + renderDiffBranch(child, depth + 1, collapsed) + "</div>";
        html += "</div>";
      }
    });
    return html;
  }

  function renderDiffTree(diff, options) {
    options = options || {};
    var hasDiff = diff.added.length || diff.removed.length || diff.changed.length || diff.same.length;
    if (!hasDiff) return '<div class="empty-hint">No data</div>';
    var model = diffTreeModel(diff);
    return '<div class="json-tree-view" data-tree-scope="diff">' + renderDiffBranch(model, 0, !!options.collapsed) + "</div>";
  }

  global.JsonDiffCore = {
    esc: esc,
    flatten: flatten,
    diffFlat: diffFlat,
    renderSide: renderSide,
    renderJsonTree: renderJsonTree,
    renderDiffTree: renderDiffTree
  };
})(typeof window !== "undefined" ? window : globalThis);
