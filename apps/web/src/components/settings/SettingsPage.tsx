import { useEffect, useState } from 'react';
import { usePlan } from '@/components/auth/AuthProvider';
import { useBankrollStore } from '@/stores/bankrollStore';
import { api } from '@/services/api';
import { useCheckout } from '@/hooks/useCheckout';
import { useDebugMode } from '@/hooks/useDebugMode';
import { Link } from 'react-router-dom';
import BookEditor from '@/components/auth/BookEditor';

const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';

export default function SettingsPage() {
  const { plan, signedIn } = usePlan();
  const balance = useBankrollStore((s) => s.balance);
  const addFunds = useBankrollStore((s) => s.addFunds);
  const withdrawFunds = useBankrollStore((s) => s.withdrawFunds);
  const [deposit, setDeposit] = useState('100');
  const [telegram, setTelegram] = useState<{ configured: boolean; mockDisabled: boolean } | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof api.health>> | null>(null);
  const checkout = useCheckout();
  const debug = useDebugMode();
  const [boardOnly, setBoardOnly] = useState(!requireAuth);

  useEffect(() => {
    if (!debug) return;
    api.getSettings().then((s) => setTelegram(s.telegram)).catch(() => {
      setTelegram({ configured: false, mockDisabled: true });
    });
    api.health().then((h) => setHealth(h)).catch(() => {
      setHealth(null);
    });
  }, [debug]);

  const handleCheckout = async (target: 'edge' | 'pro') => {
    if (boardOnly) return;
    const result = await checkout(target);
    if (result.url) {
      window.location.href = result.url;
    } else {
      setBoardOnly(true);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Settings</h1>
        <p className="text-ink-dim font-mono text-[13px] mt-1">
          Your books, plan, and local bankroll.
        </p>
      </div>

      {signedIn && (
        <section className="border border-line bg-bg-2 p-6">
          <BookEditor />
        </section>
      )}

      <section className="border border-line bg-bg-2 p-6 space-y-3">
        <h2 className="label">Plan</h2>
        <p className="text-ink">
          Current plan:{' '}
          <span className="uppercase font-mono font-medium">{plan}</span>
        </p>
        {plan === 'free' && (
          boardOnly ? (
            <Link
              to="/app"
              className="inline-block bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2"
            >
              Open the board →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleCheckout('edge')}
              className="bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2"
            >
              Upgrade to Edge — $19/mo
            </button>
          )
        )}
        {plan === 'edge' && (
          boardOnly ? (
            <Link
              to="/app"
              className="inline-block bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2"
            >
              Open the board →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleCheckout('pro')}
              className="bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2"
            >
              Upgrade to Pro — $49/mo
            </button>
          )
        )}
      </section>

      <section className="border border-line bg-bg-2 p-6 space-y-4">
        <h2 className="label">Bankroll</h2>
        <p className="text-3xl font-mono font-medium text-ink">${balance.toFixed(2)}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="bg-bg text-ink font-mono px-3 py-2 w-28 border border-line focus:outline-none focus:border-moss"
          />
          <button
            type="button"
            onClick={() => addFunds(Number(deposit) || 0)}
            className="border border-moss text-ink text-[11px] uppercase tracking-[0.14em] px-4 py-2 hover:bg-moss"
          >
            Add funds
          </button>
          <button
            type="button"
            onClick={() => withdrawFunds(Number(deposit) || 0)}
            className="border border-line text-ink-dim text-[11px] uppercase tracking-[0.14em] px-4 py-2 hover:text-ink"
          >
            Withdraw
          </button>
        </div>
        <p className="font-mono text-[11px] text-ink-dim">Stored in this browser only. Not a wallet.</p>
      </section>

      {debug && (
        <>
          <section className="border border-line bg-bg-2 p-6 space-y-3">
            <h2 className="label">Server status</h2>
            {!health && <p className="text-ink-dim font-mono text-[13px]">Checking server…</p>}
            {health && (
              <dl className="grid grid-cols-2 gap-3 font-mono text-[13px]">
                <dt className="text-ink-dim">Data source</dt>
                <dd className="text-ink">{health.mock ? 'Mock' : 'Live'}</dd>
                <dt className="text-ink-dim">Auth required</dt>
                <dd className="text-ink">{health.authRequired ? 'Yes' : 'No'}</dd>
                <dt className="text-ink-dim">Native exchanges</dt>
                <dd className="text-ink">{health.nativeExchanges ? 'On' : 'Off'}</dd>
                <dt className="text-ink-dim">Sharp fallback</dt>
                <dd className="text-ink">{health.sharpFallback}</dd>
                <dt className="text-ink-dim">Snapshots</dt>
                <dd className="text-ink">{health.snapshots ? 'On' : 'Off'}</dd>
                {health.remainingCredits !== undefined && (
                  <>
                    <dt className="text-ink-dim">Odds API credits</dt>
                    <dd className="text-ink">{health.remainingCredits.toLocaleString()}</dd>
                  </>
                )}
              </dl>
            )}
            <p className="font-mono text-[11px] text-ink-dim">
              Clerk and Stripe keys are optional in mock/dev. Paste them later to take real cards.
            </p>
          </section>

          <section className="border border-line bg-bg-2 p-6 space-y-3">
            <h2 className="label">Telegram alerts</h2>
            {!telegram && <p className="text-ink-dim font-mono text-[13px]">Checking server…</p>}
            {telegram && (
              <>
                <p className="text-ink font-mono text-[13px]">
                  Server bot:{' '}
                  <span className="font-medium">
                    {telegram.configured ? 'configured' : 'not configured'}
                  </span>
                </p>
                {telegram.mockDisabled && (
                  <p className="text-warn font-mono text-[13px]">
                    Mock mode is on — the poller will not send fake FanDuel dogs.
                  </p>
                )}
                <p className="font-mono text-[11px] text-ink-dim">
                  Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID on the API box. Per-user chats wait until
                  there are paying users. This is Jack&apos;s chat first.
                </p>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
