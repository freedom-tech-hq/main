---
status: draft
---
# Remote Credential Vault

## Problem

Provide to the user a traditional email+password experience, unless they opt-out for remote storage.

## Relevant Knowledge

- When users create accounts in the Freedom Email App, credentials are generated from random and then encrypted with the user's password
- Current system only stores encrypted credentials locally on the user's device
- The system uses `freedom-store-api-server` backend for data synchronization operations
- The backend already has API endpoints for push/pull operations to sync data
- Email functionality is implemented in the API but not exposed in the UI
- Password-based encryption is used to secure user credentials
- Biometric authentication is supported as an optional additional authentication method
- The frontend uses React components for user interactions

## Solution

### Minimal Prototype Version to Start With

1. **Protocol**
- Store encrypted credentials
  - Key: email.
  - Authentication: Sign one of the fields. Server uses the public key it knows to verify the signature.
- Read: simple API endpoint. Everyone can get the credentials, because they are encrypted with a password.

2. **UI**
- Registration: Inject into our flow for now as a checkbox (save the key on server)
- Login: After 'Import Credential' add 'Login from Server' item.
- With the design team we will invent something better later.

### Nonpareil Version

Collect drafts here.

#### Pavel's opinion:

One thing I'l like to see in theory - do not give the encrypted credentials to anyone without verification that they have a password.
- Maybe this is not important.
- We might save one more salt for this. SRP-like protocol. You get any email's salt. Then you post to the server the hashed password. If the hash matches, you get the encrypted credentials. If not - you get readable error that the email is real but your password does not match.
Note: services often return non-distinguishing errors for no-user and wrong-password cases. This is not for us, because the existence of an email address is easily verifiable, so no point to hide it in one of the API endpoints.

#### Brian's amendment

We are going to implement a traditional account to manage our relations with a user, in parallel with an encrypted store. That authentication could be used to verify to whom we give the encrypted credentials.
