import { Link } from 'react-router-dom';
import LiquidBg from '@/components/common/LiquidBg';
import BrandMark from '@/components/common/BrandMark';

export function AppNotFound() {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="font-display font-bold text-3xl">That page is gone</h1>
      <p className="font-mono text-[13px] text-ink-dim">
        No live desk, no props, no crash — just a bad URL.
      </p>
      <Link to="/app" className="btn btn-primary inline-flex">
        Back to Odds
      </Link>
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="liquid-scene text-ink min-h-dvh">
      <LiquidBg />
      <header
        className="sticky top-0 z-40 glass-strong"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl mx-auto px-3 h-14 flex items-center">
          <Link to="/" className="text-[#eef2fb]">
            <BrandMark />
          </Link>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-3xl">That page is gone</h1>
        <p className="font-mono text-[13px] text-ink-dim">
          No live, no props desk, no 404 crash — just a bad URL.
        </p>
        <Link to="/app" className="btn btn-primary inline-flex">
          Back to Odds
        </Link>
      </main>
    </div>
  );
}
