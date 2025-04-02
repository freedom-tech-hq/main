FROM node:22

ARG SENDER_HOST=smtp1.dev.linefeedr.com
ARG MAIL_DOMAIN=mail-host.dev.linefeedr.com

# Environment variables
ENV SENDER_HOST=${SENDER_HOST}
ENV MAIL_DOMAIN=${MAIL_DOMAIN}
ENV NODE_ENV=production

# Install Haraka globally
RUN npm install -g Haraka@3.0.5

# Create app directory and set as working directory
WORKDIR /app

# Copy Haraka configuration
COPY config /app/config
COPY plugins /app/plugins
COPY package.json /app/

# Install dependencies
RUN npm install

# Configure mail domain
RUN echo "${SENDER_HOST}" > /app/config/me \
    && echo "${MAIL_DOMAIN}" > /app/config/host_list

# Expose SMTP port (587 for submission with auth)
EXPOSE 587

# Start Haraka
CMD ["haraka", "-c", "/app"]
