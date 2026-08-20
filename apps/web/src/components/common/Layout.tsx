import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutGrid, Settings, Sparkles, Ticket } from 'lucide-react';
import { usePlan } from '@/components/auth/AuthProvider';
import AuthControls from '@/components/auth/AuthControls';
import BookOnboarding from '@/components/auth/BookOnboarding';
import LiquidBg from '@/components/common/LiquidBg';
import BrandMark from '@/components/common/BrandMark';
import { Betslip } from '@/components/betslip/Betslip';
import { useBetslipStore, useTotalBets } from '@/stores/betslipStore';
import { useBankrollStore } from '@/stores/bankrollStore';

const navItems = [
  { path: '/app', label: 'Odds', icon: LayoutGrid, end: true },
  { path: '/app/ev', label: 'Edges', icon: Sparkles, end: false },
  { path: '/app/tickets', label: 'Tickets', icon: Ticket, end: false },
  { path: '/app/settings', label: 'More', icon: Settings, end: false },
] as const;

export default function Layout() {
  const { plan, isLoaded, needsBookSetup } = usePlan();
  const toggleSlip = useBetslipStore((s) => s.togglePanel);
  const slipCount = useTotalBets();
  const roll = useBankrollStore((s) => s.balance);

  return (
    <div className="liquid-scene text-ink flex flex-col min-h-dvh">
      <LiquidBg />

      <header
        className="sticky top-0 z-40 glass-strong"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="text-[#eef2fb] text-base sm:text-lg shrink-0">
              <BrandMark />
            </Link>
            {isLoaded && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#eef2fb] border-2 border-[#c9bde8] rounded-full px-2 py-0.5">
                {plan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-full text-[12px] uppercase tracking-[0.12em] ${
                      isActive ? 'bg-[#3d6fd8] text-[#eef2fb]' : 'text-[#c9bde8] hover:text-[#eef2fb]'
                    }`
                  }
                >
                  {item.label === 'More' ? 'Settings' : item.label}
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggleSlip}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#eef2fb] border-2 border-[#c9bde8] rounded-full px-2.5 py-1"
            >
              Slip{slipCount ? ` ${slipCount}` : ''}
            </button>
            {roll > 0 && (
              <span className="font-mono text-[11px] text-[#c9bde8] tabular-nums shrink-0">
                ${roll.toFixed(0)}
              </span>
            )}
            <AuthControls compact />
          </div>
        </div>
      </header>

      <main className="max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 pt-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-10 flex-1 w-full min-w-0">
        {needsBookSetup ? <BookOnboarding /> : <Outlet />}
      </main>
      <Betslip />

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-4 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className="min-w-0">
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-0.5 min-h-14 px-1 text-[10px] uppercase tracking-[0.12em] ${
                      isActive ? 'text-[#eef2fb]' : 'text-[#c9bde8]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex items-center justify-center h-8 w-10 rounded-full ${
                          isActive ? 'bg-[#3d6fd8] text-[#eef2fb]' : ''
                        }`}
                      >
                        <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                      </span>
                      <span className="truncate w-full text-center">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
