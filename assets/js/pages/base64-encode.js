document.addEventListener("DOMContentLoaded", function() {
  var i18n = window.I18N;
  var bridgeKey = "jsonDiffWorkshop.base64.decode";
  var reverseBridgeKey = "jsonDiffWorkshop.base64.encode";
  var inputEl = document.getElementById("enc-input");
  var resultEl = document.getElementById("enc-result");
  var inCountEl = document.getElementById("enc-in-count");
  var outCountEl = document.getElementById("enc-out-count");
  var decodeNavLink = document.querySelector('a[href="base64-decode.html"]');

  document.getElementById("enc-clear-btn").addEventListener("click", clearEncode);
  document.getElementById("enc-copy-input-btn").addEventListener("click", function() { copyText(inputEl.value, "enc-copy-input-btn"); });
  document.getElementById("enc-copy-result-btn").addEventListener("click", function() { copyText(resultEl.textContent, "enc-copy-result-btn"); });
  document.getElementById("enc-download-btn").addEventListener("click", function() { downloadText(resultEl.textContent, "encoded.txt"); });
  document.getElementById("enc-file-input").addEventListener("change", loadFileForEncode);
  document.getElementById("enc-open-decode-btn").addEventListener("click", sendToDecodePage);
  inputEl.addEventListener("input", onEncodeInput);

  function setPlaceholder() {
    resultEl.textContent = i18n.t("base64Encode.outputPlaceholder");
    resultEl.classList.add("empty-hint");
  }

  function setCount(element, value, key) {
    element.textContent = value.toLocaleString() + " " + i18n.t(key);
  }

  function onEncodeInput() {
    var value = inputEl.value;
    setCount(inCountEl, value.length, "base64Encode.chars");
    if (!value) {
      setPlaceholder();
      outCountEl.textContent = "";
      return;
    }
    try {
      var encoded = btoa(unescape(encodeURIComponent(value)));
      resultEl.classList.remove("empty-hint");
      resultEl.textContent = encoded;
      setCount(outCountEl, encoded.length, "base64Encode.b64Chars");
    } catch (error) {
      resultEl.classList.remove("empty-hint");
      resultEl.textContent = i18n.t("base64Encode.encodeFailed") + ": " + error.message;
      outCountEl.textContent = "";
    }
  }

  function clearEncode() {
    inputEl.value = "";
    setCount(inCountEl, 0, "base64Encode.chars");
    outCountEl.textContent = "";
    setPlaceholder();
  }

  function loadFileForEncode(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(loadEvent) {
      inputEl.value = loadEvent.target.result;
      onEncodeInput();
      showToast(i18n.t("base64Encode.loadedFile"), file.name, "ok");
    };
    reader.onerror = function() {
      showToast(i18n.t("base64Encode.loadError"), "", "err");
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
  }

  function sendToDecodePage() {
    if (!resultEl.textContent || resultEl.classList.contains("empty-hint")) {
      showToast(i18n.t("base64Encode.nothingToSendTitle"), i18n.t("base64Encode.nothingToSendBody"), "err");
      return;
    }
    sessionStorage.setItem(bridgeKey, resultEl.textContent);
    window.location.href = "base64-decode.html";
  }

  function copyText(text, buttonId) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(function() {
      var button = document.getElementById(buttonId);
      var original = button.textContent;
      button.textContent = i18n.t("common.copied");
      setTimeout(function() { button.textContent = original; }, 1200);
    });
  }

  function downloadText(text, filename) {
    if (!text || resultEl.classList.contains("empty-hint")) {
      showToast(i18n.t("base64Encode.nothingToDownloadTitle"), i18n.t("base64Encode.nothingToDownloadBody"), "err");
      return;
    }
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function applyLanguage() {
    if (decodeNavLink) decodeNavLink.textContent = i18n.t("base64Decode.heroTitle");
    if (inputEl.value) onEncodeInput();
    else clearEncode();
  }

  window.addEventListener("i18n:updated", applyLanguage);

  var bridged = sessionStorage.getItem(reverseBridgeKey);
  if (bridged) {
    inputEl.value = bridged;
    sessionStorage.removeItem(reverseBridgeKey);
    onEncodeInput();
  } else {
    applyLanguage();
  }
});
