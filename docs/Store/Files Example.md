---
status: this was a helper file for Pavel; spread its contents to the proper places
---
# Freedom Syncable Items - File System Example

## Terms

- **File System Objects:**
  - **Folder**: A container that may hold other folders, bundles, and files. Each folder is independently sharable, and sharing a parent folder doesn't automatically give access to sub-folders.

  - **Bundle**: A container that may hold other bundles and files. Unlike folders, bundles don't have their own sharing capabilities and are shared as part of their parent folder.

  - **File**: Contains binary data. Files are immutable and are shared as part of their parent folder.

- **Special Bundles**:
  - **.access-control**: Contains role/access information and encrypted shared secrets.
  - **.changes**: Contains information about deletions.

- **Roles**:
  - **Creator**: Cannot be removed or modified (one per root). Can add/remove any users except creator. Can read, write, delete bundles and files. Can read, create, delete folders. Can accept/reject changes.
  - **Owner**: Can add/remove any users except creator. Can read, write, delete bundles and files. Can read, create, delete folders. Can accept/reject most changes.
  - **Admin**: Can add/remove editors and viewers. Can read, write, delete most bundles and files. Can read, create, delete folders.
  - **Editor**: Can read folders. Can read and write most bundles and files.
  - **Viewer**: Can read folders, bundles, and files.

- **Encryption**: Most files, folders, and bundle names are encrypted, making their contents unreadable without the necessary keys.

- **Shared Secrets**: 4096-bit RSA-OAEP keys using SHA-256 hashing where the private key is encrypted for specific members.

- **Provenance**: Metadata that establishes:
  - **Origin**: Who created the item (in a provable way)
  - **Acceptance**: If the item was accepted by a high-trust user

## Example

### Alice's Personal Finance System

Alice wants to create a secure, shareable financial management system using Freedom's syncable items. Here's how she structures it:

```
/AliceAccount (Root Folder)
|-- Photos (Folder)
|   |-- Holiday 2025 (Folder - shared with friends as R/W)
|   |   |-- Friends (Bundle - friends will put here)
|   |   |-- 2025-01-01.jpg
|   |   |-- 2025-01-02.jpg
|-- Docs (Folder)
|   |-- Documents (Bundle)
|   |   |-- 2025-01-01.docx
|   |   |-- Invoices (Folder - impossible)




/AliceAccount (Root Folder - Creator: Alice)
|
|   # See InMemoryAccessControlledFolderBase.ts:81-83
|-- folder (handled as folder)
|   |-- 
|-- plainBundle (handled as plain-bundle)
|   |-- .access-control (chain of ACLs)
|   |   |-- bundles
|   |   |   |-- snapshots
|   |   |   |   |-- bundles
|   |   |   |   |-- files
|   |   |   |   |   |-- default-snapshot (plain file)
|   |   |   |-- deltas-default-snapshot
|   |   |   |   |-- bundles
|   |   |   |   |-- files
|   |   |-- files
|   |-- .changes (history for deleted files)
|   |   |-- bundles
|   |   |   |-- snapshots
|   |   |   |   |-- bundles
|   |   |   |   |-- files
|   |   |   |   |   |-- default-snapshot
|   |   |-- files
|-- encryptedBundle
|   |--





|-- .plain-bundles (Directory physically, but does not exist in our logical FS)
|   |-- 
|
|
|-- .access-control (Special Bundle)
|   |-- initial-state.json (File - defines Alice as Creator)
|   |-- shared-secrets.enc (File - encrypted keys)
|   |-- changes-001.json (File - signed access control changes)
|
|-- .changes (Special Bundle)
|   |-- deletions-log.json (File - record of deleted items)
|
|-- BankAccounts (Folder - Owner: Alice)
|   |-- .access-control (Special Bundle)
|   |   |-- initial-state.json (File - defines Alice as Owner)
|   |   |-- shared-secrets.enc (File - encrypted keys for this folder)
|   |
|   |-- CheckingAccount (Bundle)
|   |   |-- transactions.json (File - encrypted transaction data)
|   |   |-- balance.json (File - encrypted balance data)
|   |
|   |-- SavingsAccount (Bundle)
|       |-- transactions.json (File - encrypted transaction data)
|       |-- balance.json (File - encrypted balance data)
|       |-- goals.json (File - encrypted savings goals)
|
|-- Investments (Folder - Owner: Alice, Admin: Bob)
|   |-- .access-control (Special Bundle)
|   |   |-- initial-state.json (File - defines Alice as Owner, Bob as Admin)
|   |   |-- shared-secrets.enc (File - encrypted keys for this folder)
|   |
|   |-- StockPortfolio (Bundle)
|   |   |-- holdings.json (File - encrypted stock data)
|   |   |-- performance.json (File - encrypted performance data)
|   |
|   |-- RetirementAccounts (Bundle)
|       |-- 401k.json (File - encrypted 401k data)
|       |-- ira.json (File - encrypted IRA data)
|
|-- SharedExpenses (Folder - Owner: Alice, Editor: Charlie)
    |-- .access-control (Special Bundle)
    |   |-- initial-state.json (File - defines Alice as Owner, Charlie as Editor)
    |   |-- shared-secrets.enc (File - encrypted keys for this folder)
    |   |-- changes-001.json (File - signed access control change adding Charlie)
    |
    |-- Rent (Bundle)
    |   |-- payments.json (File - encrypted payment history)
    |   |-- agreement.pdf (File - encrypted rental agreement)
    |
    |-- Utilities (Bundle)
        |-- electricity.json (File - encrypted electricity bills)
        |-- internet.json (File - encrypted internet bills)
        |-- water.json (File - encrypted water bills)
```

### Sharing Scenario

1. **Initial Setup**: Alice creates the entire structure as the Creator of the root folder. All data is encrypted with her keys.

2. **Adding Bob as Investment Admin**:
   - Alice adds Bob to the Investments folder with Admin role
   - The system creates a new shared secret for the Investments folder
   - The shared secret is encrypted with both Alice's and Bob's public keys
   - Bob can now access, read, and modify files within the Investments folder
   - Bob cannot access BankAccounts or other folders not explicitly shared

3. **Adding Charlie as SharedExpenses Editor**:
   - Alice adds Charlie to the SharedExpenses folder with Editor role
   - A new shared secret is created for the SharedExpenses folder
   - The shared secret is encrypted with Alice's and Charlie's public keys
   - Charlie can now view and edit files within the SharedExpenses folder
   - Charlie cannot delete bundles or files, only modify existing ones
   - Charlie cannot access BankAccounts or Investments folders

4. **Removing Access**:
   - If Alice needs to remove Charlie's access to SharedExpenses:
     - She updates the .access-control bundle, removing Charlie
     - A new shared secret is generated and encrypted only for Alice
     - New data will be encrypted with the new shared secret
     - Charlie can no longer access newly added or modified files

5. **File Modifications**:
   - When Alice updates her checking account balance:
     - She decrypts the balance.json file using the current shared secret
     - Makes changes to the data
     - Re-encrypts with the current shared secret
     - Signs the changes with her private key
     - The file is immutable, so a new version is created

6. **Conflict Resolution**:
   - If Bob and Alice both update the StockPortfolio/holdings.json file:
     - Both changes are kept and merged according to CRDT rules
     - The system ensures eventual consistency
     - Both users will see the merged result once synchronization occurs
