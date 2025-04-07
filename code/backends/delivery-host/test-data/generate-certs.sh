#!/bin/sh
set -e

docker run --rm -it \
  --user "$(id -u):$(id -g)" \
  --volume "${PWD}/:/tmp/step-ca/" \
  --workdir "/tmp/step-ca/" \
  --entrypoint "/tmp/step-ca/generate-certs-inner.sh" \
  smallstep/step-ca
