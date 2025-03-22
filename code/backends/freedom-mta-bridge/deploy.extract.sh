#!/bin/bash
set -e

# Consts
DEPLOY_DIR="${DEPLOY_DIR:-"$(realpath "$(dirname "$0")/../../deployment")"}"

CURRENT_DIR=$(pwd)
PACKAGE_DIR=$(basename "$CURRENT_DIR")
PARENT_DIR=$(basename "$(dirname "$CURRENT_DIR")")
PACKAGE_DEPLOY_DIR="$DEPLOY_DIR/code/$PARENT_DIR/$PACKAGE_DIR"

# Copy
mkdir -p "$PACKAGE_DEPLOY_DIR"

# Mail server
cp -R \
  config \
  Dockerfile \
  "$PACKAGE_DEPLOY_DIR/"

# Bridge script
cp -R \
  bridge_incoming.js \
  package.json \
  package-lock.json \
  "$PACKAGE_DEPLOY_DIR/"
