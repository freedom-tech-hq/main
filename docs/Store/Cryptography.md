---
status: revise completeness and readability
---
# Cryptography

### Data Encryption

We encrypt data in two different ways, depending on the size of the data being encrypted.

For small data chunks (not more than 446 bytes), we encrypt data using the user's or shared secret private key directly. We currently use 4096-bit RSA-OAEP keys using SHA-256 hashing.

For larger chunks, we use a two-stage encryption where we first encrypt an AES key using the private key and then encrypt the data chunk using the AES key. We include the encrypted AES key in the chunk metadata. AES keys are reused throughout an app's runtime, up to 10000 times, or until they're explicitly rotated.

We include metadata about how each chunk was encrypted, generally including the key ID.

## Signatures

We currently use 4096-bit RSASSA-PKCS1-v1_5 using SHA-256 hashing for signatures.

## Useful Commands
### Generate a 4096-bit RSA private key

```bash
openssl genpkey -algorithm RSA \
  -aes-256-cbc \
  -pkeyopt rsa_keygen_bits:4096 \
  -out private.pem
```

### Extract the public key

```bash
openssl rsa -in private.pem -pubout -out public.pem
```

### Alternative commands

For advanced use cases only!

```bash
# No passphrase
openssl genpkey -algorithm RSA \
  -pkeyopt rsa_keygen_bits:4096 \
  -out private_no_pass.pem

# Encrypt
openssl rsa -aes-256-cbc \
  -passout pass:your_password \
  -in private_no_pass.pem \
  -out private.pem

# Explicit passphrase
openssl genpkey -algorithm RSA \
  -aes-256-cbc -pass pass:"your_secure_passphrase" \
  -pkeyopt rsa_keygen_bits:4096 \
  -out private.pem
```

