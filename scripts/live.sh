#!/usr/bin/env bash
# Run the app against The Odds API using apps/api/.env.
# Requires THE_ODDS_API_KEY and USE_MOCK_DATA=false in that file.
# Does not enable Clerk/Stripe.
set -e
export REQUIRE_AUTH=false
export DEV_PLAN=pro
export VITE_DEV_PLAN=pro
# Goes through turbo + apps/api/.env. Set USE_MOCK_DATA=false there.
# For mock without burning credits, use `pnpm demo` instead.
pnpm dev
