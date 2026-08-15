import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SPORTS } from '@ny-sharp-edge/shared';
import OddsGrid from '@/components/odds/OddsGrid';
import { useOdds } from '@/hooks/useOdds';
import { useCheckout } from '@/hooks/useCheckout';

const BULLETS = [
  '+EV vs Pinnacle',
  'Arbitrage scanner',
  'Exchange screen (Kalshi + Polymarket)',
];

const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';

export default function LandingPage() {
  const { data, isLoading, error } = useOdds(SPORTS.NFL);
  const checkout = useCheckout();
  const [boardOnly, setBoardOnly] = useState(!requireAuth);

  const liveEvents = data?.events.slice(0, 2) ?? [];
  const linesUnavailable = Boolean(error) || (!isLoading && liveEvents.length === 0);

  const handleCheckout = async (plan: 'edge' | 'pro') => {
    if (boardOnly) {
      window.location.href = '/app';
      return;
    }
    const result = await checkout(plan);
    if (result.url) {
      window.location.href = result.url;
    } else {
      setBoardOnly(true);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="h-12 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="font-display font-bold tracking-[0.22em] text-lg text-ink">
            LINEEDGE
          </Link>
          <div className="flex items-center gap-4">
            {requireAuth && (
              <Link
                to="/app"
                className="text-[11px] uppercase tracking-[0.18em] text-ink-dim hover:text-ink"
              >
                Sign in
              </Link>
            )}
            <Link
              to="/app"
              className="text-[11px] uppercase tracking-[0.18em] bg-moss hover:bg-moss-2 text-ink px-4 py-2"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-10">
              <div className="space-y-6">
                <h1 className="font-display font-bold text-ink uppercase tracking-tight leading-[0.9] text-[clamp(48px,8vw,92px)]">
                  FIND +EV
                  <br />
                  WITHOUT A
                  <br />
                  $200 TERMINAL.
                </h1>
                <p className="font-mono text-[14px] text-ink-dim max-w-md">
                  Pinnacle fair odds. US books. Kalshi and Polymarket on Pro. $19/mo.
                </p>
              </div>

              <ol className="space-y-2 font-mono text-[14px] text-ink">
                {BULLETS.map((bullet, i) => (
                  <li key={bullet} className="flex gap-4">
                    <span className="text-ink-dim">{String(i + 1).padStart(2, '0')}</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-col sm:flex-row gap-3">
                {boardOnly ? (
                  <Link
                    to="/app"
                    className="inline-flex justify-center items-center bg-moss hover:bg-moss-2 text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px] px-6 py-3"
                  >
                    Open the board →
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCheckout('edge')}
                      className="inline-flex justify-center items-center bg-moss hover:bg-moss-2 text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px] px-6 py-3"
                    >
                      Start with Edge — $19/mo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCheckout('pro')}
                      className="inline-flex justify-center items-center border border-moss text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px] px-6 py-3 hover:bg-moss"
                    >
                      Go Pro — $49/mo
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="border border-line overflow-hidden max-h-[520px] pointer-events-none">
              {isLoading && (
                <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
                  Loading live lines…
                </div>
              )}
              {linesUnavailable && (
                <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
                  LIVE LINES UNAVAILABLE
                </div>
              )}
              {!isLoading && !linesUnavailable && (
                <div className="p-3">
                  <OddsGrid events={liveEvents} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <p className="label mb-8">Price</p>
          <div className="grid md:grid-cols-2 gap-0 max-w-xl border border-line">
            <div className="p-6 border-b md:border-b-0 md:border-r border-line">
              <p className="label">Edge</p>
              <p className="font-mono text-[48px] leading-none text-ink mt-4">$19</p>
              <p className="font-mono text-[12px] text-ink-dim mt-2">/mo · live books + +EV</p>
              {boardOnly ? (
                <Link
                  to="/app"
                  className="mt-6 inline-block font-mono text-[13px] text-lichen hover:text-ink"
                >
                  Open the board →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout('edge')}
                  className="mt-6 font-mono text-[13px] text-lichen hover:text-ink"
                >
                  Get Edge
                </button>
              )}
            </div>
            <div className="p-6">
              <p className="label">Pro</p>
              <p className="font-mono text-[48px] leading-none text-ink mt-4">$49</p>
              <p className="font-mono text-[12px] text-ink-dim mt-2">/mo · arb + exchanges</p>
              {boardOnly ? (
                <Link
                  to="/app"
                  className="mt-6 inline-block font-mono text-[13px] text-lichen hover:text-ink"
                >
                  Open the board →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckout('pro')}
                  className="mt-6 font-mono text-[13px] text-lichen hover:text-ink"
                >
                  Get Pro
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 py-4 font-mono text-[11px] text-ink-dim flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>LINEEDGE</span>
          <span>·</span>
          <span>18+</span>
          <span>·</span>
          <span>NOT ADVICE</span>
          <span>·</span>
          <Link to="/legal" className="hover:text-ink">
            /legal
          </Link>
        </div>
      </footer>
    </div>
  );
}
