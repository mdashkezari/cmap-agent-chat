#!/usr/bin/env bash
set -euo pipefail

# release.sh
# Day-to-day build + deploy for CMAP Chat frontend (S3 + CloudFront).
#
# Default targets (can be overridden by env or flags):
#   BUCKET: cmap-chat-438898709554-prod
#   DIST_ID: E3NUIEC7JZLOFO
#
# Usage:
#   ./scripts/release.sh
#   ./scripts/release.sh --bucket <bucket> --dist <distribution_id>
#   ./scripts/release.sh --install        # run npm ci/npm install before build
#
# Env overrides:
#   CMAP_CHAT_BUCKET
#   CMAP_CHAT_DIST_ID

BUCKET_DEFAULT="cmap-chat-438898709554-prod"
DIST_DEFAULT="E3NUIEC7JZLOFO"

INSTALL_DEPS=0
BUCKET="${CMAP_CHAT_BUCKET:-$BUCKET_DEFAULT}"
DIST_ID="${CMAP_CHAT_DIST_ID:-$DIST_DEFAULT}"

usage() {
  cat <<EOF
Usage: ./scripts/release.sh [options]

Options:
  --bucket <name>    S3 bucket name (default: ${BUCKET_DEFAULT})
  --dist <id>        CloudFront distribution id (default: ${DIST_DEFAULT})
  --install          Install deps before build (npm ci if lockfile exists)
  -h, --help         Show help

Environment variables:
  CMAP_CHAT_BUCKET   Override bucket
  CMAP_CHAT_DIST_ID  Override distribution id

Examples:
  ./scripts/release.sh
  ./scripts/release.sh --install
  ./scripts/release.sh --bucket my-bucket --dist E123456ABCDEF
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)
      BUCKET="${2:-}"; shift 2 ;;
    --dist)
      DIST_ID="${2:-}"; shift 2 ;;
    --install)
      INSTALL_DEPS=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [[ -z "${BUCKET}" || -z "${DIST_ID}" ]]; then
  echo "ERROR: bucket and dist id are required." >&2
  usage
  exit 2
fi

# Move to repo root regardless of where the script is called from.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js/npm first." >&2
  exit 1
fi
if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: aws cli not found. Install and configure AWS CLI first." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found. It's required for release metadata/version checks." >&2
  exit 1
fi

echo "== CMAP Chat release =="
echo "Repo:   ${ROOT_DIR}"
echo "Bucket: ${BUCKET}"
echo "Dist:   ${DIST_ID}"

echo ""
echo "== Version check (package.json must be bumped before deploy) =="
VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo 0.0.0)"

# Fetch the currently deployed build-info.json from S3 (bucket is private; AWS creds required).
LIVE_INFO_JSON="$(aws s3 cp "s3://${BUCKET}/build-info.json" - 2>/dev/null || true)"
if [[ -n "${LIVE_INFO_JSON}" ]]; then
  LIVE_VERSION="$(python3 -c "import json,sys
try:
  obj=json.load(sys.stdin)
  print(obj.get('version',''))
except Exception:
  print('')" <<<"${LIVE_INFO_JSON}")"

  if [[ -n "${LIVE_VERSION}" && "${LIVE_VERSION}" == "${VERSION}" ]]; then
    echo "ERROR: Refusing to deploy because package.json version (${VERSION}) matches the currently deployed version (${LIVE_VERSION})." >&2
    echo "" >&2
    echo "Bump the version, then re-run release:" >&2
    echo "  npm version patch   # x.y.z -> x.y.(z+1)" >&2
    echo "  npm version minor   # x.y.z -> x.(y+1).0" >&2
    echo "  npm version major   # x.y.z -> (x+1).0.0" >&2
    echo "  ./scripts/release.sh" >&2
    exit 1
  fi
else
  echo "No existing build-info.json found in s3://${BUCKET}/build-info.json; proceeding (first deploy or file missing)."
fi

if [[ "${INSTALL_DEPS}" == "1" ]]; then
  echo ""
  echo "== Installing dependencies =="
  if [[ -f package-lock.json ]]; then
    npm ci --no-audit --no-fund
  else
    npm install --no-audit --no-fund
  fi
fi

echo ""
echo "== Building (npm run build) =="
npm run build

if [[ ! -d "dist" ]]; then
  echo "ERROR: build did not produce ./dist" >&2
  exit 1
fi

echo ""
echo "== Writing build metadata =="
# We publish build metadata as a static file so we can verify what's live.
#   - /build-info.json (machine-readable; includes a version_text field)

GIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
BUILD_NUM="${CMAP_CHAT_BUILD_NUM:-${BUILD_NUM:-$(date -u +"%Y%m%d%H%M%S")}}"

# API endpoints (these are stable for prod deployments).
API_URL="https://agent.simonscmap.ai"
API_DOCS_URL="https://agent.simonscmap.ai/docs"

VERSION_TEXT="${VERSION}+${BUILD_NUM} (${GIT_SHA}) ${BUILD_TIME}"

cat > dist/build-info.json <<EOF
{
  "version": "${VERSION}",
  "build": "${BUILD_NUM}",
  "git_sha": "${GIT_SHA}",
  "build_time": "${BUILD_TIME}",
  "version_text": "${VERSION_TEXT}",
  "api_url": "${API_URL}",
  "api_docs_url": "${API_DOCS_URL}"
}
EOF

echo "Wrote dist/build-info.json"

echo ""
echo "== Deploying to S3 + invalidating CloudFront =="
./scripts/deploy_s3_cloudfront.sh "${BUCKET}" "${DIST_ID}"

echo ""
echo "== Done =="
echo "Frontend: https://simonscmap.ai"
echo "Chat redirect: https://chat.simonscmap.ai -> https://simonscmap.ai"
echo ""
echo "Quick verify:"
echo "  curl -I https://simonscmap.ai/"
echo "  curl -I https://chat.simonscmap.ai/"
echo "  curl -s https://simonscmap.ai/build-info.json"
