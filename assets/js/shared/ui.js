function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showToast(title, body, type) {
  var tc = document.getElementById("toast-container");
  var t = document.createElement("div");
  t.className = "toast toast-" + (type || "fix");
  t.innerHTML = '<div class="toast-title">' + esc(title) + "</div>" + (body ? '<div class="toast-body">' + esc(body) + "</div>" : "");
  tc.appendChild(t);
  setTimeout(function() {
    t.style.animation = "toastOut 0.2s ease forwards";
    setTimeout(function() {
      if (tc.contains(t)) tc.removeChild(t);
    }, 200);
  }, 3500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    showToast("คัดลอกแล้ว", text, "ok");
  });
}
