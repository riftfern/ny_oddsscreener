import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BRAND, SUPPORT_MAILTO } from '@ny-sharp-edge/shared';
import LiquidBg from '@/components/common/LiquidBg';
import BrandMark from '@/components/common/BrandMark';

const LINKS = [
  { to: '/legal', label: 'Support', end: true },
  { to: '/terms', label: 'Terms', end: true },
  { to: '/privacy', label: 'Privacy', end: true },
] as const;

export default function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="liquid-scene text-ink min-h-dvh flex flex-col">
      <LiquidBg />
      <header
        className="sticky top-0 z-40 glass-strong"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          <Link to="/" className="text-[#eef2fb] text-base shrink-0">
            <BrandMark />
          </Link>
          <Link to="/app" className="btn btn-secondary min-h-10 text-[12px]">
            Open app
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-8 flex-1 w-full min-w-0">
        <nav className="flex flex-wrap gap-1.5 mb-6">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `chip ${isActive ? 'chip-on' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <h1 className="font-display font-bold text-3xl tracking-tight mb-2">{title}</h1>
        <p className="font-mono text-[12px] text-ink-dim mb-8">
          Effective {BRAND.legalEffective} · {BRAND.domain}
        </p>
        <div className="space-y-6 text-ink-dim font-mono text-[14px] leading-relaxed">{children}</div>
      </main>

      <footer
        className="px-3 sm:px-4 py-6"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto font-mono text-[11px] text-ink-dim flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link to="/" className="hover:text-ink lowercase">
            {BRAND.wordmark}
          </Link>
          <span>·</span>
          <a href={SUPPORT_MAILTO} className="hover:text-ink">
            {BRAND.supportEmail}
          </a>
          <span>·</span>
          <Link to="/terms" className="hover:text-ink">
            /terms
          </Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-ink">
            /privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="font-display font-semibold text-ink text-xl mb-2">{children}</h2>;
}
