const dinoLeaderboardStorageKey = "officeDinoLeaderboard";
const dinoDefaultPlayerNames = [
  "มนุษย์เงินเดือนนิรนาม",
  "พนักงานดีเด่นปลอมๆ",
  "หัวหน้าบอกยังไหว",
  "ลาออกพรุ่งนี้แน่นะ",
  "ประชุมอีกแล้วเหรอ",
  "มือไวใจสั่น",
  "คนอู้ผู้ยิ่งใหญ่",
  "โบนัสยังไม่มา"
];

function getDefaultPlayerName() {
  return dinoDefaultPlayerNames[Math.floor(Math.random() * dinoDefaultPlayerNames.length)];
}

function normalizeLeaderboardEntry(entry) {
  return {
    name: String((entry && entry.name) || "").trim() || getDefaultPlayerName(),
    score: Number((entry && entry.score) || 0),
    level: String((entry && entry.level) || ""),
    timestamp: Number((entry && entry.timestamp) || Date.now())
  };
}

function sortLeaderboardEntries(entries) {
  return entries.slice().sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.timestamp - b.timestamp;
  });
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(dinoLeaderboardStorageKey);
    const rows = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(rows)) return [];
    return sortLeaderboardEntries(rows.map(normalizeLeaderboardEntry)).slice(0, 100);
  } catch (err) {
    return [];
  }
}

function saveLeaderboardEntry(entry) {
  const rows = loadLeaderboard();
  rows.push(normalizeLeaderboardEntry(entry));
  const nextRows = sortLeaderboardEntries(rows).slice(0, 100);
  localStorage.setItem(dinoLeaderboardStorageKey, JSON.stringify(nextRows));
  return nextRows;
}
