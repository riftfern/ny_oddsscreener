import { Link } from 'react-router-dom';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="h-12 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="font-display font-bold tracking-[0.22em] text-lg text-ink">
            LINEEDGE
          </Link>
          <Link
            to="/app"
            className="text-[11px] uppercase tracking-[0.18em] text-ink-dim hover:text-ink"
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display font-bold text-3xl tracking-tight mb-8">Legal & Disclosures</h1>

        <div className="space-y-6 text-ink-dim font-mono text-[14px]">
          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Information product only</h2>
            <p>
              LineEdge is not a sportsbook and does not accept wagers. We do not place bets on
              your behalf. We are not a registered investment advisor.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Age restriction</h2>
            <p>You must be 18 years or older to use this product.</p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Odds and data</h2>
            <p>
              Odds are provided by third parties and can be stale, delayed, or pulled at any time
              without notice. Lines displayed in the app may have moved by the time you place a bet.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">You can lose money</h2>
            <p>
              Sports betting involves risk. Past +EV or arbitrage examples are not a guarantee of
              future results. Only bet what you can afford to lose.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Chargebacks and access</h2>
            <p>
              Access to paid features continues only while your subscription is active. If you
              dispute or charge back a payment, access ends when the subscription ends.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">New York users</h2>
            <p>
              In New York and everywhere else we operate, LineEdge is an informational tool
              only. We do not accept wagers and are not a gambling operator.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Arbitrage disclaimer</h2>
            <p>
              Arbitrage opportunities shown are theoretical. Both legs must clear at the displayed
              price for the calculated profit to realize. If one line moves or a bet is rejected,
              the arb may result in a loss.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-ink text-xl mb-2">Affiliation</h2>
            <p>
              Built independently — not affiliated with OddsJam, Kalshi, Polymarket, or any
              sportsbook.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 py-4 font-mono text-[11px] text-ink-dim">
          <Link to="/" className="hover:text-ink">
            LINEEDGE · /legal
          </Link>
        </div>
      </footer>
    </div>
  );
}
