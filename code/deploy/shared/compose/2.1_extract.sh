#!/bin/bash
set -e

# Inputs
. "$DEPLOY_STEPS_DIR/require-params.sh"

# Select the part of git repo we use
cd "$PROJECT_CODE_ROOT_DIR"

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

# Create RELEASE.txt with git hash and branch
GIT_HASH=$(git rev-parse HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "commit: $GIT_HASH" > "$DEPLOY_WORKSPACE_DIR/code/RELEASE.txt"
echo "branch: $GIT_BRANCH" >> "$DEPLOY_WORKSPACE_DIR/code/RELEASE.txt"

# Done
echo "OK: Code to deploy is extracted to $DEPLOY_WORKSPACE_DIR"
