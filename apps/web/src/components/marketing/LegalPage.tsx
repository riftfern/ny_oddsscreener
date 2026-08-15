import { Link } from 'react-router-dom';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Marketing Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            LineEdge
          </Link>
          <Link
            to="/app"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Legal & Disclosures</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Information product only</h2>
            <p>
              LineEdge is not a sportsbook and does not accept wagers. We do not place bets on
              your behalf. We are not a registered investment advisor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Age restriction</h2>
            <p>You must be 18 years or older to use this product.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Odds and data</h2>
            <p>
              Odds are provided by third parties and can be stale, delayed, or pulled at any time
              without notice. Lines displayed in the app may have moved by the time you place a bet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">You can lose money</h2>
            <p>
              Sports betting involves risk. Past +EV or arbitrage examples are not a guarantee of
              future results. Only bet what you can afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Chargebacks and access</h2>
            <p>
              Access to paid features continues only while your subscription is active. If you
              dispute or charge back a payment, access ends when the subscription ends.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">New York users</h2>
            <p>
              In New York and everywhere else we operate, LineEdge is an informational tool
              only. We do not accept wagers and are not a gambling operator.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Arbitrage disclaimer</h2>
            <p>
              Arbitrage opportunities shown are theoretical. Both legs must clear at the displayed
              price for the calculated profit to realize. If one line moves or a bet is rejected,
              the arb may result in a loss.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-2">Affiliation</h2>
            <p>
              Built independently — not affiliated with OddsJam, Kalshi, Polymarket, or any
              sportsbook.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-400">
          <Link to="/" className="hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
