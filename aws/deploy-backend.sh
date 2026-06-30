#!/usr/bin/env bash
# Build backend Docker image and push to ECR for App Runner / ECS.
# Usage: ./aws/deploy-backend.sh 123456789012.dkr.ecr.ap-south-1.amazonaws.com/frontseat-seeding

set -euo pipefail

ECR_REPO="${1:?ECR repository URI required (no tag)}"
TAG="${2:-latest}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

REGISTRY="${ECR_REPO%%/*}"
aws ecr get-login-password --region "${AWS_REGION:-ap-south-1}" | \
  docker login --username AWS --password-stdin "$REGISTRY"

echo "Building backend image..."
docker build -t "${ECR_REPO}:${TAG}" "$ROOT/backend"

echo "Pushing ${ECR_REPO}:${TAG}..."
docker push "${ECR_REPO}:${TAG}"

echo "Backend image pushed. Update App Runner service to use ${ECR_REPO}:${TAG}"
