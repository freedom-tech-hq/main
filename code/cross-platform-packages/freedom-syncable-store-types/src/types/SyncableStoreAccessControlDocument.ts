import type { AccessControlDocumentPrefix, InitialAccess } from 'freedom-access-control-types';
import { AccessControlDocument } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { inline, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { OldSyncablePath } from 'freedom-sync-types';
import { isEqual } from 'lodash-es';

import { checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder } from '../utils/checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder.ts';
import { generateContentHashForSyncableStoreAccessChange } from '../utils/generateContentHashForSyncableStoreAccessChange.ts';
import { isTrustedTimeNameValidForPath } from '../utils/validation/isTrustedTimeNameValidForPath.ts';
import type { SyncableStore } from './SyncableStore.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';
import { editorAndBelowRoles, ownerAndBelowRoles, syncableStoreRoleSchema } from './SyncableStoreRole.ts';

export class SyncableStoreAccessControlDocument extends AccessControlDocument<SyncableStoreRole> {
  constructor(
    fwd:
      | { initialAccess: InitialAccess<SyncableStoreRole>; snapshot?: undefined }
      | { initialAccess?: undefined; snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> } }
  ) {
    super({ roleSchema: syncableStoreRoleSchema, ...fwd });
  }

  // Overridden Public Methods

  public override clone(out?: SyncableStoreAccessControlDocument): SyncableStoreAccessControlDocument {
    return super.clone(
      out ?? new SyncableStoreAccessControlDocument({ initialAccess: this.initialAccess_ })
    ) as SyncableStoreAccessControlDocument;
  }

  // Public Methods

  public get creatorCryptoKeySetId(): CryptoKeySetId | undefined {
    const foundCreator = objectEntries(this.initialState_.get()?.value ?? {}).find(([_cryptoKeySetId, role]) => role === 'creator');
    return foundCreator?.[0];
  }

  public readonly isDeltaValidForRole = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForRole'],
    async (
      trace,
      {
        store,
        path,
        role,
        encodedDelta
      }: {
        store: SyncableStore;
        path: OldSyncablePath;
        role: SyncableStoreRole;
        encodedDelta: EncodedConflictFreeDocumentDelta<AccessControlDocumentPrefix>;
      }
    ): PR<boolean> => {
      switch (role) {
        case 'creator':
          // Creators can do anything
          return makeSuccess(true);
        case 'editor':
        case 'viewer':
        case 'appender':
          // Editors, viewers, and appenders are never allowed to make access control changes
          return makeSuccess(false);
        case 'owner':
        case 'admin':
          break;
      }

      const beforeInitialState = this.initialState_;
      const beforeChanges = Array.from(this.changes_.values());
      const beforeSharedKeys = Array.from(this.sharedKeys_.values());

      this.applyDeltas([encodedDelta]);

      const afterInitialState = this.initialState_;
      const afterChanges = Array.from(this.changes_.values());
      const afterSharedKeys = Array.from(this.sharedKeys_.values());

      // Initial state should be immutable
      if (!isEqual(beforeInitialState, afterInitialState)) {
        return makeSuccess(false);
      }

      // All changes from "before" should still be present in "after" and in the same relative order
      const addedChanges = checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder({
        before: beforeChanges,
        after: afterChanges
      });
      if (addedChanges === undefined) {
        return makeSuccess(false);
      }

      // If no changes were added, the delta is likely logically out of order, with respect to the CRDT.
      // This can be dangerous because there could be rogue changes that appear to not be applied, but that would later be applied with
      // subsequent delta applications.  The relative-order check should theoretically catch these types of cases too.
      // TODO: more analysis is needed here
      if (addedChanges.length === 0) {
        return makeSuccess(false);
      }

      // All shared keys from "before" should still be present in "after" and in the same relative order
      const addedSharedKeys = checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder({
        before: beforeSharedKeys,
        after: afterSharedKeys
      });
      if (addedSharedKeys === undefined) {
        return makeSuccess(false);
      }

      // TODO: could probably check for corruption of shared keys in a more meaningful way

      const allowedTargetRoles: Set<SyncableStoreRole> = inline(() => {
        switch (role) {
          case 'admin':
            // Admins can add / remove / modify editors and viewers only
            return editorAndBelowRoles;
          case 'owner':
            // Owners can add / remove / modify owners, admins, editors, and viewers (just not creators)
            return ownerAndBelowRoles;
        }
      });

      for (const addedChange of addedChanges) {
        const contentHash = await generateContentHashForSyncableStoreAccessChange(trace, addedChange.value);
        if (!contentHash.ok) {
          return contentHash;
        }

        const trustedTimeNameValid = await isTrustedTimeNameValidForPath(trace, store, {
          path,
          trustedTimeName: addedChange.value.trustedTimeName,
          contentHash: contentHash.value
        });
        if (!trustedTimeNameValid.ok) {
          return makeSuccess(false);
        }

        switch (addedChange.value.type) {
          case 'add-access':
            if (!allowedTargetRoles.has(addedChange.value.role)) {
              return makeSuccess(false);
            }
            break;

          case 'modify-access':
            if (!allowedTargetRoles.has(addedChange.value.oldRole) || !allowedTargetRoles.has(addedChange.value.newRole)) {
              return makeSuccess(false);
            }
            break;

          case 'remove-access':
            if (!allowedTargetRoles.has(addedChange.value.oldRole)) {
              return makeSuccess(false);
            }
            break;
        }
      }

      return makeSuccess(true);
    }
  );
}
