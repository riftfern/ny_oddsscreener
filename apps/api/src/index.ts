import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import oddsRouter from './routes/odds.js';
import evRouter from './routes/ev.js';
import arbitrageRouter from './routes/arbitrage.js';
import billingRouter, { handleStripeWebhook } from './routes/billing.js';
import settingsRouter from './routes/settings.js';
import tennisRouter from './routes/tennis.js';
import { requirePlan } from './middleware/plan.js';
import { telegramAlertPoller } from './services/telegramAlerts.js';
import { getLastRemainingCredits } from './services/oddsApi.js';
import { getOddsPapiConfig } from './services/oddsPapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from api root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('API Key loaded:', process.env.THE_ODDS_API_KEY ? 'Yes' : 'No');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(cors());

// Stripe webhook MUST be mounted before express.json() so the raw body is available
// for signature verification.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  const remainingCredits = getLastRemainingCredits();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    mock: process.env.USE_MOCK_DATA === 'true',
    authRequired: process.env.REQUIRE_AUTH === 'true',
    telegramConfigured:
      !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
    nativeExchanges: process.env.NATIVE_EXCHANGES !== 'false',
    sharpFallback: getOddsPapiConfig().enabled ? 'oddspapi' : 'off',
    snapshots: process.env.SNAPSHOTS === 'true',
    ...(remainingCredits !== undefined ? { remainingCredits } : {}),
  });
});

// Routes
app.use('/api/odds', oddsRouter);
app.use('/api/ev', requirePlan('edge'), evRouter);
app.use('/api/arbitrage', requirePlan('pro'), arbitrageRouter);
app.use('/api/billing', billingRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/tennis', tennisRouter);

// Vite build, same origin as /api (Render: one Web Service).
const webDist = join(__dirname, '..', '..', 'web', 'dist');
const webIndex = join(webDist, 'index.html');
if (existsSync(webIndex)) {
  console.log('Serving web from', webDist);
  app.use(express.static(webDist, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(webIndex, (err) => {
      if (err) next(err);
    });
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║     scharfedge API Server                     ║
  ║     Listening on 0.0.0.0:${PORT}                 ║
  ╚═══════════════════════════════════════════════╝

  Available endpoints:
    GET /api/health     - Health check
    GET /api/odds       - Get odds (query: sport, live)
    GET /api/ev         - Get +EV opportunities (query: sport, minEV, live)
    GET /api/arbitrage  - Get arbitrage opportunities (query: sport, minProfit, live)
    GET  /api/billing/status    - Stripe configured?
    POST /api/billing/checkout  - Stripe Checkout (Edge $19 / Pro $49)
    POST /api/billing/webhook   - Stripe webhook (writes Clerk plan)
    POST /api/billing/portal    - Stripe Customer Portal

  Data: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK (no Odds API)' : 'LIVE'}
    Auth: ${process.env.REQUIRE_AUTH === 'true' ? 'on' : 'off'}
  `);

  // Start Pro alert poller after the HTTP server is listening.
  telegramAlertPoller.start();
});
