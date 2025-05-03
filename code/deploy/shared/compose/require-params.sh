#!/bin/bash
# Do not change in sourced scripts # set -e

# This script checks if necessary environment variables are set
# It should be sourced from other scripts that require these variables

# Required params
REQUIRED_PARAMS=(
  # Match with 1_vars.sh
  "DEPLOY_DEPLOYMENT"
  "DEPLOY_ENV_NAME"

  "PROJECT_CODE_ROOT"
  "DEPLOY_DEPLOYMENT_DIR"
  "DEPLOY_WORKSPACE_DIR"

  "DEPLOY_SCRIPTS_DIR"
  "DEPLOY_STEPS_DIR"

  "DEPLOY_DOCKER_CONTEXT"
)

# Check if params are set
MISSING_PARAMS=()
for param in "${REQUIRED_PARAMS[@]}"; do
  if [ -z "${!param}" ]; then
    MISSING_PARAMS+=("$param")
  fi
done

# If any params are missing, exit with error
if [ ${#MISSING_PARAMS[@]} -gt 0 ]; then
  echo "Error: Missing required parameters: ${MISSING_PARAMS[*]}"
  echo "Please run 1_vars.sh first to set all required parameters."
  exit 1
fi
