import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  BREAKOUT_FORM_URL,
  loadAvailability,
  type AvailabilityResult,
  type Breakout,
  type BreakoutRun,
} from '../lib/breakouts';

/**
 * "Choose your breakout": links to the Google Form and shows live seat counts.
 * Seat counts come from the organisers' Sheet via the Apps Script endpoint.
 * The page never sees student names or emails.
 */
export default function BreakoutChooser() {
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  useEffect(() => {
    let active = true;
    loadAvailability().then((r) => {
      if (active) setResult(r);
    });
    return () => {
      active = false;
    };
  }, []);

  const data = result?.state === 'ready' ? result.data : null;
  const times = data ? Array.from(new Set(data.breakouts.flatMap((b) => b.runs.map((r) => r.time)))) : [];

  return (
    <section id="breakouts" aria-labelledby="breakouts-title" className="summit-section">
      <div className="summit-wrap">
        <div className="lp-eyebrow" style={{ marginBottom: 24 }}>[ Breakouts ]</div>
        <div className="summit-head">
          <h2 id="breakouts-title" className="lp-display" style={{ fontSize: 'clamp(2rem,5vw,4rem)', lineHeight: 1.02 }}>
            Choose your breakout.
          </h2>
          <p className="summit-lede">
            Rank your top three on the form. Organisers place every student and email your school address once you have a place.
            {data ? (
              data.breakoutsPerStudent === 2
                ? ' You\'ll be placed in two breakouts, one in each time slot.'
                : ' You\'ll be placed in one breakout.'
            ) : null}
          </p>
        </div>

        <ol className="summit-steps">
          <li><span className="summit-step-num">01</span> Rank your top 3 on the form</li>
          <li><span className="summit-step-num">02</span> Organisers place you</li>
          <li><span className="summit-step-num">03</span> Check your school email</li>
        </ol>

        <div className="summit-cta">
          {BREAKOUT_FORM_URL ? (
            <a href={BREAKOUT_FORM_URL} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-solid" style={{ padding: '15px 28px', fontSize: 15 }}>
              Rank your breakouts <ArrowUpRight size={17} aria-hidden />
              <span className="sr-only"> (opens Google Forms in a new tab)</span>
            </a>
          ) : (
            <span className="lp-btn lp-btn-ghost" aria-disabled="true" style={{ padding: '15px 28px', fontSize: 15, cursor: 'default' }}>
              The form opens soon
            </span>
          )}
          <p className="summit-note">Use your school email. To change your choices before you're placed, open the form again.</p>
        </div>

        <div className="summit-status" role="status" aria-live="polite">
          {result === null && 'Checking seats…'}
          {result?.state === 'unavailable' && 'Availability will update soon. You can still rank your breakouts on the form.'}
          {data && (
            <>
              {result?.state === 'ready' && result.stale ? 'Availability will update soon. Showing seats as of ' : 'Seats updated '}
              {formatTime(data.updatedAt)}
              {times.length > 1 ? `. Each breakout runs at ${joinWords(times)}.` : '.'}
              {' '}Seats fill as students are placed, not when the form is sent.
            </>
          )}
        </div>

        {data && data.breakouts.length > 0 && (
          <ul className="summit-grid" aria-label="Breakouts and seats left">
            {data.breakouts.map((b) => (
              <BreakoutCard key={b.id} breakout={b} />
            ))}
          </ul>
        )}

        <p className="summit-privacy">
          We use your name, grade, school email and choices only to run the summit. They are never shared with sponsors or
          partners, and this page only ever shows seat counts.
        </p>
      </div>
    </section>
  );
}

function BreakoutCard({ breakout: b }: { breakout: Breakout }) {
  const titleId = `breakout-${b.id}`;
  return (
    <li className={`lp-panel summit-card${b.full ? ' is-full' : ''}`} aria-labelledby={titleId}>
      {(b.full || b.status === 'tentative') && (
        <div className="summit-tags">
          {b.full && <span className="summit-tag summit-tag-full">Full</span>}
          {b.status === 'tentative' && <span className="summit-tag">Tentative</span>}
        </div>
      )}
      <h3 id={titleId} className="lp-display summit-card-title">{b.name}</h3>
      <p className={b.description ? 'summit-desc' : 'summit-desc is-tba'}>{b.description || 'Topic to be announced'}</p>
      {b.runs.length > 0 && (
        <ul className="summit-runs">
          {b.runs.map((run) => (
            <RunRow key={run.time} run={run} />
          ))}
        </ul>
      )}
    </li>
  );
}

function RunRow({ run }: { run: BreakoutRun }) {
  const pct = run.capacity > 0 ? Math.round((run.taken / run.capacity) * 100) : 100;
  return (
    <li className={`summit-run${run.full ? ' is-full' : ''}`}>
      <div className="summit-run-top">
        <span className="summit-run-time">{run.time}</span>
        <span className="summit-run-left">{run.full ? 'Full' : `${run.left} ${run.left === 1 ? 'seat' : 'seats'} left`}</span>
      </div>
      <div className="summit-bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="summit-run-count">{run.taken} of {run.capacity} seats taken</span>
    </li>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return 'recently';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function joinWords(items: string[]) {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
