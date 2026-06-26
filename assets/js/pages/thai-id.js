document.addEventListener("DOMContentLoaded", function() {
  var i18n = window.I18N;
  var idHistory = [];
  var jsonNavLink = document.querySelector('a[href="json-diff.html"]');

  document.getElementById("thai-id-generate-btn").addEventListener("click", generateThaiID);
  document.getElementById("thai-id-validate-btn").addEventListener("click", validateThaiIDInput);
  document.getElementById("thai-id-clear-history-btn").addEventListener("click", clearIDHistory);

  function prefixDescriptions() {
    return {
      "1": i18n.t("thaiId.prefix1"),
      "2": i18n.t("thaiId.prefix2"),
      "3": i18n.t("thaiId.prefix3"),
      "4": i18n.t("thaiId.prefix4"),
      "5": i18n.t("thaiId.prefix5"),
      "6": i18n.t("thaiId.prefix6"),
      "7": i18n.t("thaiId.prefix7"),
      "8": i18n.t("thaiId.prefix8")
    };
  }

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
      list.innerHTML = '<div class="empty-hint">' + esc(i18n.t("thaiId.noHistory")) + "</div>";
      return;
    }

    list.innerHTML = idHistory.slice(0, 20).map(function(item) {
      return '<button class="history-item" type="button" data-copy-id="' + item.id + '"><span>' + esc(item.fmt) + '</span><span class="copy-muted">' + esc(i18n.t("thaiId.copyHint")) + "</span></button>";
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
    document.getElementById("id-number-display").textContent = i18n.t("thaiId.initialNumber");
    document.getElementById("id-formatted-display").textContent = i18n.t("thaiId.initialFormatted");
    document.getElementById("id-meta-grid").innerHTML = "";
  }

  function generateThaiID() {
    var count = parseInt(document.getElementById("id-gen-count").value, 10);
    var firstDigit = parseInt(document.getElementById("id-first-digit").value, 10);
    var ids = [];
    for (var i = 0; i < count; i++) ids.push(genOneThaiID(firstDigit));

    var latest = ids[ids.length - 1];
    var prefixMap = prefixDescriptions();
    document.getElementById("id-number-display").textContent = latest;
    document.getElementById("id-formatted-display").textContent = formatThaiID(latest);
    document.getElementById("id-meta-grid").innerHTML =
      metaCard(i18n.t("thaiId.firstDigitGroup"), latest[0] + " - " + (prefixMap[latest[0]] || i18n.t("thaiId.unknown"))) +
      metaCard(i18n.t("thaiId.provinceCode"), latest.slice(1, 3)) +
      metaCard(i18n.t("thaiId.districtCode"), latest.slice(3, 5)) +
      metaCard(i18n.t("thaiId.sequenceCode"), latest.slice(5, 10)) +
      metaCard(i18n.t("thaiId.extensionDigits"), latest.slice(10, 12)) +
      metaCard(i18n.t("thaiId.checksumDigit"), latest[12]);

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
      resultEl.innerHTML = '<div class="empty-hint">' + esc(i18n.t("thaiId.validateEmpty")) + "</div>";
      return;
    }
    if (value.length !== 13) {
      resultEl.innerHTML = '<span class="stat stat-rem">' + esc(i18n.t("thaiId.invalidLengthTitle")) + "</span><p>" + esc(i18n.t("thaiId.invalidLengthBody")) + "</p>";
      return;
    }

    var digits = value.split("").map(Number);
    var checkDigit = digits.pop();
    var expected = calcThaiIDChecksum(digits);

    if (checkDigit === expected) {
      resultEl.innerHTML = '<span class="stat stat-add">' + esc(i18n.t("thaiId.checksumValidTitle")) + "</span><p>" + esc(i18n.t("thaiId.checksumValidBody")) + "</p>";
    } else {
      resultEl.innerHTML = '<span class="stat stat-rem">' + esc(i18n.t("thaiId.checksumInvalidTitle")) + "</span><p>" + esc(i18n.t("thaiId.checksumInvalidBody")) + "</p>";
    }
  }

  document.getElementById("id-val-input").addEventListener("input", function() {
    this.value = this.value.replace(/[^0-9]/g, "");
  });

  function applyLanguage() {
    if (jsonNavLink) jsonNavLink.textContent = i18n.t("landing.jsonDiffTitle");
    renderIDHistory();
    if (!idHistory.length) clearIDHistory();
  }

  window.addEventListener("i18n:updated", applyLanguage);
  applyLanguage();
});
