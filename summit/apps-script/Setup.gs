/**
 * Setup.gs — the organiser menu, first-time setup, and "Refresh form choices".
 *
 * setupSummit() creates, in this Sheet:
 *   Settings    breakouts per student (1 or 2), time slots, date, grades, sender name
 *   Breakouts   id, name, description, capacity, runs, room, status, listed
 *   Templates   the three emails, as editable plain text
 *   Topics      one row per breakout: the beginner / intermediate / advanced topic
 *   Responses   linked to a new Google Form, plus the organiser columns
 *   Capacity    a summary written by "Check capacity and duplicates"
 */

const NAMES_PROPERTY = 'BREAKOUT_NAMES';
const FORM_ID_PROPERTY = 'FORM_ID';
const ORGANISER_HEADER_COLOUR = '#fff2cc';

/** Simple trigger: adds the AI Summit menu when the Sheet opens. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AI Summit')
    .addItem('Send confirmation emails to newly assigned students', 'sendConfirmationEmails')
    .addItem('Send assignment-topic emails', 'sendTopicEmails')
    .addSeparator()
    .addItem('Check capacity and duplicates', 'checkCapacityAndDuplicates')
    .addItem('Refresh form choices and dropdowns', 'refreshFormChoices')
    .addItem('Send me a test of each email', 'sendTestEmails')
    .addItem('Show remaining email quota', 'showEmailQuota')
    .addSeparator()
    .addItem('Run setup (first time only)', 'setupSummit')
    .addItem('Run self-tests (fake data, no emails)', 'runSelfTests')
    .addToUi();
}

/**
 * Menu: Run setup. Safe to click twice: it stops if the form already exists.
 * The lock stops two runs overlapping (for example a click that was waiting on
 * Google's permission screen finishing at the same time as a second click), which
 * would otherwise create a second form.
 */
function setupSummit() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) {
    SpreadsheetApp.getUi().alert('Setup is already running. Wait for it to finish.');
    return;
  }
  try {
    setupSummitLocked_();
  } finally {
    lock.releaseLock();
  }
}

function setupSummitLocked_() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const docProps = PropertiesService.getDocumentProperties();
  if (docProps.getProperty(FORM_ID_PROPERTY)) {
    ui.alert('Setup has already run',
      'This Sheet already has its form. To change breakouts, grades or time slots, edit the tabs and then use ' +
      'AI Summit → Refresh form choices and dropdowns.', ui.ButtonSet.OK);
    return;
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());

  createSettingsTab_(ss);
  const settings = readSettings_();
  createBreakoutsTab_(ss, settings);
  createTemplatesTab_(ss);
  const breakouts = readBreakouts_(settings).breakouts;
  createTopicsTab_(ss, breakouts);

  // Create the form and link it to this Sheet.
  const built = createForm_(settings, breakouts);
  const form = built.form;
  const before = ss.getSheets().map(function (s) { return s.getSheetId(); });
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  const fresh = SpreadsheetApp.openById(ss.getId());
  let responses = fresh.getSheets().filter(function (s) { return before.indexOf(s.getSheetId()) === -1; })[0];
  if (!responses) {
    responses = fresh.getSheets().filter(function (s) { return String(s.getFormUrl() || '').indexOf(form.getId()) !== -1; })[0];
  }
  if (!responses) throw new Error('The form was created but its responses tab could not be found. Check the Sheet for a "Form responses" tab and rename it to "Responses".');
  responses.setName(SUMMIT.TABS.RESPONSES);
  docProps.setProperty(FORM_ID_PROPERTY, form.getId());

  prepareResponsesTab_(responses, settings, breakouts);
  removeEmptyDefaultTab_(fresh);

  setSetting_(SUMMIT.SETTINGS_KEYS.FORM_LINK, form.getPublishedUrl());
  setSetting_(SUMMIT.SETTINGS_KEYS.FORM_EDIT_LINK, form.getEditUrl());
  setSetting_(SUMMIT.SETTINGS_KEYS.SIGN_IN, built.verified
    ? 'Yes: students sign in with their school account, email is collected automatically, one response each (they can edit it).'
    : 'No: this account can\'t restrict the form to the school, so students type their email. Duplicates are caught in the Sheet.');
  saveBreakoutNames_(breakouts);

  ui.alert('Setup finished',
    'Created the form "' + SUMMIT.FORM_TITLE + '" and the Settings, Breakouts, Templates, Topics and Responses tabs.\n\n' +
    'Student form link (also on the Settings tab):\n' + form.getPublishedUrl() + '\n\n' +
    (built.verified ? '' : 'Note: the form could not be limited to school sign-in on this account. See the Settings tab.\n\n') +
    'Next: deploy the web app (README step 4).', ui.ButtonSet.OK);
}

/**
 * Menu: Refresh form choices and dropdowns.
 * Run after adding, renaming or hiding a breakout, or changing grades or time slots.
 */
function refreshFormChoices() {
  const ui = SpreadsheetApp.getUi();
  const settings = readSettings_();
  const parsed = readBreakouts_(settings);
  const problems = settings.problems.concat(parsed.problems);
  if (problems.length) {
    ui.alert('Fix these first', problems.map(bullet_).join('\n'), ui.ButtonSet.OK);
    return;
  }
  const breakouts = parsed.breakouts;
  const formId = PropertiesService.getDocumentProperties().getProperty(FORM_ID_PROPERTY);
  if (!formId) { ui.alert('Run AI Summit → Run setup first.'); return; }

  const form = FormApp.openById(formId);
  form.getItems(FormApp.ItemType.GRID).forEach(function (item) {
    if (normaliseKey_(item.getTitle()) === normaliseKey_(SUMMIT.QUESTIONS.CHOICES)) configureChoiceGrid_(item.asGridItem(), breakouts);
  });
  form.getItems(FormApp.ItemType.LIST).forEach(function (item) {
    if (normaliseKey_(item.getTitle()) === normaliseKey_(SUMMIT.QUESTIONS.GRADE)) item.asListItem().setChoiceValues(settings.grades);
  });
  form.setDescription(formDescription_(settings));

  const renamed = carryRenamedBreakouts_(breakouts);
  prepareResponsesTab_(sheet_(SUMMIT.TABS.RESPONSES), settings, breakouts);
  createTopicsTab_(ss_(), breakouts);
  saveBreakoutNames_(breakouts);
  clearAvailabilityCache_();

  const listed = breakouts.filter(function (b) { return b.listed; }).length;
  ui.alert('Form and dropdowns updated',
    'The form now offers ' + listed + ' breakout(s) and ' + settings.grades.length + ' grade(s).' +
    (renamed ? '\n\nUpdated ' + renamed + ' assignment cell(s) to match renamed breakouts.' : ''),
    ui.ButtonSet.OK);
}

/* ---------- Tabs ---------- */

function createSettingsTab_(ss) {
  if (ss.getSheetByName(SUMMIT.TABS.SETTINGS)) return;
  const K = SUMMIT.SETTINGS_KEYS;
  const D = SUMMIT.DEFAULTS;
  const sh = ss.insertSheet(SUMMIT.TABS.SETTINGS);
  const rows = [
    ['Setting', 'Value', 'Notes'],
    [K.PER_STUDENT, String(D.PER_STUDENT), '1 or 2. With 2, each student gets one breakout in each time slot.'],
    [K.SLOTS, D.SLOTS.join('; '), 'Separate with semicolons, earliest first. Each breakout runs in these slots unless its "runs" cell says otherwise.'],
    [K.DEFAULT_CAPACITY, String(D.DEFAULT_CAPACITY), 'Seats per run when a breakout\'s capacity cell is blank.'],
    [K.DATE, D.DATE, 'Used in emails as {date}.'],
    [K.GRADES, D.GRADES.join('; '), 'Choices on the form. Use "Refresh form choices and dropdowns" after changing.'],
    [K.SENDER_NAME, D.SENDER_NAME, 'The name students see as the sender.'],
    [K.REPLY_TO, '', 'Optional: where students\' replies go, for example the organisers\' shared inbox.'],
    [K.FORM_LINK, '', 'Filled in by setup. Give this to the website as VITE_BREAKOUT_FORM_URL.'],
    [K.FORM_EDIT_LINK, '', 'Filled in by setup.'],
    [K.SIGN_IN, '', 'Filled in by setup.'],
  ];
  sh.getRange(1, 2, rows.length, 1).setNumberFormat('@'); // keep "16 December 2026" as text, not a date
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  styleHeader_(sh, 3);
  sh.setColumnWidth(1, 240);
  sh.setColumnWidth(2, 360);
  sh.setColumnWidth(3, 520);
}

function createBreakoutsTab_(ss, settings) {
  if (ss.getSheetByName(SUMMIT.TABS.BREAKOUTS)) return;
  const sh = ss.insertSheet(SUMMIT.TABS.BREAKOUTS);
  const rows = [SUMMIT.BREAKOUT_HEADERS].concat(SUMMIT.STARTING_BREAKOUTS.map(function (b) {
    return [b[0], b[1], '', settings.defaultCapacity, settings.slots.join('; '), '', 'confirmed', true];
  }));
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  styleHeader_(sh, rows[0].length);
  const maxRows = sh.getMaxRows();
  sh.getRange(2, 8, maxRows - 1, 1).insertCheckboxes();
  sh.getRange(2, 7, maxRows - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['confirmed', 'tentative'], true).setAllowInvalid(false).build());
  const notes = [
    'Short and permanent, e.g. "finance". Assignments and sent emails are tracked by id, so keep it the same when you rename a breakout.',
    'Shown on the website, the form and in emails. Run "Refresh form choices and dropdowns" after renaming.',
    'One line for the website. Leave blank to show "Topic to be announced".',
    'Seats per run. Blank uses Settings → Default capacity per run.',
    'Time slots this breakout runs in, separated by semicolons. Must match Settings → Time slots (or use 1 and 2). Blank means every slot.',
    'Used in emails only, e.g. "Room 204". Never shown on the website.',
    'confirmed or tentative. Tentative breakouts are labelled on the website.',
    'Untick to hide from the website and the form (after "Refresh form choices and dropdowns").',
  ];
  notes.forEach(function (note, i) { sh.getRange(1, i + 1).setNote(note); });
  sh.setColumnWidth(2, 220);
  sh.setColumnWidth(3, 360);
  sh.setColumnWidth(5, 260);
}

function createTemplatesTab_(ss) {
  if (ss.getSheetByName(SUMMIT.TABS.TEMPLATES)) return;
  const sh = ss.insertSheet(SUMMIT.TABS.TEMPLATES);
  const note = 'Plain text. Placeholders: ' + SUMMIT.PLACEHOLDERS.map(function (p) { return '{' + p + '}'; }).join(' ') +
    '. {schedule} lists each breakout with its time and room. {topics} lists each breakout with its topic.';
  const rows = [['template', 'subject', 'body', 'notes']].concat(DEFAULT_TEMPLATES.map(function (t) {
    const when = { confirmation: 'First email after a student is assigned.', updated: 'Sent instead when an assignment changes after the first email.', topic: 'The pre-summit assignment-topic email.' }[t.key];
    return [t.key, t.subject, t.body, when + ' ' + note];
  }));
  sh.getRange(1, 1, rows.length, 4).setValues(rows);
  styleHeader_(sh, 4);
  sh.getRange(2, 1, rows.length - 1, 4).setWrap(true).setVerticalAlignment('top');
  sh.setColumnWidth(2, 320);
  sh.setColumnWidth(3, 520);
  sh.setColumnWidth(4, 320);
}

/** Creates the Topics tab, or adds rows for breakouts that are new since last time. */
function createTopicsTab_(ss, breakouts) {
  let sh = ss.getSheetByName(SUMMIT.TABS.TOPICS);
  if (!sh) {
    sh = ss.insertSheet(SUMMIT.TABS.TOPICS);
    sh.getRange(1, 1, 1, 5).setValues([['id', 'breakout'].concat(SUMMIT.LEVELS.map(function (l) { return l.toLowerCase(); }))]);
    styleHeader_(sh, 5);
    sh.getRange(1, 3).setNote('Leave blank until the topics are final. The topic email won\'t send for a student whose topic is blank.');
    sh.setColumnWidth(2, 220);
    [3, 4, 5].forEach(function (c) { sh.setColumnWidth(c, 320); });
  }
  const existing = readObjects_(sh).map(function (r) { return normaliseKey_(r.id); });
  const add = breakouts
    .filter(function (b) { return existing.indexOf(b.id) === -1; })
    .map(function (b) { return [b.id, b.name, '', '', '']; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 5).setValues(add);
  sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 5).setWrap(true).setVerticalAlignment('top');
}

/** Adds the organiser columns, dropdowns and header notes to the Responses tab. Safe to run repeatedly. */
function prepareResponsesTab_(sh, settings, breakouts) {
  const C = SUMMIT.COLUMNS;
  const headers = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getDisplayValues()[0];
  const layout = responsesLayout_(headers);
  const wanted = [];
  if (layout.duplicate === -1) wanted.push(C.DUPLICATE);
  settings.slots.forEach(function (label, k) {
    if (layout.slots[k] === undefined) wanted.push(C.SLOT_PREFIX + (k + 1) + ': ' + label + ')');
  });
  [[layout.level, C.LEVEL], [layout.confirmationStatus, C.CONFIRMATION_STATUS], [layout.confirmationSentFor, C.CONFIRMATION_SENT_FOR],
   [layout.topicStatus, C.TOPIC_STATUS], [layout.topicSentFor, C.TOPIC_SENT_FOR]].forEach(function (pair) {
    if (pair[0] === -1) wanted.push(pair[1]);
  });
  if (wanted.length) {
    const start = sh.getLastColumn() + 1;
    if (sh.getMaxColumns() < start + wanted.length - 1) sh.insertColumnsAfter(sh.getMaxColumns(), start + wanted.length - 1 - sh.getMaxColumns());
    sh.getRange(1, start, 1, wanted.length).setValues([wanted]).setFontWeight('bold').setBackground(ORGANISER_HEADER_COLOUR);
  }

  // Re-read the layout now the columns exist.
  const all = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const L = responsesLayout_(all);
  if (sh.getMaxRows() < 600) sh.insertRowsAfter(sh.getMaxRows(), 600 - sh.getMaxRows());
  const rows = sh.getMaxRows() - 1;

  const names = breakouts.filter(function (b) { return b.listed; }).map(function (b) { return b.name; });
  settings.slots.forEach(function (label, k) {
    const col = L.slots[k];
    if (col === undefined) return;
    if (names.length) {
      sh.getRange(2, col + 1, rows, 1).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(names, true).setAllowInvalid(true)
          .setHelpText('Pick a breakout for ' + label + ', or leave blank.').build());
    }
    sh.getRange(1, col + 1).setNote('Slot ' + (k + 1) + ': ' + label + '. Pick from the dropdown. ' +
      (settings.perStudent === 1 ? 'Each student needs one breakout in total (either slot).' : 'Each student needs one breakout in each slot.') +
      ' Red means over capacity, unknown, not running in this slot, or an older duplicate response.');
  });
  if (L.level !== -1) {
    sh.getRange(2, L.level + 1, rows, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(SUMMIT.LEVELS, true).setAllowInvalid(false).build());
    sh.getRange(1, L.level + 1).setNote('Used for the assignment-topic email.');
  }
  const scriptOwned = [
    [L.duplicate, 'Filled in by the script. An older response from the same email address doesn\'t count.'],
    [L.confirmationStatus, 'Filled in by the script when you send confirmation emails.'],
    [L.confirmationSentFor, 'Filled in by the script: what the last confirmation email said. Don\'t edit; it stops duplicate emails.'],
    [L.topicStatus, 'Filled in by the script when you send assignment-topic emails.'],
    [L.topicSentFor, 'Filled in by the script: what the last topic email covered. Don\'t edit; it stops duplicate emails.'],
  ];
  scriptOwned.forEach(function (pair) { if (pair[0] !== -1) sh.getRange(1, pair[0] + 1).setNote(pair[1]); });
  sh.setFrozenRows(1);
}

/* ---------- Form ---------- */

function formDescription_(settings) {
  return 'For students attending the AI Summit 2026 at Vidyashilp Academy on ' + settings.date + '.\n\n' +
    'Rank the three breakouts you\'d most like to attend. Organisers place students and email you once you have a place. ' +
    (settings.slots.length === 1
      ? 'Breakouts run from ' + settings.slots[0] + '.'
      : 'Each breakout runs ' + settings.slots.length + ' times: ' + settings.slots.join(' and ') + '.') + '\n\n' +
    SUMMIT.CONSENT_TEXT;
}

/** Builds the form. verified is true when students must sign in with a school account. */
function createForm_(settings, breakouts) {
  const Q = SUMMIT.QUESTIONS;
  const form = FormApp.create(SUMMIT.FORM_TITLE);
  form.setDescription(formDescription_(settings));

  let verified = false;
  try {
    form.setRequireLogin(true); // school (Workspace) accounts only; throws on personal accounts
    verified = true;
  } catch (err) {
    verified = false;
  }
  if (verified) {
    try {
      form.setEmailCollectionType(FormApp.EmailCollectionType.VERIFIED);
    } catch (err) {
      form.setCollectEmail(true); // older name for the same setting
    }
    form.setLimitOneResponsePerUser(true);
    form.setAllowResponseEdits(true);
  }
  form.setPublishingSummary(false); // students can't see other people's answers
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Thanks! Organisers will place you in a breakout and email you once you have a place.' +
    (verified ? ' You can edit your answers from the link in your confirmation receipt.' : ''));

  form.addTextItem().setTitle(Q.NAME).setRequired(true);
  form.addListItem().setTitle(Q.GRADE).setChoiceValues(settings.grades).setRequired(true);
  if (!verified) {
    form.addTextItem().setTitle(Q.EMAIL)
      .setHelpText('Use your school email address. We send your breakout details here.')
      .setRequired(true)
      .setValidation(FormApp.createTextValidation().setHelpText('Enter a valid email address.').requireTextIsEmail().build());
  }
  configureChoiceGrid_(form.addGridItem().setTitle(Q.CHOICES), breakouts);
  form.addCheckboxItem().setTitle(Q.CONSENT).setChoiceValues([SUMMIT.CONSENT_TEXT]).setRequired(true);
  return { form: form, verified: verified };
}

/** One row per choice (1st, 2nd, 3rd), one column per listed breakout, each breakout picked at most once. */
function configureChoiceGrid_(item, breakouts) {
  const columns = breakouts.filter(function (b) { return b.listed; }).map(function (b) { return b.name; });
  if (!columns.length) throw new Error('No breakouts are listed. Tick "listed" for at least one breakout.');
  const rows = SUMMIT.CHOICE_ROWS.slice(0, Math.min(SUMMIT.CHOICE_ROWS.length, columns.length));
  item.setHelpText('Choose one breakout per row, each one only once. Descriptions and seats left are on the AI Summit page of the AI Centre website.')
    .setRows(rows)
    .setColumns(columns)
    .setRequired(true)
    .setValidation(FormApp.createGridValidation()
      .setHelpText('Pick a different breakout for each choice.')
      .requireLimitOneResponsePerColumn()
      .build());
}

/* ---------- Helpers ---------- */

function setSetting_(label, value) {
  const sh = sheet_(SUMMIT.TABS.SETTINGS);
  const labels = sh.getRange(1, 1, sh.getLastRow(), 1).getDisplayValues();
  for (let i = 0; i < labels.length; i++) {
    if (String(labels[i][0]).trim() === label) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([label, value, '']);
}

function saveBreakoutNames_(breakouts) {
  const names = {};
  breakouts.forEach(function (b) { names[b.id] = b.name; });
  PropertiesService.getDocumentProperties().setProperty(NAMES_PROPERTY, JSON.stringify(names));
}

/**
 * When a breakout is renamed on the Breakouts tab (same id, new name), existing
 * assignment cells still hold the old name. This swaps them for the new name.
 * Returns how many cells changed.
 */
function carryRenamedBreakouts_(breakouts) {
  const saved = JSON.parse(PropertiesService.getDocumentProperties().getProperty(NAMES_PROPERTY) || '{}');
  const renames = {};
  breakouts.forEach(function (b) {
    if (saved[b.id] && normaliseKey_(saved[b.id]) !== normaliseKey_(b.name)) renames[normaliseKey_(saved[b.id])] = b.name;
  });
  if (!Object.keys(renames).length) return 0;

  const sh = sheet_(SUMMIT.TABS.RESPONSES);
  const layout = responsesLayout_(sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]);
  const lastRow = sh.getLastRow();
  let changed = 0;
  if (lastRow < 2) return 0;
  layout.slots.forEach(function (col) {
    if (col === undefined) return;
    const range = sh.getRange(2, col + 1, lastRow - 1, 1);
    const values = range.getValues().map(function (r) {
      const next = renames[normaliseKey_(r[0])];
      if (next) { changed++; return [next]; }
      return r;
    });
    range.setValues(values);
  });
  return changed;
}

function styleHeader_(sh, width) {
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground(ORGANISER_HEADER_COLOUR);
  sh.setFrozenRows(1);
}

/** Deletes the blank "Sheet1" a new spreadsheet starts with, if nobody has used it. */
function removeEmptyDefaultTab_(ss) {
  const blank = ss.getSheets().filter(function (s) { return /^(sheet1|sheet 1)$/i.test(s.getName()) && s.getLastRow() === 0; })[0];
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);
}
