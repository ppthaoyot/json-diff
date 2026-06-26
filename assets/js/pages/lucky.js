document.addEventListener("DOMContentLoaded", function() {
  var i18n = window.I18N;
  var luckyMode = 2;
  var luckyHistory = [];
  var spinning = false;

  function fortunes() {
    return [
      { stars: 5, msg: i18n.t("lucky.fortune5") },
      { stars: 4, msg: i18n.t("lucky.fortune4") },
      { stars: 3, msg: i18n.t("lucky.fortune3") },
      { stars: 2, msg: i18n.t("lucky.fortune2") },
      { stars: 1, msg: i18n.t("lucky.fortune1") }
    ];
  }

  function labels() {
    return {
      2: i18n.t("lucky.label2"),
      3: i18n.t("lucky.label3"),
      6: i18n.t("lucky.label6")
    };
  }

  document.querySelectorAll("[data-lucky-mode]").forEach(function(button) {
    button.addEventListener("click", function() {
      setLuckyMode(parseInt(button.getAttribute("data-lucky-mode"), 10));
    });
  });
  document.getElementById("lucky-spin-btn").addEventListener("click", spinLucky);
  document.getElementById("lucky-clear-btn").addEventListener("click", clearLuckyHistory);

  function genLuckyNumber(mode) {
    return String(Math.floor(Math.random() * Math.pow(10, mode))).padStart(mode, "0");
  }

  function setLuckyMode(mode) {
    luckyMode = mode;
    document.querySelectorAll("[data-lucky-mode]").forEach(function(button) {
      button.classList.toggle("active", parseInt(button.getAttribute("data-lucky-mode"), 10) === mode);
    });
    document.getElementById("lucky-mode-info").textContent = labels()[mode];
    document.getElementById("lucky-numbers").textContent = mode === 2 ? "??" : mode === 3 ? "???" : "??????";
    document.getElementById("lucky-subtitle").textContent = i18n.t("lucky.subtitleIdle");
    document.getElementById("lucky-stars").textContent = "";
    document.getElementById("lucky-fortune").textContent = "";
  }

  function spinLucky() {
    if (spinning) return;
    spinning = true;
    var button = document.getElementById("lucky-spin-btn");
    var numberEl = document.getElementById("lucky-numbers");
    button.disabled = true;
    button.textContent = i18n.t("lucky.drawing");

    var ticks = 0;
    var rollTimer = setInterval(function() {
      ticks += 1;
      numberEl.textContent = genLuckyNumber(luckyMode);
      if (ticks < 18) return;

      clearInterval(rollTimer);
      var finalNumber = genLuckyNumber(luckyMode);
      var fortuneSet = fortunes();
      var fortune = fortuneSet[Math.floor(Math.random() * fortuneSet.length)];
      numberEl.textContent = finalNumber;
      document.getElementById("lucky-subtitle").textContent = i18n.t("lucky.subtitleDone");
      document.getElementById("lucky-stars").textContent = "★".repeat(fortune.stars) + "☆".repeat(5 - fortune.stars);
      document.getElementById("lucky-fortune").textContent = fortune.msg;

      luckyHistory.unshift({ num: finalNumber, mode: luckyMode });
      if (luckyHistory.length > 18) luckyHistory = luckyHistory.slice(0, 18);
      renderLuckyHistory();

      spinning = false;
      button.disabled = false;
      button.textContent = i18n.t("lucky.spinAgain");
    }, 60);
  }

  function renderLuckyHistory() {
    var historyEl = document.getElementById("lucky-history-items");
    if (!luckyHistory.length) {
      historyEl.innerHTML = '<div class="empty-hint">' + esc(i18n.t("lucky.noHistory")) + "</div>";
      return;
    }
    historyEl.innerHTML = '<div class="history-chip-wrap">' + luckyHistory.map(function(item) {
      return '<button class="history-chip" type="button" data-copy="' + item.num + '" title="' + labels()[item.mode] + '">' + item.num + "</button>";
    }).join("") + "</div>";
    historyEl.querySelectorAll("[data-copy]").forEach(function(button) {
      button.addEventListener("click", function() {
        copyToClipboard(button.getAttribute("data-copy"));
      });
    });
  }

  function clearLuckyHistory() {
    luckyHistory = [];
    renderLuckyHistory();
  }

  window.addEventListener("i18n:updated", function() {
    setLuckyMode(luckyMode);
    renderLuckyHistory();
  });

  setLuckyMode(2);
  clearLuckyHistory();
});
