import { useState } from 'react';
import { Link } from 'react-router-dom';
import { eventInHorizon, inSeasonSport } from '@ny-sharp-edge/shared';
import OddsGrid from '@/components/odds/OddsGrid';
import { useOdds } from '@/hooks/useOdds';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { billingErrorMessage } from '@/hooks/useCheckout';
import { usePlan } from '@/components/auth/AuthProvider';
import AuthControls from '@/components/auth/AuthControls';
import LiquidBg from '@/components/common/LiquidBg';
import BrandMark from '@/components/common/BrandMark';
import { BRAND, SUPPORT_MAILTO } from '@ny-sharp-edge/shared';

const BULLETS = [
  'Only shops you actually have — NY, NJ, or PA as a shortcut',
  'A quiet +EV feed. Fat / likely-stale numbers stay hidden',
  'Ticket ideas — parlays and round robins, not locks',
];

export default function LandingPage() {
  const { data, isLoading, error } = useOdds(inSeasonSport());
  const { canCharge } = useBillingStatus();
  const { startCheckout } = usePlan();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const soon = (data?.events ?? []).filter((e) => eventInHorizon(e.commenceTime, 'soon'));
  const liveEvents = (soon.length > 0 ? soon : data?.events ?? []).slice(0, 2);
  const previewIsSeason = soon.length === 0 && liveEvents.length > 0;
  const linesUnavailable = Boolean(error) || (!isLoading && liveEvents.length === 0);

  const handleCheckout = async (plan: 'edge' | 'pro') => {
    if (!canCharge) {
      window.location.href = '/app';
      return;
    }
    setCheckoutError(null);
    setStarting(true);
    const result = await startCheckout(plan);
    setStarting(false);
    if (result.error) setCheckoutError(billingErrorMessage(result.error));
  };

  return (
    <div className="liquid-scene text-ink flex flex-col min-h-dvh">
      <LiquidBg />
      <header
        className="sticky top-0 z-40 glass-strong"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 min-w-0">
          <Link to="/" className="text-[#eef2fb] text-base shrink-0">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <AuthControls compact />
            <Link to="/app" className="btn btn-primary px-4 min-h-10 text-[12px] uppercase tracking-[0.12em]">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1">
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-7 min-w-0">
              <div className="space-y-4">
                <h1 className="font-display font-bold text-ink uppercase tracking-tight leading-[0.95] text-[clamp(2.1rem,9vw,5.5rem)] break-words">
                  Best number
                  <br />
                  at the shops
                  <br />
                  you actually use.
                </h1>
                <p className="font-mono text-[13px] sm:text-[14px] text-ink-dim max-w-md leading-relaxed">
                  NY-first. Your books only. Pinnacle fair line. $19/mo — not a $300 national firehose.
                </p>
              </div>

              <ol className="space-y-2 font-mono text-[13px] text-ink">
                {BULLETS.map((bullet, i) => (
                  <li key={bullet} className="flex gap-3 min-w-0">
                    <span className="text-ink-dim shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="break-words">{bullet}</span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-col gap-2">
                {canCharge ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleCheckout('edge')}
                      disabled={starting}
                      className="btn btn-primary w-full"
                    >
                      Start with Edge — $19/mo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCheckout('pro')}
                      disabled={starting}
                      className="btn btn-secondary w-full"
                    >
                      Go Pro — $49/mo
                    </button>
                  </>
                ) : (
                  <Link to="/app" className="btn btn-primary w-full">
                    Open the board
                  </Link>
                )}
                {checkoutError && (
                  <p className="font-mono text-[12px] text-bad">{checkoutError}</p>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl overflow-hidden min-w-0 pointer-events-none">
              {isLoading && (
                <div className="p-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                  Loading live lines…
                </div>
              )}
              {linesUnavailable && (
                <div className="p-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
                  Live lines unavailable
                </div>
              )}
              {!isLoading && !linesUnavailable && (
                <div className="p-2.5">
                  {previewIsSeason && (
                    <p className="font-mono text-[11px] text-ink-dim px-1 pb-2">
                      Nothing tonight — next season slate.
                    </p>
                  )}
                  <OddsGrid events={liveEvents} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 sm:px-4 pb-10">
        <div className="max-w-3xl lg:max-w-5xl mx-auto">
          <p className="label mb-4">Price</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <p className="label">Edge</p>
              <p className="font-mono text-[40px] leading-none text-ink mt-3">$19</p>
              <p className="font-mono text-[12px] text-ink-dim mt-2">/mo · live books at your shops + quiet +EV</p>
              {canCharge ? (
                <button
                  type="button"
                  onClick={() => handleCheckout('edge')}
                  disabled={starting}
                  className="mt-5 font-mono text-[13px] text-lichen"
                >
                  Get Edge
                </button>
              ) : (
                <Link to="/app" className="mt-5 inline-block font-mono text-[13px] text-lichen">
                  Open the board
                </Link>
              )}
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="label">Pro</p>
              <p className="font-mono text-[40px] leading-none text-ink mt-3">$49</p>
              <p className="font-mono text-[12px] text-ink-dim mt-2">/mo · tickets + Kalshi / Polymarket</p>
              {canCharge ? (
                <button
                  type="button"
                  onClick={() => handleCheckout('pro')}
                  disabled={starting}
                  className="mt-5 font-mono text-[13px] text-lichen"
                >
                  Get Pro
                </button>
              ) : (
                <Link to="/app" className="mt-5 inline-block font-mono text-[13px] text-lichen">
                  Open the board
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="px-3 sm:px-4 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="max-w-3xl lg:max-w-5xl mx-auto font-mono text-[11px] text-ink-dim flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="lowercase">{BRAND.wordmark}</span>
          <span>·</span>
          <span>18+</span>
          <span>·</span>
          <span>NOT ADVICE</span>
          <span>·</span>
          <Link to="/terms" className="hover:text-ink">
            terms
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-ink">
            privacy
          </Link>
          <span>·</span>
          <a href={SUPPORT_MAILTO} className="hover:text-ink">
            {BRAND.supportEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}
