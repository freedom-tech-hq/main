#!/bin/bash
set -e

if [ -z "$DEPLOY_WORKSPACE_DIR" ]; then
  echo "Error: DEPLOY_WORKSPACE_DIR is not set"
  exit 1
fi

# Consts
CURRENT_DIR=$(pwd)
PACKAGE_DIR=$(basename "$CURRENT_DIR")
PARENT_DIR=$(basename "$(dirname "$CURRENT_DIR")")
PACKAGE_DEPLOY_DIR="$DEPLOY_WORKSPACE_DIR/code/$PARENT_DIR/$PACKAGE_DIR"

# Copy
mkdir -p "$PACKAGE_DEPLOY_DIR"

# Docker Mailserver
cp -R \
  deploy-config \
  test-data \
  Dockerfile \
  mailserver.env \
  "$PACKAGE_DEPLOY_DIR/"
