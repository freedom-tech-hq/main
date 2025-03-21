#!/bin/bash
set -e

echo "Step 1: Set vars"
. ./steps/1_vars.sh "$1" "$2"

echo "Step 2: Assemble deployment files"
./steps/2.1_extract.sh
./steps/2.2_apply-deployment.sh

echo "Step 3: Build"
./steps/3_build.sh

echo "Step 4: Deploy"
./steps/4_deploy.sh

echo "OK: Deployment of $DEPLOY_DEPLOYMENT completed successfully!"
