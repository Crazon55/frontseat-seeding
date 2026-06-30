#!/usr/bin/env bash
# Build and deploy frontend static assets to S3 + invalidate CloudFront.
# Usage: ./aws/deploy-frontend.sh my-bucket-id E1234567890ABC

set -euo pipefail

BUCKET="${1:?S3 bucket name required}"
DISTRIBUTION_ID="${2:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

echo "Installing dependencies..."
npm ci

echo "Building production bundle..."
npm run build

echo "Syncing to s3://${BUCKET}..."
aws s3 sync build/ "s3://${BUCKET}/" --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.html"

aws s3 sync build/ "s3://${BUCKET}/" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --exclude "*" \
  --include "*.html"

if [[ -n "$DISTRIBUTION_ID" ]]; then
  echo "Invalidating CloudFront ${DISTRIBUTION_ID}..."
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
fi

echo "Frontend deploy complete."
