# NY Sharp Edge 🍎📈

**A high-performance sportsbook odds screener and +EV betting tool engineered for the New York market.**

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## 🚀 Overview

**NY Sharp Edge** is a full-stack real-time odds comparison platform designed to help bettors find an edge against the house. It aggregates lines from all 9 legal New York sportsbooks, identifying **Arbitrage** (guaranteed profit) and **+EV** (positive expected value) opportunities instantly.

Built as a **Turborepo monorepo**, it demonstrates modern web development practices including strict TypeScript typing, shared logic packages, and optimistic UI updates.

## ✨ Key Features

-   **⚡ Real-Time Odds Dashboard**: Compare moneyline, spread, and total odds across FanDuel, DraftKings, BetMGM, Caesars, and more.
-   **💰 +EV Finder**: Automatically calculates "fair odds" by removing the vig (bookmaker fee) to identify mathematically profitable bets.
-   **⚖️ Arbitrage Scanner**: Detects discrepancies between books to find risk-free guaranteed profit opportunities.
-   **🎯 Best Line Highlighting**: Visual indicators for the best available odds for every outcome.
-   **📱 Responsive Design**: Fully responsive UI built with Tailwind CSS.

## 🛠️ Tech Stack

-   **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS.
-   **Backend**: Node.js, Express, TypeScript.
-   **Architecture**: Monorepo managed with **pnpm workspaces** and **Turborepo**.
-   **Data**: Integration with [The Odds API](https://the-odds-api.com).

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/riftfern/ny_oddsscreener.git
cd ny_oddsscreener
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run in Mock Mode (Recommended for Portfolio Review)

You can run the application immediately without an API key using the built-in mock data mode. This simulates real-time data updates and diverse market scenarios.

**Start the development server:**

```bash
pnpm dev
```

*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **Backend**: [http://localhost:3001](http://localhost:3001)

### 4. Run with Live Data (Optional)

To see live odds, you will need a free API key from [The Odds API](https://the-odds-api.com).

1.  Copy the environment file:
    ```bash
    cp apps/api/.env.example apps/api/.env
    ```
2.  Add your key to `apps/api/.env`:
    ```
    THE_ODDS_API_KEY=your_api_key_here
    ```
3.  Restart the server: `pnpm dev`

## 📂 Project Structure

```
ny_oddsscreener/
├── apps/
│   ├── web/                 # React frontend application
│   │   ├── src/components/  # Modular UI components
│   │   ├── src/hooks/       # Custom React Query hooks
│   │   └── src/stores/      # Zustand global state
│   └── api/                 # Node.js/Express backend
│       ├── src/routes/      # REST API endpoints
│       └── src/services/    # Business logic & API integration
├── packages/
│   └── shared/              # Shared TypeScript types & math utilities
│       ├── src/types/       # Common interfaces (Event, Market, Odds)
│       └── src/calculations/# Core math (Arbitrage, EV, Kelly Criterion)
└── turbo.json               # Build pipeline configuration
```

## 🧠 Core Calculations

The `packages/shared` library handles the heavy lifting for betting math:

*   **No-Vig Fair Odds**: Calculates the true probability of an outcome by removing the bookmaker's margin (vigorish).
*   **Kelly Criterion**: Suggests optimal stake sizes based on bankroll and edge.
*   **Implied Probability**: Converts American odds to percentage probabilities.

## 🔮 Roadmap

-   [x] Odds comparison dashboard
-   [x] Mock data simulation engine
-   [x] +EV bet finder
-   [x] Arbitrage finder
-   [ ] Historical odds tracking
-   [ ] User authentication & bankroll management
-   [ ] Push notifications for high-value arbs

## 📄 License

MIT

---

*Built by Jack (@riftfern)*