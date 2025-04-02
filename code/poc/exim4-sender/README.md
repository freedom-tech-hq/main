# Freedom SMTP Relay Service

**Status**: This setup have not worked yet. I switched to evaluating [Haraka](../haraka/README.md) and then [Docker Mailserver](../postfix-dms/README.md). 

This service provides an authenticated SMTP relay for the Freedom Network, allowing validated users to send emails through the Freedom infrastructure. It uses the same Exim4 stack as the MTA bridge but with additional authentication capabilities.

## Testing

```bash
swaks --to recipient@some-some-some.com \
      --from pavel.koryagin@some-some-some.com \
      --server 127.0.0.1 \
      --port 587 \
      --auth PLAIN \
      --auth-user pavel.koryagin@example.com \
      --auth-password password123 \
      --body "This is a test email from an authorized sender"
```

```bash
swaks --to recipient@some-some-some.com \
      --from pavel.koryagin@some-some-some.com \
      --server 127.0.0.1 \
      --port 587 \
      --auth PLAIN \
      --auth-user unauthorized@example.com \
      --auth-password password123 \
      --body "This is a test email from an unauthorized sender"
```

## Architecture Overview

The Freedom SMTP Relay service consists of:

1. **Exim4 SMTP Server**: Handles SMTP connections and routes email based on authentication status
2. **Authentication Service**: Validates sender credentials using a REST API
3. **Rate Limiting**: Prevents abuse by enforcing sending limits
4. **Logging & Monitoring**: Captures relay activity for security and debugging

```
┌─────────────┐      ┌───────────────┐      ┌─────────────────┐
│ SMTP Client │─────▶│ Exim4 + Auth  │─────▶│ Freedom Network │
│ (User)      │      │ Router Script │      │ Infrastructure  │
└─────────────┘      └───────────────┘      └─────────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Auth API   │
                     │  Endpoint   │
                     └─────────────┘
```

## SMTP Authentication Configuration

The SMTP relay will use Exim4 with a custom authentication router that verifies credentials through a REST API. This approach provides flexibility while maintaining security.

### Exim4 Configuration

#### 1. Main Configuration (update-exim4.conf.conf)

```
dc_eximconfig_configtype=internet
dc_other_hostnames=mail-relay.placeholder
dc_local_interfaces=0.0.0.0
dc_readhost=mail-relay.placeholder
dc_relay_domains=
dc_minimaldns=false
dc_relay_nets=
dc_smarthost=
CONF_SMARTHOST=
dc_use_split_config=true
dc_hide_mailname=false
dc_mailname_in_oh=true
dc_localdelivery=mail_spool
```

#### 2. Authentication Router (auth_router.conf)

```
# Authentication router for SMTP relay
auth_smtp_router:
  driver = accept
  condition = ${run{/app/auth_check.js}{$sender_address}{$authenticated_id}}
  transport = remote_smtp
  
# Reject unauthorized mail
unauthorized_mail:
  driver = redirect
  data = :fail: Relay not permitted. Authentication required.
  domains = ! +local_domains
```

#### 3. Authentication Script (auth_check.js)

The authentication script will validate the sender against a REST API service. The script will run whenever a user attempts to send mail through the relay:

```javascript
#!/usr/bin/env node

/**
 * auth_check.js
 * 
 * Authenticates SMTP users through a REST API
 * Called by Exim4 router to determine if a sender is authorized
 * 
 * Arguments:
 *   $1: Sender email address
 *   $2: Authenticated ID (if available)
 * 
 * Returns:
 *   0 (success) if authentication passes
 *   1 (failure) if authentication fails
 */

const axios = require('axios');

// Authentication service configuration
const AUTH_API_HOST = process.env.AUTH_API_HOST || 'auth-service';
const AUTH_API_PORT = process.env.AUTH_API_PORT || 3001;
const AUTH_ENDPOINT = '/api/v1/auth/smtp';
const AUTH_API_URL = `http://${AUTH_API_HOST}:${AUTH_API_PORT}${AUTH_ENDPOINT}`;

async function checkAuth(senderEmail, authId) {
  try {
    const response = await axios.post(AUTH_API_URL, {
      senderEmail,
      authId
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 second timeout
    });
    
    return response.data.authenticated === true;
  } catch (error) {
    console.error(`Authentication error: ${error.message}`);
    return false;
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: auth_check.js <sender_email> [auth_id]');
    process.exit(1);
  }

  const senderEmail = process.argv[2];
  const authId = process.argv[3] || null;
  
  const isAuthenticated = await checkAuth(senderEmail, authId);
  
  process.exit(isAuthenticated ? 0 : 1);
}

main();
```

## REST API Authentication Endpoint

The authentication service should implement a REST API endpoint (`/api/v1/auth/smtp`) that:

1. Accepts POST requests with JSON body
2. Validates sender credentials
3. Returns JSON with `{"authenticated": true|false}`

### API Reference

#### Request Format

```json
{
  "senderEmail": "user@example.com",
  "authId": "optional-auth-token"
}
```

#### Response Format

```json
{
  "authenticated": true,
  "quotaRemaining": 100,
  "ttl": 3600
}
```

## Alternative: Script-Based Authentication

As an alternative to a REST API, you can implement script-based authentication that verifies credentials against a local database or file:

1. Create a credentials file or SQLite database
2. Modify the auth_check.js script to check credentials locally
3. Update credentials periodically through a secure mechanism

This approach is simpler but less flexible than the REST API option.

## Implementation Steps

1. Create a Docker-based service similar to freedom-mta-bridge
2. Extend the Exim4 configuration with authentication routers
3. Implement the authentication script
4. Develop the REST API authentication service
5. Configure TLS for secure connections
6. Add monitoring and rate limiting
7. Test with actual SMTP clients

## Security Considerations

- Always require TLS for client connections (STARTTLS)
- Implement rate limiting to prevent abuse
- Monitor authentication failures for potential attacks
- Rotate credentials regularly
- Validate sender domains against approved list
- Log all relay activities for audit purposes

## Deployment Configuration

A sample docker-compose.yml entry for the SMTP relay:

```yaml
services:
  smtp-relay:
    build:
      context: ./code/backends/freedom-smtp-relay
      args:
        - RELAY_DOMAIN=${RELAY_DOMAIN}
    ports:
      - "587:587"  # SMTP with STARTTLS
    environment:
      - AUTH_API_HOST=auth-service
      - AUTH_API_PORT=3001
    depends_on:
      - auth-service
    restart: unless-stopped
```
