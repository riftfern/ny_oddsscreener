import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getMockEvents, SPORTS } from '@ny-sharp-edge/shared';
import OddsGrid from '@/components/odds/OddsGrid';
import { useCheckout } from '@/hooks/useCheckout';
import { Check } from 'lucide-react';

const BULLETS = [
  '+EV vs Pinnacle',
  'Arbitrage scanner',
  'Exchange screen (Kalshi + Polymarket)',
];

export default function LandingPage() {
  const screenshotEvents = useMemo(
    () => getMockEvents(SPORTS.NBA).slice(0, 2),
    []
  );
  const checkout = useCheckout();

  const handleCheckout = async (plan: 'edge' | 'pro') => {
    const result = await checkout(plan);
    if (result.url) {
      window.location.href = result.url;
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Marketing Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white">
            NY Sharp Edge
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/app"
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/app"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Open app
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Find +EV lines without a $200/mo terminal.
                </h1>
                <p className="text-xl text-gray-300">
                  Pinnacle fair odds. US books. Kalshi and Polymarket on Pro. $19/mo.
                </p>
              </div>

              <ul className="space-y-3">
                {BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-gray-300">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-600/20 p-1">
                      <Check className="w-4 h-4 text-blue-400" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => handleCheckout('edge')}
                  className="inline-flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Start with Edge — $19/mo
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckout('pro')}
                  className="inline-flex justify-center items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Go Pro — $49/mo
                </button>
              </div>
            </div>

            {/* Screenshot slot */}
            <div className="relative rounded-xl border border-gray-700 bg-gray-800/50 p-4 shadow-2xl overflow-hidden">
              <div className="pointer-events-none opacity-90">
                <OddsGrid events={screenshotEvents} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">Simple pricing</h2>
            <p className="text-gray-400 mt-2">No $99+ tiers. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Edge */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/70 p-6">
              <h3 className="text-xl font-bold text-white">Edge</h3>
              <p className="text-3xl font-bold text-white mt-4">
                $19<span className="text-base font-normal text-gray-400">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Live US books
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> +EV vs Pinnacle
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> 6 sports
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Quarter-Kelly sizing
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout('edge')}
                className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                Get Edge
              </button>
            </div>

            {/* Pro */}
            <div className="rounded-xl border border-blue-500/30 bg-gray-800/70 p-6 relative">
              <span className="absolute top-0 right-0 -mt-3 mr-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Pro
              </span>
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <p className="text-3xl font-bold text-white mt-4">
                $49<span className="text-base font-normal text-gray-400">/mo</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Everything in Edge
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Arbitrage finder
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400" /> Kalshi + Polymarket screen
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout('pro')}
                className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Footer */}
      <footer className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              18+ only. Not gambling advice. Odds can move and lines can be pulled at any time.
              No guaranteed profit. Arbitrage is theoretical until both legs clear.
            </p>
            <p>
              Built independently — not affiliated with OddsJam, Kalshi, or any sportsbook.{" "}
              <Link to="/legal" className="underline hover:text-white transition-colors">
                Legal
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
