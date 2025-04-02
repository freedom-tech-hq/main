FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN npm init -y && \
    npm install smtp-server

# Copy the mock SMTP server script
COPY mock-smtp.js .

# Expose port 25 for SMTP
EXPOSE 25

# Run the mock SMTP server
CMD ["node", "mock-smtp.js"]
