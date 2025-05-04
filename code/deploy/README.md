# Continuous Deployment System

This directory contains deployment configurations and scripts.

## Architecture

Layers are:

1. **Account** - IaC setup to host multiple related environments. Should be two: `prod` and `dev`.
2. **Environment** - IaC setup to host a particular environment in an account.
3. **Deployment** - A set of applications to be deployed to an environment.
   For testing, a deployment should work the same with a local host docker/kubernetes.

See Terraform description below for more details.

## Directory Structure

- `code/deploy/`
  - `x.y_deployment-name/` - contains an IaC/deployment configuration. `x` - layer, `y` - index.
    - `README.md` - explains the particular configuration.
    - `deploy-this.sh` - an interactive wrapper to apply the IaC / start the deployment.
    - `tear-down-this.sh` - an interactive wrapper to tear down the IaC/deployment.
- `code/secrets/`
  - `<environemnt name>/` - directory with ENV-specific set of secrets.
    This and nested are git-ignored.
    Examples names are: `local`, `dev`.
    - `N.N_xxx/` - directory with IaC/deployment configuration-specific secrets and customizations.
  - `sample/` - sample version of the directory above that is added to git.

## Usage

- See per configuration READMEs.
- Use `deploy-this.sh`, it is interactive.

---

## Type: Terraform IaC

The IaC configurations (layers 1, 2) and app deployments (layer 3) work in the following combination.

- Account Infrastructure (layer 1, `1.N_xxx.iac` folders)
  - One account can contain several deployments. E.g. for developers and separate branches.
    - **Production account** should contain only production deployments (main, beta, next, etc.).
    - **Dev account** can contain everything else.
  - An account configuration includes a few global shared settings.
    - Domain zone to share between the deployments.
    - Custom roles.
    - Manually deployed machines should be bound to either Dev account, or Production account, or a certain deployment.
- Deployment Infrastructure (layer 2, `2.N_xxx.iac` folders)
  - A deployment infrastructure is a set of hardware and cloud services, required to host one instance of
    a particular app deployment. App deployments are in `deploy/3.N_xxx` folders.
  - Note: to release apps separately, use many App Deployments but in a single Deployment Infrastructure.
    Maintaining several Deployment Infrastructures is an overhead.

### Keeping Terraform State Files

TODO: Decide where
Currently, they are simply local files at the deployer's machine.

---

## Type: Docker Compose Deployment

```bash
./deploy-compose.sh <deployment-name> [env-name]
```

- `<deployment-name>` is the name of a deployment configuration in the `deployments/` directory (e.g., `mail-host`).
- `[env-name]` (optional) is the name of the environment to deploy from `deployments/<deployment-name>/envs/<env-name>.env`. Defaults to "local". `local.env` file is optional, other envs' files are required.

### Deployment Process Implementation

See the contents of `deploy-compose.sh`. It is structured in a way so that each step can be executed or re-executed **manually** one by one.

To reproduce any step, the first one `. ./steps/1_vars.sh <deployment-name> <env-name>` should be executed in the current shell session at least once.

**Steps are:**

1. Set Env Variables - it fills up the defaults and applies `<env-name>.env`
2. Assemble Deployment Files
   1. `yarn deploy:extract` (executes build as a dependency)
   2. Apply Deployment Configuration
3. Build Docker Images
4. Deploy Docker Containers

Missing step: infrastructure check. When deploying to cloud, we need to check the version of IaC applied.

### Deployment Structure

- `3.N_xxx/`
  - `overrides/` - files and directories to be applied to `workspace/` after build.
- `shared/compose/` - contains individual scripts for each deployment step.
- `workspace/` - working directory to assemble clean and reduced production version of the deployment.
  Note: build might happen before copying here, see the implementation.

### Environment Variables

See [1_vars.sh](./steps/1_vars.sh). Document variables there.
