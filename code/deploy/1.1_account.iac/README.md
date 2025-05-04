# Account Infrastructure

This directory contains Terraform configurations for setting up the core account infrastructure.

## Usage

### Prerequisites

1. Terraform CLI installed
2. `gcloud` CLI installed and authenticated
3. `gcloud auth application-default login` executed
   - This is additional to regular auth.
   - On re-authentication request this command is sufficient.
4. `terraform init` executed

### Deploying Infrastructure

Using the unified script:

```bash
./deploy-this.sh
```

After deploying the account (layer 1) infrastructure, continue with layer 2 infrastruture. 

Manual commands are also allowed:

```bash
terraform apply
```

### Teardown

To remove all deployed resources:

```bash
./tear-down-this.sh
```

## Resources

This Terraform configuration creates and manages the following resources:
- Cloud project setup
- IAM roles and permissions
- Core networking infrastructure
- Base security configurations
