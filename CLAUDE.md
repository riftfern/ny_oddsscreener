# CLAUDE.md - Project Context & Guidelines

## Project: LineEdge (repo folder: ny_oddsscreener)
A high-performance sportsbook odds screener and +EV betting tool for the New York market.

## 🏗 Architecture
- **Monorepo**: Managed with Turborepo and pnpm workspaces.
- **Root**: `package.json`, `turbo.json`, `pnpm-workspace.yaml`.
- **Apps**:
  - `apps/web`: React 18 (Vite), TypeScript, Tailwind CSS, TanStack Query, Zustand.
  - `apps/api`: Node.js, Express, TypeScript. Proxies requests to "The Odds API".
- **Packages**:
  - `packages/shared`: Shared TypeScript types (`Event`, `Market`, `Odds`) and math utilities (Kelly Criterion, No-Vig).

## 🛠 Tech Stack & Conventions
- **Language**: Strict TypeScript throughout.
- **Styling**: Tailwind CSS. (Prefer `clsx` or `tailwind-merge` for class conditional logic).
- **State Management**:
  - Server State: TanStack Query (v5).
  - Client State: Zustand.
- **Data Fetching**:
  - Frontend currently mocks data client-side in `api.ts` (Legacy).
  - **Goal**: Move all data fetching to traverse the Express API (`apps/api`), enabling a switch between Mock/Live data via Backend ENV variables.

## 🚀 Key Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start both frontend (localhost:3000) and backend (localhost:3001).
- `pnpm build`: Build all apps and packages.
- `pnpm typecheck`: Run TypeScript validation across the monorepo.

## 📝 Coding Rules for Claude
1.  **Types First**: Always define or import shared types from `@ny-sharp-edge/shared` before writing logic.
2.  **Monorepo Awareness**: When modifying shared logic, remember to rebuild or check compatibility with both `web` and `api`.
3.  **Functional Components**: Use React functional components with named exports.
4.  **Error Handling**: backend routes must use try/catch blocks and return standardized JSON errors.
5.  **No "Any"**: Avoid `any` types; use proper interfaces or generics.

## 🔮 Roadmap / Current Focus
- Refactoring `apps/web` to consume `apps/api` endpoints instead of local mocks.
- Implementing UI components using a system like shadcn/ui for a sharper look.
- Adding User Authentication (Future).
