# Continuous Deployment System

This directory contains deployment configurations and scripts.

## Architecture

Layers are:

1. **Account** - IaC setup to host multiple related environments. Should be two: `prod` and `dev`.
2. **Environment** - IaC setup to host a particular environment in an account.
3. **Deployment** - A set of applications to be deployed to an environment.
   For testing, a deployment should work the same with a local host docker/kubernetes.

## Directory Structure

- `x.y_deployment-name` - contains a deployment configuration. `x` - layer, `y` - index.
  - `deploy-this.sh` - an interactive wrapper to start the deployment.
  - `tear-down-this.sh` - an interactive wrapper to tear down the deployment.
- TODO


TODO: revise the part below

## Usage

```bash
./deploy.sh <deployment-name> [env-name]
```

- `<deployment-name>` is the name of a deployment configuration in the `deployments/` directory (e.g., `mail-host`).
- `[env-name]` (optional) is the name of the environment to deploy from `deployments/<deployment-name>/envs/<env-name>.env`. Defaults to "local". `local.env` file is optional, other envs' files are required.

## Deployment Process Implementation

See the contents of `deploy.sh`. It is structured in a way so that each step can be executed or re-executed **manually** one by one.

To reproduce any step, the first one `. ./steps/1_vars.sh <deployment-name> <env-name>` should be executed in the current shell session at least once.

**Steps are:**

1. Set Env Variables - it fills up the defaults and applies `<env-name>.env`
2. Assemble Deployment Files
   1. `yarn deploy:extract` (executes build as a dependency)
   2. Apply Deployment Configuration
3. Build Docker Images
4. Deploy Docker Containers

Missing step: infrastructure check. When deploying to cloud, we need to check the version of IaC applied.

## Deployment Structure

- `deployments/`: Contains deployment-specific configurations
  - Each subdirectory (e.g., `mail-host/`) contains files for a specific deployment
  - Includes `envs/`, `code/`
- `steps/`: Contains individual scripts for each deployment step
- `workspace/`: Working directory created during deployment

## Environment Variables

See [1_vars.sh](./steps/1_vars.sh). Document variables there.
