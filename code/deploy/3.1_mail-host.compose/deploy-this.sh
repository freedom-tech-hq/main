#!/bin/bash
set -e

DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/..")"

cd "$DEPLOY_ROOT_DIR"

# UI
read -p "Enter the env name (default: local): " ENV_NAME
ENV_NAME="${ENV_NAME:-local}"

# Unified script
./deploy-compose.sh 3.1_mail-host.compose "$ENV_NAME"
