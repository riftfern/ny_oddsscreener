import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import oddsRouter from './routes/odds.js';
import evRouter from './routes/ev.js';
import arbitrageRouter from './routes/arbitrage.js';
import billingRouter from './routes/billing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from api root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('API Key loaded:', process.env.THE_ODDS_API_KEY ? 'Yes' : 'No');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Stripe webhook MUST be mounted before express.json() so the raw body is available
// for signature verification.
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRouter);

app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// Routes
app.use('/api/odds', oddsRouter);
app.use('/api/ev', evRouter);
app.use('/api/arbitrage', arbitrageRouter);
app.use('/api/billing', billingRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║     NY Sharp Edge API Server                  ║
  ║     Running on http://localhost:${PORT}          ║
  ╚═══════════════════════════════════════════════╝

  Available endpoints:
    GET /api/health     - Health check
    GET /api/odds       - Get odds (query: sport, live)
    GET /api/ev         - Get +EV opportunities (query: sport, minEV, live)
    GET /api/arbitrage  - Get arbitrage opportunities (query: sport, minProfit, live)
    POST /api/billing/checkout  - Stripe Checkout
    POST /api/billing/webhook   - Stripe webhook
    POST /api/billing/portal    - Stripe Customer Portal

  Note: Using mock data by default. Add ?live=true for real API data.
  `);
});
