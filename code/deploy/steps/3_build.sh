#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Docker root
cd "$DEPLOY_WORKSPACE_DIR"

# Note: TypeScript production build happens in Docker

# Build with docker compose
COMPOSE_BAKE=true docker --context "$DEPLOY_DOCKER_CONTEXT" compose build

# Done
echo "OK: docker compose build completed for $DEPLOY_DEPLOYMENT"
