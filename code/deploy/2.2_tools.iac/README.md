# Developer Cloud Tools

This directory contains Terraform configuration for tools.

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

After deploying infrastructure, deploy the application(s), see 'Deploying Applications' section below.

Manual commands are also allowed:

```bash
terraform apply
```

### Teardown

To remove all deployed resources:

```bash
./tear-down-this.sh
```

### Deploying Applications

- `freedom-mock-smtp-server` - use instructions from [README.md](../../dev-packages/freedom-mock-smtp-server/README.md)
