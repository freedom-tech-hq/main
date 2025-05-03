#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Select the part of git repo we use
cd "$PROJECT_CODE_ROOT"

# Clean and create deployment workspace
mkdir -p "$DEPLOY_WORKSPACE_DIR"
rm -rf \
  "$DEPLOY_WORKSPACE_DIR/.env" \
  "${DEPLOY_WORKSPACE_DIR:?}/"*

# Extract modules to the deployment workspace
echo "Rebuilding and extracting modules to $DEPLOY_WORKSPACE_DIR"
mkdir -p "$DEPLOY_WORKSPACE_DIR/code"
NODE_ENV=production yarn deploy:extract --skip-nx-cache --no-cloud
cp \
  package.json \
  yarn.lock \
  "$DEPLOY_WORKSPACE_DIR/code/"

# Done
echo "OK: Code to deploy is extracted to $DEPLOY_WORKSPACE_DIR"
