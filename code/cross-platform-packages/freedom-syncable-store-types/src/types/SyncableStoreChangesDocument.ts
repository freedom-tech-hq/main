import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import type { SignedValue } from 'freedom-crypto-data';
import { makeSignedValueSchema } from 'freedom-crypto-data';
import type { StaticSyncablePath } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_FILE_ID, STORE_CHANGES_BUNDLE_FILE_ID } from '../consts/special-file-ids.ts';
import { checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder } from '../utils/checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder.ts';
import { getFolderPath } from '../utils/get/getFolderPath.ts';
import { getSyncableAtPath } from '../utils/get/getSyncableAtPath.ts';
import type { SyncableStore } from './SyncableStore.ts';
import type { SyncableStoreChange } from './SyncableStoreChange.ts';
import { syncableStoreChangeSchema } from './SyncableStoreChange.ts';
import type { SyncableStoreRole } from './SyncableStoreRole.ts';

const signedStoreChangeSchema = makeSignedValueSchema<SyncableStoreChange>(syncableStoreChangeSchema, undefined);

export const SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX = 'SYNC_STORE_CHANGES';
export type SyncableStoreChangesDocumentPrefix = typeof SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX;

export class SyncableStoreChangesDocument extends ConflictFreeDocument<SyncableStoreChangesDocumentPrefix> {
  private deletedPathStrings_: Set<string> = new Set();

  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<SyncableStoreChangesDocumentPrefix> }) {
    super(SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX, snapshot);

    this.rebuildState_();
  }

  // Overridden Public Methods

  public override clone(out?: SyncableStoreChangesDocument): SyncableStoreChangesDocument {
    return super.clone(out ?? new SyncableStoreChangesDocument()) as SyncableStoreChangesDocument;
  }

  public override applyDeltas(
    deltas: Array<EncodedConflictFreeDocumentDelta<SyncableStoreChangesDocumentPrefix>>,
    options?: { updateDeltaBasis?: boolean }
  ): void {
    super.applyDeltas(deltas, options);

    this.rebuildState_();
  }

  // Field Helpers

  public readonly isDeletedPath = (path: StaticSyncablePath) => {
    return this.deletedPathStrings_.has(path.toString());
  };

  public readonly addChange = makeAsyncResultFunc(
    [import.meta.filename, 'addChange'],
    async (_trace: Trace, change: SignedValue<SyncableStoreChange>): PR<undefined> => {
      this.applyChangeToState_(change.value);

      this.changes_.append([change]);

      return makeSuccess(undefined);
    }
  );

  // Public Methods

  public readonly isDeltaValidForRole = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForRole'],
    async (
      trace,
      {
        store,
        path: deltaPath,
        role,
        encodedDelta
      }: {
        store: SyncableStore;
        path: StaticSyncablePath;
        role: SyncableStoreRole;
        encodedDelta: EncodedConflictFreeDocumentDelta<SyncableStoreChangesDocumentPrefix>;
      }
    ): PR<boolean> => {
      switch (role) {
        case 'creator':
          // Creators can do anything
          return makeSuccess(true);
        case 'editor':
        case 'viewer':
          // Editors and viewers are never allowed to make store changes
          return makeSuccess(false);
        case 'owner':
        case 'admin':
          break;
      }

      const beforeChanges = Array.from(this.changes_.values());

      this.applyDeltas([encodedDelta]);

      const afterChanges = Array.from(this.changes_.values());

      // All changes from "before" should still be present in "after" and in the same relative order
      const addedChanges = checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder({
        before: beforeChanges,
        after: afterChanges
      });
      if (addedChanges === undefined) {
        return makeSuccess(false);
      }

      for (const addedChange of addedChanges) {
        switch (addedChange.value.type) {
          case 'delete': {
            const checked = await allResultsMapped(trace, addedChange.value.paths, {}, async (trace, path) => {
              // Checking that the path being deleted is directly associated with the folder associated with this store change document
              const folderPath = await getFolderPath(trace, store, path);
              if (!folderPath.ok) {
                return folderPath;
              } else if (!folderPath.value.isEqual(deltaPath)) {
                return makeSuccess(false);
              }

              // Checking that the item being deleted isn't a folder, since only creators can delete folders
              const syncableItem = await getSyncableAtPath(trace, store, path);
              if (!syncableItem.ok) {
                return syncableItem;
              } else if (syncableItem.value.type === 'folder') {
                return makeSuccess(false);
              }

              // Deletes are never allowed inside of special access control or store change bundles
              if (path.ids.find((id) => id === ACCESS_CONTROL_BUNDLE_FILE_ID || id === STORE_CHANGES_BUNDLE_FILE_ID) !== undefined) {
                return makeSuccess(false);
              }

              return makeSuccess(true);
            });
            if (!checked.ok) {
              return generalizeFailureResult(trace, checked, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
            } else if (checked.value.includes(false)) {
              return makeSuccess(false);
            }
          }
        }
      }

      return makeSuccess(true);
    }
  );

  // Private Field Access Methods

  private get changes_() {
    return this.generic.getArrayField<SignedValue<SyncableStoreChange>>('changes', signedStoreChangeSchema);
  }

  // Private Methods

  private readonly applyChangeToState_ = (change: SyncableStoreChange) => {
    switch (change.type) {
      case 'delete':
        for (const path of change.paths) {
          this.deletedPathStrings_.add(path.toString());
        }

        break;
    }
  };

  private readonly rebuildState_ = () => {
    this.deletedPathStrings_ = new Set<string>();

    for (const change of this.changes_.values()) {
      this.applyChangeToState_(change.value);
    }
  };
}

export const makeNewSyncableStoreChangesDocument = () => new SyncableStoreChangesDocument();

export const makeSyncableStoreChangesDocumentFromSnapshot = (snapshot: {
  id: string;
  encoded: EncodedConflictFreeDocumentSnapshot<SyncableStoreChangesDocumentPrefix>;
}) => new SyncableStoreChangesDocument(snapshot);
