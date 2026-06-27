function getDinoGlobalLeaderboardEndpoint() {
  if (typeof window !== "undefined" && typeof window.DINO_GLOBAL_LEADERBOARD_ENDPOINT === "string") {
    return window.DINO_GLOBAL_LEADERBOARD_ENDPOINT.trim();
  }
  if (typeof document !== "undefined" && typeof document.querySelector === "function") {
    var meta = document.querySelector('meta[name="office-dino-global-endpoint"]');
    if (meta && typeof meta.getAttribute === "function") {
      return String(meta.getAttribute("content") || "").trim();
    }
  }
  return "";
}

function normalizeDinoSpeedMode(speedMode) {
  var value = String(speedMode || "normal").trim().toLowerCase();
  return /^(baby|easy|normal|hard)$/.test(value) ? value : "normal";
}

function normalizeDinoGlobalLeaderboardEntry(entry) {
  var speedMode = normalizeDinoSpeedMode(entry && entry.speedMode);
  return {
    name: String((entry && entry.name) || "").trim() || getDefaultPlayerName(),
    score: Number((entry && entry.score) || 0),
    level: String((entry && entry.level) || ""),
    speedMode: speedMode,
    speedLabel: String((entry && entry.speedLabel) || speedMode),
    timestamp: Number((entry && entry.timestamp) || Date.now())
  };
}

function normalizeDinoGlobalLeaderboardRows(rows, speedMode) {
  if (!Array.isArray(rows)) return [];
  var targetSpeedMode = normalizeDinoSpeedMode(speedMode);
  return sortLeaderboardEntries(rows.map(normalizeDinoGlobalLeaderboardEntry).filter(function(row) {
    return row.speedMode === targetSpeedMode;
  })).slice(0, dinoLeaderboardLimit);
}

function normalizeDinoGlobalLeaderboardPayload(payload, speedMode) {
  var source = payload && typeof payload === "object" ? payload : {};
  return {
    ok: Boolean(source.ok !== false),
    rows: normalizeDinoGlobalLeaderboardRows(source.rows, speedMode),
    message: String(source.message || ""),
    speedMode: normalizeDinoSpeedMode(source.speedMode || speedMode),
    updatedAt: Number(source.updatedAt || Date.now())
  };
}

function loadDinoGlobalLeaderboard(speedMode) {
  var endpoint = getDinoGlobalLeaderboardEndpoint();
  var normalizedSpeedMode = normalizeDinoSpeedMode(speedMode);
  if (!endpoint) {
    return Promise.resolve({
      ok: false,
      rows: [],
      message: "global leaderboard is not configured",
      speedMode: normalizedSpeedMode,
      updatedAt: Date.now()
    });
  }

  return new Promise(function(resolve, reject) {
    if (typeof document === "undefined" || typeof window === "undefined") {
      reject(new Error("browser-only transport"));
      return;
    }

    var callbackName = "__dinoLeaderboardJsonp_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    var script = document.createElement("script");
    var done = false;
    var timeoutId = setTimeout(function() {
      cleanup();
      reject(new Error("global leaderboard request timed out"));
    }, 8000);

    function cleanup() {
      if (done) return;
      done = true;
      clearTimeout(timeoutId);
      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    window[callbackName] = function(payload) {
      cleanup();
      resolve(normalizeDinoGlobalLeaderboardPayload(payload, normalizedSpeedMode));
    };

    script.onerror = function() {
      cleanup();
      reject(new Error("global leaderboard request failed"));
    };

    script.src = endpoint
      + (endpoint.indexOf("?") >= 0 ? "&" : "?")
      + "action=leaderboard"
      + "&limit=" + encodeURIComponent(String(dinoLeaderboardLimit))
      + "&speedMode=" + encodeURIComponent(normalizedSpeedMode)
      + "&callback=" + encodeURIComponent(callbackName)
      + "&_=" + encodeURIComponent(String(Date.now()));

    (document.body || document.head || document.documentElement).appendChild(script);
  });
}

function submitDinoGlobalLeaderboardEntry(entry) {
  var endpoint = getDinoGlobalLeaderboardEndpoint();
  if (!endpoint) {
    return Promise.resolve({
      ok: false,
      message: "global leaderboard is not configured"
    });
  }

  return new Promise(function(resolve, reject) {
    if (typeof document === "undefined") {
      reject(new Error("browser-only transport"));
      return;
    }

    var normalized = normalizeDinoGlobalLeaderboardEntry(entry);
    var form = document.createElement("form");
    var iframe = document.createElement("iframe");
    var frameName = "dino-global-submit-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    var settled = false;

    iframe.name = frameName;
    iframe.style.display = "none";

    form.method = "POST";
    form.action = endpoint;
    form.target = frameName;
    form.style.display = "none";

    [
      ["action", "submit"],
      ["name", normalized.name],
      ["score", String(normalized.score)],
      ["level", normalized.level],
      ["speedMode", normalized.speedMode],
      ["speedLabel", normalized.speedLabel],
      ["timestamp", String(normalized.timestamp)]
    ].forEach(function(pair) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = pair[0];
      input.value = pair[1];
      form.appendChild(input);
    });

    function cleanup() {
      if (form.parentNode) form.parentNode.removeChild(form);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    function finish(result) {
      if (settled) return;
      settled = true;
      setTimeout(cleanup, 200);
      resolve(result);
    }

    iframe.onload = function() {
      finish({ ok: true, message: "submitted" });
    };

    setTimeout(function() {
      if (!settled) finish({ ok: true, message: "submitted" });
    }, 1500);

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}
