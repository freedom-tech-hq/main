FROM ghcr.io/docker-mailserver/docker-mailserver:latest

ENV LOG_LEVEL=error

# Contents of this dir are always overrden dynamically. See ./deploy-config/README.md
COPY ./deploy-config/ /tmp/docker-mailserver/
