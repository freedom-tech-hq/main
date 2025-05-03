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

No extra parameters are needed so far.

```bash
terraform apply
```

Then deploy the application(s) from `deploy/3.N_xxx` folder(s).

## Connecting to the Docker VM

### Initialize a Docker Context

```bash
export DOCKER_VM_IP=999.999.999.999
export DOCKER_VM_USER=pavel

# Only once, after the machine creation and before the first run
ssh-keygen -R "$DOCKER_VM_IP"
ssh-keyscan "$DOCKER_VM_IP" >> ~/.ssh/known_hosts
ssh "$DOCKER_VM_USER@$DOCKER_VM_IP" "sudo usermod -aG docker $DOCKER_VM_USER"

# Optional health check
ssh "$DOCKER_VM_USER@$DOCKER_VM_IP" "docker ps"

# Create the context
docker context create \
    --docker host=ssh://"$DOCKER_VM_USER@$DOCKER_VM_IP" \
    --description="DEV server" \
    freedom-dev
```

### Using the Docker Context

```bash
docker --context freedom-dev [command]
docker --context freedom-dev ps
COMPOSE_BAKE=true docker --context freedom-dev compose up -d --build
docker --context freedom-dev compose down
```

### Removing the Docker Context

```bash
docker context rm freedom-dev
```
