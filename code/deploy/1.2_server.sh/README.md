# New Server Manual Setup

This directory contains script and data for initializing new servers (usually physical).

## Usage

For the servers created not by Terraform, use this process.

### Prerequisites

1. Root access to the new server
2. IP addresses are chosen and configured. See the [registry](https://docs.google.com/spreadsheets/d/17e-5nwrVJ55u-JOIm4LDL9at8fGGpc0MjAmWqIejgjs/edit). 
3. Admins and their SSH keys are listed and available. See 'Define constants' section in [`init-new-server.sh`](init-new-server.sh). 

### Steps

1. Configure A and PTR records for the server.
  - It is **not** the mail domain, it is the domain name of this particular host.
  - E.g. `smtp1.dev.linefeedr.com.`
  - You probably do this by updating and applying layer 2 IaC configurations, according to the intended role of the server.
2. Sign in to the server as `root` at least once to confirm it works for you.
  - It should be `root`. Sudoers are not supported in the init script execution.
3. Run `./init-new-server.sh <server-ip> <hostname>`.
  - Example `./init-new-server.sh 999.9.9.9 smtp1.dev.linefeedr.com`.
  - Hostname is the same as the PTR record (without the trailing dot.)
  - There're commented out lines in the end if you need to debug what it executes.
  - If you use password authentication, it will ask for the server's `root` password once.
4. Follow the extra steps demanded by the intended deployment. E.g. Let's Encrypt.

## Connecting to the Docker Host

### Initialize a Docker Context

```bash
export DOCKER_VM_IP=999.999.999.999
export DOCKER_VM_USER=pavel

# Recognize the server key. Only once, after the machine creation and before the first run
ssh-keygen -R "$DOCKER_VM_IP"
ssh-keyscan "$DOCKER_VM_IP" >> ~/.ssh/known_hosts

# Optional health check
ssh "$DOCKER_VM_USER@$DOCKER_VM_IP" "docker ps"

# Create the context (the names are for the only dev server)
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
