import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import BreakoutChooser from '../components/BreakoutChooser';
import Footer from '../components/Footer';

const SUMMIT_DATE = 'Wednesday 16 December 2026';
const VENUE = 'Vidyashilp Academy, Bengaluru';

/** Public page for the AI Summit 2026. Open to everyone, signed in or not. */
export default function SummitPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'AI Summit 2026 · AI Centre, Vidyashilp Academy';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="lp summit-page">
      <a href="#breakouts" className="summit-skip">Skip to breakouts</a>

      <header className="summit-header">
        <nav aria-label="Main" className="summit-nav">
          <Link to="/" className="summit-brand" aria-label="AI Centre home">
            <span className="summit-mark" aria-hidden><span /></span>
            <span className="lp-display" style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>AI Centre</span>
          </Link>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <a href="#breakouts" className="lp-link" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Breakouts</a>
            <Link to="/about" className="lp-link lp-hide-mobile" style={{ fontSize: 14, color: 'var(--text-muted)' }}>About Us</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="summit-hero" aria-labelledby="summit-title">
          <div className="lp-grid-bg" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
          <div className="lp-vignette" aria-hidden style={{ position: 'absolute', inset: 0 }} />
          <div className="summit-wrap" style={{ position: 'relative' }}>
            <div className="lp-eyebrow" style={{ marginBottom: 28 }}>[ AI Centre · Vidyashilp Academy ]</div>
            <h1 id="summit-title" className="lp-display" style={{ fontSize: 'clamp(3rem,10vw,8.5rem)' }}>
              AI Summit 2026
            </h1>
            <dl className="summit-facts">
              <div>
                <dt className="lp-eyebrow">Date</dt>
                <dd>{SUMMIT_DATE}</dd>
              </div>
              <div>
                <dt className="lp-eyebrow">Where</dt>
                <dd>{VENUE}</dd>
              </div>
              <div>
                <dt className="lp-eyebrow">For</dt>
                <dd>IGCSE students</dd>
              </div>
            </dl>
            <a href="#breakouts" className="lp-btn lp-btn-ghost" style={{ padding: '14px 26px', fontSize: 15 }}>
              Choose your breakout <ArrowDown size={16} aria-hidden />
            </a>
          </div>
        </section>

        <BreakoutChooser />
      </main>

      <footer style={{ borderTop: '1px solid var(--line)', padding: '40px clamp(20px,4vw,56px) 8px' }}>
        <div className="summit-wrap summit-foot">
          <span className="lp-eyebrow">© {new Date().getFullYear()} AI Centre</span>
          <Link to="/" className="lp-link" style={{ fontSize: 14, color: 'var(--text-muted)' }}>Back to AI Centre</Link>
        </div>
      </footer>
      <Footer />
    </div>
  );
}
