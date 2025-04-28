# GitHub Runner Setup

Set up a GitHub self-hosted runner.

## Setup Steps

Set the vars. Select free index for a runner. Create many.

```bash
export DOCKER_CONTEXT=freedom-dev
export RUNNER_CONTAINER=github-runner-1
```

Build. Tag `freedom-github-runner`.

```bash
docker --context "$DOCKER_CONTEXT" \
  build -t freedom-github-runner .
```

Create a container by running it. On the first run, it enters the config mode.

```bash
docker --context "$DOCKER_CONTEXT" \
  run -it \
  --name "$RUNNER_CONTAINER" \
  --restart unless-stopped \
  freedom-github-runner
```

Run there the command from [New self-hosted runner](https://github.com/freedom-tech-hq/main/settings/actions/runners/new?arch=x64&os=linux) page that starts with `./config.sh ...`. **Check what repo is selected.**

If you are adding a new runner, check the name, group, and label of the existing ones.

Recommended label: `build-server`

Exit the container. At this step, it switches to the autonomous mode.

Start the container in the background.

```bash
docker --context "$DOCKER_CONTEXT" start "$RUNNER_CONTAINER"
```

## Teardown

Do not delete the container before deleting the runner registration.

Start with [GitHub UI](https://github.com/freedom-tech-hq/main/settings/actions/runners) and follow the instructions.

## Helpful Facts

A runner can be hosted locally, at a developer's machine.

---

Inspect the runners: 

```bash
docker --context "$DEPLOY_DOCKER_CONTEXT" ps --filter "name=github-runner-"
```
