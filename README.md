# scharfedge

A NY-first sportsbook odds screener at [scharfedge.com](https://scharfedge.com). Your books only. Quiet +EV against a Pinnacle fair line.

Support: [support@scharfedge.com](mailto:support@scharfedge.com) · [Terms](https://scharfedge.com/terms) · [Privacy](https://scharfedge.com/privacy)

- **Free** — 15-minute delayed US odds (funnel).
- **Edge** — $19/mo: live books at *your* shops, quiet +EV vs Pinnacle, 6 sports.
- **Pro** — $49/mo: everything in Edge plus ticket ideas and Kalshi/Polymarket.

Built with React, Vite, Express, TypeScript, TanStack Query, Zustand, and Tailwind CSS.

## What it does

- Compares moneyline, spread, and total odds at the shops you actually have (NY / NJ / PA as a shortcut).
- Computes a quiet +EV feed against a Pinnacle no-vig fair line — not against the best soft-book line. Likely-stale 20%+ numbers stay hidden.
- Scans for arbitrage opportunities across books.
- Shows Kalshi and Polymarket lines on the Pro exchange screen, matched to sportsbook events by team names (manual map table when a title is ambiguous).
- Pro +EV can include cross-venue edges (book vs exchange) when the same event matches.

## Run locally (mock mode)

```bash
pnpm install
pnpm demo
```

- Web: http://localhost:3000
- API: http://localhost:3001

`pnpm demo` starts API + web directly with `USE_MOCK_DATA=true`. It does not go through `turbo run dev`, so a live `apps/api/.env` cannot flip you back onto The Odds API.

## Run against The Odds API (live)

Put your key in `apps/api/.env` and set `USE_MOCK_DATA=false`. Then:

```bash
pnpm live
```

Auth stays off on this laptop (`REQUIRE_AUTH=false`, `DEV_PLAN=pro`) so the phone board keeps working. Production must flip both auth flags (see below).

Credit math: each sport refresh costs one unit per region. Default Edge poll is `us,us2,eu` = **3 units** per sport per 45s cache TTL. Do not add `us_ex` to `ODDS_REGIONS`. The `/sports` catalog is cheap; `/odds` is what burns the key.

Pinnacle lives in region `eu`. It is present on MLB and some NFL events right now. NBA can return games with **no Pinnacle line** (offseason / no market). +EV skips a market when there is no sharp book.

## Record a demo

```bash
pnpm demo
```

This forces mock data so you can record a Loom without burning credits. Open `/`, `/app`, `/app/ev`, `/app/tickets`, `/app/exchanges`, `/legal`, `/terms`, and `/privacy`.

## Charge and cut off (Clerk + Stripe)

Clerk is already wired (app `app_3HxkCgsPpRHZBlZbSYyN0nsIneS`). Refresh keys with:

```bash
clerk env pull --app app_3HxkCgsPpRHZBlZbSYyN0nsIneS --file .env.local
```

The app does **not** use Clerk Billing's `<PricingTable />`. It uses Stripe Checkout + a webhook that writes `publicMetadata.plan` on the Clerk user (`free` | `edge` | `pro`).

**Code (already in the repo)**

- Landing **Start with Edge — $19/mo** when Stripe is configured; otherwise **Open the board** (laptop beta).
- Checkout requires a signed-in Clerk user, then Stripe Checkout for Edge `$19` or Pro `$49`.
- `checkout.session.completed` writes `plan` + `stripeCustomerId` on the Clerk user.
- `customer.subscription.updated` / `deleted`: `canceled` / `unpaid` / `incomplete_expired` / `paused` → `free`. `active` / `trialing` / `past_due` keep Edge or Pro (`past_due` is Stripe's retry window).
- `/app/ev` is gated at Edge. With `REQUIRE_AUTH=true`, unsigned requests are `free` (15-minute delayed odds, no live +EV).
- Success URL `/app?checkout=success` reloads the Clerk user until `plan` is `edge` or `pro`.
- Settings → **Manage billing** opens the Stripe Customer Portal.

**You do in Stripe + hosting (cannot be done from this laptop)**

1. Stripe Dashboard → Product catalog
   - **ScharfEdge Edge** — recurring **$19 / month**. Copy `price_...` → `STRIPE_PRICE_EDGE`
   - **ScharfEdge Pro** — recurring **$49 / month**. Copy `price_...` → `STRIPE_PRICE_PRO`
2. Developers → API keys → `STRIPE_SECRET_KEY` (`sk_test_...` first, `sk_live_...` for the real-card gate).
3. Developers → Webhooks → endpoint `https://YOUR_PUBLIC_API/api/billing/webhook`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.  
   Copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`.  
   Stripe cannot hit `localhost`. For a laptop test: `stripe listen --forward-to localhost:3001/api/billing/webhook`.
4. Settings → Billing → Customer portal → turn it on (or **Manage billing** 500s).  
   Point TOS / privacy at `https://scharfedge.com/terms` and `https://scharfedge.com/privacy` once the domain is live.
5. Paste into `apps/api/.env` and restart the API:

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_EDGE=price_...
STRIPE_PRICE_PRO=price_...
FRONTEND_URL=http://localhost:3000
# production: FRONTEND_URL=https://scharfedge.com
```

6. **Production only** (do not flip this on the LAN phone board):

```
# apps/api/.env
REQUIRE_AUTH=true

# apps/web/.env
VITE_REQUIRE_AUTH=true
```

Host `apps/api` as a **long-lived Node process**. `vercel.json` is the static web SPA; it is not a live odds or webhook host.

**Gate to prove it works**

1. Sign in → Start with Edge → pay (test card `4242…` in test mode, then a real card in live mode).
2. Land in `/app` with the header chip **edge**. Edges (`/app/ev`) loads.
3. Settings → Manage billing → cancel. After Stripe sends `subscription.deleted` / `canceled`, Clerk `plan` is `free`.
4. Sign out. With `REQUIRE_AUTH=true` you cannot see live +EV (landing is marketing / delayed preview; `/app/ev` is 402 / upgrade).

Do **not** set `REQUIRE_AUTH=true` on this laptop if you still want the unsigned phone board.

## Legal URLs (for Stripe + Clerk)

Once `scharfedge.com` is serving the web app:

- Terms: `https://scharfedge.com/terms`
- Privacy: `https://scharfedge.com/privacy`
- Support: `https://scharfedge.com/legal` and `support@scharfedge.com`

Create the `support@` mailbox in Google Workspace. Add `https://scharfedge.com` to Clerk allowed origins / redirect URLs.

## Important notes

- 18+ only. Not gambling advice. Odds can move and lines can be pulled at any time. No guaranteed profit. Arbitrage is theoretical until both legs clear.
- The in-memory odds cache is per-process. For production, run `apps/api` as a single long-lived Node process; do not rely on serverless cold starts for caching.
- Keep `us_ex` off `ODDS_REGIONS`. Exchanges are fetched separately via `/api/odds/exchanges` so Edge users do not pay for Pro-only data.

## License

MIT
