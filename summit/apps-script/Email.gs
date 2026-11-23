/**
 * Email.gs — confirmation and assignment-topic emails.
 *
 * Emails go from the Google account of whoever clicks the menu item, so organisers
 * should click it while signed in to the school Workspace account.
 *
 * Each email goes once. After sending, the script writes what it said into the
 * "Confirmation sent for" / "Topic email sent for" column. Next time it compares the
 * student's current assignment with that record:
 *   same            → nothing is sent
 *   different       → one "updated" email is sent (confirmation), or the topic email is re-sent
 *   cleared         → nothing is sent; the status asks organisers to tell the student
 *
 * Only one organiser can send at a time (a lock), and sending stops before the
 * account's daily email quota runs out. Unsent students stay queued for next time.
 */

/** Menu: Send confirmation emails to newly assigned students. */
function sendConfirmationEmails() {
  runEmailJob_('confirmation');
}

/** Menu: Send assignment-topic emails. */
function sendTopicEmails() {
  runEmailJob_('topic');
}

/** Menu: Show remaining email quota. */
function showEmailQuota() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Email quota',
    'This account (' + Session.getEffectiveUser().getEmail() + ') can email ' + MailApp.getRemainingDailyQuota() +
    ' more recipients today.\n\nGoogle Workspace accounts (including school accounts) get 1,500 a day. ' +
    'Personal Gmail accounts get 100. The count resets 24 hours after the first email of the day.',
    ui.ButtonSet.OK);
}

function runEmailJob_(kind) {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(5000)) {
    ui.alert('Someone else is sending emails from this Sheet right now. Try again in a minute.');
    return;
  }
  try {
    const state = loadState_();
    if (state.problems.length) {
      ui.alert('Fix these first', state.problems.map(bullet_).join('\n'), ui.ButtonSet.OK);
      return;
    }

    const templates = readTemplates_();
    const needed = kind === 'confirmation' ? ['confirmation', 'updated'] : ['topic'];
    const templateProblems = [];
    needed.forEach(function (key) {
      const t = templates[key];
      if (!t || !t.subject.trim() || !t.body.trim()) { templateProblems.push('The "' + key + '" template is missing or empty.'); return; }
      const unknown = unknownPlaceholders_(t.subject).concat(unknownPlaceholders_(t.body));
      if (unknown.length) templateProblems.push('The "' + key + '" template uses ' + unknown.join(', ') + ', which isn\'t a placeholder. Allowed: ' +
        SUMMIT.PLACEHOLDERS.map(function (p) { return '{' + p + '}'; }).join(' '));
    });
    if (templateProblems.length) {
      ui.alert('Fix the Templates tab first', templateProblems.join('\n\n'), ui.ButtonSet.OK);
      return;
    }

    applyChecks_(state); // refresh duplicate marks and red cells first
    const topics = kind === 'topic' ? readTopics_() : null;
    const students = state.responses.students;
    const plan = kind === 'confirmation'
      ? planConfirmations_(students, state.breakouts, state.settings)
      : planTopics_(students, state.breakouts, state.settings, topics);

    const sh = state.responses.sheet;
    const L = state.responses.layout;
    const statusCol = kind === 'confirmation' ? L.confirmationStatus : L.topicStatus;
    const sentForCol = kind === 'confirmation' ? L.confirmationSentFor : L.topicSentFor;
    const statusKey = kind === 'confirmation' ? 'confirmationStatus' : 'topicStatus';

    // Record why anyone is held back, and copy records across from older duplicate responses.
    plan.forEach(function (p) {
      const current = p.student[statusKey];
      if (p.action === 'blocked' || p.action === 'removed') {
        const text = 'Not sent: ' + p.reason;
        if (current !== text) setCell_(sh, p.student.row, statusCol, text);
      } else if (p.action === 'carry') {
        setCell_(sh, p.student.row, sentForCol, p.sentFor);
        setCell_(sh, p.student.row, statusCol, 'Already emailed from an earlier response');
      } else if (p.action === 'none' && /^(Not sent|Waiting)/.test(current)) {
        setCell_(sh, p.student.row, statusCol, '');
      }
    });
    SpreadsheetApp.flush();

    const queue = plan.filter(function (p) { return p.action === 'send' || p.action === 'update'; });
    const held = plan.filter(function (p) { return p.action === 'blocked' || p.action === 'removed'; }).length;
    const label = kind === 'confirmation' ? 'confirmation' : 'assignment-topic';
    if (!queue.length) {
      ui.alert('Nothing to send',
        'No student needs a ' + label + ' email right now.' +
        (held ? '\n\n' + held + ' student(s) are held back. The "' + (kind === 'confirmation' ? SUMMIT.COLUMNS.CONFIRMATION_STATUS : SUMMIT.COLUMNS.TOPIC_STATUS) + '" column says why.' : ''),
        ui.ButtonSet.OK);
      return;
    }

    const quota = MailApp.getRemainingDailyQuota();
    const allowed = Math.max(0, Math.min(queue.length, quota - SUMMIT.QUOTA_RESERVE));
    const updates = queue.filter(function (p) { return p.action === 'update'; }).length;
    const message = [
      'Send ' + queue.length + ' ' + label + ' email(s) from ' + Session.getEffectiveUser().getEmail() + '?',
      updates ? updates + ' of them are for students whose assignment' + (kind === 'topic' ? ' or level' : '') + ' changed after an earlier email.' : '',
      held ? held + ' student(s) are held back; the status column says why.' : '',
      'Emails left today on this account: ' + quota + '.',
      allowed < queue.length
        ? 'Only ' + allowed + ' can go today. The rest will be marked "Waiting" and go next time you run this.'
        : '',
    ].filter(Boolean).join('\n\n');
    if (ui.alert('Send emails?', message, ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

    let sent = 0;
    let failed = 0;
    queue.forEach(function (p, i) {
      const row = p.student.row;
      if (i >= allowed) {
        setCell_(sh, row, statusCol, 'Waiting: daily email limit reached, run again tomorrow');
        return;
      }
      const key = kind === 'confirmation' ? (p.action === 'update' ? 'updated' : 'confirmation') : 'topic';
      const values = emailValues_(p.student, p.assignment, state.settings, p.level, topics);
      try {
        const options = {
          to: p.student.email,
          subject: fillTemplate_(templates[key].subject, values),
          body: fillTemplate_(templates[key].body, values),
          name: state.settings.senderName,
        };
        if (state.settings.replyTo) options.replyTo = state.settings.replyTo;
        MailApp.sendEmail(options);
        // Record straight away, so a crash part-way through can't cause a second email.
        setCell_(sh, row, sentForCol, p.sentFor);
        setCell_(sh, row, statusCol, (p.action === 'update' ? 'Update sent ' : 'Sent ') + timestampText_());
        sent++;
      } catch (err) {
        setCell_(sh, row, statusCol, 'Failed: ' + err.message);
        failed++;
      }
      SpreadsheetApp.flush();
    });

    ui.alert('Done',
      'Sent ' + sent + ' ' + label + ' email(s).' +
      (failed ? '\n' + failed + ' failed; the status column has the error.' : '') +
      (queue.length > allowed ? '\n' + (queue.length - allowed) + ' are waiting for tomorrow\'s quota.' : '') +
      '\nEmails left today: ' + MailApp.getRemainingDailyQuota() + '.',
      ui.ButtonSet.OK);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menu: Send me a test of each email.
 * Sends the three templates, filled in with a made-up student, to your own address only.
 */
function sendTestEmails() {
  const ui = SpreadsheetApp.getUi();
  const me = Session.getEffectiveUser().getEmail();
  if (ui.alert('Send test emails?', 'This sends 3 test emails (confirmation, updated, topic) to ' + me + ' only.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;

  const settings = readSettings_();
  const breakouts = readBreakouts_(settings).breakouts.filter(function (b) { return b.listed; });
  const templates = readTemplates_();
  const topics = readTopics_();

  // A made-up student in the first listed breakout(s), one per time slot.
  const items = [];
  for (let slot = 0; slot < settings.slots.length && items.length < settings.perStudent; slot++) {
    const b = breakouts.filter(function (x) {
      return x.runs.indexOf(slot) !== -1 && !items.some(function (i) { return i.breakout.id === x.id; });
    })[0];
    if (b) items.push({ slot: slot, breakout: b });
  }
  if (!items.length) { ui.alert('No listed breakouts to use in a test.'); return; }
  const level = SUMMIT.LEVELS[0];
  const testTopics = {};
  items.forEach(function (i) {
    const t = topics[i.breakout.id] || {};
    testTopics[i.breakout.id] = {};
    testTopics[i.breakout.id][level.toLowerCase()] = t[level.toLowerCase()] || '[' + level + ' topic for ' + i.breakout.name + ' not written yet]';
  });
  const student = { name: 'Test Student', grade: settings.grades[0], email: me };
  const values = emailValues_(student, { items: items }, settings, level, testTopics);

  const sent = [];
  ['confirmation', 'updated', 'topic'].forEach(function (key) {
    const t = templates[key];
    if (!t) return;
    const options = {
      to: me,
      subject: '[TEST] ' + fillTemplate_(t.subject, values),
      body: fillTemplate_(t.body, values),
      name: settings.senderName,
    };
    if (settings.replyTo) options.replyTo = settings.replyTo;
    MailApp.sendEmail(options);
    sent.push(key);
  });
  ui.alert('Sent ' + sent.length + ' test email(s) to ' + me + ': ' + sent.join(', ') + '.');
}
