#!/bin/sh
set -e

SSL_DIR=./dms/config/ssl

mkdir -p "$SSL_DIR/demoCA"

step certificate create "Smallstep Root CA" "$SSL_DIR/demoCA/cacert.pem" "$SSL_DIR/demoCA/cakey.pem" \
  --no-password --insecure \
  --profile root-ca \
  --not-before "2021-01-01T00:00:00+00:00" \
  --not-after "2031-01-01T00:00:00+00:00" \
  --san "local.dev.freedommail.me" \
  --san "smtp1.local.dev.freedommail.me" \
  --kty RSA --size 2048

step certificate create "Smallstep Leaf" "$SSL_DIR/smtp1.local.dev.freedommail.me-cert.pem" "$SSL_DIR/smtp1.local.dev.freedommail.me-key.pem" \
  --no-password --insecure \
  --profile leaf \
  --ca "$SSL_DIR/demoCA/cacert.pem" \
  --ca-key "$SSL_DIR/demoCA/cakey.pem" \
  --not-before "2021-01-01T00:00:00+00:00" \
  --not-after "2031-01-01T00:00:00+00:00" \
  --san "local.dev.freedommail.me" \
  --san "smtp1.local.dev.freedommail.me" \
  --kty RSA --size 2048
