#!/bin/bash
set -e

# First time run interactively
bash

# Then switch to autonomous mode
rm -f entrypoint.sh
ln -s run.sh entrypoint.sh
