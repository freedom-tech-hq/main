#!/bin/bash
set -e

DEPLOY_SCRIPTS_DIR="$(realpath "$(dirname "$0")/..")"

cd "$DEPLOY_SCRIPTS_DIR"

read -p "Enter the env name (default: local): " ENV_NAME
ENV_NAME="${ENV_NAME:-local}"

./deploy-compose.sh 3.1_mail-host "$ENV_NAME"
