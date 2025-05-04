#!/bin/bash
set -e

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
  echo "Initializing Terraform..."
  terraform init
fi

# Destroy Terraform deployment
terraform destroy
