#!/bin/bash
set -e

DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/..")"

cd "$DEPLOY_ROOT_DIR"

# UI
read -p "Enter the env name (default: local): " ENV_NAME
ENV_NAME="${ENV_NAME:-local}"

# Unified script
./deploy-compose.sh 3.1_mail-host.compose "$ENV_NAME"

# Create and push git tag for dev and prod environments
if [ "$ENV_NAME" = "dev" ] || [ "$ENV_NAME" = "prod" ]; then
  # Format: release/env/YYYY-MM-DD_HH.mm (UTC)
  TIMESTAMP=$(date -u +"%Y-%m-%d_%H.%M")
  TAG_NAME="release/${ENV_NAME}/${TIMESTAMP}"

  echo "Creating git tag: $TAG_NAME"
  git tag "$TAG_NAME"
  for REMOTE in $(git remote); do
    git push "$REMOTE" "$TAG_NAME"
  done
fi
