/**
 * Capacity.gs — capacity warnings and the duplicate check.
 *
 * - onEdit runs whenever someone edits the Sheet. When an "Assigned breakout" cell
 *   changes, it re-checks that column: cells that are over capacity, unknown, in a
 *   time slot the breakout doesn't run, or on an older duplicate response turn red,
 *   and a pop-up names any breakout that's over capacity.
 * - "Check capacity and duplicates" (menu) does the same for the whole tab, marks
 *   older duplicate responses, rewrites the Capacity tab and lists anything that
 *   would stop an email going out.
 */

const PROBLEM_COLOUR = '#f4c7c3';

/** Simple trigger: Google runs this automatically on every edit. */
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== SUMMIT.TABS.RESPONSES) return;
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    const layout = responsesLayout_(headers);
    const first = e.range.getColumn() - 1;
    const last = first + e.range.getNumColumns() - 1;
    const touchesSlot = layout.slots.some(function (c) { return c !== undefined && c >= first && c <= last; });
    if (!touchesSlot) return;

    const state = loadState_();
    const result = applyChecks_(state);
    clearAvailabilityCache_();
    if (result.over.length) {
      e.source.toast(
        result.over.map(function (o) {
          return o.breakout.name + ' (' + state.settings.slots[o.slot] + '): ' + o.taken + ' assigned, ' + o.capacity + ' seats';
        }).join('\n'),
        'Over capacity',
        15
      );
    }
  } catch (err) {
    console.warn('onEdit check skipped: ' + err);
  }
}

/**
 * Marks older duplicate responses and colours problem cells in the "Assigned breakout" columns.
 * Returns { superseded, counts, over } for callers that need them.
 */
function applyChecks_(state) {
  const sh = state.responses.sheet;
  const layout = state.responses.layout;
  const students = state.responses.students;
  const settings = state.settings;
  const index = indexBreakouts_(state.breakouts);
  const superseded = findSuperseded_(students);
  const counts = countSeats_(students, state.breakouts, settings, superseded);
  const over = overCapacity_(state.breakouts, counts);
  const overKeys = {};
  over.forEach(function (o) { overKeys[o.breakout.id + '#' + o.slot] = true; });

  const lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    const byRow = {};
    students.forEach(function (s) { byRow[s.row] = s; });

    if (layout.duplicate !== -1) {
      const marks = [];
      for (let r = 2; r <= lastRow; r++) marks.push([superseded[r] ? 'Older response: row ' + superseded[r] + ' counts' : '']);
      sh.getRange(2, layout.duplicate + 1, lastRow - 1, 1).setValues(marks);
    }

    settings.slots.forEach(function (_, slot) {
      const col = layout.slots[slot];
      if (col === undefined) return;
      const colours = [];
      for (let r = 2; r <= lastRow; r++) {
        const s = byRow[r];
        const problem = s ? assignmentCellProblem_(s.slotValues[slot], slot, index, overKeys, !!superseded[r], settings) : '';
        colours.push([problem ? PROBLEM_COLOUR : null]);
      }
      sh.getRange(2, col + 1, lastRow - 1, 1).setBackgrounds(colours);
    });
  }
  return { superseded: superseded, counts: counts, over: over };
}

/** Menu: AI Summit → Check capacity and duplicates. */
function checkCapacityAndDuplicates() {
  const ui = SpreadsheetApp.getUi();
  const state = loadState_();
  const result = applyChecks_(state);
  writeCapacityTab_(state, result.counts);
  clearAvailabilityCache_();

  const lines = [];
  if (state.problems.length) lines.push('Settings and Breakouts tabs:\n' + state.problems.map(bullet_).join('\n'));

  lines.push(result.over.length
    ? 'Over capacity:\n' + result.over.map(function (o) {
        return bullet_(o.breakout.name + ' (' + state.settings.slots[o.slot] + '): ' + o.taken + ' assigned, ' + o.capacity + ' seats');
      }).join('\n')
    : 'No breakout is over capacity.');

  const dupes = Object.keys(result.superseded).length;
  lines.push(dupes
    ? dupes + ' older duplicate response(s) are marked in the "' + SUMMIT.COLUMNS.DUPLICATE + '" column and don\'t count.'
    : 'No duplicate responses.');

  const held = planConfirmations_(state.responses.students, state.breakouts, state.settings)
    .filter(function (p) { return p.action === 'blocked' || p.action === 'removed'; });
  if (held.length) {
    lines.push('Confirmation emails that can\'t go yet (' + held.length + '):\n' +
      held.slice(0, 12).map(function (p) { return bullet_('Row ' + p.student.row + ': ' + p.reason); }).join('\n') +
      (held.length > 12 ? '\n…and ' + (held.length - 12) + ' more (see the "' + SUMMIT.COLUMNS.CONFIRMATION_STATUS + '" column after sending).' : ''));
  }
  ui.alert('Capacity and duplicates', lines.join('\n\n'), ui.ButtonSet.OK);
}

/** Rewrites the Capacity tab: one line per breakout per time slot. Organisers only; the website never reads it. */
function writeCapacityTab_(state, counts) {
  const ss = ss_();
  const sh = ss.getSheetByName(SUMMIT.TABS.CAPACITY) || ss.insertSheet(SUMMIT.TABS.CAPACITY);
  const rows = [['Breakout', 'Time slot', 'Assigned', 'Seats', 'Left', 'Status', 'On website']];
  state.breakouts.forEach(function (b) {
    state.settings.slots.forEach(function (label, slot) {
      const taken = (counts[b.id] || [])[slot] || 0;
      const runs = b.runs.indexOf(slot) !== -1;
      if (!runs && !taken) return;
      let status = 'Open';
      if (!runs) status = 'Doesn\'t run in this slot';
      else if (taken > b.capacity) status = 'OVER CAPACITY';
      else if (taken === b.capacity) status = 'Full';
      rows.push([b.name, label, taken, runs ? b.capacity : '', runs ? Math.max(0, b.capacity - taken) : '', status, b.listed ? 'Yes' : 'Hidden']);
    });
  });
  sh.clear();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.getRange(1, 9).setValue('Updated ' + timestampText_() + ' by "Check capacity and duplicates". Live counts are on the Responses tab.');
  sh.autoResizeColumns(1, rows[0].length);
}

function bullet_(text) {
  return '• ' + text;
}
