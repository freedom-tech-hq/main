import type { PR } from 'freedom-async';
import { allResultsMapped, AsyncTransient, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import type { SignedValue } from 'freedom-crypto-data';
import { makeSignedValueSchema } from 'freedom-crypto-data';
import { type SyncablePath, syncablePathSchema } from 'freedom-sync-types';
import type { ConflictFreeDocumentEvaluator, SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID, adminAndAboveRoles, STORE_CHANGES_BUNDLE_ID } from 'freedom-syncable-store-types';
import { once } from 'lodash-es';

import { checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder } from '../utils/checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder.ts';
import { getNearestFolderPath } from '../utils/get/getNearestFolderPath.ts';
import { getSyncableAtPath } from '../utils/get/getSyncableAtPath.ts';
import type { SyncableStoreChange } from './SyncableStoreChange.ts';
import { syncableStoreChangeSchema } from './SyncableStoreChange.ts';

const signedStoreChangeSchema = makeSignedValueSchema<SyncableStoreChange>(syncableStoreChangeSchema, undefined);

export const SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX = 'SYNC_STORE_CHANGES';
export type SyncableStoreChangesDocumentPrefix = typeof SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX;

type DocEval = ConflictFreeDocumentEvaluator<SyncableStoreChangesDocumentPrefix, SyncableStoreChangesDocument>;

export class SyncableStoreChangesDocument extends ConflictFreeDocument<SyncableStoreChangesDocumentPrefix> {
  private transients_ = new AsyncTransient(async () => {
    const deletedPathStrings = new Set<string>();

    const folderPath = this.getFolderPath_();

    const transients = { deletedPathStrings };
    for (const change of this.changes_.values()) {
      applyChangeToTransients(transients, (await change).value, { folderPath });
    }

    return transients;
  });

  constructor(snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<SyncableStoreChangesDocumentPrefix> }) {
    super(SYNCABLE_STORE_CHANGES_DOCUMENT_PREFIX, snapshot);
  }

  public static newDocument = (folderPath: SyncablePath) => {
    const doc = new SyncableStoreChangesDocument();
    doc.folderPath_.set(folderPath);
    return doc;
  };

  /** Older documents were initialized in this way, so this provides backwards compatibility */
  public initializeFolderPath = (folderPath: SyncablePath) => {
    if (this.folderPath_.get() === undefined) {
      this.folderPath_.set(folderPath);
    }
  };

  // ConflictFreeDocumentEvaluator Methods

  public static loadDocument: DocEval['loadDocument'] = (snapshot) => new SyncableStoreChangesDocument(snapshot);

  public static isSnapshotValid: DocEval['isSnapshotValid'] = makeAsyncResultFunc(
    [import.meta.filename, 'isSnapshotValid'],
    async (_trace, { originRole }): PR<boolean> =>
      // Only creators can create folders (and therefor store change bundles and snapshots)
      makeSuccess(originRole === 'creator')
  );

  public static isDeltaValidForDocument: DocEval['isDeltaValidForDocument'] = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForDocument'],
    async (trace, document, { store, path, originRole, encodedDelta }): PR<boolean> => {
      // Only admins and above can create store change deltas
      if (!adminAndAboveRoles.has(originRole)) {
        return makeSuccess(false);
      }

      return await document.isDeltaValidForRole_(trace, { store, path, role: originRole, encodedDelta });
    }
  );

  // Overridden Public Methods

  public override async clone(out?: SyncableStoreChangesDocument): Promise<SyncableStoreChangesDocument> {
    return (await super.clone(out ?? new SyncableStoreChangesDocument())) as SyncableStoreChangesDocument;
  }

  public override applyDeltas(
    deltas: Array<EncodedConflictFreeDocumentDelta<SyncableStoreChangesDocumentPrefix>>,
    options?: { updateDeltaBasis?: boolean }
  ): void {
    super.applyDeltas(deltas, options);

    this.transients_.markNeedsUpdate();
  }

  // Field Helpers

  public readonly isDeletedPath = makeAsyncResultFunc(
    [import.meta.filename, 'isDeletedPath'],
    async (trace, path: SyncablePath): PR<boolean> => {
      if (!path.startsWith(this.getFolderPath_())) {
        return makeSuccess(false); // Not owned by this folder
      }

      const transients = await this.transients_.getValue(trace);

      return makeSuccess(transients.deletedPathStrings.has(makeKeyFromPath({ folderPath: this.getFolderPath_(), path })));
    }
  );

  public readonly addChange = makeAsyncResultFunc(
    [import.meta.filename, 'addChange'],
    async (trace: Trace, change: SignedValue<SyncableStoreChange>): PR<undefined> => {
      const transients = await this.transients_.getValue(trace);

      // Directly modifying the transients
      applyChangeToTransients(transients, change.value, { folderPath: this.getFolderPath_() });

      this.changes_.append([change]);

      return makeSuccess(undefined);
    }
  );

  // Private Field Access Methods

  private get changes_() {
    return this.generic.getAsyncArrayField<SignedValue<SyncableStoreChange>>('changes', signedStoreChangeSchema);
  }

  private get folderPath_() {
    return this.generic.getObjectField<SyncablePath>('folderPath', syncablePathSchema);
  }

  // Private Methods

  private readonly getFolderPath_ = once(() => this.folderPath_.get()!);

  private readonly isDeltaValidForRole_ = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForRole_'],
    async (
      trace,
      {
        store,
        path: deltaPath,
        role,
        encodedDelta
      }: {
        store: SyncableStore;
        path: SyncablePath;
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
        case 'appender':
          // Editors, viewers, and appenders are never allowed to make store changes
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
        const addedChangeValue = (await addedChange).value;
        switch (addedChangeValue.type) {
          case 'delete': {
            const checked = await allResultsMapped(trace, addedChangeValue.paths, {}, async (trace, path) => {
              // Checking that the path being deleted is directly associated with the folder associated with this store change document
              const nearestFolderPath = await getNearestFolderPath(trace, store, path);
              if (!nearestFolderPath.ok) {
                return nearestFolderPath;
              } else if (!nearestFolderPath.value.isEqual(deltaPath)) {
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
              if (path.ids.find((id) => id === ACCESS_CONTROL_BUNDLE_ID || id === STORE_CHANGES_BUNDLE_ID) !== undefined) {
                return makeSuccess(false);
              }

              return makeSuccess(true);
            });
            if (!checked.ok) {
              return generalizeFailureResult(trace, checked, ['not-found', 'untrusted', 'wrong-type']);
            } else if (checked.value.includes(false)) {
              return makeSuccess(false);
            }
          }
        }
      }

      return makeSuccess(true);
    }
  );
}

// Helpers

const applyChangeToTransients = (
  { deletedPathStrings }: { deletedPathStrings: Set<string> },
  change: SyncableStoreChange,
  { folderPath }: { folderPath: SyncablePath }
) => {
  switch (change.type) {
    case 'delete':
      for (const path of change.paths) {
        deletedPathStrings.add(makeKeyFromPath({ folderPath, path }));
      }

      break;
  }
};

const makeKeyFromPath = ({ folderPath, path }: { folderPath: SyncablePath; path: SyncablePath }): string => {
  if (!path.startsWith(folderPath)) {
    throw new Error(`${path.toString()} isn't owned by ${folderPath.toString()}`);
  }

  return path.ids.slice(folderPath.ids.length).join('/');
};
