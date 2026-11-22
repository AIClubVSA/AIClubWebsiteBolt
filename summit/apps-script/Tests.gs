/**
 * Tests.gs — self-tests for the rules in Logic.gs.
 *
 * Menu: AI Summit → Run self-tests. Uses made-up students only. It doesn't read
 * or change the Sheet and doesn't send email.
 *
 * Covers: a full breakout, a student submitting twice, an assignment changing after
 * the email was sent, and the public endpoint never exposing student data.
 */

function runSelfTests() {
  const results = runSelfTestsCore_();
  const failed = results.filter(function (r) { return !r.ok; });
  const text = results.map(function (r) { return (r.ok ? '✓ ' : '✗ ') + r.name + (r.ok ? '' : '\n    ' + r.detail); }).join('\n');
  console.log(text);
  SpreadsheetApp.getUi().alert(
    failed.length ? failed.length + ' self-test(s) failed' : 'All ' + results.length + ' self-tests passed',
    text, SpreadsheetApp.getUi().ButtonSet.OK);
}

/** Runs every test and returns [{ name, ok, detail }]. No Google services are used. */
function runSelfTestsCore_() {
  const results = [];
  const test = function (name, fn) {
    try {
      fn();
      results.push({ name: name, ok: true });
    } catch (err) {
      results.push({ name: name, ok: false, detail: String(err && err.message || err) });
    }
  };
  const eq = function (actual, expected, label) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new Error((label ? label + ': ' : '') + 'expected ' + e + ', got ' + a);
  };

  // ---- Fake data. Every name and address here is made up. ----
  const settings = parseSettings_({
    'Breakouts per student': '1',
    'Time slots': '10:00–11:00 am; 11:15 am–12:15 pm',
    'Default capacity per run': '35',
  });
  const parsed = parseBreakouts_([
    { id: 'finance', name: 'AI in Finance', description: 'Money and models', capacity: '2', runs: '10:00-11:00 am; 11:15 am - 12:15 pm', room: 'Room 101', status: 'confirmed', listed: 'TRUE' },
    { id: 'law', name: 'AI in Law', description: '', capacity: '', runs: '', room: '', status: 'tentative', listed: 'TRUE' },
    { id: 'secret', name: 'Hidden breakout', description: '', capacity: '5', runs: '2', room: '', status: 'confirmed', listed: 'FALSE' },
    { id: '', name: '', description: '', capacity: '', runs: '', room: '', status: '', listed: '' },
  ], settings);
  const breakouts = parsed.breakouts;
  let nextRow = 2;
  const student = function (name, email, slotValues, extra) {
    const s = {
      row: nextRow++, timestamp: Date.UTC(2026, 10, 1) + nextRow * 60000, name: name, grade: 'Grade 9',
      email: email, slotValues: slotValues, level: '', confirmationSentFor: '', topicSentFor: '',
    };
    Object.keys(extra || {}).forEach(function (k) { s[k] = extra[k]; });
    return s;
  };

  test('Breakouts tab: defaults, slot matching and hidden rows', function () {
    eq(parsed.problems, [], 'problems');
    eq(breakouts.map(function (b) { return b.id; }), ['finance', 'law', 'secret']);
    eq(breakouts[0].runs, [0, 1], 'finance runs (dash and spacing differences)');
    eq(breakouts[1].capacity, 35, 'blank capacity uses the default');
    eq(breakouts[1].runs, [0, 1], 'blank runs means every slot');
    eq(breakouts[2].runs, [1], '"2" means slot 2');
    eq(breakouts[2].listed, false);
  });

  test('Bad Breakouts rows are reported, not thrown', function () {
    const bad = parseBreakouts_([
      { id: 'x', name: 'X', capacity: 'lots', runs: '9:00 am', status: 'maybe', listed: '' },
      { id: 'x', name: 'X again' },
    ], settings);
    eq(bad.problems.length, 4, 'capacity, unknown slot, status and duplicate id');
  });

  test('A full breakout shows as Full and blocks over-capacity emails', function () {
    nextRow = 2;
    const students = [
      student('Test Alpha', 'alpha@example.test', ['AI in Finance', '']),
      student('Test Bravo', 'bravo@example.test', ['finance', '']), // id works as well as name
    ];
    let counts = countSeats_(students, breakouts, settings, {});
    let api = buildAvailability_(breakouts, counts, settings, 'now');
    const finance = api.breakouts.filter(function (b) { return b.id === 'finance'; })[0];
    eq(finance.runs[0], { time: '10:00–11:00 am', capacity: 2, taken: 2, left: 0, full: true }, 'slot 1');
    eq(finance.runs[1].full, false, 'slot 2 still open');
    eq(finance.full, false, 'breakout not full until every run is');

    students.push(student('Test Charlie', 'charlie@example.test', ['AI in Finance', '']));
    counts = countSeats_(students, breakouts, settings, {});
    api = buildAvailability_(breakouts, counts, settings, 'now');
    eq(api.breakouts[0].runs[0].taken, 2, 'public count never exceeds capacity');
    eq(overCapacity_(breakouts, counts).length, 1, 'over-capacity warning');
    const plan = planConfirmations_(students, breakouts, settings);
    eq(plan.map(function (p) { return p.action; }), ['blocked', 'blocked', 'blocked'], 'nobody confirmed into an over-full run');
    if (plan[0].reason.indexOf('over capacity (3/2)') === -1) throw new Error('reason should mention capacity: ' + plan[0].reason);
  });

  test('Already-emailed students are not blocked when a run later overfills', function () {
    nextRow = 2;
    const students = [
      student('Test Alpha', 'alpha@example.test', ['AI in Finance', ''], { confirmationSentFor: 'slot1=finance' }),
      student('Test Bravo', 'bravo@example.test', ['AI in Finance', '']),
      student('Test Charlie', 'charlie@example.test', ['AI in Finance', '']),
    ];
    eq(planConfirmations_(students, breakouts, settings).map(function (p) { return p.action; }), ['none', 'blocked', 'blocked']);
  });

  test('A student submitting twice: only the latest response counts, and no second email', function () {
    nextRow = 2;
    const first = student('Test Delta', 'delta@example.test', ['AI in Law', ''], { confirmationSentFor: 'slot1=law' });
    const second = student('Test Delta', 'DELTA@example.test', ['', '']);
    const other = student('Test Echo', 'echo@example.test', ['AI in Law', '']);
    const students = [first, second, other];
    const superseded = findSuperseded_(students);
    eq(superseded, { 2: 3 }, 'row 2 replaced by row 3 (email match ignores case)');
    eq(countSeats_(students, breakouts, settings, superseded).law, [1, 0], 'older response not counted');

    let plan = planConfirmations_(students, breakouts, settings);
    eq(plan[0].action, 'blocked', 'assignment left on the older response is flagged');
    eq(plan[1].action, 'removed', 'latest response has no assignment, but an email went out earlier');

    // Organisers move the assignment to the latest response: same breakout, so no new email.
    first.slotValues = ['', ''];
    second.slotValues = ['AI in Law', ''];
    plan = planConfirmations_(students, breakouts, settings);
    eq(plan[1].action, 'carry', 'record copied across, nothing sent');
    eq(plan[1].sentFor, 'slot1=law');

    // ...or a different breakout: one "updated" email.
    second.slotValues = ['', 'AI in Finance'];
    plan = planConfirmations_(students, breakouts, settings);
    eq(plan[1].action, 'update');
  });

  test('An assignment changing after the email was sent', function () {
    nextRow = 2;
    const s = student('Test Foxtrot', 'foxtrot@example.test', ['AI in Law', '']);
    let plan = planConfirmations_([s], breakouts, settings)[0];
    eq([plan.action, plan.sentFor], ['send', 'slot1=law'], 'first email');

    s.confirmationSentFor = plan.sentFor;
    eq(planConfirmations_([s], breakouts, settings)[0].action, 'none', 'no duplicate on the next run');

    s.slotValues = ['', 'AI in Law']; // same breakout, other time slot
    plan = planConfirmations_([s], breakouts, settings)[0];
    eq([plan.action, plan.previous, plan.sentFor], ['update', 'slot1=law', 'slot2=law'], 'time change is an update');

    s.confirmationSentFor = plan.sentFor;
    s.slotValues = ['', ''];
    eq(planConfirmations_([s], breakouts, settings)[0].action, 'removed', 'cleared assignment is flagged, not emailed');
  });

  test('Renaming a breakout is not treated as a change', function () {
    nextRow = 2;
    const renamed = parseBreakouts_([{ id: 'law', name: 'AI and the Law', listed: 'TRUE' }], settings).breakouts;
    const s = student('Test Golf', 'golf@example.test', ['AI and the Law', ''], { confirmationSentFor: 'slot1=law' });
    eq(planConfirmations_([s], renamed, settings)[0].action, 'none');
  });

  test('Assignment checks: wrong slot, unknown name, wrong count, bad email', function () {
    nextRow = 2;
    const two = parseSettings_({ 'Breakouts per student': '2', 'Time slots': '10:00–11:00 am; 11:15 am–12:15 pm' });
    const cases = [
      [student('Test Hotel', 'hotel@example.test', ['Hidden breakout', '']), settings, 'doesn\'t run at'],
      [student('Test India', 'india@example.test', ['AI in Space', '']), settings, 'isn\'t a breakout'],
      [student('Test Juliet', 'juliet@example.test', ['AI in Law', 'AI in Finance']), settings, 'needs exactly 1'],
      [student('Test Kilo', 'kilo@example.test', ['AI in Law', '']), two, 'needs 2 breakouts'],
      [student('Test Lima', 'lima@example.test', ['AI in Law', 'AI in Law']), two, 'same breakout'],
      [student('Test Mike', 'not-an-email', ['AI in Law', '']), settings, 'no valid email'],
    ];
    cases.forEach(function (c) {
      const p = planConfirmations_([c[0]], breakouts, c[1])[0];
      if (p.action !== 'blocked' || p.reason.indexOf(c[2]) === -1) throw new Error(c[0].name + ': expected "' + c[2] + '", got ' + p.action + ' / ' + p.reason);
    });
    const ok = student('Test November', 'november@example.test', ['AI in Law', 'AI in Finance']);
    eq(planConfirmations_([ok], breakouts, two)[0].action, 'send', 'two breakouts, one per slot');
  });

  test('Topic emails wait for the confirmation, a level and a topic', function () {
    nextRow = 2;
    const s = student('Test Oscar', 'oscar@example.test', ['AI in Law', '']);
    const topics = { law: { beginner: 'Read one news story about AI in court.', intermediate: '', advanced: '' } };
    const action = function () { const p = planTopics_([s], breakouts, settings, topics)[0]; return p.action + (p.reason ? ': ' + p.reason : ''); };
    eq(action(), 'blocked: send the confirmation email first');
    s.confirmationSentFor = 'slot1=law';
    eq(action().indexOf('blocked: choose a Level'), 0, 'level needed');
    s.level = 'intermediate';
    eq(action(), 'blocked: no Intermediate topic for AI in Law on the Topics tab yet');
    s.level = 'Beginner';
    const p = planTopics_([s], breakouts, settings, topics)[0];
    eq([p.action, p.sentFor], ['send', 'slot1=law; level=Beginner']);
    s.topicSentFor = p.sentFor;
    eq(action(), 'none', 'sent once only');
  });

  test('Email templates fill in, and typos are caught', function () {
    const s = { name: 'Test Papa Example', grade: 'Grade 10', email: 'papa@example.test' };
    const a = resolveAssignment_({ slotValues: ['AI in Finance', ''] }, indexBreakouts_(breakouts), settings);
    const values = emailValues_(s, a, settings, '', null);
    eq(fillTemplate_('Hi {first_name}: {breakout} at {time} in {room}', values), 'Hi Test: AI in Finance at 10:00–11:00 am in Room 101');
    eq(values.schedule, '• AI in Finance: 10:00–11:00 am, Room 101');
    eq(unknownPlaceholders_('Hi {name}, see {breakuot} and {Name}'), ['{breakuot}', '{Name}']);
    DEFAULT_TEMPLATES.forEach(function (t) {
      eq(unknownPlaceholders_(t.subject + t.body), [], t.key + ' template');
    });
  });

  test('The public endpoint exposes counts only', function () {
    nextRow = 2;
    const students = [student('Test Quebec', 'quebec@example.test', ['AI in Law', ''])];
    const api = buildAvailability_(breakouts, countSeats_(students, breakouts, settings, {}), settings, 'now');
    const text = JSON.stringify(api);
    ['quebec', 'example.test', 'Test Quebec', 'Room 101', 'Grade 9', 'Hidden breakout'].forEach(function (secret) {
      if (text.indexOf(secret) !== -1) throw new Error('endpoint contains "' + secret + '"');
    });
    eq(Object.keys(api).sort(), ['breakouts', 'breakoutsPerStudent', 'ok', 'updatedAt']);
    eq(Object.keys(api.breakouts[0]).sort(), ['description', 'full', 'id', 'name', 'runs', 'status']);
    eq(Object.keys(api.breakouts[0].runs[0]).sort(), ['capacity', 'full', 'left', 'taken', 'time']);
  });

  test('Responses columns are found by header text', function () {
    const layout = responsesLayout_(['Timestamp', 'Email address', 'Full name', 'Grade', 'Rank your top 3 breakouts [1st choice]', 'Consent',
      'Duplicate?', 'Assigned breakout (slot 2: 11:15 am–12:15 pm)', 'Assigned breakout (slot 1: 10:00–11:00 am)', 'Level',
      'Confirmation email', 'Confirmation sent for', 'Topic email', 'Topic email sent for']);
    eq([layout.timestamp, layout.email, layout.name, layout.grade, layout.duplicate, layout.level], [0, 1, 2, 3, 6, 9]);
    eq(layout.slots, [8, 7], 'slot columns by number, whatever their order');
    eq(responsesLayout_(['Timestamp', 'School email address']).email, 1, 'typed email question');
  });

  return results;
}
