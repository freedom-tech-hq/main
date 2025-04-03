# Infrastructure as Code (IaC)

This directory contains different IaC configurations.

## Principles

The IaC configurations (this folder) and app deployments (see [deploy](../deploy/README.md))
work in the following combination.

- Account Infrastructure
  - One account can contain several deployments. E.g. for developers and separate branches.
    - **Production account** should contain only production deployments (main, beta, next, etc.).
    - **Dev account** can contain everything else.
  - An account configuration includes a few global shared settings.
    - Domain zone to share between the deployments.
    - Custom roles.
    - Manually deployed machines should be bound to either Dev account, or Production account, or a certain deployment.
- Deployment Infrastructure
  - A deployment infrastructure is a set of hardware and cloud services, required to host one instance of
    a particular app deployment. App deployments are in [deploy/deployments/](../deploy/deployments).
  - Note: to release apps separately, use many App Deployments but in a single Deployment Infrastructure.
    Maintaining several Deployment Infrastructures is an overhead.

## Directory Structure

```
.
├── configurations/         # An account configuration
│   ├── account/            # An account configuration
│   ├── deployment/         # A deployment configuration
├── shared/                 # Reusable Terraform/Bash/other modules
└── scripts/                # Helper shell scripts
```

## Usage

See per configuration READMEs.

## Keeping the State Files

TODO: Describe where
Currently, they are simply local files at the deployer's machine.
