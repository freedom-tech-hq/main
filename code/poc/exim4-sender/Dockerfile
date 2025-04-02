FROM ubuntu:22.04

ARG RELAY_DOMAIN=mail-relay.placeholder

# Install Node.js and Exim
RUN apt-get update && apt-get install -y curl ca-certificates gnupg2 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    exim4 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configure Exim to use authentication router
COPY config/exim/conf.d/auth/99_custom_auth /etc/exim4/conf.d/auth/

# Copy Exim4 configuration
COPY config/exim/update-exim4.conf.conf /etc/exim4/update-exim4.conf.conf

# Configure Exim to use our domain
RUN echo "${RELAY_DOMAIN}" > /etc/mailname
RUN sed -i "s/mail-relay\.placeholder/${RELAY_DOMAIN}/g" /etc/exim4/conf.d/auth/99_custom_auth
RUN sed -i "s/mail-relay\.placeholder/${RELAY_DOMAIN}/g" /etc/exim4/update-exim4.conf.conf

# Apply Exim parametrized configuration
RUN update-exim4.conf

# Create app directory and set as working directory
RUN mkdir -p /app && touch /app/app.log && chmod 666 /app/app.log
WORKDIR /app

# Copy our Node.js scripts and dependencies
COPY auth_check.js /app/
COPY auth_check.sh /app/
COPY package.json /app/
COPY package-lock.json /app/

# Install Node.js dependencies
RUN npm ci --production

# Expose SMTP port
EXPOSE 587

# Environment variables
ENV RELAY_DOMAIN=${RELAY_DOMAIN}

# Start Exim
CMD ["exim4", "-bd", "-v", "-oX", "587"]
