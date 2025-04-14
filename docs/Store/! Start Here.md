# Synchronized File Store

This folder documents the core of the product – the full-stack distributed file system implementation.

## Features

- Encryption on the client.
- Sharing and permissions.
- Push/pull (git-like) synchronization.
- Application-level conventions.
    - E.g. Email application defines folder structure and sharing with SMTP server that has keys as a virtual user, writes the inbox and reads outgoing emails.

## Principles

The component is exceptionally complex. So we maintain its documentation in layers:

1. [User-Facing File System](User-Facing%20File%20System.md) – how the decrypted file system looks to the user.
2. [Permission Management](Permission%20Management.md) – how sharing is implemented.
3. [File System Encryption](File%20System%20Encryption.md) – how encryption of content, filenames, and permissions is implemented.
4. [Synchronization](Synchronization.md) – push/pull protocol(s).

**Note:** public key and user registry is not included. TODO: describe and link.

Original document from Google Docs (should be deprecated): [Freedom Syncable Items](Freedom%20Syncable%20Items.md)
