#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Docker root
cd "$DEPLOY_WORKSPACE_DIR"

# Deploy with docker compose
COMPOSE_BAKE=true docker --context "$DEPLOY_DOCKER_CONTEXT" compose up -d

# Done
echo "OK: docker compose up is deployed for $DEPLOY_DEPLOYMENT"
