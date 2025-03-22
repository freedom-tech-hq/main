# Freedom Mail Backend

This deploys functional backend for Freedom Mail.

Includes:

- [MTA + bridge script](../../../backends/freedom-mta-bridge/README.md)
- [freedom-mail-host](../../../backends/freedom-mail-host/README.md) 

## Envs

- Local deployment is supported.
  - Requires GCP credentials. See [some.secrets.env.sample](envs/some.secrets.env.sample)
- Cloud deployments.
  - No limits.
  - GCP credentials must not be set. Apply machine role with Terraform instead.

## Testing

### Seed

Put [users.json](../../../backends/freedom-mail-host/src/__tests__/fixtures/users.json) in the bucket.

### Use Test

Local, assuming fixture `users.json`:

```bash
swaks --to user1@my-test.com --from sender@my-test.com --server 127.0.0.1 --body "This is a test email"
```

Generic:

```bash
export DOCKER_VM_IP=999.999.999.999
export TEST_MAIL_TO=user1@my-test.com

swaks --to "$TEST_MAIL_TO" --from sender@my-test.com --server "$DOCKER_VM_IP" --body "This is a test email"
```
