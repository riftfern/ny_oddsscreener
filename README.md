# NY Sharp Edge

A sportsbook odds screener and +EV betting tool for New York legal sportsbooks. Built with React, TypeScript, and Node.js.

## Features

- **Odds Comparison Dashboard**: Compare odds across all 9 NY legal sportsbooks
- **Real-time Data**: Live odds from The Odds API with 30-second auto-refresh
- **Best Odds Highlighting**: Instantly see which book has the best line
- **Multi-Sport Support**: NFL, NBA, NHL, MLB
- **EV Calculations**: Built-in utilities for expected value, no-vig odds, and Kelly Criterion
- **Arbitrage Detection**: Algorithms to identify risk-free betting opportunities

## NY Legal Sportsbooks

- FanDuel
- DraftKings
- BetMGM
- Caesars
- BetRivers
- Fanatics
- Bally Bet
- bet365
- theScore Bet

## Tech Stack

**Frontend**
- React 18
- TypeScript
- Vite
- TanStack Query
- Zustand
- Tailwind CSS

**Backend**
- Node.js
- Express
- TypeScript

**Monorepo**
- Turborepo
- pnpm workspaces

## Project Structure

```
ny_oddsscreener/
├── apps/
│   ├── web/                 # React frontend
│   │   └── src/
│   │       ├── components/  # UI components
│   │       ├── hooks/       # React Query hooks
│   │       ├── stores/      # Zustand stores
│   │       └── services/    # API client
│   └── api/                 # Express backend
│       └── src/
│           ├── routes/      # API endpoints
│           └── services/    # Odds API integration
├── packages/
│   └── shared/              # Shared types and calculations
│       └── src/
│           ├── types/       # TypeScript definitions
│           └── calculations/# EV, arbitrage, odds utilities
├── turbo.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/riftfern/ny_oddsscreener.git
cd ny_oddsscreener

# Install dependencies
pnpm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Add your API keys to apps/api/.env
```

### Environment Variables

```
THE_ODDS_API_KEY=your_key_here
```

Get a free API key at https://the-odds-api.com (500 requests/month on free tier).

### Development

```bash
# Start both frontend and backend
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

### API Endpoints

```
GET /api/health              # Health check
GET /api/odds?sport=<sport>  # Get odds for a sport
GET /api/ev                  # Get +EV opportunities (coming soon)
GET /api/arbitrage           # Get arbitrage opportunities (coming soon)
```

**Supported Sports:**
- `americanfootball_nfl`
- `basketball_nba`
- `baseball_mlb`
- `icehockey_nhl`

## Calculations

The shared package includes utilities for:

- **Odds Conversion**: American to decimal, implied probability
- **No-Vig Fair Odds**: Remove the vig to find true probabilities
- **Expected Value**: Calculate EV percentage and edge
- **Kelly Criterion**: Optimal stake sizing
- **Arbitrage Detection**: Find guaranteed profit opportunities

## Roadmap

- [x] Odds comparison dashboard
- [x] The Odds API integration
- [ ] +EV bet finder
- [ ] Arbitrage finder
- [ ] Kalshi/Polymarket integration
- [ ] Bet tracking
- [ ] Push notifications

## License

MIT

## Author

Jack (@riftfern)
