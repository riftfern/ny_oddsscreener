import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import oddsRouter from './routes/odds.js';
import evRouter from './routes/ev.js';
import arbitrageRouter from './routes/arbitrage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from api root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('API Key loaded:', process.env.THE_ODDS_API_KEY ? 'Yes' : 'No');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
    GET /api/odds       - Get odds (query: sport)
    GET /api/ev         - Get +EV opportunities (query: sport, minEV)
    GET /api/arbitrage  - Get arbitrage opportunities (query: sport, minProfit)
  `);
});
