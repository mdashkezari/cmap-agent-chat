#!/usr/bin/env bash
set -euo pipefail

# Production build helper
# Usage: ./scripts/build.sh

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js + npm first."
  exit 1
fi

npm ci
npm run build
