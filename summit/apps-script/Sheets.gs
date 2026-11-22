/**
 * Sheets.gs — reading and writing the Sheet's tabs.
 *
 * Everything is read by header text, never by fixed column letters, so organisers
 * can reorder columns or add their own notes columns without breaking anything.
 */

/** The Sheet this script is bound to. The web app falls back to the id saved by setup. */
function ss_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Setup has not been run yet.');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Can\'t find the "' + name + '" tab. Run AI Summit → Run setup first, or check the tab name.');
  return sh;
}

/** Rows of a tab as objects keyed by lower-case header, using the text shown in each cell. */
function readObjects_(sh) {
  const values = sh.getDataRange().getDisplayValues();
  const headers = (values[0] || []).map(function (h) { return String(h).trim().toLowerCase(); });
  return values.slice(1).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) { if (h) obj[h] = row[i]; });
    return obj;
  });
}

function readSettings_() {
  const raw = {};
  sheet_(SUMMIT.TABS.SETTINGS).getDataRange().getDisplayValues().slice(1).forEach(function (r) {
    if (String(r[0]).trim()) raw[String(r[0]).trim()] = r[1];
  });
  return parseSettings_(raw);
}

function readBreakouts_(settings) {
  return parseBreakouts_(readObjects_(sheet_(SUMMIT.TABS.BREAKOUTS)), settings);
}

/** { confirmation: {subject, body}, updated: {...}, topic: {...} } */
function readTemplates_() {
  const templates = {};
  readObjects_(sheet_(SUMMIT.TABS.TEMPLATES)).forEach(function (r) {
    const key = normaliseKey_(r.template);
    if (key) templates[key] = { subject: String(r.subject || ''), body: String(r.body || '') };
  });
  return templates;
}

/** { breakoutId: { beginner, intermediate, advanced } } */
function readTopics_() {
  const topics = {};
  readObjects_(sheet_(SUMMIT.TABS.TOPICS)).forEach(function (r) {
    const id = normaliseKey_(r.id);
    if (!id) return;
    const t = {};
    SUMMIT.LEVELS.forEach(function (level) { t[level.toLowerCase()] = String(r[level.toLowerCase()] || '').trim(); });
    topics[id] = t;
  });
  return topics;
}

/** Reads the Responses tab into student objects (see Logic.gs for the shape). */
function readResponses_(settings) {
  const sh = sheet_(SUMMIT.TABS.RESPONSES);
  const values = sh.getDataRange().getValues();
  const headers = (values[0] || []).map(String);
  const layout = responsesLayout_(headers);

  const missing = [];
  if (layout.timestamp === -1) missing.push(SUMMIT.COLUMNS.TIMESTAMP);
  if (layout.name === -1) missing.push(SUMMIT.QUESTIONS.NAME);
  if (layout.email === -1) missing.push('Email address');
  settings.slots.forEach(function (label, k) {
    if (layout.slots[k] === undefined) missing.push(SUMMIT.COLUMNS.SLOT_PREFIX + (k + 1) + ': ' + label + ')');
  });
  if (missing.length) {
    throw new Error('The Responses tab is missing these columns: ' + missing.join(', ') +
      '. Run AI Summit → Refresh form choices and dropdowns to add them.');
  }

  const cell = function (row, col) { return col === -1 || col === undefined ? '' : String(row[col] == null ? '' : row[col]).trim(); };
  const students = [];
  values.slice(1).forEach(function (r, i) {
    const ts = r[layout.timestamp];
    const timestamp = ts instanceof Date ? ts.getTime() : (Date.parse(ts) || 0);
    const student = {
      row: i + 2,
      timestamp: timestamp,
      name: cell(r, layout.name),
      grade: cell(r, layout.grade),
      email: cell(r, layout.email).toLowerCase(),
      slotValues: settings.slots.map(function (_, k) { return cell(r, layout.slots[k]); }),
      level: cell(r, layout.level),
      confirmationSentFor: cell(r, layout.confirmationSentFor),
      topicSentFor: cell(r, layout.topicSentFor),
      confirmationStatus: cell(r, layout.confirmationStatus),
      topicStatus: cell(r, layout.topicStatus),
    };
    if (student.timestamp || student.name || student.email) students.push(student);
  });
  return { sheet: sh, headers: headers, layout: layout, students: students };
}

/** Everything the menu actions need, read once. */
function loadState_() {
  const settings = readSettings_();
  const parsed = readBreakouts_(settings);
  return {
    settings: settings,
    breakouts: parsed.breakouts,
    problems: settings.problems.concat(parsed.problems),
    responses: readResponses_(settings),
  };
}

/** Writes one cell. col is a 0-based column index from responsesLayout_. */
function setCell_(sh, row, col, value) {
  if (col === -1 || col === undefined) return;
  sh.getRange(row, col + 1).setValue(value);
}

function timestampText_() {
  return Utilities.formatDate(new Date(), ss_().getSpreadsheetTimeZone() || 'Asia/Kolkata', 'd MMM yyyy, HH:mm');
}

/** Clears the web app's cached answer so the website picks up changes within a minute. */
function clearAvailabilityCache_() {
  try { CacheService.getScriptCache().remove(API_CACHE_KEY); } catch (err) { /* cache is optional */ }
}
