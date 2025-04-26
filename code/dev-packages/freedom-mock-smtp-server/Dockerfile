FROM node:22-alpine

WORKDIR /app

# Collect samples
# ENV SAMPLES_DIR=/app/samples # Enable in docker-compose, when needed
RUN mkdir /app/samples

# Install dependencies
ADD package.json .
RUN --mount=type=cache,target=/root/.cache/yarn,rw \
    yarn install --production

# Add implementation
ADD mock-smtp.mjs .

# Expose port 25 for SMTP
ENV PORT=25
EXPOSE 25

# Run the mock SMTP server
CMD ["node", "mock-smtp.mjs"]
