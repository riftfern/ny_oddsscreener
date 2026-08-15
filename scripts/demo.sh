#!/usr/bin/env bash
# Run the full app on mock data for demos / Loom recordings.
# This avoids burning The Odds API credits.
set -e
export USE_MOCK_DATA=true
export REQUIRE_AUTH=false
export DEV_PLAN=pro
export VITE_DEV_PLAN=pro
pnpm dev
