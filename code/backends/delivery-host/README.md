## Run and Test

```bash
docker compose up
```

```bash
docker compose exec delivery-host \
    swaks --to nowhere@freedommail.me \
          --from user1@local.dev.freedommail.me \
          --server 127.0.0.1:25 \
          --tls \
          --body "This is a test email"
```

## Setup

```bash
docker compose run --rm -it delivery-host setup help
```

# How test-data is generated

Legend:
- Mail: user@local.dev.freedommail.me
- Sender: smtp1.local.dev.freedommail.me (different from Mail domain)

Self-signed certificate:

```bash
cd test-data
./generate-certs.sh
```

DKIM key:

```bash
docker compose run --rm -it delivery-host setup config dkim domain local.dev.freedommail.me
```
