---
status: AI-version, revise it
---
# Permission Management

## How Permissions Are Stored

Permissions are stored in the `.access-control` special bundle within each folder. This bundle:

- Isn't encrypted at the top level, but contains signed and/or encrypted elements
- Is structured as a conflict-free resolution data type (CRDT)
- Contains the role assignments for each user
- Stores encrypted shared keys (secret keys encrypted per user with read access)

## Permission Change Process

1. **Adding/Changing Permissions**: Users with sufficient privileges append signed changes to the access control document
2. **Change Validation**: 
   - Changes must be signed by a user with appropriate privileges
   - Disallowed changes are rejected by servers and client apps
   - Changes are named using timestamps signed by trusted time sources

3. **Types of Access Control Changes**:
   - Add - Grant access to a user
   - Remove - Revoke access from a user
   - Modify - Change a user's role

## Key Management with Permissions

When permissions change, key management follows these rules:

- **Adding Users**: All previous secrets are encrypted for the new user and added to the document
- **Removing Users**: A new secret is generated and encrypted for all remaining members
- **Key Rotation**: Apps decide if and when to re-encrypt old data using new keys

## Validation Process

Validation of permission changes follows this sequence:

1. If the change has an acceptance by a high-trust user:
   - The acceptance is validated
2. Otherwise:
   - The origin signature is validated
   - Role-specific validation rules are applied

## Conflict Resolution

Permission changes made by multiple devices are merged automatically using CRDT resolution. This ensures that permission data remains consistent across all copies of the file system, even with out-of-sync changes.
