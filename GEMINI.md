# GEMINI.md

## Project Overview

This is a sportsbook odds screener and +EV betting tool for New York legal sportsbooks. It's a full-stack application built with a React frontend, a Node.js/Express backend, and a shared library for types and calculations. The project is structured as a pnpm monorepo and uses Turborepo for build orchestration.

**Frontend:**
- React 18, TypeScript, Vite
- TanStack Query for data fetching
- Zustand for state management
- Tailwind CSS for styling

**Backend:**
- Node.js, Express, TypeScript
- Serves odds data fetched from The Odds API

**Shared:**
- TypeScript types and interfaces
- Business logic for odds conversion, EV, and arbitrage calculations

## Building and Running

### Prerequisites

- Node.js >=18.0.0
- pnpm

### Installation

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Set up environment variables:**
    - Copy the example environment file for the API:
      ```bash
      cp apps/api/.env.example apps/api/.env
      ```
    - Add your API key from [The Odds API](https://the-odds-api.com) to `apps/api/.env`:
      ```
      THE_ODDS_API_KEY=your_key_here
      ```

### Key Commands

-   **Run development servers (frontend & backend):**
    ```bash
    pnpm dev
    ```
    - Frontend will be available at `http://localhost:3000`
    - Backend will be available at `http://localhost:3001`

-   **Build for production:**
    ```bash
    pnpm build
    ```

-   **Run linters:**
    ```bash
    pnpm lint
    ```
-   **Run type checking:**
    ```bash
    pnpm typecheck
    ```

-   **Clean project (removes `dist`, `node_modules`):**
    ```bash
    pnpm clean
    ```

## Development Conventions

-   **Monorepo:** The project is a monorepo managed with pnpm workspaces and Turborepo.
    -   `apps/web`: The React frontend application.
    -   `apps/api`: The Express backend application.
    -   `packages/shared`: A shared package for types, constants, and calculation utilities used by both the frontend and backend.
-   **TypeScript:** The entire codebase is written in TypeScript.
-   **State Management:** The frontend uses a combination of TanStack Query for server state and Zustand for global client state.
-   **API:** The backend is a simple Express server that provides a few API endpoints. It communicates with the frontend and fetches data from the external "The Odds API".
-   **Styling:** The frontend uses Tailwind CSS for styling.
