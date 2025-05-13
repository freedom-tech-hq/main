# Remote Credential Vault Specification

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

3. **Interaction**
- Registration: just save, if the checkbox is set.
- Login:

### Nonpareil Version

0. **Pavel's opinion on this section**

One thing I'l like to see in theory - do not give the encrypted credentials to anyone without verification that they have a password.
- Maybe this is not important.
- We might save one more salt for this. SRP-like protocol. You get any email's salt. Then you post to the server the hashed password. If the hash matches, you get the encrypted credentials. If not - you get readable error that the email is real but your password does not match.
Note: services often return non-distinguishing errors for no-user and wrong-password cases. This is not for us, because the existence of an email address is easily verifiable, so no point to hide it in one of the API endpoints.

Below is AI creativity, not revised.

1. **Zero-knowledge Password Proof**
   - Implement a Zero-Knowledge Proof (ZKP) protocol to verify the user's password matches their stored credentials without sending the password
   - Use a challenge-response mechanism where the server sends a challenge, and the client proves knowledge of the password
   - Could use Secure Remote Password (SRP) or similar protocols

2. **Multi-factor Authentication for Recovery**
   - Require email verification plus another factor (e.g., recovery code, trusted device) for credential recovery
   - Implement rate limiting and suspicious activity detection

3. **Vault Access Control**
   - Allow users to define trusted devices that can access their vault
   - Provide audit logs for all vault access attempts
   - Implement device fingerprinting to detect unusual access patterns

4. **Version Control and Backup**
   - Store multiple versions of encrypted credentials to prevent data loss
   - Implement a secure rollback mechanism if credentials become corrupted

5. **UI/UX Enhancements**
   - Provide visual feedback about vault status (synced, pending, error)
   - Allow users to manage multiple devices from a central dashboard
   - Implement progressive disclosure of advanced features


## Steps

### 1. Backend Implementation

1. Extend database schema for credential storage
   - Simple first version: add an optional string field to User.ts code/server-packages/freedom-db/src/model/types/User.ts
   - List all usages of User.ts in chat, to solve the next step better

2. Create new API endpoint for storing credentials
   - File: `/code/cross-platform-packages/freedom-store-api-server-api/src/api/store-credentials.ts`
   - File: `/code/backends/freedom-store-api-server/src/api-handlers/store-credentials.ts`
   - Implement POST handler that accepts encrypted credentials and stores them indexed by email

3. Create new API endpoint for retrieving credentials
   - File: `/code/cross-platform-packages/freedom-store-api-server-api/src/api/retrieve-credentials.ts`
   - File: `/code/backends/freedom-store-api-server/src/api-handlers/retrieve-credentials.ts`
   - Implement POST handler that returns encrypted credentials when provided with valid email

### 2. Frontend Implementation

1. Extend tasks to handle remote credential operations
   - File: `/code/apps/freedom-email-app/src/contexts/tasks.tsx`
   - Add functions to store/retrieve credentials from server
   - Handle errors and provide appropriate user feedback

2. Modify account creation flow to include remote storage option
   - File: `/code/apps/freedom-email-app/src/components/new-account/NewAccountMasterPasswordDialog.tsx`
   - Add a checkbox for "Save encrypted credentials on our server" option during account creation

3. Add "Login from Server" option in the login screen
   - File: `/code/apps/freedom-email-app/src/components/AccountCreationOrLogin.tsx`
   - Add a new button between "Import Credential" and "New Account" in the existing interface
   - Implement email input dialog for credential retrieval
