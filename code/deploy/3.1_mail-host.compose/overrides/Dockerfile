FROM node:22

# This Dockerfile is for running, not building
ENV NODE_ENV=production

WORKDIR /app

# TODO: Copy only package.json(s) before install and the rest after
COPY ./code /app/

RUN --mount=type=cache,target=/root/.cache/yarn,rw \
    yarn install --frozen-lockfile --production

# The Dockerfile is shared, set workdir in the compose file
# WORKDIR /app/backends/<SERVER-NAME>
# CMD ["yarn", "start"]
