#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Apply module overrides
cp -R "$DEPLOY_DEPLOYMENT_DIR"/files/* "$DEPLOY_WORKSPACE_DIR/"

# Done
echo "OK: Deployment files are applied to $DEPLOY_WORKSPACE_DIR"
