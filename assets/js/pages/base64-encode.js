document.addEventListener("DOMContentLoaded", function() {
  var bridgeKey = "jsonDiffWorkshop.base64.decode";
  var reverseBridgeKey = "jsonDiffWorkshop.base64.encode";
  var inputEl = document.getElementById("enc-input");
  var resultEl = document.getElementById("enc-result");
  var inCountEl = document.getElementById("enc-in-count");
  var outCountEl = document.getElementById("enc-out-count");

  document.getElementById("enc-clear-btn").addEventListener("click", clearEncode);
  document.getElementById("enc-copy-input-btn").addEventListener("click", function() { copyText(inputEl.value, "enc-copy-input-btn"); });
  document.getElementById("enc-copy-result-btn").addEventListener("click", function() { copyText(resultEl.textContent, "enc-copy-result-btn"); });
  document.getElementById("enc-download-btn").addEventListener("click", function() { downloadText(resultEl.textContent, "encoded.txt"); });
  document.getElementById("enc-file-input").addEventListener("change", loadFileForEncode);
  document.getElementById("enc-open-decode-btn").addEventListener("click", sendToDecodePage);
  inputEl.addEventListener("input", onEncodeInput);

  function setPlaceholder() {
    resultEl.textContent = "Encoded Base64 output will appear here.";
    resultEl.classList.add("empty-hint");
  }

  function onEncodeInput() {
    var value = inputEl.value;
    inCountEl.textContent = value.length.toLocaleString() + " characters";
    if (!value) {
      setPlaceholder();
      outCountEl.textContent = "";
      return;
    }
    try {
      var encoded = btoa(unescape(encodeURIComponent(value)));
      resultEl.classList.remove("empty-hint");
      resultEl.textContent = encoded;
      outCountEl.textContent = encoded.length.toLocaleString() + " Base64 characters";
    } catch (error) {
      resultEl.classList.remove("empty-hint");
      resultEl.textContent = "Encoding failed: " + error.message;
      outCountEl.textContent = "";
    }
  }

  function clearEncode() {
    inputEl.value = "";
    inCountEl.textContent = "0 characters";
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
      showToast("Loaded file", file.name, "ok");
    };
    reader.onerror = function() {
      showToast("Could not read file", "", "err");
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
  }

  function sendToDecodePage() {
    if (!inputEl.value && resultEl.classList.contains("empty-hint")) {
      showToast("Nothing to send", "Create Base64 output first.", "err");
      return;
    }
    if (!resultEl.textContent || resultEl.classList.contains("empty-hint")) {
      showToast("Nothing to send", "Create Base64 output first.", "err");
      return;
    }
    sessionStorage.setItem(bridgeKey, resultEl.textContent);
    window.location.href = "base64-decode.html";
  }

  function copyText(text, buttonId) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(function() {
      flashButton(buttonId);
    });
  }

  function flashButton(buttonId) {
    var button = document.getElementById(buttonId);
    var original = button.textContent;
    button.textContent = "Copied";
    setTimeout(function() {
      button.textContent = original;
    }, 1200);
  }

  function downloadText(text, filename) {
    if (!text || resultEl.classList.contains("empty-hint")) {
      showToast("Nothing to download", "Generate output first.", "err");
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

  var bridged = sessionStorage.getItem(reverseBridgeKey);
  if (bridged) {
    inputEl.value = bridged;
    sessionStorage.removeItem(reverseBridgeKey);
    onEncodeInput();
  } else {
    clearEncode();
  }
});
