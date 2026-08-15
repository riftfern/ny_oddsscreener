import { Outlet, NavLink, Link } from 'react-router-dom';
import { usePlan } from '@/components/auth/AuthProvider';
import AuthControls from '@/components/auth/AuthControls';
import BookOnboarding from '@/components/auth/BookOnboarding';

const navItems = [
  { path: '/app', label: 'Odds', end: true },
  { path: '/app/ev', label: 'Edges' },
  { path: '/app/exchanges', label: 'Exchanges' },
  { path: '/app/settings', label: 'Settings' },
];

export default function Layout() {
  const { plan, isLoaded, needsBookSetup } = usePlan();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col">
      <header className="h-12 border-b border-line bg-bg">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              className="font-display font-bold text-ink tracking-[0.22em] text-lg shrink-0"
            >
              LINEEDGE
            </Link>
            {isLoaded && (
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink border border-line px-1.5 py-0.5">
                {plan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 min-w-0">
            <nav className="flex items-stretch h-12 gap-1 overflow-x-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    `flex items-center px-3 text-[11px] uppercase tracking-[0.18em] border-b-2 ${
                      isActive
                        ? 'border-moss text-ink'
                        : 'border-transparent text-ink-dim hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <AuthControls compact />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {needsBookSetup ? <BookOnboarding /> : <Outlet />}
      </main>

      <footer className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 py-3 font-mono text-[11px] text-ink-dim flex flex-wrap items-center gap-x-3 gap-y-1">
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
