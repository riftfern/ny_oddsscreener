# LineEdge API

Express API for the LineEdge odds screener. Serves the Vite React frontend and
fetches/transforms data from The Odds API.

## Running

```bash
pnpm install
pnpm --filter @ny-sharp-edge/api dev
```

The server loads `apps/api/.env`. Copy `.env.example` and add your key.

## Credit math (The Odds API)

The Odds API charges **one credit unit per sport per region per call**.

- Default Edge poll (`/api/odds`, `/api/ev`, `/api/arbitrage`):
  `us,us2,eu` = **3 region-units** per sport per cache TTL.
- Exchanges poll (`/api/odds/exchanges`):
  `us_ex` = **1 additional region-unit** per sport per cache TTL, only when the
  Exchanges page or Pro cross-EV view is open.

Cache TTL defaults to 45 seconds (`ODDS_CACHE_TTL_MS`). EV and arb re-scan every
sport but hit the same in-memory cache, so a single user browsing all screens
does not multiply live calls.

`us_ex` is intentionally NOT included in `ODDS_REGIONS`. Do not add it there;
that would charge every Edge user for Kalshi/Polymarket data.

## Cross-venue +EV

`findCrossVenueEVOpportunities` joins default-region events with `us_ex` events
using the exact `event.id` returned by The Odds API. It computes:

- `source: 'pinnacle'` — Pinnacle no-vig is the fair line; an exchange price
  (Kalshi/Polymarket) beats it.
- `source: 'exchange'` — exchange no-vig mid is the fair line; a soft book beats it.

This is gated on event ids matching across regions. If a live probe shows ids do
not match, Exchanges ships as a parallel screen only and cross-venue EV stays
parked until a native Kalshi/Polymarket adapter is built (Phase 5).

## Endpoints

- `GET /api/health` — health check
- `GET /api/odds?sport=<key>` — Edge odds (US books + Pinnacle fair line)
- `GET /api/odds/exchanges?sport=<key>` — Kalshi / Polymarket lines
- `GET /api/ev?sport=<key>&minEV=<n>` — +EV opportunities vs Pinnacle
- `GET /api/arbitrage?sport=<key>&minProfit=<n>&totalStake=<n>` — arbitrage

## Deployment note

The in-memory cache is per-process. It works for a single long-lived Node box
(Fly.io, Railway, VPS) and does not work on Vercel serverless cold starts. Keep
`apps/api` on a long-lived host; use Vercel only for the frontend until Grok
says otherwise.
