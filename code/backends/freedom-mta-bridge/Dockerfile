FROM ubuntu:22.04

ARG MAIL_DOMAIN=my-test.com

# Install Node.js and Exim
RUN apt-get update && apt-get install -y curl ca-certificates gnupg2 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    exim4 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configure Exim to pipe all emails to our script
COPY config/exim/conf.d/router/900_exim4-config_catch_all /etc/exim4/conf.d/router/

# Copy Exim4 configuration
COPY config/exim/update-exim4.conf.conf /etc/exim4/update-exim4.conf.conf

# Configure Exim to use our domain
RUN echo "${MAIL_DOMAIN}" > /etc/mailname
RUN sed -i "s/mail-domain\.placeholder/${MAIL_DOMAIN}/g" /etc/exim4/conf.d/router/900_exim4-config_catch_all
RUN sed -i "s/mail-domain\.placeholder/${MAIL_DOMAIN}/g" /etc/exim4/update-exim4.conf.conf

# Apply Exim parametrized configuration
RUN update-exim4.conf

# Create app directory and set as working directory
RUN mkdir -p /app
WORKDIR /app

# Copy our Node.js scripts and dependencies
COPY bridge_incoming.js /app/
COPY package.json /app/
COPY package-lock.json /app/

# Install Node.js dependencies
RUN npm ci --production

# Expose SMTP port
EXPOSE 25

# Environment variables
ENV MAIL_DOMAIN=${MAIL_DOMAIN}

# Start Exim
CMD ["exim4", "-bd", "-v"]
