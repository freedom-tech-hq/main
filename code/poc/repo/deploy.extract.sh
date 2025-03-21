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

cp -R package.json "$PACKAGE_DEPLOY_DIR/"

if [ -d "lib" ]; then
  cp -R lib "$PACKAGE_DEPLOY_DIR/"
fi

if [ -d "dist" ]; then
  cp -R dist "$PACKAGE_DEPLOY_DIR/"
fi
