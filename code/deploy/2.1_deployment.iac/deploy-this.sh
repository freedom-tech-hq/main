#!/bin/bash
set -e

DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/..")"

# UI
read -p "Enter the env name: " DEPLOY_ENV_NAME

# Unified setup
source "$DEPLOY_ROOT_DIR/shared/terraform/1_vars.sh" 2.1_deployment.iac "$DEPLOY_ENV_NAME"

# Apply Terraform configuration
echo "Deploying infrastructure to $DEPLOY_ENV_NAME environment..."
terraform apply
