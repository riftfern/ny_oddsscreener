import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SportsbookId, MarketType } from '@ny-sharp-edge/shared';

export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'settlement';
export type BetStatus = 'pending' | 'won' | 'lost' | 'push';

export interface BetRecord {
  id: string;
  eventDescription: string;
  outcomeName: string;
  marketType: MarketType;
  bookId: SportsbookId;
  odds: number;
  stake: number;
  status: BetStatus;
  payout: number | null;
  placedAt: string;
  settledAt: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  betId: string | null;
  createdAt: string;
}

interface BankrollStore {
  balance: number;
  bets: BetRecord[];
  transactions: Transaction[];

  addFunds: (amount: number) => void;
  withdrawFunds: (amount: number) => void;
  logBet: (bet: {
    eventDescription: string;
    outcomeName: string;
    marketType: MarketType;
    bookId: SportsbookId;
    odds: number;
    stake: number;
  }) => void;
  settleBet: (betId: string, outcome: 'won' | 'lost' | 'push', payout?: number) => void;
  reset: () => void;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useBankrollStore = create<BankrollStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      bets: [],
      transactions: [],

      addFunds: (amount) => {
        if (amount <= 0) return;
        const { balance, transactions } = get();
        const newBalance = balance + amount;
        const tx: Transaction = {
          id: generateId(),
          type: 'deposit',
          amount,
          balanceAfter: newBalance,
          description: `Deposited $${amount.toFixed(2)}`,
          betId: null,
          createdAt: new Date().toISOString(),
        };
        set({ balance: newBalance, transactions: [tx, ...transactions] });
      },

      withdrawFunds: (amount) => {
        if (amount <= 0) return;
        const { balance, transactions } = get();
        if (amount > balance) return;
        const newBalance = balance - amount;
        const tx: Transaction = {
          id: generateId(),
          type: 'withdrawal',
          amount: -amount,
          balanceAfter: newBalance,
          description: `Withdrew $${amount.toFixed(2)}`,
          betId: null,
          createdAt: new Date().toISOString(),
        };
        set({ balance: newBalance, transactions: [tx, ...transactions] });
      },

      logBet: (betData) => {
        if (betData.stake <= 0) return;
        const { balance, bets, transactions } = get();
        if (betData.stake > balance) return;

        const betId = generateId();
        const newBalance = balance - betData.stake;

        const bet: BetRecord = {
          id: betId,
          ...betData,
          status: 'pending',
          payout: null,
          placedAt: new Date().toISOString(),
          settledAt: null,
        };

        const tx: Transaction = {
          id: generateId(),
          type: 'bet',
          amount: -betData.stake,
          balanceAfter: newBalance,
          description: `Bet $${betData.stake.toFixed(2)} on ${betData.outcomeName}`,
          betId,
          createdAt: new Date().toISOString(),
        };

        set({
          balance: newBalance,
          bets: [bet, ...bets],
          transactions: [tx, ...transactions],
        });
      },

      settleBet: (betId, outcome, payout) => {
        const { balance, bets, transactions } = get();
        const bet = bets.find((b) => b.id === betId);
        if (!bet || bet.status !== 'pending') return;

        let credit = 0;
        let resolvedPayout = 0;

        if (outcome === 'won') {
          // payout = total return (stake + profit)
          resolvedPayout = payout ?? calculatePayout(bet.stake, bet.odds);
          credit = resolvedPayout;
        } else if (outcome === 'push') {
          resolvedPayout = bet.stake;
          credit = bet.stake;
        }
        // 'lost' → credit stays 0

        const newBalance = balance + credit;
        const now = new Date().toISOString();

        const updatedBets = bets.map((b) =>
          b.id === betId
            ? { ...b, status: outcome, payout: resolvedPayout, settledAt: now }
            : b
        );

        const tx: Transaction = {
          id: generateId(),
          type: 'settlement',
          amount: credit,
          balanceAfter: newBalance,
          description:
            outcome === 'won'
              ? `Won $${resolvedPayout.toFixed(2)} on ${bet.outcomeName}`
              : outcome === 'push'
                ? `Push — $${bet.stake.toFixed(2)} returned on ${bet.outcomeName}`
                : `Lost $${bet.stake.toFixed(2)} on ${bet.outcomeName}`,
          betId,
          createdAt: now,
        };

        set({
          balance: newBalance,
          bets: updatedBets,
          transactions: [tx, ...transactions],
        });
      },

      reset: () => set({ balance: 0, bets: [], transactions: [] }),
    }),
    {
      name: 'ny-sharp-edge-bankroll',
    }
  )
);

function calculatePayout(stake: number, americanOdds: number): number {
  if (americanOdds > 0) {
    return stake + stake * (americanOdds / 100);
  }
  return stake + stake * (100 / Math.abs(americanOdds));
}

// Selector hooks
export const usePendingBets = () =>
  useBankrollStore((state) => state.bets.filter((b) => b.status === 'pending'));

export const useBankrollStats = () =>
  useBankrollStore((state) => {
    const settled = state.bets.filter((b) => b.status !== 'pending');
    const wins = settled.filter((b) => b.status === 'won').length;
    const losses = settled.filter((b) => b.status === 'lost').length;
    const totalWagered = settled.reduce((s, b) => s + b.stake, 0);
    const totalReturned = settled.reduce((s, b) => s + (b.payout ?? 0), 0);
    return {
      totalBets: settled.length,
      wins,
      losses,
      pushes: settled.filter((b) => b.status === 'push').length,
      winRate: settled.length > 0 ? (wins / settled.length) * 100 : 0,
      totalWagered,
      totalReturned,
      netProfit: totalReturned - totalWagered,
    };
  });
