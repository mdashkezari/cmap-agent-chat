#!/usr/bin/env bash
set -euo pipefail

# Deploy dist/ to an existing S3+CloudFront setup.
#
# Requirements:
# - AWS CLI configured
# - A CloudFront distribution (DIST_ID) pointing to our bucket
# - S3 bucket name (BUCKET)
#
# Usage:
#   ./scripts/deploy_s3_cloudfront.sh <BUCKET> <DIST_ID>
#
# Example:
#   ./scripts/deploy_s3_cloudfront.sh simonscmap-ai-frontend E123ABC456DEF

BUCKET="${1:-}"
DIST_ID="${2:-}"

if [[ -z "$BUCKET" || -z "$DIST_ID" ]]; then
  echo "Usage: $0 <S3_BUCKET_NAME> <CLOUDFRONT_DISTRIBUTION_ID>"
  exit 1
fi

if [[ ! -d "dist" ]]; then
  echo "dist/ not found. Run: npm run build"
  exit 1
fi

echo "Syncing dist/ to s3://$BUCKET ..."
aws s3 sync dist "s3://$BUCKET" --delete

# Ensure entrypoints and version files are always fresh.
# Vite emits hashed assets; index.html and build-info should not be cached aggressively.
NO_CACHE="no-cache, no-store, must-revalidate"

if [[ -f "dist/index.html" ]]; then
  aws s3 cp "dist/index.html" "s3://$BUCKET/index.html" \
    --cache-control "$NO_CACHE" \
    --content-type "text/html"
fi

if [[ -f "dist/build-info.json" ]]; then
  aws s3 cp "dist/build-info.json" "s3://$BUCKET/build-info.json" \
    --cache-control "$NO_CACHE" \
    --content-type "application/json"
fi


echo "Creating CloudFront invalidation ..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo "Done."
