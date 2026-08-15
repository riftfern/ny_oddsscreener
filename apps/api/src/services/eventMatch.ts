import type { Event } from '@ny-sharp-edge/shared';

/**
 * Manual overrides: sportsbook event.id → native market id.
 * Prefer this over heuristics when a title is ambiguous.
 */
export const MANUAL_EVENT_MAP: Record<string, string> = {
  // e.g. 'evt-odds-api-id': 'pm:12345',
};

const STOP = new Set([
  'the', 'and', 'vs', 'at', 'fc', 'sc', 'afc', 'club', 'will', 'win', 'beat',
  'over', 'under', 'game', 'match', 'winner', 'yes', 'no',
]);

export function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function teamNickname(team: string): string {
  const tokens = normalizeTitle(team)
    .split(' ')
    .filter((t) => t.length > 2 && !STOP.has(t));
  return tokens[tokens.length - 1] ?? '';
}

export function titleMentionsTeam(title: string, team: string): boolean {
  const nick = teamNickname(team);
  if (!nick) return false;
  return normalizeTitle(title).includes(nick);
}

export function titlesMatchEvent(title: string, event: Event): boolean {
  return titleMentionsTeam(title, event.homeTeam) && titleMentionsTeam(title, event.awayTeam);
}

export function findMatchingEvent(title: string, events: Event[], nativeId?: string): Event | undefined {
  if (nativeId) {
    const mapped = events.find((event) => MANUAL_EVENT_MAP[event.id] === nativeId);
    if (mapped) return mapped;
  }
  return events.find((event) => titlesMatchEvent(title, event));
}

export interface NativeMarket {
  venue: 'kalshi' | 'polymarket';
  id: string;
  title: string;
  yesName: string;
  noName: string;
  yesAmerican: number;
  noAmerican: number;
  commenceTime?: string;
}

function outcomeNameForSide(event: Event, label: string): string | undefined {
  const normalized = normalizeTitle(label);
  if (titleMentionsTeam(label, event.awayTeam) || normalized.includes(teamNickname(event.awayTeam))) {
    return event.awayTeam;
  }
  if (titleMentionsTeam(label, event.homeTeam) || normalized.includes(teamNickname(event.homeTeam))) {
    return event.homeTeam;
  }
  return undefined;
}

/**
 * Attach a native Yes/No market onto a sportsbook event's h2h outcomes.
 * Yes maps to the team mentioned in yesName (or the title); the other side gets No.
 */
export function attachNativeMarket(event: Event, market: NativeMarket, now: string): Event {
  const yesTeam = outcomeNameForSide(event, market.yesName) ?? outcomeNameForSide(event, market.title);
  const noTeam = yesTeam === event.awayTeam ? event.homeTeam : event.awayTeam;

  return {
    ...event,
    markets: event.markets.map((mkt) => {
      if (mkt.type !== 'h2h') return mkt;
      return {
        ...mkt,
        outcomes: mkt.outcomes.map((outcome) => {
          const american =
            outcome.name === yesTeam
              ? market.yesAmerican
              : outcome.name === noTeam
                ? market.noAmerican
                : undefined;
          if (american === undefined) return outcome;
          if (outcome.bookOdds.some((bo) => bo.bookId === market.venue)) return outcome;
          return {
            ...outcome,
            bookOdds: [
              ...outcome.bookOdds,
              { bookId: market.venue, odds: american, updatedAt: now },
            ],
          };
        }),
      };
    }),
  };
}
