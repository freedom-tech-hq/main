#!/bin/bash
set -e

DEPLOY_ROOT_DIR="$(realpath "$(dirname "$0")/..")"

cd "$DEPLOY_ROOT_DIR"

# UI
read -p "Enter the env name (default: local): " ENV_NAME
ENV_NAME="${ENV_NAME:-local}"

# Get vars
. ./steps/1_vars.sh 3.1_mail-host.compose "$ENV_NAME"

# Teardown
docker --context "$DEPLOY_DOCKER_CONTEXT" \
  rm -f $(docker --context "$DEPLOY_DOCKER_CONTEXT" ps -a --filter "name=${DEPLOY_STACK_NAME}-" -q)
docker --context "$DEPLOY_DOCKER_CONTEXT" \
  volume rm $(docker --context "$DEPLOY_DOCKER_CONTEXT" volume ls --filter "name=${DEPLOY_STACK_NAME}_" -q)
docker --context "$DEPLOY_DOCKER_CONTEXT" \
  network rm $(docker --context "$DEPLOY_DOCKER_CONTEXT" network ls --filter "name=${DEPLOY_STACK_NAME}_" -q)
