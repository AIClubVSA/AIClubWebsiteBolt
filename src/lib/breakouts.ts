/**
 * Breakout availability for the AI Summit page.
 *
 * Reads seat counts from the Google Apps Script web app (see summit/README.md).
 * The endpoint returns counts only, never student details. Answers are cached in
 * the browser for a few minutes so a busy page doesn't hammer the script.
 */

export interface BreakoutRun {
  time: string;
  capacity: number;
  taken: number;
  left: number;
  full: boolean;
}

export interface Breakout {
  id: string;
  name: string;
  description: string;
  status: 'confirmed' | 'tentative';
  full: boolean;
  runs: BreakoutRun[];
}

export interface Availability {
  updatedAt: string;
  breakoutsPerStudent: number;
  breakouts: Breakout[];
}

/** Set in Vercel (Project → Settings → Environment Variables), never committed. */
export const BREAKOUTS_ENDPOINT = (import.meta.env.VITE_BREAKOUTS_ENDPOINT ?? '').trim();
export const BREAKOUT_FORM_URL = (import.meta.env.VITE_BREAKOUT_FORM_URL ?? '').trim();

const CACHE_KEY = 'ai-summit-breakouts-v1';
const FRESH_MS = 5 * 60 * 1000; // use the cached answer without asking again
const STALE_OK_MS = 60 * 60 * 1000; // if the endpoint is down, still show an answer up to an hour old
const TIMEOUT_MS = 8000;

interface CacheEntry {
  savedAt: number;
  data: Availability;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    const data = parseAvailability(entry?.data);
    return data && typeof entry.savedAt === 'number' ? { savedAt: entry.savedAt, data } : null;
  } catch {
    return null;
  }
}

function writeCache(data: Availability) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    /* private browsing or storage full: caching is optional */
  }
}

const toCount = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/**
 * Checks the endpoint's JSON and keeps only the fields the page shows.
 * Anything malformed is dropped rather than shown. Returns null if the answer is unusable.
 */
export function parseAvailability(input: unknown): Availability | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  if (raw.ok === false || !Array.isArray(raw.breakouts)) return null;

  const breakouts: Breakout[] = [];
  for (const item of raw.breakouts) {
    if (!item || typeof item !== 'object') continue;
    const b = item as Record<string, unknown>;
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    if (!name) continue;
    const runs: BreakoutRun[] = [];
    for (const r of Array.isArray(b.runs) ? b.runs : []) {
      if (!r || typeof r !== 'object') continue;
      const run = r as Record<string, unknown>;
      const capacity = toCount(run.capacity);
      const taken = toCount(run.taken);
      if (capacity === null || taken === null || typeof run.time !== 'string') continue;
      const seatsTaken = Math.min(taken, capacity);
      runs.push({ time: run.time, capacity, taken: seatsTaken, left: capacity - seatsTaken, full: seatsTaken >= capacity });
    }
    breakouts.push({
      id: typeof b.id === 'string' && b.id ? b.id : name,
      name,
      description: typeof b.description === 'string' ? b.description.trim() : '',
      status: b.status === 'tentative' ? 'tentative' : 'confirmed',
      full: runs.length > 0 && runs.every((r) => r.full),
      runs,
    });
  }

  const per = Number(raw.breakoutsPerStudent);
  return {
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    breakoutsPerStudent: per === 2 ? 2 : 1,
    breakouts,
  };
}

export type AvailabilityResult =
  | { state: 'ready'; data: Availability; stale: boolean }
  | { state: 'unavailable' };

/** Cached answer if it's fresh, otherwise asks the endpoint. Never throws. */
export async function loadAvailability(): Promise<AvailabilityResult> {
  const cached = readCache();
  if (cached && Date.now() - cached.savedAt < FRESH_MS) return { state: 'ready', data: cached.data, stale: false };
  if (!BREAKOUTS_ENDPOINT) return { state: 'unavailable' };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // A plain GET with no custom headers, so the browser doesn't need a CORS preflight
    // (Apps Script web apps can't answer one).
    const res = await fetch(BREAKOUTS_ENDPOINT, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseAvailability(await res.json());
    if (!data) throw new Error('Unexpected response');
    writeCache(data);
    return { state: 'ready', data, stale: false };
  } catch {
    if (cached && Date.now() - cached.savedAt < STALE_OK_MS) return { state: 'ready', data: cached.data, stale: true };
    return { state: 'unavailable' };
  } finally {
    window.clearTimeout(timer);
  }
}
