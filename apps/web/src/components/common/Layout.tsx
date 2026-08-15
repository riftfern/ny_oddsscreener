import { Outlet, NavLink, Link } from 'react-router-dom';
import { Betslip, BetslipToggle } from '../betslip';
import { usePlan } from '@/components/auth/AuthProvider';

const navItems = [
  { path: '/app', label: 'Odds', end: true },
  { path: '/app/ev', label: '+EV Finder' },
  { path: '/app/arb', label: 'Arbitrage' },
  { path: '/app/exchanges', label: 'Exchanges' },
  { path: '/app/settings', label: 'Settings' },
];

const PLAN_BADGE_COLORS: Record<ReturnType<typeof usePlan>['plan'], string> = {
  free: 'bg-gray-600',
  edge: 'bg-blue-600',
  pro: 'bg-purple-600',
};

export default function Layout() {
  const { plan, isLoaded } = usePlan();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors">
                NY Sharp Edge
              </Link>
              {isLoaded && (
                <span className={`text-xs ${PLAN_BADGE_COLORS[plan]} px-2 py-0.5 rounded text-white uppercase tracking-wider`}>
                  {plan}
                </span>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right side (future: settings, notifications) */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">US + Pinnacle</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-400">
            <span>NY Sharp Edge — information product, not a sportsbook</span>
            <div className="flex items-center gap-4">
              <Link to="/legal" className="hover:text-white transition-colors">
                Legal
              </Link>
              <span>Data refreshes every 45 seconds</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            18+ only. Not gambling advice. Odds can move and lines can be pulled at any time.
            No guaranteed profit. Arbitrage is theoretical until both legs clear.
          </p>
        </div>
      </footer>

      {/* Betslip */}
      <BetslipToggle />
      <Betslip />
    </div>
  );
}
