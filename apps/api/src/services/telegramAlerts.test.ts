import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelegramAlertPoller } from './telegramAlerts.js';
import * as oddsApi from './oddsApi.js';

describe('TelegramAlertPoller', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token';
    process.env.TELEGRAM_CHAT_ID = 'chat-id';
    process.env.USE_MOCK_DATA = 'false';
    process.env.ODDS_CACHE_TTL_MS = '45000';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200 } as unknown as Response)
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not send the same EV opportunity twice', async () => {
    const opp = {
      eventId: 'evt-1',
      event: {
        id: 'evt-1',
        sportKey: 'basketball_nba' as const,
        homeTeam: 'Knicks',
        awayTeam: 'Lakers',
        commenceTime: '2026-08-15T00:00:00Z',
        markets: [],
      },
      marketType: 'h2h' as const,
      outcomeName: 'Lakers',
      bookId: 'fanduel',
      bookOdds: 120,
      fairOdds: 100,
      fairProbability: 0.5,
      evPercentage: 3.5,
      edge: 0.035,
      kellySuggestion: 12,
    };

    vi.spyOn(oddsApi, 'fetchEVResponse').mockResolvedValue({
      opportunities: [opp],
      count: 1,
      scannedEvents: 1,
      minEV: 2,
      lastUpdated: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    });

    vi.spyOn(oddsApi, 'fetchArbitrageResponse').mockResolvedValue({
      opportunities: [],
      count: 0,
      scannedEvents: 1,
      minProfit: 0.5,
      totalStake: 100,
      lastUpdated: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    });

    const poller = new TelegramAlertPoller();
    await (poller as unknown as { tick(config: { botToken: string; chatId: string }): Promise<void> }).tick({ botToken: 'bot-token', chatId: 'chat-id' });
    await (poller as unknown as { tick(config: { botToken: string; chatId: string }): Promise<void> }).tick({ botToken: 'bot-token', chatId: 'chat-id' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    poller.stop();
  });

  it('is a no-op when Telegram credentials are missing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';
    process.env.TELEGRAM_CHAT_ID = '';

    const poller = new TelegramAlertPoller();
    poller.start();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    poller.stop();
  });

  it('does not start in mock mode', async () => {
    process.env.USE_MOCK_DATA = 'true';

    const poller = new TelegramAlertPoller();
    poller.start();

    expect(globalThis.fetch).not.toHaveBeenCalled();
    poller.stop();
  });
});
