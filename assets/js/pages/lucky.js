document.addEventListener("DOMContentLoaded", function() {
  var luckyMode = 2;
  var luckyHistory = [];
  var spinning = false;
  var fortunes = [
    { stars: 5, msg: "Rocket energy. If luck has office hours, this number showed up early." },
    { stars: 4, msg: "Strong vibes. Not guaranteed riches, but definitely dramatic confidence." },
    { stars: 3, msg: "Steady luck. Respectable, practical, and mildly suspicious in a good way." },
    { stars: 2, msg: "A gentle maybe. Sometimes medium luck lands the biggest plot twist." },
    { stars: 1, msg: "Risky aura. Maybe the universe wants a rematch." }
  ];
  var labels = {
    2: "2-digit lucky draw (00-99)",
    3: "3-digit lucky draw (000-999)",
    6: "6-digit lucky draw (000000-999999)"
  };

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
    document.getElementById("lucky-mode-info").textContent = labels[mode];
    document.getElementById("lucky-numbers").textContent = mode === 2 ? "??" : mode === 3 ? "???" : "??????";
    document.getElementById("lucky-subtitle").textContent = "Tap the button below when you want a new number.";
    document.getElementById("lucky-stars").textContent = "";
    document.getElementById("lucky-fortune").textContent = "";
  }

  function spinLucky() {
    if (spinning) return;
    spinning = true;
    var button = document.getElementById("lucky-spin-btn");
    var numberEl = document.getElementById("lucky-numbers");
    button.disabled = true;
    button.textContent = "Drawing...";

    var ticks = 0;
    var rollTimer = setInterval(function() {
      ticks += 1;
      numberEl.textContent = genLuckyNumber(luckyMode);
      if (ticks < 18) return;

      clearInterval(rollTimer);
      var finalNumber = genLuckyNumber(luckyMode);
      var fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      numberEl.textContent = finalNumber;
      document.getElementById("lucky-subtitle").textContent = "Freshly generated lucky number.";
      document.getElementById("lucky-stars").textContent = "★".repeat(fortune.stars) + "☆".repeat(5 - fortune.stars);
      document.getElementById("lucky-fortune").textContent = fortune.msg;

      luckyHistory.unshift({ num: finalNumber, mode: luckyMode });
      if (luckyHistory.length > 18) luckyHistory = luckyHistory.slice(0, 18);
      renderLuckyHistory();

      spinning = false;
      button.disabled = false;
      button.textContent = "Draw again";
    }, 60);
  }

  function renderLuckyHistory() {
    var historyEl = document.getElementById("lucky-history-items");
    if (!luckyHistory.length) {
      historyEl.innerHTML = '<div class="empty-hint">No lucky history yet.</div>';
      return;
    }
    historyEl.innerHTML = '<div class="history-chip-wrap">' + luckyHistory.map(function(item) {
      return '<button class="history-chip" type="button" data-copy="' + item.num + '" title="' + labels[item.mode] + '">' + item.num + "</button>";
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

  setLuckyMode(2);
  clearLuckyHistory();
});
