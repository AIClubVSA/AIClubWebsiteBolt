/**
 * Api.gs — the public web-app endpoint the website reads.
 *
 * Deploy as a web app: Execute as "Me", Who has access "Anyone".
 * It returns seat counts per breakout and nothing else. See buildAvailability_
 * in Logic.gs for the exact fields. Student names, emails, grades and rooms are
 * never included.
 *
 * Example response:
 * {
 *   "ok": true,
 *   "updatedAt": "2026-12-01T04:30:00.000Z",
 *   "breakoutsPerStudent": 1,
 *   "breakouts": [
 *     { "id": "finance", "name": "AI in Finance", "description": "", "status": "confirmed", "full": false,
 *       "runs": [ { "time": "10:00–11:00 am", "capacity": 35, "taken": 12, "left": 23, "full": false },
 *                 { "time": "11:15 am–12:15 pm", "capacity": 35, "taken": 35, "left": 0, "full": true } ] }
 *   ]
 * }
 */

const API_CACHE_KEY = 'availability-v1';

function doGet() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(API_CACHE_KEY);
    if (cached) return jsonOutput_(cached);

    const text = JSON.stringify(availabilityPayload_());
    cache.put(API_CACHE_KEY, text, SUMMIT.API_CACHE_SECONDS);
    return jsonOutput_(text);
  } catch (err) {
    // Log the detail for organisers (Apps Script → Executions); tell the public nothing about it.
    console.error(err);
    return jsonOutput_(JSON.stringify({ ok: false }));
  }
}

function availabilityPayload_() {
  const settings = readSettings_();
  const breakouts = readBreakouts_(settings).breakouts;
  const students = readResponses_(settings).students;
  const counts = countSeats_(students, breakouts, settings, findSuperseded_(students));
  return buildAvailability_(breakouts, counts, settings, new Date().toISOString());
}

function jsonOutput_(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}
