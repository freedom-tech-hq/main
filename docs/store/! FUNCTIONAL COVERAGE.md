---
status: in work, Pavel. Most parts are still only AI-brainstorming artifacts
---
# **[store]** Freedom Syncable Store Functional Coverage

## Scenarios

### Variants

Every scenario (with certain exceptions) should be tested on different states of the synchronization stack:
- Full client
- Server
- Full client + Server online
- Full client + delayed Server sync
- Lite client + Server online
- Lite client + delayed Server sync
- *In the future: add stacks with a Node Server*

Additionally, tests should count and assert the **amount of I/O operations** to track the performance.

---

### User’s perspective (from most frequent to less frequent)

#### **[store.ops]** File operations

**[store.ops.file.create]** Create a new file.
**[store.ops.file.delete]** Delete an existing file.
**[store.ops.file.negative.modify]** Attempt to modify an immutable file.

**[store.ops.folder.create]** Create a new folder.
**[store.ops.folder.delete]** Delete an existing folder.

**[store.ops.bundle.create]** Create a new bundle.
**[store.ops.bundle.delete]** Delete an existing bundle.
**[store.ops.bundle.nesting]** Create nested bundles and verify correct behavior.

#### **[store.sharing]** Sharing and access

This section is a brainstorm artifact. Revise it. Group by role.

**[store.sharing.add]** Add a user with specific permissions to a folder.
**[store.sharing.remove]** Remove a user's access from a folder.
**[store.sharing.modify]** Change a user's role for a folder.
**[store.sharing.inheritance]** Verify bundle and file permission inheritance from parent folder.
**[store.sharing.negative.unauthorized]** Attempt permission changes without proper authorization.

**[store.sharing.role.creator]** Verify creator role capabilities.
**[store.sharing.role.owner]** Verify owner role capabilities.
**[store.sharing.role.admin]** Verify admin role capabilities.
**[store.sharing.role.editor]** Verify editor role capabilities.
**[store.sharing.role.viewer]** Verify viewer role capabilities.
**[store.sharing.role.appender]** Verify appender role capabilities.

**[store.sharing.negative.permissions]** Attempt to create/delete a file without proper permissions.
**[store.sharing.negative.permissions]** Attempt to create/delete a folder without proper permissions.
**[store.sharing.negative.permissions]** Attempt to create/delete a bundle without proper permissions.

#### **[store.account]** Account operations

**[store.account.create]** Create a new account.
**[store.account.delete]** Delete an existing account.
**[store.account.quota]** Handle account quota limitations.
**[store.account.negative.unauthorized]** Reject unauthorized account creation attempts.
**[store.account.negative.duplicate]** Handle duplicate account creation gracefully.

**[store.account.store.create]** Create a new store for a user.
**[store.account.store.delete]** Delete an existing store.
**[store.account.store.quota]** Handle store quota limitations.
**[store.account.store.negative.unauthorized]** Reject unauthorized store creation attempts.
**[store.account.store.negative.duplicate]** Handle duplicate store creation gracefully.

---
### Implementation Perspective

### **[encryption]** Encryption operations

**[encryption.data.small]** Verify small data encryption/decryption (≤446 bytes).
**[encryption.data.large]** Verify large data encryption/decryption (>446 bytes).
**[encryption.metadata]** Verify metadata is properly included with encrypted data.

**[encryption.id.plain]** Verify plain ID usage for system files.
**[encryption.id.encrypted]** Verify encrypted ID usage for user content.
**[encryption.id.time]** Verify time-based ID functionality.

**[encryption.keys.sharing]** Verify sharing of encrypted keys when adding users.
**[encryption.keys.rotation]** Verify key rotation when removing users.

### **[sync]** Synchronization operations

**[sync.push]** Push changes from a device to a remote.
**[sync.pull]** Pull changes from a remote to a device.
**[sync.order]** Verify correct sync order (access control → changes → content).

**[sync.conflict]** Handle concurrent changes with CRDT resolution.
**[sync.interruption]** Handle sync interruptions gracefully.
**[sync.negative.quota]** Handle sync when remote quota is exceeded.
**[sync.negative.permissions]** Handle sync attempts without proper permissions.

**[sync.remote.cloud]** Sync with Freedom Cloud.
**[sync.remote.node]** Sync with Freedom Node.
**[sync.remote.device]** Direct device-to-device synchronization.

**[sync.config.add]** Add a new remote to sync configuration.
**[sync.config.remove]** Remove a remote from sync configuration.
**[sync.config.priority]** Modify remote priority in sync configuration.

### **[special]** Special bundles and operations

**[special.access-control]** Verify .access-control bundle functionality.
**[special.changes]** Verify .changes bundle functionality.
**[special.negative.tamper]** Handle attempts to tamper with special bundles.

### **[validation]** Content validation

**[validation.signature]** Verify content signature validation.
**[validation.provenance]** Verify content provenance validation.
**[validation.negative.invalid]** Handle invalid content validation gracefully.

### **[applications]** Application-specific scenarios

**[applications.allocation]** Verify application data allocation within a store.
**[applications.structure]** Verify application-defined folder structure.
**[applications.sharing]** Verify application-specific sharing rules.
**[applications.visibility]** Test visibility of application data through different UIs.

---

## Module to scenario mapping

### Store Management

### File System Operations

### Permission Management

### Encryption

### Synchronization

### Validation
