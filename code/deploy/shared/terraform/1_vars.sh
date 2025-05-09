#!/bin/bash
# Do not change in sourced scripts # set -e

# Locate the roots
if [ "$(basename "$0")" = "1_vars.sh" ]; then
  DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/../..")"
elif [ -n "$DEPLOY_ROOT_DIR" ]; then
  true # Calling in another context, but this var is already prepared
else
  echo "Error: 1_vars.sh should be sourced from either a user shell session or with DEPLOY_ROOT_DIR set"
  exit 1
fi

# Set deploy params
export DEPLOY_DEPLOYMENT="$1"
export DEPLOY_ENV_NAME="$2"

# Calculations
PROJECT_CODE_ROOT_DIR="$(realpath "$DEPLOY_ROOT_DIR/..")"

# Set deploy params
export DEPLOY_DEPLOYMENT_SECRETS_DIR="$PROJECT_CODE_ROOT_DIR/secrets/$DEPLOY_ENV_NAME/$DEPLOY_DEPLOYMENT"
export DEPLOY_TF_VARS_FILE="$DEPLOY_DEPLOYMENT_SECRETS_DIR/vars.tfvars"
export DEPLOY_TF_STATE_FILE="$DEPLOY_DEPLOYMENT_SECRETS_DIR/terraform.tfstate"
export TF_CLI_ARGS="-var-file='$DEPLOY_TF_VARS_FILE' -state='$DEPLOY_TF_STATE_FILE'"

# Check vars file
if [ ! -f "$DEPLOY_TF_VARS_FILE" ]; then
  echo "Error: $DEPLOY_TF_VARS_FILE does not exist"
  exit 1
fi

# Set current dir
cd "$DEPLOY_ROOT_DIR/$DEPLOY_DEPLOYMENT" || exit 1

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
  echo "Initializing Terraform..."
  terraform init
fi
