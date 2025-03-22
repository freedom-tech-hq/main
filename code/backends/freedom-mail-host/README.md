# Freedom Mail Host

A backend service that receives incoming emails and stores them in user's vault.

## Cloud Deployment

See [mail-host](../../deploy/deployments/mail-host/README.md) deployment.

## Development

### Local Run

```shell
yarn dev
```

### Manual Testing

Use curl and fixtures:

```bash
curl -X POST http://127.0.0.1:3000/incoming \
  --data-binary @src/__tests__/fixtures/sample.eml \
  -H "Content-Type: text/plain"
```
