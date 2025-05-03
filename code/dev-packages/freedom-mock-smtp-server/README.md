# Mock SMTP Server

A simple SMTP server that logs all received emails to the console. Useful for testing and development.

## Local Usage

Start with defaults (defaults are to use during local development, see source code for values):

`yarn start`

## Cloud Deployment

The tool can expose emails in logs and collect samples.

### Prerequisites

- [2.2_tools](../../deploy/2.2_tools.iac) setup.
- Local docker context `freedom-dev` is created for the dev server.

### Deploy

IP is chosen in [freedom-mock-smtp-server.tf](../../deploy/2.2_tools.iac/freedom-mock-smtp-server.tf)

```
COMPOSE_BAKE=true \
DEPLOY_LISTEN_IP=82.26.157.251 \
docker \
    --context freedom-dev \
    compose up -d \
    --build
```

### Read

```bash
docker --context freedom-dev logs -f mock-smtp-server-smtp-1

docker --context freedom-dev exec mock-smtp-server-smtp-1 ls /app/samples

docker --context freedom-dev exec mock-smtp-server-smtp-1 cat /app/samples/someEmail.eml > someEmail.eml
```
