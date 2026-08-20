import { useEffect, useState } from 'react';
import { usePlan } from '@/components/auth/AuthProvider';
import { useBankrollStore } from '@/stores/bankrollStore';
import { api } from '@/services/api';
import { billingErrorMessage } from '@/hooks/useCheckout';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { useDebugMode } from '@/hooks/useDebugMode';
import { Link } from 'react-router-dom';
import BookEditor from '@/components/auth/BookEditor';
import { BRAND, SUPPORT_MAILTO, booksCaption, formatAmerican, getVenue } from '@ny-sharp-edge/shared';
import { usePositionStore } from '@/stores/positionStore';

export default function SettingsPage() {
  const { plan, signedIn, books, startCheckout, startPortal } = usePlan();
  const { canCharge } = useBillingStatus();
  const balance = useBankrollStore((s) => s.balance);
  const addFunds = useBankrollStore((s) => s.addFunds);
  const withdrawFunds = useBankrollStore((s) => s.withdrawFunds);
  const [deposit, setDeposit] = useState('1000');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [telegram, setTelegram] = useState<{ configured: boolean; mockDisabled: boolean } | null>(null);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof api.health>> | null>(null);
  const debug = useDebugMode();
  const [editingBooks, setEditingBooks] = useState(false);

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
    if (!canCharge) return;
    setBillingError(null);
    const result = await startCheckout(target);
    if (result.error) setBillingError(billingErrorMessage(result.error));
  };

  const handlePortal = async () => {
    setBillingError(null);
    const result = await startPortal();
    if (result.error) setBillingError(billingErrorMessage(result.error));
  };

  return (
    <div className="space-y-4 max-w-2xl min-w-0">
      <div>
        <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
          Settings
        </h1>
        <p className="text-ink-dim font-mono text-[13px] mt-2 leading-snug">
          Plan, local bankroll, then your shops.
        </p>
      </div>

      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="label">Plan</h2>
        <p className="text-ink">
          Current plan:{' '}
          <span className="uppercase font-mono font-medium">{plan}</span>
        </p>
        {plan === 'free' && (
          canCharge ? (
            <button
              type="button"
              onClick={() => handleCheckout('edge')}
              className="btn btn-primary"
            >
              Upgrade to Edge — $19/mo
            </button>
          ) : (
            <Link
              to="/app"
              className="btn btn-primary"
            >
              Open the board →
            </Link>
          )
        )}
        {plan === 'edge' && canCharge && (
          <button
            type="button"
            onClick={() => handleCheckout('pro')}
            className="btn btn-primary"
          >
            Upgrade to Pro — $49/mo
          </button>
        )}
        {signedIn && canCharge && plan !== 'free' && (
          <button
            type="button"
            onClick={handlePortal}
            className="btn btn-secondary"
          >
            Manage billing
          </button>
        )}
        {billingError && <p className="font-mono text-[12px] text-bad">{billingError}</p>}
        <p className="font-mono text-[12px] text-ink-dim">
          Billing help:{' '}
          <a href={SUPPORT_MAILTO} className="text-lichen">
            {BRAND.supportEmail}
          </a>
          {' · '}
          <Link to="/terms" className="text-lichen">
            Terms
          </Link>
          {' · '}
          <Link to="/privacy" className="text-lichen">
            Privacy
          </Link>
        </p>
      </section>

      <section className="glass rounded-2xl p-4 space-y-4">
        <h2 className="label">Bankroll</h2>
        <p className="text-3xl font-mono font-medium text-ink">${balance.toFixed(2)}</p>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            min="1"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="bg-[#fffdf4] text-ink font-mono px-3 py-3 w-full rounded-xl border-2 border-line focus:outline-none focus:border-lichen"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const n = Number(deposit) || 0;
                setWalletError(null);
                if (n <= 0) {
                  setWalletError('Enter a positive amount.');
                  return;
                }
                addFunds(n);
              }}
              className="btn btn-primary"
            >
              Add funds
            </button>
            <button
              type="button"
              onClick={() => {
                const n = Number(deposit) || 0;
                setWalletError(null);
                if (n <= 0) {
                  setWalletError('Enter a positive amount.');
                  return;
                }
                if (n > balance) {
                  setWalletError(`You only have $${balance.toFixed(2)} in this browser.`);
                  return;
                }
                withdrawFunds(n);
              }}
              className="btn btn-secondary"
            >
              Withdraw
            </button>
          </div>
          {walletError && <p className="font-mono text-[12px] text-bad">{walletError}</p>}
        </div>
        <p className="font-mono text-[11px] text-ink-dim">Stored in this browser only. Not a wallet.</p>
      </section>

      <WalletHistory />
      <PositionsPanel />

      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="label">Your shops</h2>
        <p className="font-mono text-[13px] text-ink">
          {booksCaption(books)}
        </p>
        {books && books.length > 0 && (
          <p className="font-mono text-[12px] text-ink-dim">
            {books.map((id) => getVenue(id).shortName).join(' · ')}
          </p>
        )}
        {!editingBooks ? (
          <button
            type="button"
            className="chip chip-on"
            onClick={() => setEditingBooks(true)}
          >
            Edit shops
          </button>
        ) : (
          <BookEditor onClose={() => setEditingBooks(false)} />
        )}
      </section>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="label">Kalshi / Polymarket</h2>
        <p className="font-mono text-[13px] text-ink-dim">
          Not a live sportsbook tab. Only unmatched leftovers, and often empty.
        </p>
        <Link to="/app/exchanges" className="chip chip-on inline-flex">
          Open exchanges
        </Link>
      </section>

      {debug && (
        <>
          <section className="glass rounded-2xl p-4 space-y-3">
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

          <section className="glass rounded-2xl p-4 space-y-3">
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

function WalletHistory() {
  const bets = useBankrollStore((s) => s.bets);
  const settleBet = useBankrollStore((s) => s.settleBet);
  if (bets.length === 0) return null;
  return (
    <section className="glass rounded-2xl p-4 space-y-2">
      <h2 className="label">Sim tickets</h2>
      <p className="font-mono text-[11px] text-ink-dim">Grade pending tickets yourself. We do not auto-settle from the books.</p>
      <ul className="space-y-2">
        {bets.slice(0, 12).map((b) => (
          <li key={b.id} className="font-mono text-[12px] text-ink">
            <div>
              {b.status.toUpperCase()} ${b.stake.toFixed(0)} {b.outcomeName} @ {getVenue(b.bookId).shortName}{' '}
              {b.odds > 0 ? '+' : ''}
              {b.odds}
              <span className="text-ink-dim"> · {b.eventDescription}</span>
            </div>
            {b.status === 'pending' && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                <button type="button" className="chip" onClick={() => settleBet(b.id, 'won')}>
                  Won
                </button>
                <button type="button" className="chip" onClick={() => settleBet(b.id, 'lost')}>
                  Lost
                </button>
                <button type="button" className="chip" onClick={() => settleBet(b.id, 'push')}>
                  Push
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PositionsPanel() {
  const { books } = usePlan();
  const positions = usePositionStore((s) => s.positions);
  const addPosition = usePositionStore((s) => s.addPosition);
  const removePosition = usePositionStore((s) => s.removePosition);
  const [team, setTeam] = useState('');
  const [odds, setOdds] = useState('-110');
  const [stake, setStake] = useState('50');
  const shopIds = books && books.length > 0 ? books : ['fanduel'];
  const [bookId, setBookId] = useState(shopIds[0]);
  const [kind, setKind] = useState<'game' | 'future'>('game');

  return (
    <section className="glass rounded-2xl p-4 space-y-3">
      <h2 className="label">My tickets</h2>
      <p className="font-mono text-[12px] text-ink-dim">
        Save a leftover game or a season ticket. Season tickets do not hedge against week-1
        moneylines.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`chip ${kind === 'game' ? 'chip-on' : ''}`}
          onClick={() => setKind('game')}
        >
          Game leftover
        </button>
        <button
          type="button"
          className={`chip ${kind === 'future' ? 'chip-on' : ''}`}
          onClick={() => setKind('future')}
        >
          Season / future
        </button>
      </div>
      <div className="grid gap-2">
        <input
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="Team (e.g. Kansas City Chiefs)"
          className="bg-[#fffdf4] text-ink font-mono px-3 py-2 rounded-xl border-2 border-line"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={odds}
            onChange={(e) => setOdds(e.target.value)}
            placeholder="Odds"
            className="bg-[#fffdf4] text-ink font-mono px-3 py-2 rounded-xl border-2 border-line"
          />
          <input
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="Stake"
            className="bg-[#fffdf4] text-ink font-mono px-3 py-2 rounded-xl border-2 border-line"
          />
        </div>
        <select
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          className="bg-[#fffdf4] text-ink font-mono px-3 py-2 rounded-xl border-2 border-line"
        >
          {shopIds.map((id) => (
            <option key={id} value={id}>
              {getVenue(id).name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (!team.trim()) return;
            addPosition({
              team: team.trim(),
              odds: Number(odds) || 0,
              stake: Number(stake) || 0,
              bookId,
              note: kind === 'future' ? 'season ticket' : '',
              kind,
            });
            setTeam('');
          }}
        >
          Save ticket
        </button>
      </div>
      {positions.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2">
          <p className="font-mono text-[12px] min-w-0">
            {p.team} {formatAmerican(p.odds)} · ${p.stake} · {getVenue(p.bookId).shortName}
            {p.kind === 'future' || (p.note && /season/i.test(p.note)) ? ' · season' : ''}
          </p>
          <button type="button" className="chip" onClick={() => removePosition(p.id)}>
            Drop
          </button>
        </div>
      ))}
    </section>
  );
}
