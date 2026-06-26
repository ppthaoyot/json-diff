document.addEventListener("DOMContentLoaded", function() {
  var idHistory = [];
  var prefixDescriptions = {
    "1": "Born Thai citizen and registered on time",
    "2": "Born Thai citizen with late registration",
    "3": "Listed in household records before 1984",
    "4": "Moved into household records during transition period",
    "5": "Naturalized Thai citizen",
    "6": "Lawful entrant without Thai citizenship yet",
    "7": "Child of category 3 or 6 person born in Thailand",
    "8": "Stateless or temporary foreign resident"
  };

  document.getElementById("thai-id-generate-btn").addEventListener("click", generateThaiID);
  document.getElementById("thai-id-validate-btn").addEventListener("click", validateThaiIDInput);
  document.getElementById("thai-id-clear-history-btn").addEventListener("click", clearIDHistory);

  function calcThaiIDChecksum(digits12) {
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += digits12[i] * (13 - i);
    return (11 - (sum % 11)) % 10;
  }

  function randDigit() {
    return Math.floor(Math.random() * 10);
  }

  function genOneThaiID(firstDigitFixed) {
    var digits = [];
    var firstDigit = firstDigitFixed > 0 ? firstDigitFixed : Math.floor(Math.random() * 8) + 1;
    digits.push(firstDigit);
    for (var i = 1; i < 12; i++) digits.push(randDigit());
    digits.push(calcThaiIDChecksum(digits));
    return digits.join("");
  }

  function formatThaiID(id) {
    return id[0] + "-" + id.slice(1, 5) + "-" + id.slice(5, 10) + "-" + id.slice(10, 12) + "-" + id[12];
  }

  function metaCard(label, value) {
    return '<div class="meta-card"><strong>' + esc(label) + '</strong><span>' + esc(String(value)) + "</span></div>";
  }

  function renderIDHistory() {
    var list = document.getElementById("id-history-list");
    if (!idHistory.length) {
      list.innerHTML = '<div class="empty-hint">No generated IDs yet.</div>';
      return;
    }

    list.innerHTML = idHistory.slice(0, 20).map(function(item) {
      return '<button class="history-item" type="button" data-copy-id="' + item.id + '"><span>' + esc(item.fmt) + '</span><span class="copy-muted">Copy</span></button>';
    }).join("");

    list.querySelectorAll("[data-copy-id]").forEach(function(button) {
      button.addEventListener("click", function() {
        copyToClipboard(button.getAttribute("data-copy-id"));
      });
    });
  }

  function clearIDHistory() {
    idHistory = [];
    renderIDHistory();
    document.getElementById("id-number-display").textContent = "- - - - - - - - - - - - -";
    document.getElementById("id-formatted-display").textContent = "Generate a valid test ID to begin.";
    document.getElementById("id-meta-grid").innerHTML = "";
  }

  function generateThaiID() {
    var count = parseInt(document.getElementById("id-gen-count").value, 10);
    var firstDigit = parseInt(document.getElementById("id-first-digit").value, 10);
    var ids = [];
    for (var i = 0; i < count; i++) ids.push(genOneThaiID(firstDigit));

    var latest = ids[ids.length - 1];
    document.getElementById("id-number-display").textContent = latest;
    document.getElementById("id-formatted-display").textContent = formatThaiID(latest);
    document.getElementById("id-meta-grid").innerHTML =
      metaCard("First digit group", latest[0] + " - " + (prefixDescriptions[latest[0]] || "Unknown")) +
      metaCard("Province code", latest.slice(1, 3)) +
      metaCard("District code", latest.slice(3, 5)) +
      metaCard("Registry sequence", latest.slice(5, 10)) +
      metaCard("Extension digits", latest.slice(10, 12)) +
      metaCard("Checksum digit", latest[12]);

    ids.forEach(function(id) {
      idHistory.unshift({ id: id, fmt: formatThaiID(id) });
    });
    if (idHistory.length > 50) idHistory = idHistory.slice(0, 50);
    renderIDHistory();
  }

  function validateThaiIDInput() {
    var inputEl = document.getElementById("id-val-input");
    var resultEl = document.getElementById("id-val-result");
    var value = inputEl.value.trim();

    if (!value) {
      resultEl.innerHTML = "";
      return;
    }

    if (value.length !== 13) {
      resultEl.innerHTML = '<span class="stat stat-rem">Invalid length</span><p>Enter exactly 13 digits to validate a Thai ID checksum.</p>';
      return;
    }

    var digits = value.split("").map(Number);
    var checkDigit = digits.pop();
    var expected = calcThaiIDChecksum(digits);

    if (checkDigit === expected) {
      resultEl.innerHTML = '<span class="stat stat-add">Checksum valid</span><p>This value follows the Thai ID checksum format and is suitable for testing scenarios.</p>';
    } else {
      resultEl.innerHTML = '<span class="stat stat-rem">Checksum invalid</span><p>The final digit does not match the expected checksum.</p>';
    }
  }

  document.getElementById("id-val-input").addEventListener("input", function() {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  renderIDHistory();
  clearIDHistory();
});
