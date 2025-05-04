# Freedom Mail Host

A backend service that receives incoming emails and stores them in user's vault.

## Status

**Is a draft, but is already testing-friendly**

Before going production:

+ Implement unified error wrapping
+ Remove excessive console.log()
- Find unhandled async results
- Do not crash the process on processOutboundEmail() exceptions
- Implement retries on network errors in deliverOutboundEmail()
- Get rid of `freedom-fake-email-service` dependency
- Implement bounces on deliverOutboundEmail() failures

## Cloud Deployment

See [mail-host](../../deploy/3.1_mail-host.compose/README.md) deployment.

## Development

### Local Run

```shell
yarn dev
```

### Manual Testing

Inbound email (port 25, no restrictions)

```bash
swaks --to user1@local.dev.freedommail.me \
      --from nowhere@no-server.linefeedr.com \
      --server 127.0.0.1:25 \
      --body "This is a test inbound email"
```

User email (port 587, TLS, auth) - NO LONGER IMPLEMENTED

```bash
swaks --to nowhere@no-server.linefeedr.com \
      --from user1@local.dev.freedommail.me \
      --server 127.0.0.1:587 \
      --tls \
      --auth PLAIN \
      --auth-user user1@local.dev.freedommail.me \
      --auth-password password123 \
      --body "This is a test user email"
```
