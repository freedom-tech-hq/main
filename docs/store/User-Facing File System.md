---
status: generally complete, but having TODOs
---
# User-Facing File System

## What You Possess

1. **Account** – Represents a single user.
2. **Store** – A physical implementation of the Synchronized File Store, defined by this section. One account may create many stores.

## What You See In a Store

When working with Freedom's **decrypted** virtual file system, you interact with three primary types of objects:

1. **Folders**
  - Can hold other **folders**, **bundles**, and **files**.
  - Each folder is **independently sharable**.
2. **Bundles**
  - Can hold other **bundles** and **files** (not folders.)
  - Unlike folders, bundles don't have their own sharing capabilities – they **inherit permissions** from their parent folder.
3. **Files**
  - Contain any data, but treated as binary.
  - Files are **immutable** (cannot be changed once created). Though they can be deleted.
  - **Inherit permissions** from their parent folder (directly or through bundles).

Note: the look of the **encrypted** state of the file system is described in [File System Encryption](File%20System%20Encryption.md).

## Permissions Overview

Objects in the file system have permission roles that determine what users can do:

- **Creator** - The original creator of a root folder who has full control. There's exactly one creator per root.
    - TODO: answer, what is a ‘root’, what is a creator for a file? If Bob created a file in Alice’s shared folder, who is the owner? Who’s quota is consumed on the cloud server?

- **Owner** - Can manage users, content, and perform most actions except modifying the creator.

- **Admin** - Can add/remove editors and viewers, manage content, and create folders.

- **Editor** - Can view folders, read and write most bundles and files.

- **Viewer** - Can only read folders, bundles, and files.

- **Appender** - Can create bundles and files, but cannot read them.

More formal definition of the roles is in [Permission Management](Permission%20Management.md).

## Hidden bundles

Permissions and other implementation-specific information is stored in the pre-defined bundles. They are described in the respective sections.

## Applications

Every individual application working with a store defines its own file structure and sharing.

E.g. Email application defines folder structure and sharing with SMTP server that has keys as a virtual user, writes the inbox and reads outgoing emails.

TODO: Decide
- Does the user see the folders of an application or are they hidden for a file-system UI and rendered only through the app-specific UI.
- Does an application always use a separate store or do we allow them to allocate its data within a general-purpose user store?


— END, move the rest to another file —

## Special Bundles

Each folder contains two special administrative bundles that help manage the file system:

- `.access-control` - Contains role/access information and encrypted shared keys
- `.changes` - Contains information about deleted items

## Deletions

Files in the system are immutable, but they can be "deleted" from view. When you delete a file:

- It immediately disappears from your view
- The underlying data may still exist for a retention period
- The deletion is recorded in the `.changes` special bundle

Note that IDs of folders, bundles, and files cannot be reused, even after deletion.
