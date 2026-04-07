#!/usr/bin/env bash
set -euo pipefail

# Installs dependencies with common "hang" culprits disabled.
# Also prints registry info to help debug proxy/registry issues.

echo "Node: $(node -v)"
echo "npm : $(npm -v)"
echo "registry: $(npm config get registry)"

npm install --no-audit --no-fund --progress=false
