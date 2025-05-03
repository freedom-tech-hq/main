#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Apply the deployment overrides
cp -R "$DEPLOY_DEPLOYMENT_DIR"/overrides/. "$DEPLOY_WORKSPACE_DIR/"
cp -R "$DEPLOY_DEPLOYMENT_SECRETS_DIR"/overrides/. "$DEPLOY_WORKSPACE_DIR/"

# Done
echo "OK: Deployment overrides are applied to $DEPLOY_WORKSPACE_DIR"
