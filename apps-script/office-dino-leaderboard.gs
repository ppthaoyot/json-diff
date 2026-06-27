const LEADERBOARD_LIMIT = 20;
const SCORE_SHEET_NAME = 'scores';
const DEFAULT_SPREADSHEET_ID = '11MWZgibIYSph7Sn2NYrD0eYZdacsVO7BiVyMBzoJJ2w';
const DEFAULT_SPEED_MODE = 'normal';
const SPEED_MODES = ['baby', 'easy', 'normal', 'hard'];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || 'leaderboard');

  if (action !== 'leaderboard') {
    return createJsonOutput_({
      ok: false,
      message: 'unsupported action',
      rows: [],
      updatedAt: Date.now()
    }, params.callback);
  }

  const limit = Math.max(1, Math.min(Number(params.limit || LEADERBOARD_LIMIT), LEADERBOARD_LIMIT));
  const speedMode = normalizeSpeedMode_(params.speedMode);
  const payload = {
    ok: true,
    rows: getLeaderboardRows_(limit, speedMode),
    speedMode: speedMode,
    updatedAt: Date.now()
  };
  return createJsonOutput_(payload, params.callback);
}

function doPost(e) {
  const entry = parseIncomingEntry_(e);
  appendScoreRow_(entry);

  return createJsonOutput_({
    ok: true,
    message: 'saved',
    row: entry,
    updatedAt: Date.now()
  });
}

function parseIncomingEntry_(e) {
  const params = (e && e.parameter) || {};
  let payload = {};

  if (e && e.postData && e.postData.contents && String(e.postData.type || '').indexOf('application/json') >= 0) {
    payload = JSON.parse(e.postData.contents);
  } else {
    payload = params;
  }

  const name = String(payload.name || '').trim().slice(0, 32) || 'ผู้เล่นนิรนาม';
  const score = Math.max(0, Number(payload.score || 0));
  const level = String(payload.level || '').trim().slice(0, 80);
  const speedMode = normalizeSpeedMode_(payload.speedMode);
  const speedLabel = String(payload.speedLabel || speedMode).trim().slice(0, 40);
  const timestamp = Number(payload.timestamp || Date.now());

  return {
    name: name,
    score: score,
    level: level,
    speedMode: speedMode,
    speedLabel: speedLabel,
    timestamp: timestamp
  };
}

function appendScoreRow_(entry) {
  const sheet = getScoreSheet_();
  sheet.appendRow([
    new Date(entry.timestamp),
    entry.name,
    entry.score,
    entry.level,
    entry.timestamp,
    entry.speedMode,
    entry.speedLabel
  ]);
}

function getLeaderboardRows_(limit, speedMode) {
  const targetSpeedMode = normalizeSpeedMode_(speedMode);
  const sheet = getScoreSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const bestByName = {};
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const entry = {
      name: String(row[1] || '').trim(),
      score: Number(row[2] || 0),
      level: String(row[3] || ''),
      timestamp: Number(row[4] || 0),
      speedMode: normalizeSpeedMode_(row[5]),
      speedLabel: String(row[6] || normalizeSpeedMode_(row[5])).trim()
    };
    if (!entry.name) continue;
    if (entry.speedMode !== targetSpeedMode) continue;

    const current = bestByName[entry.name];
    if (!current || entry.score > current.score || (entry.score === current.score && entry.timestamp < current.timestamp)) {
      bestByName[entry.name] = entry;
    }
  }

  return Object.keys(bestByName)
    .map(function(name) { return bestByName[name]; })
    .sort(function(a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.timestamp - b.timestamp;
    })
    .slice(0, limit);
}

function getScoreSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || DEFAULT_SPREADSHEET_ID;
  const spreadsheet = spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Spreadsheet not found. Set SPREADSHEET_ID in Script Properties or update DEFAULT_SPREADSHEET_ID.');
  }

  let sheet = spreadsheet.getSheetByName(SCORE_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SCORE_SHEET_NAME);
    sheet.appendRow(['created_at', 'name', 'score', 'level', 'timestamp', 'speed_mode', 'speed_label']);
  } else {
    ensureScoreSheetHeader_(sheet);
  }
  return sheet;
}

function ensureScoreSheetHeader_(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, 7);
  const header = headerRange.getValues()[0];
  const expected = ['created_at', 'name', 'score', 'level', 'timestamp', 'speed_mode', 'speed_label'];
  let changed = false;
  for (let i = 0; i < expected.length; i++) {
    if (!header[i]) {
      header[i] = expected[i];
      changed = true;
    }
  }
  if (changed) headerRange.setValues([header]);
}

function normalizeSpeedMode_(speedMode) {
  const value = String(speedMode || DEFAULT_SPEED_MODE).trim().toLowerCase();
  return SPEED_MODES.indexOf(value) >= 0 ? value : DEFAULT_SPEED_MODE;
}

function createJsonOutput_(payload, callbackName) {
  const body = JSON.stringify(payload);
  if (callbackName) {
    return ContentService
      .createTextOutput(String(callbackName) + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}
