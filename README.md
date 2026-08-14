# NY Sharp Edge

A sportsbook odds screener that finds +EV lines against a sharp fair line.

- **Edge** — $19/mo: live US books, +EV vs Pinnacle, 6 sports.
- **Pro** — $49/mo: everything in Edge plus arbitrage and Kalshi/Polymarket exchange lines.

Built with React, Vite, Express, TypeScript, TanStack Query, Zustand, and Tailwind CSS.

## What it does

- Compares moneyline, spread, and total odds across US sportsbooks.
- Computes +EV opportunities against a Pinnacle no-vig fair line — not against the best soft-book line.
- Scans for arbitrage opportunities across books.
- Shows Kalshi and Polymarket lines on the Pro exchange screen.

## Run locally (mock mode)

```bash
pnpm install
USE_MOCK_DATA=true REQUIRE_AUTH=false DEV_PLAN=pro pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

## Configure Clerk and Stripe

Copy the example env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Add your keys:

```
# apps/api/.env
THE_ODDS_API_KEY=your_key_here
REQUIRE_AUTH=true
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_EDGE=price_...
STRIPE_PRICE_PRO=price_...

# apps/web/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_REQUIRE_AUTH=true
VITE_API_URL=http://localhost:3001
```

Create the Stripe products and prices in the Stripe Dashboard, then paste the price ids into the env files. The webhook endpoint is `POST /api/billing/webhook` and must receive the raw request body.

## Important notes

- 18+ only. Not gambling advice. Odds can move and lines can be pulled at any time. No guaranteed profit. Arbitrage is theoretical until both legs clear.
- The in-memory odds cache is per-process. For production, run `apps/api` as a single long-lived Node process; do not rely on serverless cold starts for caching.
- Keep `us_ex` off `ODDS_REGIONS`. Exchanges are fetched separately via `/api/odds/exchanges` so Edge users do not pay for Pro-only data.

## License

MIT
