#!/bin/bash
# Do not change in sourced scripts # set -e

# Locate the roots
if [ "$(basename "$0")" = "deploy-compose.sh" ]; then
  DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")")"
elif [ "$(basename "$0")" = "1_vars.sh" ]; then
  DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/../..")"
elif [ -n "$DEPLOY_ROOT_DIR" ]; then
  true # Calling in another context, but this var is already prepared
else
  echo "Error: 1_vars.sh should be sourced from either deploy-compose.sh or a user shell session"
  exit 1
fi

# Check if deployment name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <deployment-name> [env-name]"
  echo " E.g. $0 3.1_mail-host.compose local"
  exit 1
fi

# Calculations
DEPLOY_STEPS_DIR="$DEPLOY_ROOT_DIR/shared/compose"
PROJECT_CODE_ROOT_DIR="$(realpath "$DEPLOY_ROOT_DIR/..")"
DEPLOY_DOCKER_CONTEXT="$(docker context show)"

# Set deploy params
export DEPLOY_DEPLOYMENT="$1"
export DEPLOY_ENV_NAME="${2:-local}"

export PROJECT_CODE_ROOT_DIR
export DEPLOY_DEPLOYMENT_DIR="$DEPLOY_ROOT_DIR/$DEPLOY_DEPLOYMENT"
export DEPLOY_DEPLOYMENT_SECRETS_DIR="$PROJECT_CODE_ROOT_DIR/secrets/$DEPLOY_ENV_NAME/$DEPLOY_DEPLOYMENT"
export DEPLOY_WORKSPACE_DIR="$DEPLOY_ROOT_DIR/workspace"

export DEPLOY_ROOT_DIR
export DEPLOY_STEPS_DIR

export DEPLOY_DOCKER_CONTEXT

# Apply environment file
DEPLOY_ENV_FILE="$DEPLOY_DEPLOYMENT_SECRETS_DIR/deploy.env"
if [ -f "$DEPLOY_ENV_FILE" ]; then
  echo "Applying environment file: $DEPLOY_ENV_FILE"
  set -o allexport
  source "$DEPLOY_ENV_FILE"
  set +o allexport
else
  # For non-local environments, the env file is required
  if [ "$DEPLOY_ENV_NAME" != "local" ]; then
    echo "Error: Environment file $DEPLOY_ENV_FILE does not exist"
    exit 1
  fi
fi

echo "OK: Ready to deploy $DEPLOY_DEPLOYMENT as $DEPLOY_ENV_NAME to $DEPLOY_DOCKER_CONTEXT via $DEPLOY_WORKSPACE_DIR"
