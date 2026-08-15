import { useEffect, useState } from 'react';
import { usePlan } from '@/components/auth/AuthProvider';
import { useBankrollStore } from '@/stores/bankrollStore';
import { api } from '@/services/api';
import { useCheckout } from '@/hooks/useCheckout';

export default function SettingsPage() {
  const { plan } = usePlan();
  const balance = useBankrollStore((s) => s.balance);
  const addFunds = useBankrollStore((s) => s.addFunds);
  const withdrawFunds = useBankrollStore((s) => s.withdrawFunds);
  const [deposit, setDeposit] = useState('100');
  const [telegram, setTelegram] = useState<{ configured: boolean; mockDisabled: boolean } | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof api.health>> | null>(null);
  const checkout = useCheckout();

  useEffect(() => {
    api.getSettings().then((s) => setTelegram(s.telegram)).catch(() => {
      setTelegram({ configured: false, mockDisabled: true });
    });
    api.health().then((h) => setHealth(h)).catch(() => {
      setHealth(null);
    });
  }, []);

  const handleCheckout = async (target: 'edge' | 'pro') => {
    const result = await checkout(target);
    if (result.url) window.location.href = result.url;
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Local bankroll and how this box is configured.</p>
      </div>

      <section className="rounded-xl border border-gray-700 bg-gray-800/70 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Plan</h2>
        <p className="text-gray-300">
          Current plan:{' '}
          <span className="uppercase font-semibold text-white">{plan}</span>
        </p>
        {plan === 'free' && (
          <button
            type="button"
            onClick={() => handleCheckout('edge')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Upgrade to Edge — $19/mo
          </button>
        )}
        {plan === 'edge' && (
          <button
            type="button"
            onClick={() => handleCheckout('pro')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Upgrade to Pro — $49/mo
          </button>
        )}
        <p className="text-xs text-gray-500">
          Clerk and Stripe keys are optional in mock/dev. Paste them later to take real cards.
        </p>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-800/70 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Bankroll</h2>
        <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-2 w-28 border border-gray-600"
          />
          <button
            type="button"
            onClick={() => addFunds(Number(deposit) || 0)}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            Add funds
          </button>
          <button
            type="button"
            onClick={() => withdrawFunds(Number(deposit) || 0)}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            Withdraw
          </button>
        </div>
        <p className="text-xs text-gray-500">Stored in this browser only. Not a wallet.</p>
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-800/70 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Server status</h2>
        {!health && <p className="text-gray-400 text-sm">Checking server…</p>}
        {health && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-400">Data source</dt>
            <dd className="text-white font-medium">{health.mock ? 'Mock' : 'Live'}</dd>
            <dt className="text-gray-400">Auth required</dt>
            <dd className="text-white font-medium">{health.authRequired ? 'Yes' : 'No'}</dd>
            <dt className="text-gray-400">Native exchanges</dt>
            <dd className="text-white font-medium">{health.nativeExchanges ? 'On' : 'Off'}</dd>
            <dt className="text-gray-400">Sharp fallback</dt>
            <dd className="text-white font-medium">{health.sharpFallback}</dd>
            <dt className="text-gray-400">Snapshots</dt>
            <dd className="text-white font-medium">{health.snapshots ? 'On' : 'Off'}</dd>
            {health.remainingCredits !== undefined && (
              <>
                <dt className="text-gray-400">Odds API credits</dt>
                <dd className="text-white font-medium">{health.remainingCredits.toLocaleString()}</dd>
              </>
            )}
          </dl>
        )}
      </section>

      <section className="rounded-xl border border-gray-700 bg-gray-800/70 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Telegram alerts</h2>
        {!telegram && <p className="text-gray-400 text-sm">Checking server…</p>}
        {telegram && (
          <>
            <p className="text-gray-300 text-sm">
              Server bot:{' '}
              <span className="text-white font-medium">
                {telegram.configured ? 'configured' : 'not configured'}
              </span>
            </p>
            {telegram.mockDisabled && (
              <p className="text-yellow-400/80 text-sm">
                Mock mode is on — the poller will not send fake FanDuel dogs.
              </p>
            )}
            <p className="text-xs text-gray-500">
              Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID on the API box. Per-user chats wait until
              there are paying users. This is Jack&apos;s chat first.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
