import { generateSignedAddAccessChange, generateSignedModifyAccessChange } from 'freedom-access-control';
import type { AccessChangeParams, AccessControlState, TrustedTimeSignedAccessChange } from 'freedom-access-control-types';
import type { PR, Result } from 'freedom-async';
import { allResultsNamed, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { type Sha256Hash } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSha256HashFromHashesById } from 'freedom-crypto';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { LocalItemMetadata, SyncableId, SyncableItemType, SyncablePath } from 'freedom-sync-types';
import { extractSyncableIdParts } from 'freedom-sync-types';
import type {
  MutableSyncableFolderAccessor,
  MutableSyncableStore,
  SaveableDocument,
  SyncableStoreRole,
  SyncTracker
} from 'freedom-syncable-store-types';
import { ACCESS_CONTROL_BUNDLE_ID, syncableStoreRoleSchema } from 'freedom-syncable-store-types';
import type { TrustedTimeSource } from 'freedom-trusted-time-source';
import { getDefaultInMemoryTrustedTimeSource } from 'freedom-trusted-time-source';
import { pick } from 'lodash-es';
import type { SingleOrArray } from 'yaschema';

import { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import { createConflictFreeDocumentBundleAtPath } from '../../utils/create/createConflictFreeDocumentBundleAtPath.ts';
import { doesSyncableStoreRoleHaveReadAccess } from '../../utils/doesSyncableStoreRoleHaveReadAccess.ts';
import { generateInitialFolderAccess } from '../../utils/generateInitialFolderAccess.ts';
import { generateTrustedTimeForSyncableStoreAccessChange } from '../../utils/generateTrustedTimeForSyncableStoreAccessChange.ts';
import { getMutableConflictFreeDocumentFromBundleAtPath } from '../../utils/get/getMutableConflictFreeDocumentFromBundleAtPath.ts';
import { DefaultFileStore } from './DefaultFileStore.ts';
import { DefaultFolderStore } from './DefaultFolderStore.ts';
import type { DefaultMutableSyncableItemAccessorBaseConstructorArgs } from './DefaultMutableSyncableItemAccessorBase.ts';
import { DefaultMutableSyncableItemAccessorBase } from './DefaultMutableSyncableItemAccessorBase.ts';
import { FolderOperationsHandler } from './FolderOperationsHandler.ts';

export interface DefaultMutableSyncableFolderAccessorBaseConstructorArgs extends DefaultMutableSyncableItemAccessorBaseConstructorArgs {
  syncTracker: SyncTracker;
}

// TODO: need to figure out reasonable way of handling partially loaded data, especially for .access-control bundles, since both uploads and downloads are multi-part and async
export abstract class DefaultMutableSyncableFolderAccessorBase
  extends DefaultMutableSyncableItemAccessorBase
  implements MutableSyncableFolderAccessor
{
  public readonly type = 'folder';

  protected readonly syncTracker_: SyncTracker;

  private folderOperationsHandler_!: FolderOperationsHandler;
  private makeFolderAccessor_!: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;

  private folderStore__: DefaultFolderStore | undefined;
  private get folderStore_(): DefaultFolderStore {
    if (this.folderStore__ === undefined) {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        throw new Error('store was released');
      }

      this.folderStore__ = new DefaultFolderStore({
        store,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        folderOperationsHandler: this.folderOperationsHandler_,
        path: this.path,
        makeFolderAccessor: this.makeFolderAccessor_
      });
    }

    return this.folderStore__;
  }

  private fileStore__: DefaultFileStore | undefined;
  private get fileStore_(): DefaultFileStore {
    if (this.fileStore__ === undefined) {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        throw new Error('store was released');
      }

      this.fileStore__ = new DefaultFileStore({
        store,
        backing: this.backing_,
        syncTracker: this.syncTracker_,
        path: this.path,
        folderOperationsHandler: this.folderOperationsHandler_
      });
    }

    return this.fileStore__;
  }

  constructor({ syncTracker, ...args }: DefaultMutableSyncableFolderAccessorBaseConstructorArgs) {
    super(args);

    this.syncTracker_ = syncTracker;
  }

  protected override deferredInit_({
    store,
    makeFolderAccessor
  }: {
    store: MutableSyncableStore;
    makeFolderAccessor: (args: { path: SyncablePath }) => MutableSyncableFolderAccessor;
  }) {
    super.deferredInit_({ store });

    this.folderOperationsHandler_ = this.makeFolderOperationsHandler_(store);
    this.makeFolderAccessor_ = makeFolderAccessor;
  }

  // MutableAccessControlledFolderAccessor Methods

  public readonly getAccessControlDocument = makeAsyncResultFunc(
    [import.meta.filename, 'getAccessControlDocument'],
    async (trace: Trace): PR<SyncableStoreAccessControlDocument> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      return await getAccessControlDocument(trace, store, this.path);
    }
  );

  public readonly updateAccess = makeAsyncResultFunc(
    [import.meta.filename, 'updateAccess'],
    async (trace: Trace, change: AccessChangeParams<SyncableStoreRole>): PR<undefined, 'conflict'> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const accessControlDoc = await getMutableAccessControlDocument(trace, store, this.path);
      /* node:coverage disable */
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }
      /* node:coverage enable */

      let signedTimedChange: Result<TrustedTimeSignedAccessChange<SyncableStoreRole>>;
      switch (change.type) {
        case 'add-access':
          signedTimedChange = await generateSignedAddAccessChange(trace, {
            userKeys: store.userKeys,
            accessControlDoc: accessControlDoc.value.document,
            generateTrustedTimeForAccessChange: async (trace, accessChange) =>
              await generateTrustedTimeForSyncableStoreAccessChange(trace, store, { parentPath: this.path, accessChange }),
            roleSchema: syncableStoreRoleSchema,
            params: change,
            doesRoleHaveReadAccess: doesSyncableStoreRoleHaveReadAccess
          });
          break;

        case 'modify-access':
          signedTimedChange = await generateSignedModifyAccessChange(trace, {
            userKeys: store.userKeys,
            accessControlDoc: accessControlDoc.value.document,
            generateTrustedTimeForAccessChange: async (trace, accessChange) =>
              await generateTrustedTimeForSyncableStoreAccessChange(trace, store, { parentPath: this.path, accessChange }),
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

      const added = await accessControlDoc.value.document.addChange(trace, signedTimedChange.value.signedAccessChange);
      /* node:coverage disable */
      if (!added.ok) {
        return added;
      }
      /* node:coverage enable */

      const saved = await accessControlDoc.value.save(trace, { trustedTime: signedTimedChange.value.trustedTime });
      /* node:coverage disable */
      if (!saved.ok) {
        return generalizeFailureResult(trace, saved, ['conflict']);
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    }
  );

  // AccessControlledFolderAccessor Methods

  public readonly didCryptoKeyHaveRoleAtTimeMSec = makeAsyncResultFunc(
    [import.meta.filename, 'didCryptoKeyHaveRoleAtTimeMSec'],
    async (
      trace,
      { cryptoKeySetId, oneOfRoles, timeMSec }: { cryptoKeySetId: CryptoKeySetId; oneOfRoles: Set<SyncableStoreRole>; timeMSec: number }
    ): PR<boolean> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const accessControlDoc = await getAccessControlDocument(trace, store, this.path);
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

  public readonly createBinaryFile: MutableSyncableFolderAccessor['createBinaryFile'] = (trace, args) =>
    this.fileStore_.createBinaryFile(trace, args);
  public readonly createBundle: MutableSyncableFolderAccessor['createBundle'] = (trace, args) => this.fileStore_.createBundle(trace, args);
  public readonly createFolder: MutableSyncableFolderAccessor['createFolder'] = (trace, args) =>
    this.folderStore_.createFolder(trace, args);
  public readonly delete: MutableSyncableFolderAccessor['delete'] = (trace: Trace, id: SyncableId) =>
    this.selectStoreForId_(id).delete(trace, id);
  public readonly exists: MutableSyncableFolderAccessor['exists'] = (trace, id) => this.selectStoreForId_(id).exists(trace, id);
  public readonly generateNewSyncableItemName: MutableSyncableFolderAccessor['generateNewSyncableItemName'] = (trace: Trace, args) =>
    this.folderOperationsHandler_.generateNewSyncableItemName(trace, args);
  public readonly get: MutableSyncableFolderAccessor['get'] = (trace: Trace, id: SyncableId, ...args) =>
    this.getMutable(trace, id, ...args);
  public readonly getMutable: MutableSyncableFolderAccessor['getMutable'] = (trace: Trace, id: SyncableId, ...args) =>
    this.selectStoreForId_(id).getMutable(trace, id, ...args);
  public readonly isDeleted: MutableSyncableFolderAccessor['isDeleted'] = (trace, id: SyncableId) =>
    this.selectStoreForId_(id).isDeleted(trace, id);

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

      // Access Control (should be created last since syncing will be allowed once this is created)
      const createdAccessControlDoc = await createConflictFreeDocumentBundleAtPath(
        trace,
        store,
        this.path.append(ACCESS_CONTROL_BUNDLE_ID),
        { newDocument: () => SyncableStoreAccessControlDocument.newDocument(initialAccess.value) }
      );
      /* node:coverage disable */
      if (!createdAccessControlDoc.ok) {
        return generalizeFailureResult(trace, createdAccessControlDoc, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
      }
      /* node:coverage enable */

      return makeSuccess(undefined);
    }
  );

  // FolderStore Methods

  public readonly getIds = makeAsyncResultFunc(
    [import.meta.filename, 'getIds'],
    async (trace: Trace, options?: { type?: SingleOrArray<SyncableItemType> }): PR<SyncableId[]> => {
      const results = await allResultsNamed(
        trace,
        {},
        {
          idsFromFolderStore: this.folderStore_.getIds(trace, options),
          idsFromFileStore: this.fileStore_.getIds(trace, options)
        }
      );
      if (!results.ok) {
        return results;
      }

      const { idsFromFolderStore, idsFromFileStore } = results.value;

      return makeSuccess([...idsFromFolderStore, ...idsFromFileStore]);
    }
  );

  public readonly ls = async (trace: Trace): PR<string[]> => {
    const results = await allResultsNamed(
      trace,
      {},
      {
        folderStoreLs: this.folderStore_.ls(trace),
        fileStoreLs: this.fileStore_.ls(trace)
      }
    );
    if (!results.ok) {
      return results;
    }

    const { folderStoreLs, fileStoreLs } = results.value;

    return makeSuccess([...folderStoreLs, ...fileStoreLs]);
  };

  // BundleAccessor Methods

  public readonly getMetadataById = makeAsyncResultFunc([import.meta.filename, 'getMetadataById'], async (trace: Trace) => {
    const results = await allResultsNamed(
      trace,
      {},
      {
        folderStore: this.folderStore_.getMetadataById(trace),
        fileStore: this.fileStore_.getMetadataById(trace)
      }
    );
    if (!results.ok) {
      return results;
    }

    const { folderStore, fileStore } = results.value;

    return makeSuccess({ ...folderStore, ...fileStore });
  });

  // Protected Methods

  protected makeFolderOperationsHandler_(store: MutableSyncableStore) {
    const path = this.path;

    return new FolderOperationsHandler({
      store,
      getAccessControlDocument: (trace: Trace): PR<SyncableStoreAccessControlDocument> => getAccessControlDocument(trace, store, path)
    });
  }

  // DefaultMutableSyncableItemAccessorBase Abstract Methods Overrides

  protected override readonly computeLocalItemMetadata_ = makeAsyncResultFunc(
    [import.meta.filename, 'computeLocalItemMetadata_'],
    async (trace: Trace): PR<LocalItemMetadata> => {
      const metadataById = await this.getMetadataById(trace);
      /* node:coverage disable */
      if (!metadataById.ok) {
        return metadataById;
      }
      /* node:coverage enable */

      let sizeBytes = 0;
      let numDescendants = 0;
      const hashesById = objectEntries(metadataById.value).reduce(
        (out, [id, metadata]) => {
          if (metadata === undefined) {
            return out;
          }

          out[id] = metadata.hash;
          sizeBytes += metadata.sizeBytes;
          numDescendants += 1 + metadata.numDescendants;

          return out;
        },
        {} as Partial<Record<SyncableId, Sha256Hash>>
      );

      const hash = await generateSha256HashFromHashesById(trace, hashesById);
      /* node:coverage disable */
      if (!hash.ok) {
        return hash;
      }
      /* node:coverage enable */

      const localItemMetadata: LocalItemMetadata = { hash: hash.value, numDescendants, sizeBytes };

      return makeSuccess(localItemMetadata);
    }
  );

  // Private Methods

  private readonly getAccessControlState_ = makeAsyncResultFunc(
    [import.meta.filename, 'getAccessControlState'],
    async (trace: Trace): PR<AccessControlState<SyncableStoreRole>> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const accessControlDoc = await getAccessControlDocument(trace, store, this.path);
      /* node:coverage disable */
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }
      /* node:coverage enable */

      return await accessControlDoc.value.getAccessControlState(trace);
    }
  );

  private readonly selectStoreForId_ = (id: SyncableId) => {
    const idParts = extractSyncableIdParts(id);
    if (idParts.type === 'folder') {
      return this.folderStore_;
    }

    return this.fileStore_;
  };
}

// Helpers

const getAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename, 'getAccessControlDocument'],
  async (trace, store: MutableSyncableStore, path: SyncablePath) => {
    const accessControlDoc = await getMutableAccessControlDocument(trace, store, path);
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
  async (trace, store: MutableSyncableStore, path: SyncablePath): PR<SaveableDocument<SyncableStoreAccessControlDocument>> => {
    const accessControlBundlePath = path.append(ACCESS_CONTROL_BUNDLE_ID);

    const doc = await getMutableConflictFreeDocumentFromBundleAtPath(
      trace,
      store,
      accessControlBundlePath,
      SyncableStoreAccessControlDocument,
      { watch: true }
    );
    /* node:coverage disable */
    if (!doc.ok) {
      return generalizeFailureResult(trace, doc, ['format-error', 'not-found', 'untrusted', 'wrong-type']);
    }
    /* node:coverage enable */

    return makeSuccess(doc.value);
  }
);
