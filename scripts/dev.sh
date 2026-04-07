#!/usr/bin/env bash
set -euo pipefail

# Local dev helper
# Usage: ./scripts/dev.sh

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js + npm first."
  exit 1
fi

npm install
npm run dev
