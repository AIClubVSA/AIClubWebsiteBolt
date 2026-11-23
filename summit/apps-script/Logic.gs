/**
 * Logic.gs — the rules, as pure functions.
 *
 * Nothing in this file touches the Sheet, the Form or email. It takes plain data
 * (rows already read from the Sheet) and returns plain data. That keeps the rules
 * in one place and lets Tests.gs check them with fake students.
 *
 * Shapes used throughout:
 *   settings  { perStudent, slots: ['10:00–11:00 am', ...], defaultCapacity, date, grades, senderName, replyTo }
 *   breakout  { id, name, description, capacity, runs: [slotIndex, ...], room, status, listed }
 *   student   { row, timestamp, name, grade, email, slotValues: ['AI in Law', ''], level,
 *               confirmationSentFor, topicSentFor }
 *   Slot indexes start at 0 (slot 1 in the Sheet is index 0).
 */

/** Splits "a; b" or one item per line into a trimmed list. */
function splitList_(value) {
  return String(value == null ? '' : value)
    .split(/[;\n]/)
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
}

/** Lower-cases and tidies text so "AI  in Law " matches "ai in law" and "10:00 – 11:00" matches "10:00-11:00". */
function normaliseKey_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function toBoolean_(value, fallback) {
  if (value === true || value === false) return value;
  const s = normaliseKey_(value);
  if (s === '') return fallback;
  if (['true', 'yes', 'y', '1', 'x'].indexOf(s) !== -1) return true;
  if (['false', 'no', 'n', '0'].indexOf(s) !== -1) return false;
  return fallback;
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function firstName_(name) {
  const first = String(name || '').trim().split(/\s+/)[0];
  return first || 'there';
}

/** Turns the Settings tab ({label: value}) into settings, with defaults and a list of problems. */
function parseSettings_(raw) {
  const K = SUMMIT.SETTINGS_KEYS;
  const D = SUMMIT.DEFAULTS;
  const get = function (key) { return raw[key] == null ? '' : String(raw[key]).trim(); };
  const problems = [];

  const perText = get(K.PER_STUDENT);
  let perStudent = D.PER_STUDENT;
  if (perText === '1' || perText === '2') perStudent = Number(perText);
  else if (perText !== '') problems.push('Settings → "' + K.PER_STUDENT + '" must be 1 or 2 (it says "' + perText + '").');

  const slots = splitList_(get(K.SLOTS));
  const finalSlots = slots.length ? slots : D.SLOTS.slice();
  if (perStudent > finalSlots.length) {
    problems.push('Settings → "' + K.PER_STUDENT + '" is ' + perStudent + ' but only ' + finalSlots.length + ' time slot(s) are listed.');
  }

  const capText = get(K.DEFAULT_CAPACITY);
  let defaultCapacity = D.DEFAULT_CAPACITY;
  if (capText !== '') {
    const n = Number(capText);
    if (n > 0 && Math.floor(n) === n) defaultCapacity = n;
    else problems.push('Settings → "' + K.DEFAULT_CAPACITY + '" must be a whole number (it says "' + capText + '").');
  }

  const grades = splitList_(get(K.GRADES));
  return {
    perStudent: perStudent,
    slots: finalSlots,
    defaultCapacity: defaultCapacity,
    date: get(K.DATE) || D.DATE,
    grades: grades.length ? grades : D.GRADES.slice(),
    senderName: get(K.SENDER_NAME) || D.SENDER_NAME,
    replyTo: isEmail_(get(K.REPLY_TO)) ? get(K.REPLY_TO) : '',
    problems: problems,
  };
}

/** Finds which time slot some text refers to: "1", "2" or the slot's label. Returns -1 if none. */
function matchSlot_(text, slots) {
  const key = normaliseKey_(text);
  if (/^\d+$/.test(key)) {
    const n = Number(key);
    return n >= 1 && n <= slots.length ? n - 1 : -1;
  }
  for (let i = 0; i < slots.length; i++) {
    if (normaliseKey_(slots[i]) === key) return i;
  }
  return -1;
}

/**
 * Turns Breakouts tab rows (objects keyed by lower-case header) into breakouts.
 * Blank rows are skipped. Problems are reported, never thrown, so one bad row
 * doesn't take the website down.
 */
function parseBreakouts_(rows, settings) {
  const breakouts = [];
  const problems = [];
  const seen = {};

  rows.forEach(function (r, i) {
    const rowNo = i + 2;
    const name = String(r.name == null ? '' : r.name).trim();
    let id = normaliseKey_(r.id).replace(/\s+/g, '-');
    if (!name && !id) return;
    if (!name) { problems.push('Breakouts row ' + rowNo + ': the name is empty.'); return; }
    if (!id) id = normaliseKey_(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (seen[id]) { problems.push('Breakouts row ' + rowNo + ': the id "' + id + '" is used twice.'); return; }
    seen[id] = true;

    let capacity = settings.defaultCapacity;
    const capText = String(r.capacity == null ? '' : r.capacity).trim();
    if (capText !== '') {
      const n = Number(capText);
      if (n > 0 && Math.floor(n) === n) capacity = n;
      else problems.push('Breakouts row ' + rowNo + ' (' + name + '): capacity "' + capText + '" isn\'t a whole number, so ' + capacity + ' is used.');
    }

    const runParts = splitList_(r.runs);
    let runs = [];
    if (!runParts.length) {
      runs = settings.slots.map(function (_, k) { return k; });
    } else {
      runParts.forEach(function (part) {
        const k = matchSlot_(part, settings.slots);
        if (k === -1) problems.push('Breakouts row ' + rowNo + ' (' + name + '): the time "' + part + '" isn\'t one of Settings → Time slots.');
        else if (runs.indexOf(k) === -1) runs.push(k);
      });
      runs.sort();
    }

    const statusKey = normaliseKey_(r.status);
    if (statusKey && statusKey !== 'confirmed' && statusKey !== 'tentative') {
      problems.push('Breakouts row ' + rowNo + ' (' + name + '): status should be "confirmed" or "tentative".');
    }

    breakouts.push({
      id: id,
      name: name,
      description: String(r.description == null ? '' : r.description).trim(),
      capacity: capacity,
      runs: runs,
      room: String(r.room == null ? '' : r.room).trim(),
      status: statusKey === 'tentative' ? 'tentative' : 'confirmed',
      listed: toBoolean_(r.listed, true),
    });
  });

  return { breakouts: breakouts, problems: problems };
}

/** Lets an assignment cell hold either a breakout's name or its id. */
function indexBreakouts_(breakouts) {
  const index = {};
  breakouts.forEach(function (b) {
    index[normaliseKey_(b.id)] = b;
    index[normaliseKey_(b.name)] = b;
  });
  return index;
}

/** Finds the columns on the Responses tab by their header text. Missing columns are -1. */
function responsesLayout_(headers) {
  const C = SUMMIT.COLUMNS;
  const Q = SUMMIT.QUESTIONS;
  const keys = headers.map(normaliseKey_);
  const exact = function (title) { return keys.indexOf(normaliseKey_(title)); };
  const layout = {
    timestamp: exact(C.TIMESTAMP),
    name: exact(Q.NAME),
    grade: exact(Q.GRADE),
    email: -1,
    duplicate: exact(C.DUPLICATE),
    level: exact(C.LEVEL),
    confirmationStatus: exact(C.CONFIRMATION_STATUS),
    confirmationSentFor: exact(C.CONFIRMATION_SENT_FOR),
    topicStatus: exact(C.TOPIC_STATUS),
    topicSentFor: exact(C.TOPIC_SENT_FOR),
    slots: [],
  };
  keys.forEach(function (key, i) {
    // "Email address" (collected by Google sign-in) or "School email address" (typed by the student).
    if (layout.email === -1 && /^(school )?email address$/.test(key)) layout.email = i;
    const m = String(headers[i]).match(/^Assigned breakout \(slot (\d+)/i);
    if (m) layout.slots[Number(m[1]) - 1] = i;
  });
  return layout;
}

/**
 * Students who submitted more than once: only their latest response counts.
 * Returns { olderRow: latestRow }. Matching is by email address.
 */
function findSuperseded_(students) {
  const latest = {};
  students.forEach(function (s) {
    const key = normaliseKey_(s.email);
    if (!key) return;
    const cur = latest[key];
    if (!cur || s.timestamp > cur.timestamp || (s.timestamp === cur.timestamp && s.row > cur.row)) latest[key] = s;
  });
  const superseded = {};
  students.forEach(function (s) {
    const key = normaliseKey_(s.email);
    if (key && latest[key] !== s) superseded[s.row] = latest[key].row;
  });
  return superseded;
}

/**
 * If an email went out from a response the student later replaced, the newer
 * response inherits that record, so the student isn't emailed the same thing twice.
 * Returns { latestRow: 'what was sent' }.
 */
function inheritedSentFor_(students, superseded, field) {
  const inherited = {};
  students
    .filter(function (s) { return superseded[s.row] && s[field]; })
    .sort(function (a, b) { return a.timestamp - b.timestamp || a.row - b.row; })
    .forEach(function (s) { inherited[superseded[s.row]] = s[field]; });
  return inherited;
}

/**
 * Reads one student's "Assigned breakout" cells.
 * fingerprint is a short, stable record of the assignment (by id, so renaming a
 * breakout doesn't look like a change), e.g. "slot1=finance; slot2=law".
 */
function resolveAssignment_(student, index, settings) {
  const items = [];
  const errors = [];
  student.slotValues.forEach(function (value, slot) {
    const text = String(value == null ? '' : value).trim();
    if (!text) return;
    const b = index[normaliseKey_(text)];
    if (!b) { errors.push('"' + text + '" isn\'t a breakout on the Breakouts tab'); return; }
    if (b.runs.indexOf(slot) === -1) { errors.push(b.name + ' doesn\'t run at ' + settings.slots[slot]); return; }
    items.push({ slot: slot, breakout: b });
  });
  const ids = items.map(function (i) { return i.breakout.id; });
  if (ids.some(function (id, k) { return ids.indexOf(id) !== k; })) errors.push('the same breakout is assigned twice');
  return {
    items: items,
    errors: errors,
    fingerprint: items.map(function (i) { return 'slot' + (i.slot + 1) + '=' + i.breakout.id; }).join('; '),
  };
}

/** Seats taken: { breakoutId: [countForSlot1, countForSlot2, ...] }. Older duplicate responses don't count. */
function countSeats_(students, breakouts, settings, superseded) {
  const index = indexBreakouts_(breakouts);
  const counts = {};
  breakouts.forEach(function (b) { counts[b.id] = settings.slots.map(function () { return 0; }); });
  students.forEach(function (s) {
    if (superseded[s.row]) return;
    s.slotValues.forEach(function (value, slot) {
      const b = index[normaliseKey_(value)];
      if (b && slot < settings.slots.length) counts[b.id][slot]++;
    });
  });
  return counts;
}

/** Every breakout run with more students assigned than seats. */
function overCapacity_(breakouts, counts) {
  const over = [];
  breakouts.forEach(function (b) {
    (counts[b.id] || []).forEach(function (taken, slot) {
      if (taken > b.capacity) over.push({ breakout: b, slot: slot, taken: taken, capacity: b.capacity });
    });
  });
  return over;
}

/**
 * The public JSON the website reads. Listed breakouts only, and only these fields:
 * id, name, description, status and, per run, time, capacity, taken, left and full.
 * No names, emails, grades or rooms ever go in here.
 */
function buildAvailability_(breakouts, counts, settings, updatedAt) {
  return {
    ok: true,
    updatedAt: updatedAt,
    breakoutsPerStudent: settings.perStudent,
    breakouts: breakouts
      .filter(function (b) { return b.listed; })
      .map(function (b) {
        const runs = b.runs.map(function (slot) {
          const taken = Math.min((counts[b.id] || [])[slot] || 0, b.capacity);
          const left = b.capacity - taken;
          return { time: settings.slots[slot], capacity: b.capacity, taken: taken, left: left, full: left === 0 };
        });
        return {
          id: b.id,
          name: b.name,
          description: b.description,
          status: b.status,
          full: runs.length > 0 && runs.every(function (r) { return r.full; }),
          runs: runs,
        };
      }),
  };
}

/** Why an "Assigned breakout" cell should be highlighted, or '' if it's fine. */
function assignmentCellProblem_(value, slot, index, overKeys, isSuperseded, settings) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return '';
  if (isSuperseded) return 'older duplicate response';
  const b = index[normaliseKey_(text)];
  if (!b) return 'unknown breakout';
  if (b.runs.indexOf(slot) === -1) return 'doesn\'t run at ' + settings.slots[slot];
  if (overKeys[b.id + '#' + slot]) return 'over capacity';
  return '';
}

function hasAnyAssignment_(student) {
  return student.slotValues.some(function (v) { return String(v == null ? '' : v).trim() !== ''; });
}

/** Checks one student's assignment is complete and valid. Returns a reason, or '' if it's fine. */
function assignmentProblem_(assignment, student, settings) {
  if (assignment.errors.length) return assignment.errors[0];
  if (assignment.items.length !== settings.perStudent) {
    return settings.perStudent === 2
      ? 'needs 2 breakouts, one in each time slot (has ' + assignment.items.length + ')'
      : 'needs exactly 1 breakout (has ' + assignment.items.length + ')';
  }
  if (!isEmail_(student.email)) return 'no valid email address';
  return '';
}

/**
 * Decides, for every student, what the "Send confirmation emails" menu should do.
 * Actions:
 *   send     first confirmation
 *   update   assignment changed since the last email: send the "updated" template
 *   carry    already emailed from an older duplicate response; just copy that record across
 *   blocked  can't send yet (reason says why)
 *   removed  was emailed, but the assignment has since been cleared: organisers should tell the student
 *   none     nothing to do
 */
function planConfirmations_(students, breakouts, settings) {
  const index = indexBreakouts_(breakouts);
  const superseded = findSuperseded_(students);
  const counts = countSeats_(students, breakouts, settings, superseded);
  const overKeys = {};
  overCapacity_(breakouts, counts).forEach(function (o) { overKeys[o.breakout.id + '#' + o.slot] = o; });
  const inherited = inheritedSentFor_(students, superseded, 'confirmationSentFor');

  return students.map(function (s) {
    const plan = function (action, extra) {
      const p = { student: s, action: action };
      Object.keys(extra || {}).forEach(function (k) { p[k] = extra[k]; });
      return p;
    };
    if (superseded[s.row]) {
      return hasAnyAssignment_(s)
        ? plan('blocked', { reason: 'older duplicate response: assign row ' + superseded[s.row] + ' instead' })
        : plan('none');
    }
    const a = resolveAssignment_(s, index, settings);
    const previous = s.confirmationSentFor || inherited[s.row] || '';
    const carried = !s.confirmationSentFor && inherited[s.row] ? inherited[s.row] : '';

    if (!a.items.length && !a.errors.length) {
      return previous
        ? plan('removed', { assignment: a, reason: 'assignment cleared after the email was sent: tell the student' })
        : plan('none', { assignment: a });
    }
    if (a.fingerprint === previous && !a.errors.length) {
      return carried ? plan('carry', { assignment: a, sentFor: carried }) : plan('none', { assignment: a });
    }
    const problem = assignmentProblem_(a, s, settings);
    if (problem) return plan('blocked', { assignment: a, reason: problem });

    const over = a.items
      .map(function (i) { return overKeys[i.breakout.id + '#' + i.slot]; })
      .filter(Boolean)[0];
    if (over) {
      return plan('blocked', {
        assignment: a,
        reason: over.breakout.name + ' at ' + settings.slots[over.slot] + ' is over capacity (' + over.taken + '/' + over.capacity + ')',
      });
    }
    return plan(previous ? 'update' : 'send', { assignment: a, sentFor: a.fingerprint, previous: previous });
  });
}

/** Picks a level from the Level column, ignoring case. Returns '' if it isn't one of SUMMIT.LEVELS. */
function matchLevel_(value) {
  const key = normaliseKey_(value);
  for (let i = 0; i < SUMMIT.LEVELS.length; i++) {
    if (normaliseKey_(SUMMIT.LEVELS[i]) === key) return SUMMIT.LEVELS[i];
  }
  return '';
}

/**
 * Same idea as planConfirmations_, for the assignment-topic email.
 * topics is { breakoutId: { beginner, intermediate, advanced } } from the Topics tab.
 * A topic email only goes after the student's current assignment was confirmed.
 */
function planTopics_(students, breakouts, settings, topics) {
  const index = indexBreakouts_(breakouts);
  const superseded = findSuperseded_(students);
  const inheritedConfirmation = inheritedSentFor_(students, superseded, 'confirmationSentFor');
  const inheritedTopic = inheritedSentFor_(students, superseded, 'topicSentFor');

  return students.map(function (s) {
    const plan = function (action, extra) {
      const p = { student: s, action: action };
      Object.keys(extra || {}).forEach(function (k) { p[k] = extra[k]; });
      return p;
    };
    if (superseded[s.row]) return plan('none');
    const a = resolveAssignment_(s, index, settings);
    if (!a.items.length && !a.errors.length) return plan('none', { assignment: a });

    const problem = assignmentProblem_(a, s, settings);
    if (problem) return plan('blocked', { assignment: a, reason: problem });
    const confirmed = s.confirmationSentFor || inheritedConfirmation[s.row] || '';
    if (confirmed !== a.fingerprint) return plan('blocked', { assignment: a, reason: 'send the confirmation email first' });

    const level = matchLevel_(s.level);
    if (!level) return plan('blocked', { assignment: a, reason: 'choose a Level (' + SUMMIT.LEVELS.join(', ') + ')' });

    const missing = a.items.filter(function (i) {
      const t = topics[i.breakout.id];
      return !t || !String(t[level.toLowerCase()] || '').trim();
    })[0];
    if (missing) {
      return plan('blocked', { assignment: a, level: level, reason: 'no ' + level + ' topic for ' + missing.breakout.name + ' on the Topics tab yet' });
    }

    const sentFor = a.fingerprint + '; level=' + level;
    const previous = s.topicSentFor || inheritedTopic[s.row] || '';
    const carried = !s.topicSentFor && inheritedTopic[s.row] ? inheritedTopic[s.row] : '';
    if (previous === sentFor) {
      return carried ? plan('carry', { assignment: a, level: level, sentFor: carried }) : plan('none', { assignment: a, level: level });
    }
    return plan(previous ? 'update' : 'send', { assignment: a, level: level, sentFor: sentFor, previous: previous });
  });
}

/** Values for the {placeholders} in an email. Works for one or two breakouts. */
function emailValues_(student, assignment, settings, level, topics) {
  const items = assignment.items;
  const topicFor = function (i) {
    if (!level || !topics) return '';
    const t = topics[i.breakout.id] || {};
    return String(t[level.toLowerCase()] || '').trim();
  };
  return {
    name: student.name,
    first_name: firstName_(student.name),
    grade: student.grade || '',
    breakout: items.map(function (i) { return i.breakout.name; }).join(' and '),
    time: items.map(function (i) { return settings.slots[i.slot]; }).join(' and '),
    room: items.map(function (i) { return i.breakout.room; }).filter(Boolean).join(' and '),
    schedule: items.map(function (i) {
      return '• ' + i.breakout.name + ': ' + settings.slots[i.slot] + (i.breakout.room ? ', ' + i.breakout.room : '');
    }).join('\n'),
    date: settings.date,
    level: level || '',
    topic: items.map(topicFor).filter(Boolean).join('\n\n'),
    topics: items.map(function (i) { return '• ' + i.breakout.name + ': ' + topicFor(i); }).join('\n'),
  };
}

/** Replaces {placeholders}. Unknown ones are left as they are (unknownPlaceholders_ catches them first). */
function fillTemplate_(text, values) {
  return String(text || '').replace(/\{([a-z_]+)\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
  });
}

/** Placeholders in a template that aren't in SUMMIT.PLACEHOLDERS, e.g. a typo like {breakuot}. */
function unknownPlaceholders_(text) {
  const found = [];
  String(text || '').replace(/\{([^{}]*)\}/g, function (match, key) {
    if (SUMMIT.PLACEHOLDERS.indexOf(key) === -1 && found.indexOf(match) === -1) found.push(match);
    return match;
  });
  return found;
}
