# Freedom Syncable Store Types

Shared types for encrypted, sharable data.

These data are modeled in a file-system like manner and meant to be stored in memory, on disk, or in a DB.  They are designed to be used asynchronously, in parallel, and by multiple users.

There are four primitive types:

- root - the top level folder, which can contain other folders but no direct files, other than a few special files discussed later
- folder - may contain other folders, bundles, and files.  Each folder is sharable.  Sharing a parent folder gives data access to sub-folders, but not necessarily to decrypt the data those sub-folders contain.
- bundle - may contain other bundles and files.  Bundles, unlike folders, do not have their own sharing capabilities.  They are shared as part of whatever parent folder they're in.
- (flat) file - Contain binary data.  These are immutable and are shared as part of whatever parent folder they're in.

## Encryption

Most bundles and files are signed and encrypted at the top level, so their contents are entirely unreadable by Freedom or anyone else without the necessary keys.  This includes all API-created bundles and files.  Details on sharing and multi-user encryption are discussed later.

### Special Bundles

There are two special bundles, per root / folder, who's contents aren't encrypted at the top level, which are used to help with data access and data management.  These aren't encrypted at the top level, but changes to these documents must be signed and they're append-only.

- `.access-control` - role / access information and encrypted shared secrets
- `.changes` - information about deletions

## Access Control

Each folder has a special access control bundle, which isn't encrypted at the top level -- though individual elements within the bundle are signed and/or encrypted.

Access control bundles are documents, encoded, using multiple sub-bundles and files, as conflict free resolution data types (CRDT).

Each access control document has an initial access state, which is signed by the creator.

### Roles

Syncable stores support 5 roles:

- creator - an owner who cannot be removed or modified.  There is exactly one creator per root.
- owner
  - can add or remove users of any type (except creator)
  - can read, write, and delete bundles and flat files
  - can create and delete folders
  - can accept or reject changes
- admin
  - can add or remove editors and viewers
  - can read, write, and delete most bundles and flat files
  - can read folders
- editor
  - can read folders
  - can read and and write most bundles and flat files
- viewer
  - can read folders, bundles, and flat files

App-specific semantics may also be enforced for these roles.

---

Changes to access control documents are made by appending signed changes.  Any user may attempt to make changes, but disallowed changes will be rejected by synchronizing servers and by end user apps and devices.  In order to ensure that access control changes are validated in a linear order, the changes files are named using timestamps signed by a trusted time source, which could be a Freedom Cloud or Node, for example.

There are three types of access control changes: add, remove, and modify.  For a change to be accepted, the signing user must have the correct privilege to make the requested change.  In the case of potentially conflicting access changes, the first successful write to each remote wins and upstream remotes have priority over downstream remotes.

_Note: in the future, especially to support app-specific permissions modeling, custom bundles will be flaggable as append-only, which will then disallow deletion options within the bundle._

## Sharing

Access control documents contain a set of shared secrets, encrypted for each member with access.  The most recent shared secret should typically be used, so that users who have been removed, won't be able to read new data.

When new users are added, all of the previous secrets are encrypted for the new user and added to the document.

When users are removed, a new secret is generated and encrypted for all remaining members.  It's up to apps to decide if and when to reencrypt old data using new keys, which can be expensive both in terms of bandwidth and computation.

Each user has a main key set, which includes public keys for encrypting data and verifying signatures and private keys for decrypting data and generating signatures.  Freedom offers a registry for looking these public keys up using other information, like phone numbers, but public keys can also be exchanged and verified through external channels.

### Secrets

Shared secrets are actually 4096-bit RSA-OAEP keys using SHA-256 hashing where the private key is encrypted such that only the associated member can decrypt it.

_// TODO: support reencryption in code_

## Reading

Data read protection is managed in two ways:

- access to the actual bits of the (encrypted) data
- the ability to decrypt the data

When accessing remotes (e.g. Freedom cloud services or Freedom Nodes) to read or write data in a shared folder, one sends a signed token with each request.  These tokens are checked against the current state of the access control document, and the remote then grants or rejects access to read (or write) bits.

For the portions of data a user wants to read, the user's device must also have the keys to decrypt.  The keys are the shared secrets that have been encrypted for each member.

Each encrypted piece of data includes information about how it was encrypted, including a shared secret ID.  Each shared secret has an ID and a map of public key IDs to encrypted keys.  The user decrypts the secret key using their main private key.  Then, they decrypt the data using the secret key.  _We don't directly encrypt the data for each user because that would lead to as many copies of the data as their are members, which would be both space and computationally inefficient, especially for larger data chunks._

_// TODO: add support for optionally downloading metadata only / lazily downloading folders / files / optimizing local file storage_

## Writing

Write protection is managed by remotes in the same way as read protection.  Users send a signed token, which is checked against the access control document.

To write data, one decrypts the most recent shared secret and then encrypts their new data using that.

Apps may provide their own additional semantics with respect to writing, but in general those with write access should be trusted.

## Deletion

All files are immutable and IDs of folders, bundles, and files can't be reused.  However, files may be deleted.

Deletions are managed by a separate "store change" CRDT.  There's one store change document per root and per folder.  To delete a document, a signed change is appended onto the store change document, requesting the deletion.

The folder or file requested for deletion will appear to be immediately deleted, but the underlying data may have a retention period associated with it, in an app-specific manner.

Users without delete access may, in an app-specific way, still virtually delete or request deletions, if the app itself allows.  However, the realization and acceptance of such deletions will need to be approved by an owner or admin.  For example, if an editor requests deletion in a photo sharing app of their own photo let's say, an owner / admin device could recognize the request and then turn that into an actual delete change – and when such an owner/admin user has an online Freedom Node, these options can be immediate.  Freedom won't be able to make these kinds of app-specific determinations because we won't have access to the data to know things like who the original uploader of a photo is, to continue the previous example.

_// TODO: add support for undelete in code_

## Synchronization

We've casually mentioned "remotes" and "tokens" without really going into what these are.

Remotes are the systems we synchronize with.  In the most common cases, these will be a Freedom Cloud and Freedom Nodes.  Each sharable folder can be configured, per user, to sync with any number of remotes, in priority order.

On end-user devices, for most changes, synchronization will stop after the first success, for each operation.  It's  assumed that synchronization between remotes will be faster, less expensive, and/or more reliable than synchronization between end-user devices and remotes.  The exception to this is for user profile allocation, where the end-user device will push their profile to all of their desired remotes, in order to establish initial access.  User profile allocation may also require special authorization per remote.

Since folders and files are immutable, all operations are effectively append-only.  We typically use CRDTs where mutability might be required.

Tokens are really just timestamped data signed with a user's private signing key, which can be validated using their public signature validation key.  The exact validity interpretation of a token is up to apps, but generally tokens are valid for a certain amount of time and/or a certain number of uses, per remote.

Other than selecting which systems to sync between, and potentially priority order, synchronization and collaboration should be automatic.

## Appendices

### Data Encryption

We encrypt data in two different ways, depending on the size of the data being encrypted.

For small data chunks (not more than 446 bytes), we encrypt data using the user's or shared secret private key directly.  We currently use 4096-bit RSA-OAEP keys using SHA-256 hashing.

For larger chunks, we use a two-stage encryption where we first encrypt an AES key using the private key and then encrypt the data chunk using the AES key.  We include the encrypted AES key in the chunk metadata.  AES keys are reused throughout an app's runtime, up to 10000 times, or until they're explicitly rotated.

We include metadata about how each chunk was encrypted, generally including the key ID.

### Signatures

We currently use 4096-bit RSASSA-PKCS1-v1_5 using SHA-256 hashing for signatures.

### CRDT Bundles

Conflict free resolution data types (CRDTs) allow us to merge data from multiple sources without dealing with complex, manual conflict resolution.

We're currently using Yjs to encode our CRDTs and support rich text data and a variety of other complex data types.

For synchronization, we store CRDTs in bundles.  CRDT bundles each have at least 2 sub-bundles, representing snapshots and deltas (there's actually a separate deltas sub-bundle per snapshot).  Snapshots allow us to flatten and compress data, especially when we know all parties are in-sync.  Deltas represent the changes made on top of a given snapshot.

Each saved change is written to a delta file, which can then be synchronized.

### Synchronization with Access Control Change Examples

Let's examine possible synchronization scenarios, especially involving access control changes and 3 hypothetical systems:

- User Device (Device)
- Freedom Cloud (Cloud)
- Freedom Node (Node)

#### Scenario 1 - Everything as Expected

A folder "/albums/ALBUM_1" is created on Device and initialized with default access.  That is, the creator has signed initial access settings.

Device pushes "/albums/ALBUM_1" to Cloud.

Cloud verifies the initial access settings by checking their signature using the creator's public verification key.

_The storage root ID, which is used to distinguish different roots, is generated from the user ID.  The user ID includes a signature created from the user's private signing key, which is verifiable by their public signature verification key.  We can check that the same signing key was used to sign the initial access settings for the new folder as was used to create the user ID in the first place, granting "creator" role access._

Cloud broadcasts notifications for listeners of "/" and "/albums" that something has changed.  Downstream systems will generally listen for the highest level common root or folder that they have access to – so creators will listen to "/" for their roots.

Device asks Cloud for the current state of "/" and determines that nothing has changed from its perspective.

Simultaneously, Node asks Cloud for the current state of "/" and determines that something changed in "/albums" (because the hash of that doesn't match what's on Node).  Node then asks Cloud for the current state of "/albums".  It discovers a new folder, "ALBUM_1".  A new empty folder is created representing "/albums/ALBUM_1" on Node.  Node then discovers that a ".access-control" bundle exists in "/albums/ALBUM_1", which has its own sub-bundles and files.

Within any folder, the synchronization system always syncs in the following order:

1. `.access-control` bundle
1. `.changes` bundle
1. all other content

When an access control document change happens, it will be validated before it's fully accepted.  This same validation happens on each remote and end-user device that encounters these changes.

First, the signatures of the timestamps and contents are checked…