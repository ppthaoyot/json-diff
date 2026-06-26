document.addEventListener("DOMContentLoaded", function() {
  var bridgeKey = "jsonDiffWorkshop.base64.decode";
  var reverseBridgeKey = "jsonDiffWorkshop.base64.encode";
  var inputEl = document.getElementById("dec-input");
  var textEl = document.getElementById("dec-result-text");
  var imageEl = document.getElementById("dec-result-img");
  var placeholderEl = document.getElementById("dec-result-placeholder");
  var inCountEl = document.getElementById("dec-in-count");
  var outCountEl = document.getElementById("dec-out-count");

  document.getElementById("dec-clear-btn").addEventListener("click", clearDecode);
  document.getElementById("dec-copy-input-btn").addEventListener("click", function() { copyText(inputEl.value, "dec-copy-input-btn"); });
  document.getElementById("dec-copy-result-btn").addEventListener("click", function() { copyText(textEl.textContent, "dec-copy-result-btn"); });
  document.getElementById("dec-download-btn").addEventListener("click", function() { downloadText(textEl.textContent, "decoded.txt"); });
  document.getElementById("dec-file-input").addEventListener("change", loadFileForDecode);
  document.getElementById("dec-open-encode-btn").addEventListener("click", sendToEncodePage);
  inputEl.addEventListener("input", onDecodeInput);

  var bridged = sessionStorage.getItem(bridgeKey);
  if (bridged) {
    inputEl.value = bridged;
    sessionStorage.removeItem(bridgeKey);
  }

  function resetOutput() {
    placeholderEl.style.display = "";
    placeholderEl.textContent = "Decoded text or image preview will appear here.";
    textEl.style.display = "none";
    textEl.textContent = "";
    textEl.style.color = "";
    imageEl.style.display = "none";
    imageEl.src = "";
    outCountEl.textContent = "";
  }

  function onDecodeInput() {
    var value = inputEl.value.trim();
    inCountEl.textContent = value.length.toLocaleString() + " characters";
    resetOutput();
    if (!value) return;

    var clean = value.replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
      placeholderEl.style.display = "none";
      textEl.style.display = "";
      textEl.style.color = "#b91c1c";
      textEl.textContent = "Input is not valid Base64. Check for unsupported characters.";
      return;
    }

    try {
      var decoded = atob(clean);
      var isPng = decoded.startsWith("\x89PNG");
      var isJpeg = decoded.startsWith("\xFF\xD8\xFF");
      var isGif = decoded.startsWith("GIF8");
      var isWebP = decoded.slice(0, 4) === "RIFF" && decoded.slice(8, 12) === "WEBP";
      var trimmed = decoded.replace(/^\s+/, "");
      var isSvg = trimmed.startsWith("<svg") || trimmed.startsWith("<?xml");

      if (isPng || isJpeg || isGif || isWebP || isSvg) {
        var mime = isPng ? "image/png" : isJpeg ? "image/jpeg" : isGif ? "image/gif" : isWebP ? "image/webp" : "image/svg+xml";
        placeholderEl.style.display = "none";
        imageEl.style.display = "block";
        imageEl.src = "data:" + mime + ";base64," + clean;
        outCountEl.textContent = "Image preview detected: " + mime;
        return;
      }

      var text;
      try {
        text = decodeURIComponent(escape(decoded));
      } catch (error) {
        text = decoded;
      }

      placeholderEl.style.display = "none";
      textEl.style.display = "";
      textEl.textContent = text;
      outCountEl.textContent = text.length.toLocaleString() + " decoded characters";
    } catch (error) {
      placeholderEl.style.display = "none";
      textEl.style.display = "";
      textEl.style.color = "#b91c1c";
      textEl.textContent = "Decode failed: " + error.message;
    }
  }

  function clearDecode() {
    inputEl.value = "";
    inCountEl.textContent = "0 characters";
    resetOutput();
  }

  function loadFileForDecode(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(loadEvent) {
      inputEl.value = String(loadEvent.target.result || "").trim();
      onDecodeInput();
      showToast("Loaded file", file.name, "ok");
    };
    reader.onerror = function() {
      showToast("Could not read file", "", "err");
    };
    reader.readAsText(file, "UTF-8");
    event.target.value = "";
  }

  function sendToEncodePage() {
    if (!textEl.textContent || textEl.style.display === "none") {
      showToast("No text result available", "Image previews cannot be sent back as text.", "err");
      return;
    }
    sessionStorage.setItem(reverseBridgeKey, textEl.textContent);
    window.location.href = "base64-encode.html";
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
    if (!textEl.textContent || textEl.style.display === "none") {
      showToast("Nothing to download", "Decode text output first.", "err");
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

  var reverseBridged = sessionStorage.getItem(reverseBridgeKey);
  if (reverseBridged && !inputEl.value) {
    inputEl.value = reverseBridged;
    sessionStorage.removeItem(reverseBridgeKey);
  }

  if (inputEl.value) onDecodeInput();
  else clearDecode();
});
