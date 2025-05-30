#!/bin/bash
set -e

DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/..")"

# UI
read -p "Enter the env name: " DEPLOY_ENV_NAME

# Unified setup
source "$DEPLOY_ROOT_DIR/shared/terraform/1_vars.sh" 1.1_account.iac "$DEPLOY_ENV_NAME"

# Destroy Terraform deployment
echo "Tearing down infrastructure in $DEPLOY_ENV_NAME environment..."
terraform destroy
