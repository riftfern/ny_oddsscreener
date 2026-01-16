import { Outlet, NavLink } from 'react-router-dom';
import { Betslip, BetslipToggle } from '../betslip';

const navItems = [
  { path: '/', label: 'Odds' },
  { path: '/ev', label: '+EV Finder' },
  { path: '/arb', label: 'Arbitrage' },
  { path: '/exchanges', label: 'Exchanges' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">NY Sharp Edge</span>
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white">BETA</span>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
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
              <span className="text-sm text-gray-400">NY Legal Books Only</span>
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
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Portfolio Project by Jack (@riftfern)</span>
            <span>Data refreshes every 30 seconds</span>
          </div>
        </div>
      </footer>

      {/* Betslip */}
      <BetslipToggle />
      <Betslip />
    </div>
  );
}
