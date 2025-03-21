#!/bin/bash
# Do not change in sourced scripts # set -e

# Locate the roots
if [ "$(basename "$0")" = "deploy.sh" ]; then
  DEPLOY_SCRIPTS_DIR="${DEPLOY_SCRIPTS_DIR:-"$(realpath "$(dirname "$0")/..")"}"
elif [ "$(basename "$0")" = "1_vars.sh" ]; then
  DEPLOY_SCRIPTS_DIR="${DEPLOY_SCRIPTS_DIR:-"$(realpath "$(dirname "$0")/../..")"}"
else
  echo "Error: 1_vars.sh should be sourced from either deploy.sh or a user shell session"
  exit 1
fi

# Check if deployment name is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <deployment-name> [env-name]"
  echo "Available deployments:"
  ls -1 "$DEPLOY_SCRIPTS_DIR/deployments"
  exit 1
fi

# Calculations
DEPLOY_STEPS_DIR="$DEPLOY_SCRIPTS_DIR/steps"
PROJECT_CODE_ROOT="$(realpath "$DEPLOY_SCRIPTS_DIR/..")"
DEPLOY_DOCKER_CONTEXT="${DEPLOY_DOCKER_CONTEXT:-"$(docker context show)"}"

# Set deploy params
export DEPLOY_DEPLOYMENT="$1"
export DEPLOY_ENV_TYPE="${2:-local}"

export PROJECT_CODE_ROOT
export DEPLOY_DEPLOYMENT_DIR="$DEPLOY_SCRIPTS_DIR/deployments/$DEPLOY_DEPLOYMENT"
export DEPLOY_WORKSPACE_DIR="$DEPLOY_SCRIPTS_DIR/workspace"

export DEPLOY_SCRIPTS_DIR
export DEPLOY_STEPS_DIR

export DEPLOY_DOCKER_CONTEXT

# Apply environment file
DEPLOY_ENV_FILE="$DEPLOY_DEPLOYMENT_DIR/envs/$DEPLOY_ENV_TYPE.env"
if [ -f "$DEPLOY_ENV_FILE" ]; then
  echo "Applying environment file: $DEPLOY_ENV_FILE"
  set -o allexport
  source "$DEPLOY_ENV_FILE"
  set +o allexport
else
  # For non-local environments, the env file is required
  if [ "$DEPLOY_ENV_TYPE" != "local" ]; then
    echo "Error: Environment file $DEPLOY_ENV_FILE does not exist"
    exit 1
  fi
fi

echo "OK: Ready to deploy $DEPLOY_DEPLOYMENT as $DEPLOY_ENV_TYPE to $DEPLOY_WORKSPACE_DIR"
