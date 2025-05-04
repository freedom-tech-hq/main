# Deployment Infrastructure

This directory contains Terraform configurations for a single product instance deployment.

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

After deploying infrastructure, deploy the application(s) from `deploy/3.N_xxx` folder(s).

Manual commands are also allowed:

```bash
terraform apply
```

### Teardown

To remove all deployed resources:

```bash
./tear-down-this.sh
```
