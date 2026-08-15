import { fetchEVResponse, fetchArbitrageResponse } from './oddsApi.js';
import { getVenue, type EVOpportunity, type ArbitrageOpportunity } from '@ny-sharp-edge/shared';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

function getConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return null;
  return { botToken, chatId };
}

function defaultIntervalMs(): number {
  const raw = Number(process.env.ODDS_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 45_000;
}

export class TelegramAlertPoller {
  private timer: NodeJS.Timeout | null = null;
  private readonly seenEV = new Set<string>();
  private readonly seenArb = new Set<string>();
  private started = false;

  start(): void {
    if (this.started) return;

    if (process.env.USE_MOCK_DATA === 'true') {
      console.log('[telegram] Mock mode: alerts disabled so fake lines are not sent.');
      return;
    }

    const config = getConfig();
    if (!config) {
      console.log('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing: alerts disabled.');
      return;
    }

    this.started = true;
    console.log(`[telegram] Alert poller started (${defaultIntervalMs()}ms interval).`);

    // Run immediately, then on interval.
    this.tick(config).catch((err) => console.error('[telegram] initial tick failed:', err));
    this.timer = setInterval(() => {
      this.tick(config).catch((err) => console.error('[telegram] tick failed:', err));
    }, defaultIntervalMs());

    // Prevent the timer from keeping the process alive in tests.
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.started = false;
  }

  private async tick(config: TelegramConfig): Promise<void> {
    try {
      // Use the same cached fetch path as the screens so the poller does not add
      // live credit burn beyond the existing cache.
      const [evResponse, arbResponse] = await Promise.all([
        fetchEVResponse({ sport: 'all', minEV: 2 }),
        fetchArbitrageResponse({ sport: 'all', minProfit: 0.5, totalStake: 100 }),
      ]);

      const newEV = evResponse.opportunities.filter((opp) => {
        const key = evKey(opp);
        if (this.seenEV.has(key)) return false;
        this.seenEV.add(key);
        return true;
      });

      const newArb = arbResponse.opportunities.filter((opp) => {
        const key = arbKey(opp);
        if (this.seenArb.has(key)) return false;
        this.seenArb.add(key);
        return true;
      });

      for (const opp of newEV) {
        await sendTelegramMessage(config, formatEV(opp));
      }

      for (const opp of newArb) {
        await sendTelegramMessage(config, formatArb(opp));
      }
    } catch (err) {
      console.error('[telegram] tick error:', err);
    }
  }
}

function evKey(opp: EVOpportunity): string {
  return `${opp.eventId}|${opp.marketType}|${opp.outcomeName}|${opp.bookId}`;
}

function arbKey(opp: ArbitrageOpportunity): string {
  const books = opp.legs.map((leg) => leg.bookId).sort();
  return `${opp.eventId}|${opp.marketType}|${books.join('|')}`;
}

function formatEV(opp: EVOpportunity): string {
  const book = getVenue(opp.bookId);
  const teams = `${opp.event.awayTeam} @ ${opp.event.homeTeam}`;
  const kelly = opp.kellySuggestion ? ` | 1/4 Kelly $${opp.kellySuggestion.toFixed(0)}` : '';
  const deepLink = book.deepLink ? ` | ${book.deepLink}` : '';
  return `+EV ${opp.evPercentage.toFixed(1)}%\n${teams} (${opp.event.sportKey})\n${opp.outcomeName} ${opp.bookOdds > 0 ? '+' : ''}${opp.bookOdds} @ ${book.name}\nFair ${opp.fairOdds > 0 ? '+' : ''}${opp.fairOdds}${kelly}${deepLink}`;
}

function formatArb(opp: ArbitrageOpportunity): string {
  const teams = `${opp.event.awayTeam} @ ${opp.event.homeTeam}`;
  const legs = opp.legs
    .map((leg) => {
      const book = getVenue(leg.bookId);
      return `${leg.outcomeName} ${leg.odds > 0 ? '+' : ''}${leg.odds} @ ${book.name} ($${leg.suggestedStake.toFixed(0)})`;
    })
    .join('\n');
  return `ARB ${opp.profitPercentage.toFixed(2)}%\n${teams} (${opp.event.sportKey})\n${legs}\nBoth legs must clear; last price wins.`;
}

async function sendTelegramMessage(config: TelegramConfig, text: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`[telegram] send failed ${response.status}: ${body}`);
      return;
    }

    console.log('[telegram] sent alert');
  } catch (err) {
    console.error('[telegram] send error:', err);
  }
}

// Singleton for the process.
export const telegramAlertPoller = new TelegramAlertPoller();
