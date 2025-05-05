import type { AccessControlDocumentPrefix, InitialAccess } from 'freedom-access-control-types';
import { AccessControlDocument } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { inline, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { timeIdInfo } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import { deserialize } from 'freedom-serialization';
import { extractUnmarkedSyncableId, type SyncablePath } from 'freedom-sync-types';
import type { ConflictFreeDocumentEvaluator, SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';
import { adminAndAboveRoles, editorAndBelowRoles, ownerAndBelowRoles, syncableStoreRoleSchema } from 'freedom-syncable-store-types';
import { isEqual } from 'lodash-es';

import { checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder } from '../utils/checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder.ts';

type DocEval = ConflictFreeDocumentEvaluator<AccessControlDocumentPrefix, SyncableStoreAccessControlDocument>;

export class SyncableStoreAccessControlDocument extends AccessControlDocument<SyncableStoreRole> {
  constructor(fwd?: { snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> } }) {
    super({ roleSchema: syncableStoreRoleSchema, ...fwd });
  }

  public static newDocument = async (initialAccess: InitialAccess<SyncableStoreRole>) => {
    const doc = new SyncableStoreAccessControlDocument({});
    await doc.initialize({ access: initialAccess });
    return doc;
  };

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new SyncableStoreAccessControlDocument({ snapshot });

  public static isSnapshotValid: DocEval['isSnapshotValid'] = makeAsyncResultFunc(
    [import.meta.filename, 'isSnapshotValid'],
    async (_trace, { originRole }): PR<boolean> =>
      // Only creators can create folders (and therefor access control bundles and snapshots)
      makeSuccess(originRole === 'creator')
  );

  public static isDeltaValidForDocument: DocEval['isDeltaValidForDocument'] = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForDocument'],
    async (trace, document, { store, path, originRole, encodedDelta }): PR<boolean> => {
      // Only admins and above can create access control deltas
      if (!adminAndAboveRoles.has(originRole)) {
        return makeSuccess(false);
      }

      return await document.isDeltaValidForRole_(trace, { store, path, role: originRole, encodedDelta });
    }
  );

  // Overridden Public Methods

  public override async clone(out?: SyncableStoreAccessControlDocument): Promise<SyncableStoreAccessControlDocument> {
    if (out === undefined) {
      return (await super.clone(out)) as SyncableStoreAccessControlDocument;
    } else {
      const doc = new SyncableStoreAccessControlDocument();
      await doc.initialize({ access: await this.initialAccess_ });
      return (await super.clone(doc)) as SyncableStoreAccessControlDocument;
    }
  }

  // Public Methods

  private cacheCreatorCryptoKeySetId_: Promise<CryptoKeySetId | undefined> | undefined;
  public get creatorCryptoKeySetId(): Promise<CryptoKeySetId | undefined> {
    if (this.cacheCreatorCryptoKeySetId_ === undefined) {
      this.cacheCreatorCryptoKeySetId_ = inline(async (): Promise<CryptoKeySetId | undefined> => {
        const initialState = await this.initialState_.get();
        const foundCreator = objectEntries(initialState?.value ?? {}).find(([_cryptoKeySetId, role]) => role === 'creator');
        return foundCreator?.[0];
      });
    }

    return this.cacheCreatorCryptoKeySetId_;
  }

  // Private Methods

  private readonly isDeltaValidForRole_ = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForRole_'],
    async (
      trace,
      {
        path,
        role,
        encodedDelta
      }: {
        store: SyncableStore;
        path: SyncablePath;
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

      const timeId = extractUnmarkedSyncableId(path.lastId!);
      if (!timeIdInfo.is(timeId)) {
        // The file ID should be a timeId
        return makeSuccess(false);
      }
      const deltaFileTimeMSec = timeIdInfo.extractTimeMSec(timeId);
      for (const addedChange of addedChanges) {
        const deserializedChange = await deserialize(trace, (await addedChange).value);
        if (!deserializedChange.ok) {
          return makeSuccess(false);
        }

        if (deserializedChange.value.timeMSec !== deltaFileTimeMSec) {
          // The time in the delta doesn't match the file time
          return makeSuccess(false);
        }

        switch (deserializedChange.value.type) {
          case 'add-access':
            if (!allowedTargetRoles.has(deserializedChange.value.role)) {
              return makeSuccess(false);
            }
            break;

          case 'modify-access':
            if (!allowedTargetRoles.has(deserializedChange.value.oldRole) || !allowedTargetRoles.has(deserializedChange.value.newRole)) {
              return makeSuccess(false);
            }
            break;

          case 'remove-access':
            if (!allowedTargetRoles.has(deserializedChange.value.oldRole)) {
              return makeSuccess(false);
            }
            break;
        }
      }

      return makeSuccess(true);
    }
  );
}
