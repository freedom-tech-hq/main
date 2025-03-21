#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Docker root
cd "$DEPLOY_WORKSPACE_DIR"

# Copy environment variables (TODO: use secrets store in the future)
DEPLOY_ENV_SECRETS_FILE="$DEPLOY_DEPLOYMENT_DIR/envs/$DEPLOY_ENV_TYPE.secrets.env"
if [ -f "$DEPLOY_ENV_SECRETS_FILE" ]; then
  cp "$DEPLOY_ENV_SECRETS_FILE" .env
else
  touch .env
fi

# Deploy with docker compose
COMPOSE_BAKE=true docker --context "$DEPLOY_DOCKER_CONTEXT" compose up -d

# Done
echo "OK: docker compose up is deployed for $DEPLOY_DEPLOYMENT"
