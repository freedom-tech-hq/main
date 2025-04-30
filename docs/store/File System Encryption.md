---
status: irrelevant, needs rewrite
---
# File System Encryption

## Data Encryption

Freedom encrypts all user data so that neither Freedom nor anyone else without the necessary keys can read it.

Two different encryption approaches are used based on data size:

1. **Small Data** (≤ 446 bytes):
   - Encrypted directly using 4096-bit RSA-OAEP with SHA-256 hashing
   - Uses the shared secret private key for encryption

2. **Large Data** (> 446 bytes):
   - Two-stage encryption:
     1. First encrypt an AES key using the RSA private key
     2. Then encrypt the data using the AES key
   - The encrypted AES key is included in the chunk metadata
   - AES keys are reused up to 10,000 times or until explicitly rotated

Every encrypted data chunk includes metadata about how it was encrypted, typically including the key ID.

## File Name Encryption

IDs used for folders, bundles, and files support three encoding modes:

1. **Plain IDs**:
   - Not encrypted
   - Used for special system files (like `.access-control`)
   - Generally not used for user content

2. **Encrypted IDs**:
   - Default for most files and folders
   - Encrypted using the same mechanism as file data
   - Prevents metadata leakage about file contents

3. **Time-based IDs**:
   - Used when time-ordered loading is important
   - Composed of an ISO timestamp and UUID
   - Not encrypted but doesn't include meaningful information

## Shared Key Management

Freedom uses a shared key approach rather than per-user encryption:

- Each folder has shared secret keys stored in the access control document
- Secret keys are 4096-bit RSA-OAEP keys with SHA-256 hashing
- Each secret key is encrypted separately for every user with read access
- This approach avoids making multiple copies of encrypted data for each user

## Signatures

All content is signed using 4096-bit RSASSA-PKCS1-v1_5 with SHA-256 hashing to verify:

- Origin - who created the item
- Acceptance - if the item was accepted by a high-trust user

Signatures ensure data integrity and allow verification of who created or modified content.
