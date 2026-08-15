#!/usr/bin/env bash
# Run the app against The Odds API using apps/api/.env.
# Requires THE_ODDS_API_KEY and USE_MOCK_DATA=false in that file.
# Does not enable Clerk/Stripe.
set -e
export REQUIRE_AUTH=false
export DEV_PLAN=pro
export VITE_DEV_PLAN=pro
# dotenv in the API process still wins for USE_MOCK_DATA / THE_ODDS_API_KEY.
pnpm dev
