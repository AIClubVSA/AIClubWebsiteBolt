/**
 * AI Summit 2026 — breakout sign-ups (Google Apps Script, bound to the Sheet)
 *
 * Config.gs — names of tabs, form questions and columns, plus first-run defaults.
 *
 * Almost everything organisers change day to day lives in the Sheet itself
 * (Breakouts, Settings, Templates and Topics tabs), not here. Only edit this
 * file if you want to rename a tab or a column header.
 *
 * Files in this project:
 *   Config.gs   this file
 *   Logic.gs    pure logic (counting seats, duplicates, deciding who to email); no Google services
 *   Sheets.gs   reading and writing the Sheet's tabs
 *   Setup.gs    the organiser menu, first-time setup and "Refresh form choices"
 *   Capacity.gs capacity warnings and the duplicate check
 *   Api.gs      the public web-app endpoint (seat counts only)
 *   Email.gs    confirmation and assignment-topic emails
 *   Tests.gs    self-tests that use fake data only
 */

const SUMMIT = {
  TABS: {
    BREAKOUTS: 'Breakouts',
    SETTINGS: 'Settings',
    TEMPLATES: 'Templates',
    TOPICS: 'Topics',
    RESPONSES: 'Responses',
    CAPACITY: 'Capacity',
  },

  FORM_TITLE: 'AI Summit 2026: choose your breakouts',

  // Question titles on the Google Form. The Responses tab uses these as column headers.
  QUESTIONS: {
    NAME: 'Full name',
    GRADE: 'Grade',
    EMAIL: 'School email address', // only asked when the form can't verify school sign-in
    CHOICES: 'Rank your top 3 breakouts',
    CONSENT: 'Consent',
  },

  CONSENT_TEXT:
    'I understand that my name, grade, school email and choices are used only to run the AI Summit 2026. ' +
    'They are not shared with sponsors or partners, or shown publicly.',

  CHOICE_ROWS: ['1st choice', '2nd choice', '3rd choice'],

  // Columns the script adds to the right of the form's columns on the Responses tab.
  // Columns are always found by header text, so you can reorder them safely.
  COLUMNS: {
    TIMESTAMP: 'Timestamp',
    DUPLICATE: 'Duplicate?',
    // One per time slot, e.g. "Assigned breakout (slot 1: 12:45–2:45 pm)".
    // The script only relies on the "Assigned breakout (slot N" part.
    SLOT_PREFIX: 'Assigned breakout (slot ',
    LEVEL: 'Level',
    CONFIRMATION_STATUS: 'Confirmation email',
    CONFIRMATION_SENT_FOR: 'Confirmation sent for',
    TOPIC_STATUS: 'Topic email',
    TOPIC_SENT_FOR: 'Topic email sent for',
  },

  LEVELS: ['Beginner', 'Intermediate', 'Advanced'],

  // Headers of the Breakouts tab, in order.
  BREAKOUT_HEADERS: ['id', 'name', 'description', 'capacity', 'runs', 'room', 'status', 'listed'],

  // Settings tab: label in column A, value in column B.
  SETTINGS_KEYS: {
    PER_STUDENT: 'Breakouts per student',
    SLOTS: 'Time slots',
    DEFAULT_CAPACITY: 'Default capacity per run',
    DATE: 'Summit date',
    GRADES: 'Grades',
    SENDER_NAME: 'Sender name',
    REPLY_TO: 'Reply-to email',
    FORM_LINK: 'Student form link',
    FORM_EDIT_LINK: 'Form edit link (organisers only)',
    SIGN_IN: 'Form requires school sign-in',
  },

  DEFAULTS: {
    PER_STUDENT: 1,
    SLOTS: ['12:45–2:45 pm'], // add more, separated by ; in Settings, if breakouts run more than once
    DEFAULT_CAPACITY: 31,
    DATE: 'Wednesday 16 December 2026',
    GRADES: ['Grade 9', 'Grade 10'],
    SENDER_NAME: 'AI Centre, Vidyashilp Academy',
  },

  // Starting list of breakouts. Edit the Breakouts tab afterwards, not this list.
  STARTING_BREAKOUTS: [
    ['entrepreneurship', 'AI in Entrepreneurship'],
    ['design', 'AI in Design'],
    ['finance', 'AI in Finance'],
    ['education', 'AI in Education'],
    ['deeper-dive', 'A deeper dive into AI'],
    ['law', 'AI in Law'],
    ['ethics', 'AI Ethics'],
    ['careers', 'AI & Careers'],
  ],

  // Placeholders the email templates may use. Anything else in {braces} stops sending,
  // so a typo never reaches 250 inboxes.
  PLACEHOLDERS: ['name', 'first_name', 'grade', 'breakout', 'time', 'room', 'schedule', 'date', 'level', 'topic', 'topics'],

  // Emails held back from the daily quota, so organisers can still send a few by hand.
  QUOTA_RESERVE: 5,

  // How long the web app caches its answer, in seconds.
  API_CACHE_SECONDS: 60,
};

/** Default email templates, written to the Templates tab by setup. Edit them in the Sheet. */
const DEFAULT_TEMPLATES = [
  {
    key: 'confirmation',
    subject: 'Your AI Summit 2026 breakout: {breakout}',
    body: [
      'Hi {first_name},',
      '',
      "You're confirmed for the AI Summit 2026 on {date}.",
      '',
      'Your breakout:',
      '{schedule}',
      '',
      "Please be at your room a few minutes before the start time. If anything here looks wrong, reply to this email.",
      '',
      'See you there,',
      'AI Centre, Vidyashilp Academy',
    ].join('\n'),
  },
  {
    key: 'updated',
    subject: 'Updated: your AI Summit 2026 breakout',
    body: [
      'Hi {first_name},',
      '',
      'Your breakout for the AI Summit 2026 on {date} has changed. This email replaces the one we sent earlier.',
      '',
      'Your breakout is now:',
      '{schedule}',
      '',
      'If you have any questions, reply to this email.',
      '',
      'AI Centre, Vidyashilp Academy',
    ].join('\n'),
  },
  {
    key: 'topic',
    subject: 'Your pre-summit task for {breakout}',
    body: [
      'Hi {first_name},',
      '',
      'Before the AI Summit 2026 on {date}, please prepare the following ({level} level):',
      '',
      '{topics}',
      '',
      'Bring your work to your breakout:',
      '{schedule}',
      '',
      'If you have any questions, reply to this email.',
      '',
      'AI Centre, Vidyashilp Academy',
    ].join('\n'),
  },
];
