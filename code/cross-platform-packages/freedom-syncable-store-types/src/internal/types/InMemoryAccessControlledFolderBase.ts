import { generateSignedAddAccessChange, generateSignedModifyAccessChange } from 'freedom-access-control';
import type {
  AccessChange,
  AccessChangeParams,
  AccessControlDocumentPrefix,
  AccessControlState,
  TimedAccessChange
} from 'freedom-access-control-types';
import type { FailureResult, PR, Result } from 'freedom-async';
import {
  allResults,
  allResultsNamed,
  excludeFailureResult,
  firstSuccessResult,
  makeAsyncResultFunc,
  makeFailure,
  makeSuccess
} from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError, NotFoundError } from 'freedom-common-errors';
import type { EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { type Trace } from 'freedom-contexts';
import { generateSha256HashFromHashesById } from 'freedom-crypto';
import type { CryptoKeySetId, SignedValue, TrustedTimeId } from 'freedom-crypto-data';
import type {
  DynamicSyncableId,
  StaticSyncablePath,
  SyncableId,
  SyncableItemType,
  SyncablePath,
  SyncableProvenance
} from 'freedom-sync-types';
import { DynamicSyncablePath } from 'freedom-sync-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';
import { getDefaultInMemoryTrustedTimeSource } from 'freedom-trusted-time-source';
import { pick } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import { ACCESS_CONTROL_BUNDLE_FILE_ID, STORE_CHANGES_BUNDLE_FILE_ID } from '../../consts/special-file-ids.ts';
import type { SyncableStoreBacking } from '../../types/backing/SyncableStoreBacking.ts';
import type { GenerateNewSyncableItemIdFunc } from '../../types/GenerateNewSyncableItemIdFunc.ts';
import type { MutableAccessControlledFolderAccessor } from '../../types/MutableAccessControlledFolderAccessor.ts';
import type { MutableFileStore } from '../../types/MutableFileStore.ts';
import type { MutableFolderStore } from '../../types/MutableFolderStore.ts';
import type { MutableSyncableItemAccessor } from '../../types/MutableSyncableItemAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import type { SyncableItemAccessor } from '../../types/SyncableItemAccessor.ts';
import { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { SyncableStoreChangesDocument, SyncableStoreChangesDocumentPrefix } from '../../types/SyncableStoreChangesDocument.ts';
import {
  makeNewSyncableStoreChangesDocument,
  makeSyncableStoreChangesDocumentFromSnapshot
} from '../../types/SyncableStoreChangesDocument.ts';
import type { SyncableStoreRole } from '../../types/SyncableStoreRole.ts';
import { adminAndAboveRoles, syncableStoreRoleSchema } from '../../types/SyncableStoreRole.ts';
import type { SyncTracker, SyncTrackerNotifications } from '../../types/SyncTracker.ts';
import { createConflictFreeDocumentBundleAtPath } from '../../utils/create/createConflictFreeDocumentBundleAtPath.ts';
import { doesSyncableStoreRoleHaveReadAccess } from '../../utils/doesSyncableStoreRoleHaveReadAccess.ts';
import { generateInitialFolderAccess } from '../../utils/generateInitialFolderAccess.ts';
import { generateTrustedTimeIdForSyncableStoreAccessChange } from '../../utils/generateTrustedTimeIdForSyncableStoreAccessChange.ts';
import type {
  IsConflictFreeDocumentSnapshotValidArgs,
  IsDeltaValidForConflictFreeDocumentArgs
} from '../../utils/get/getConflictFreeDocumentFromBundleAtPath.ts';
import { getMutableConflictFreeDocumentFromBundleAtPath } from '../../utils/get/getMutableConflictFreeDocumentFromBundleAtPath.ts';
import { getSyncableAtPath } from '../../utils/get/getSyncableAtPath.ts';
import { markSyncableNeedsRecomputeHashAtPath } from '../../utils/markSyncableNeedsRecomputeHashAtPath.ts';
import { FolderOperationsHandler } from './FolderOperationsHandler.ts';
import { InMemoryEncryptedBundle } from './InMemoryEncryptedBundle.ts';
import { InMemoryFolder } from './InMemoryFolder.ts';
import { InMemoryPlainBundle } from './InMemoryPlainBundle.ts';
import type { MutableAccessControlledFolder } from './MutableAccessControlledFolderAndFiles.ts';

// TODO: need to figure out reasonable way of handling partially loaded data, especially for .access-control bundles, since both uploads and downloads are multi-part and async
// TODO: rename to DefaultAccessControlledFolderBase in a separate PR
export abstract class InMemoryAccessControlledFolderBase implements MutableAccessControlledFolder {
  public readonly type = 'folder';
  public readonly path: StaticSyncablePath;

  private weakStore_!: WeakRef<MutableSyncableStore>;
  private folderOperationsHandler_!: FolderOperationsHandler;
  private makeFolderAccessor_!: (args: { path: StaticSyncablePath }) => MutableAccessControlledFolderAccessor;
  private readonly syncTracker_: SyncTracker;

  private readonly backing_: SyncableStoreBacking;

  private folder__: InMemoryFolder | undefined;
  private get folder_(): InMemoryFolder {
    if (this.folder__ === undefined) {
      this.folder__ = new InMemoryFolder({
        store: this.weakStore_,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        folderOperationsHandler: this.folderOperationsHandler_,
        path: this.path,
        makeFolderAccessor: this.makeFolderAccessor_
      });
    }

    return this.folder__;
  }

  private plainBundle__: InMemoryPlainBundle | undefined;
  private get plainBundle_(): InMemoryPlainBundle {
    if (this.plainBundle__ === undefined) {
      this.plainBundle__ = new InMemoryPlainBundle({
        store: this.weakStore_,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        folderOperationsHandler: this.folderOperationsHandler_,
        path: this.path,
        supportsDeletion: false
      });
    }

    return this.plainBundle__;
  }

  private encryptedBundle__: InMemoryEncryptedBundle | undefined;
  private get encryptedBundle_(): InMemoryEncryptedBundle {
    if (this.encryptedBundle__ === undefined) {
      this.encryptedBundle__ = new InMemoryEncryptedBundle({
        store: this.weakStore_,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        folderOperationsHandler: this.folderOperationsHandler_,
        path: this.path
      });
    }

    return this.encryptedBundle__;
  }

  private needsRecomputeHashCount_ = 0;

  constructor({ backing, syncTracker, path }: { backing: SyncableStoreBacking; syncTracker: SyncTracker; path: StaticSyncablePath }) {
    this.backing_ = backing;
    this.syncTracker_ = syncTracker;
    this.path = path;
  }

  protected deferredInit_({
    store,
    makeFolderAccessor
  }: {
    store: WeakRef<MutableSyncableStore>;
    makeFolderAccessor: (args: { path: StaticSyncablePath }) => MutableAccessControlledFolderAccessor;
  }) {
    this.weakStore_ = store;
    this.folderOperationsHandler_ = this.makeFolderOperationsHandler_(store);
    this.makeFolderAccessor_ = makeFolderAccessor;
  }

  // MutableAccessControlledFolderAccessor Methods

  public readonly updateAccess = makeAsyncResultFunc(
    [import.meta.filename, 'updateAccess'],
    async (trace: Trace, change: AccessChangeParams<SyncableStoreRole>): PR<undefined, 'conflict'> => {
      const accessControlDoc = await getMutableAccessControlDocument(trace, this.weakStore_, this.path);
      /* node:coverage disable */
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }
      /* node:coverage enable */

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      let signedTimedChange: Result<SignedValue<TimedAccessChange<SyncableStoreRole>>>;
      switch (change.type) {
        case 'add-access':
          signedTimedChange = await generateSignedAddAccessChange(trace, {
            cryptoService: store.cryptoService,
            accessControlDoc: accessControlDoc.value.document,
            generateTrustedTimeIdForAccessChange: async (trace: Trace, accessChange: AccessChange<SyncableStoreRole>): PR<TrustedTimeId> =>
              await generateTrustedTimeIdForSyncableStoreAccessChange(trace, store, { path: this.path, accessChange }),
            roleSchema: syncableStoreRoleSchema,
            params: change,
            doesRoleHaveReadAccess: doesSyncableStoreRoleHaveReadAccess
          });
          break;

        case 'modify-access':
          signedTimedChange = await generateSignedModifyAccessChange(trace, {
            cryptoService: store.cryptoService,
            accessControlDoc: accessControlDoc.value.document,
            generateTrustedTimeIdForAccessChange: async (trace: Trace, accessChange: AccessChange<SyncableStoreRole>): PR<TrustedTimeId> =>
              await generateTrustedTimeIdForSyncableStoreAccessChange(trace, store, { path: this.path, accessChange }),
            roleSchema: syncableStoreRoleSchema,
            params: change,
            doesRoleHaveReadAccess: doesSyncableStoreRoleHaveReadAccess
          });
          break;

        case 'remove-access':
          // TODO: TEMP
          return makeFailure(new InternalStateError(trace, { message: "remove-access isn't supported yet" }));
      }

      if (!signedTimedChange.ok) {
        return signedTimedChange;
      }

      const added = await accessControlDoc.value.document.addChange(trace, signedTimedChange.value);
      /* node:coverage disable */
      if (!added.ok) {
        return added;
      }
      /* node:coverage enable */

      const saved = await accessControlDoc.value.save(trace);
      /* node:coverage disable */
      if (!saved.ok) {
        return generalizeFailureResult(trace, saved, ['conflict']);
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    }
  );

  // AccessControlledFolderAccessor Methods

  public readonly canPushToRemotes = makeAsyncResultFunc([import.meta.filename, 'canPushToRemotes'], async (trace): PR<boolean> => {
    const accessControlDoc = await disableLam(trace, true, (trace) => getAccessControlDocument(trace, this.weakStore_, this.path));
    return makeSuccess(accessControlDoc.ok);
  });

  public readonly didCryptoKeyHaveRoleAtTimeMSec = makeAsyncResultFunc(
    [import.meta.filename, 'didCryptoKeyHaveRoleAtTimeMSec'],
    async (
      trace,
      { cryptoKeySetId, oneOfRoles, timeMSec }: { cryptoKeySetId: CryptoKeySetId; oneOfRoles: Set<SyncableStoreRole>; timeMSec: number }
    ): PR<boolean> => {
      const accessControlDoc = await getAccessControlDocument(trace, this.weakStore_, this.path);
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }

      return await accessControlDoc.value.didHaveRoleAtTimeMSec(trace, { cryptoKeySetId, oneOfRoles, timeMSec });
    }
  );

  public readonly getRolesByCryptoKeySetId = makeAsyncResultFunc(
    [import.meta.filename, 'getRolesByCryptoKeySetId'],
    async (trace, { cryptoKeySetIds }: { cryptoKeySetIds: CryptoKeySetId[] }): PR<Partial<Record<CryptoKeySetId, SyncableStoreRole>>> => {
      const accessControlState = await this.getAccessControlState_(trace);
      if (!accessControlState.ok) {
        return accessControlState;
      }

      return makeSuccess(pick(accessControlState.value, cryptoKeySetIds));
    }
  );

  public readonly getTrustedTimeSources = makeAsyncResultFunc(
    [import.meta.filename, 'getTrustedTimeSources'],
    async (_trace): PR<TrustedTimeSource[], 'not-found'> => {
      // TODO: TEMP
      return makeSuccess([getDefaultInMemoryTrustedTimeSource()]);
    }
  );

  // MutableFolderStore Methods

  public readonly initialize = makeAsyncResultFunc(
    [import.meta.filename, 'initialize'],
    async (trace: Trace): PR<undefined, 'conflict'> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const initialAccess = await generateInitialFolderAccess(trace, store);
      if (!initialAccess.ok) {
        return initialAccess;
      }

      // Syncable Store Changes
      const createdStoreChanges = await createConflictFreeDocumentBundleAtPath(trace, store, this.path, STORE_CHANGES_BUNDLE_FILE_ID, {
        newDocument: makeNewSyncableStoreChangesDocument
      });
      /* node:coverage disable */
      if (!createdStoreChanges.ok) {
        return generalizeFailureResult(trace, createdStoreChanges, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }
      /* node:coverage enable */

      // Access Control (should be created last since syncing will be allowed once this is created)
      const newAccessControlDocument = () => new SyncableStoreAccessControlDocument({ initialAccess: initialAccess.value });

      const createdAccessControlDoc = await createConflictFreeDocumentBundleAtPath(trace, store, this.path, ACCESS_CONTROL_BUNDLE_FILE_ID, {
        newDocument: newAccessControlDocument
      });
      /* node:coverage disable */
      if (!createdAccessControlDoc.ok) {
        return generalizeFailureResult(trace, createdAccessControlDoc, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    }
  );

  public readonly createFolder: MutableFolderStore['createFolder'] = (trace, args) => this.folder_.createFolder(trace, args);

  public readonly createBinaryFile: MutableFileStore['createBinaryFile'] = (trace, args) =>
    this.encryptedBundle_.createBinaryFile(trace, args);

  public readonly createBundleFile: MutableFileStore['createBundleFile'] = (trace, args) => {
    switch (args.mode) {
      case 'via-sync':
        if (args.id === ACCESS_CONTROL_BUNDLE_FILE_ID || args.id === STORE_CHANGES_BUNDLE_FILE_ID) {
          return this.plainBundle_.createBundleFile(trace, args);
        }
        break;

      case undefined:
      case 'local':
        if (args.id === ACCESS_CONTROL_BUNDLE_FILE_ID || args.id === STORE_CHANGES_BUNDLE_FILE_ID) {
          return this.plainBundle_.createBundleFile(trace, args);
        }
        break;
    }

    return this.encryptedBundle_.createBundleFile(trace, args);
  };

  public readonly delete = makeAsyncResultFunc(
    [import.meta.filename, 'delete'],
    async (trace: Trace, id: DynamicSyncableId): PR<undefined, 'not-found'> => {
      if (id === ACCESS_CONTROL_BUNDLE_FILE_ID || id === STORE_CHANGES_BUNDLE_FILE_ID) {
        return makeFailure(new InternalStateError(trace, { message: `Deletion is not supported for ${this.path.append(id).toString()}` }));
      }

      const results = await disableLam(trace, 'not-found', (trace) =>
        Promise.all([this.folder_.delete(trace, id), this.encryptedBundle_.delete(trace, id)])
      );

      let failure: FailureResult<'not-found'> | undefined;
      for (const result of results) {
        if (result.ok) {
          return makeSuccess(undefined);
        } else if (result.value.errorCode !== 'not-found') {
          failure = result;
        }
      }

      if (failure !== undefined) {
        return failure;
      }

      return makeFailure(
        new NotFoundError(trace, {
          message: `No file or folder found for ID: ${JSON.stringify(id)} in ${this.path.toString()}`,
          errorCode: 'not-found'
        })
      );
    }
  );

  public readonly exists = makeAsyncResultFunc([import.meta.filename, 'exists'], async (trace: Trace, id: DynamicSyncableId) => {
    if (id === ACCESS_CONTROL_BUNDLE_FILE_ID || id === STORE_CHANGES_BUNDLE_FILE_ID) {
      return await this.plainBundle_.exists(trace, id);
    }

    const results = await allResultsNamed(
      trace,
      {},
      {
        existsInFolder: this.folder_.exists(trace, id),
        existsInEncryptedBundle: this.encryptedBundle_.exists(trace, id)
      }
    );
    if (!results.ok) {
      return results;
    }

    const { existsInFolder, existsInEncryptedBundle } = results.value;

    return makeSuccess(existsInFolder || existsInEncryptedBundle);
  });

  public readonly generateNewSyncableItemId: GenerateNewSyncableItemIdFunc = async (trace: Trace, args) =>
    await this.folderOperationsHandler_.generateNewSyncableItemId(trace, args);

  public readonly staticToDynamicId = (trace: Trace, id: SyncableId): PR<DynamicSyncableId> =>
    this.folderOperationsHandler_.staticToDynamicId(trace, id);

  // FolderStore Methods

  public readonly dynamicToStaticId = makeAsyncResultFunc(
    [import.meta.filename, 'dynamicToStaticId'],
    async (trace, id: DynamicSyncableId): PR<SyncableId, 'not-found'> => {
      const found = await firstSuccessResult(trace, [
        this.folder_.dynamicToStaticId(trace, id),
        this.plainBundle_.dynamicToStaticId(trace, id),
        this.encryptedBundle_.dynamicToStaticId(trace, id)
      ]);
      if (!found.ok) {
        return excludeFailureResult(found, 'empty-data-set');
      }

      return makeSuccess(found.value);
    }
  );

  public readonly getHash = makeAsyncResultFunc(
    [import.meta.filename, 'getHash'],
    async (trace, { recompute = false }: { recompute?: boolean } = {}): PR<Sha256Hash> => {
      const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
      if (!metadata.ok) {
        return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
      }

      const hash = metadata.value.hash;
      if (hash !== undefined && !recompute) {
        return makeSuccess(hash);
      }

      do {
        const needsRecomputeHashCount = this.needsRecomputeHashCount_;

        const hashesById = await this.getHashesById(trace, { recompute });
        /* node:coverage disable */
        if (!hashesById.ok) {
          return hashesById;
        }
        /* node:coverage enable */

        const hash = await generateSha256HashFromHashesById(trace, hashesById.value);
        /* node:coverage disable */
        if (!hash.ok) {
          return hash;
        }
        /* node:coverage enable */

        if (this.needsRecomputeHashCount_ === needsRecomputeHashCount) {
          const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: hash.value });
          if (!updatedHash.ok) {
            return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
          }

          return makeSuccess(hash.value);
        }
      } while (true);
    }
  );

  public readonly getIds = makeAsyncResultFunc(
    [import.meta.filename, 'getIds'],
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> => {
      const results = await allResultsNamed(
        trace,
        {},
        {
          idsFromFolder: this.folder_.getIds(trace, options),
          idsFromPlainBundle: this.plainBundle_.getIds(trace, options),
          idsFromEncryptedBundle: this.encryptedBundle_.getIds(trace, options)
        }
      );
      if (!results.ok) {
        return results;
      }

      const { idsFromPlainBundle, idsFromFolder, idsFromEncryptedBundle } = results.value;

      return makeSuccess([...idsFromPlainBundle, ...idsFromFolder, ...idsFromEncryptedBundle]);
    }
  );

  public readonly getProvenance = makeAsyncResultFunc([import.meta.filename, 'getProvenance'], async (trace): PR<SyncableProvenance> => {
    const metadata = await this.backing_.getMetadataAtPath(trace, this.path);
    if (!metadata.ok) {
      return generalizeFailureResult(trace, metadata, ['not-found', 'wrong-type']);
    }

    return makeSuccess(metadata.value.provenance);
  });

  public readonly markNeedsRecomputeHash = makeAsyncResultFunc(
    [import.meta.filename, 'markNeedsRecomputeHash'],
    async (trace): PR<undefined> => {
      const updatedHash = await this.backing_.updateLocalMetadataAtPath(trace, this.path, { hash: undefined });
      if (!updatedHash.ok) {
        return generalizeFailureResult(trace, updatedHash, ['not-found', 'wrong-type']);
      }

      this.needsRecomputeHashCount_ += 1;

      const store = this.weakStore_.deref();
      const parentPath = this.path.parentPath;
      if (store !== undefined && parentPath !== undefined) {
        const marked = await markSyncableNeedsRecomputeHashAtPath(trace, store, parentPath);
        /* node:coverage disable */
        if (!marked.ok) {
          return generalizeFailureResult(trace, marked, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
        }
        /* node:coverage enable */
      }

      return makeSuccess(undefined);
    }
  );

  public readonly ls = async (trace: Trace): PR<string[]> => {
    const results = await allResultsNamed(
      trace,
      {},
      {
        folderLs: this.folder_.ls(trace),
        plainBundleLs: this.plainBundle_.ls(trace),
        encryptedBundleLs: this.encryptedBundle_.ls(trace)
      }
    );
    if (!results.ok) {
      return results;
    }

    return makeSuccess([...results.value.folderLs, ...results.value.plainBundleLs, ...results.value.encryptedBundleLs]);
  };

  // MutableBundleAccessor Methods

  public readonly getMutable = makeAsyncResultFunc(
    [import.meta.filename, 'getMutable'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: DynamicSyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<MutableSyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => {
      if (id === ACCESS_CONTROL_BUNDLE_FILE_ID || id === STORE_CHANGES_BUNDLE_FILE_ID) {
        return await this.plainBundle_.getMutable(trace, id, expectedType);
      }

      const got = await disableLam(trace, 'not-found', (trace) =>
        firstSuccessResult(trace, [
          this.folder_.getMutable(trace, id, expectedType),
          this.encryptedBundle_.getMutable(trace, id, expectedType)
        ])
      );
      if (!got.ok) {
        return excludeFailureResult(got, 'empty-data-set');
      }

      return makeSuccess(got.value as MutableSyncableItemAccessor & { type: T });
    }
  );

  // BundleAccessor Methods

  public readonly getHashesById = makeAsyncResultFunc(
    [import.meta.filename, 'getHashesById'],
    async (trace: Trace, options?: { recompute?: boolean }) => {
      const results = await allResultsNamed(
        trace,
        {},
        {
          folderHashes: this.folder_.getHashesById(trace, options),
          plainBundleHashes: this.plainBundle_.getHashesById(trace, options),
          encryptedBundleHashes: this.encryptedBundle_.getHashesById(trace, options)
        }
      );
      if (!results.ok) {
        return results;
      }

      const { folderHashes, plainBundleHashes, encryptedBundleHashes } = results.value;

      return makeSuccess({ ...folderHashes, ...plainBundleHashes, ...encryptedBundleHashes });
    }
  );

  public readonly get = makeAsyncResultFunc(
    [import.meta.filename, 'get'],
    async <T extends SyncableItemType = SyncableItemType>(
      trace: Trace,
      id: DynamicSyncableId,
      expectedType?: SingleOrArray<T>
    ): PR<SyncableItemAccessor & { type: T }, 'deleted' | 'not-found' | 'wrong-type'> => await this.getMutable(trace, id, expectedType)
  );

  // BundleManagement Methods

  public readonly sweep = makeAsyncResultFunc([import.meta.filename, 'sweep'], async (trace: Trace) => {
    const swept = await allResults(trace, [this.folder_.sweep(trace), this.plainBundle_.sweep(trace), this.encryptedBundle_.sweep(trace)]);
    /* node:coverage disable */
    if (!swept.ok) {
      return swept;
    }
    /* node:coverage enable */

    return makeSuccess(undefined);
  });

  // Public Methods

  public readonly addListener = <TypeT extends keyof SyncTrackerNotifications>(
    type: TypeT,
    callback: (args: SyncTrackerNotifications[TypeT]) => void
  ) => this.syncTracker_.addListener(type, callback);

  // Protected Methods

  protected makeFolderOperationsHandler_(weakStore: WeakRef<MutableSyncableStore>) {
    const path = this.path;

    return new FolderOperationsHandler({
      store: weakStore,
      getAccessControlDocument: (trace: Trace): PR<SyncableStoreAccessControlDocument> => getAccessControlDocument(trace, weakStore, path),
      getMutableSyncableStoreChangesDocument: (trace: Trace): PR<SaveableDocument<SyncableStoreChangesDocument>> =>
        getMutableSyncableStoreChangesDocument(trace, weakStore, path)
    });
  }

  // Private Methods

  private readonly getAccessControlState_ = makeAsyncResultFunc(
    [import.meta.filename, 'getAccessControlState'],
    async (trace: Trace): PR<AccessControlState<SyncableStoreRole>> => {
      const accessControlDoc = await getAccessControlDocument(trace, this.weakStore_, this.path);
      /* node:coverage disable */
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }
      /* node:coverage enable */

      return makeSuccess(accessControlDoc.value.accessControlState);
    }
  );
}

// Helpers

const getAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename, 'getAccessControlDocument'],
  async (trace, weakStore: WeakRef<MutableSyncableStore>, path: SyncablePath) => {
    const accessControlDoc = await getMutableAccessControlDocument(trace, weakStore, path);
    /* node:coverage disable */
    if (!accessControlDoc.ok) {
      return accessControlDoc;
    }
    /* node:coverage enable */

    return makeSuccess(accessControlDoc.value.document);
  }
);

const getMutableAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename, 'getMutableAccessControlDocument'],
  async (trace, weakStore: WeakRef<MutableSyncableStore>, path: SyncablePath): PR<SaveableDocument<SyncableStoreAccessControlDocument>> => {
    const store = weakStore.deref();
    if (store === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
    }

    const newDocument = (snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<'ACCESS-CONTROL'> }) =>
      new SyncableStoreAccessControlDocument({ snapshot });

    // TODO: doc can be modified directly by changing bundle.  this should track that probably
    const doc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, store, path.append(ACCESS_CONTROL_BUNDLE_FILE_ID), {
      newDocument,
      isSnapshotValid: isAccessControlDocumentSnapshotValid,
      isDeltaValidForDocument: isDeltaValidForAccessControlDocument
    });
    /* node:coverage disable */
    if (!doc.ok) {
      return generalizeFailureResult(trace, doc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }
    /* node:coverage enable */

    return makeSuccess(doc.value);
  }
);

const getMutableSyncableStoreChangesDocument = makeAsyncResultFunc(
  [import.meta.filename, 'getMutableSyncableStoreChangesDocument'],
  async (trace, weakStore: WeakRef<MutableSyncableStore>, path: SyncablePath): PR<SaveableDocument<SyncableStoreChangesDocument>> => {
    const store = weakStore.deref();
    if (store === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
    }

    // TODO: doc can be modified directly by changing bundle.  this should track that probably
    const doc = await getMutableConflictFreeDocumentFromBundleAtPath(trace, store, path.append(STORE_CHANGES_BUNDLE_FILE_ID), {
      newDocument: makeSyncableStoreChangesDocumentFromSnapshot,
      isSnapshotValid: isStoreChangesDocumentSnapshotValid,
      isDeltaValidForDocument: isDeltaValidForStoreChangesDocument
    });
    /* node:coverage disable */
    if (!doc.ok) {
      return generalizeFailureResult(trace, doc, ['deleted', 'format-error', 'not-found', 'untrusted', 'wrong-type']);
    }
    /* node:coverage enable */

    return makeSuccess(doc.value);
  }
);

const isAccessControlDocumentSnapshotValid = makeAsyncResultFunc(
  [import.meta.filename, 'isAccessControlDocumentSnapshotValid'],
  async (_trace, { originRole }: IsConflictFreeDocumentSnapshotValidArgs<AccessControlDocumentPrefix>): PR<boolean> =>
    // Only creators can create folders (and therefor access control bundles and snapshots)
    makeSuccess(originRole === 'creator')
);

const isDeltaValidForAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename, 'isDeltaValidForAccessControlDocument'],
  async (
    trace,
    document: SyncableStoreAccessControlDocument,
    { store, path, originRole, encodedDelta }: IsDeltaValidForConflictFreeDocumentArgs<AccessControlDocumentPrefix>
  ): PR<boolean> => {
    // Only admins and above can create access control deltas
    if (!adminAndAboveRoles.has(originRole)) {
      return makeSuccess(false);
    }

    return await document.isDeltaValidForRole(trace, { store, path, role: originRole, encodedDelta });
  }
);

const isStoreChangesDocumentSnapshotValid = makeAsyncResultFunc(
  [import.meta.filename, 'isStoreChangesDocumentSnapshotValid'],
  async (_trace, { originRole }: IsConflictFreeDocumentSnapshotValidArgs<SyncableStoreChangesDocumentPrefix>): PR<boolean> =>
    // Only creators can create folders (and therefor store change bundles and snapshots)
    makeSuccess(originRole === 'creator')
);

const isDeltaValidForStoreChangesDocument = makeAsyncResultFunc(
  [import.meta.filename, 'isDeltaValidForStoreChangesDocument'],
  async (
    trace,
    document: SyncableStoreChangesDocument,
    { store, path, originRole, encodedDelta }: IsDeltaValidForConflictFreeDocumentArgs<SyncableStoreChangesDocumentPrefix>
  ): PR<boolean> => {
    // Only admins and above can create store change deltas
    if (!adminAndAboveRoles.has(originRole)) {
      return makeSuccess(false);
    }

    let staticPath: StaticSyncablePath;
    if (path instanceof DynamicSyncablePath) {
      const resolvedPath = await getSyncableAtPath(trace, store, path);
      if (!resolvedPath.ok) {
        return generalizeFailureResult(trace, resolvedPath, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }

      staticPath = resolvedPath.value.path;
    } else {
      staticPath = path;
    }

    return await document.isDeltaValidForRole(trace, { store, path: staticPath, role: originRole, encodedDelta });
  }
);
