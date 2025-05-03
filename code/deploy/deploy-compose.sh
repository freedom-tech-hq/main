#!/bin/bash
set -e

echo "Step 1: Set vars"
. ./shared/compose/1_vars.sh "$1" "$2"

echo "Step 2: Assemble deployment files"
./shared/compose/2.1_extract.sh
./shared/compose/2.2_apply-deployment.sh

echo "Step 3: Build"
./shared/compose/3_build.sh

echo "Step 4: Deploy"
./shared/compose/4_deploy.sh

echo "OK: Deployment of $DEPLOY_DEPLOYMENT completed successfully!"
