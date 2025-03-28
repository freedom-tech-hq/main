import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { base64String, makeIsoDateTime } from 'freedom-basic-data';
import { generalizeFailureResult, InternalSchemaValidationError, InternalStateError } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import { extractPartsFromTimeName, extractPartsFromTrustedTimeName, timeNameInfo, trustedTimeNameInfo } from 'freedom-crypto-data';
import type { DynamicSyncableId, OldSyncablePath, SyncableId, SyncablePath } from 'freedom-sync-types';
import { encId, syncableEncryptedIdInfo, timeName } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SaveableDocument } from '../../types/SaveableDocument.ts';
import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { SyncableStoreChange } from '../../types/SyncableStoreChange.ts';
import { syncableStoreChangeSchema } from '../../types/SyncableStoreChange.ts';
import type { SyncableStoreChangesDocument } from '../../types/SyncableStoreChangesDocument.ts';
import { encryptAndSignBinary } from '../../utils/encryptAndSignBinary.ts';
import { generateTrustedTimeNameForSyncable } from '../../utils/generateTrustedTimeNameForSyncable.ts';
import { shouldUseTrustedTimeNamesInPath } from '../../utils/shouldUseTrustedTimeNamesInPath.ts';
import { verifyAndDecryptBinary } from '../../utils/verifyAndDecryptBinary.ts';

export class FolderOperationsHandler {
  private getAccessControlDocument_: PRFunc<SyncableStoreAccessControlDocument>;
  private getMutableSyncableStoreChangesDocument_: PRFunc<SaveableDocument<SyncableStoreChangesDocument>>;
  private readonly weakStore_: WeakRef<MutableSyncableStore>;

  // TODO: TEMP - this should work as a live document
  // private storeChangesDoc_: SaveableDocument<SyncableStoreChangesDocument> | undefined;

  constructor({
    store,
    getAccessControlDocument,
    getMutableSyncableStoreChangesDocument
  }: {
    store: WeakRef<MutableSyncableStore>;
    getAccessControlDocument: PRFunc<SyncableStoreAccessControlDocument>;
    getMutableSyncableStoreChangesDocument: PRFunc<SaveableDocument<SyncableStoreChangesDocument>>;
  }) {
    this.weakStore_ = store;
    this.getAccessControlDocument_ = getAccessControlDocument;
    this.getMutableSyncableStoreChangesDocument_ = getMutableSyncableStoreChangesDocument;
  }

  public readonly staticToDynamicId = makeAsyncResultFunc(
    [import.meta.filename, 'staticToDynamicId'],
    async (trace, id: SyncableId): PR<DynamicSyncableId> => {
      if (syncableEncryptedIdInfo.is(id)) {
        const decrypted = await this.verifyAndDecryptString(trace, syncableEncryptedIdInfo.removePrefix(id));
        if (!decrypted.ok) {
          return decrypted;
        }
        return makeSuccess(encId(decrypted.value));
      } else if (trustedTimeNameInfo.is(id)) {
        const timeNameParts = await extractPartsFromTrustedTimeName(trace, id);
        if (!timeNameParts.ok) {
          return timeNameParts;
        }
        return makeSuccess(timeName(timeNameParts.value.uuid));
      } else if (timeNameInfo.is(id)) {
        const timeNameParts = await extractPartsFromTimeName(trace, id);
        if (!timeNameParts.ok) {
          return timeNameParts;
        }
        return makeSuccess(timeName(timeNameParts.value.uuid));
      } else {
        return makeSuccess(id);
      }
    }
  );

  public readonly generateNewSyncableItemId = makeAsyncResultFunc(
    [import.meta.filename, 'generateNewSyncableItemId'],
    async (
      trace: Trace,
      {
        parentPath,
        id,
        getSha256ForItemProvenance
      }: { parentPath: OldSyncablePath; id: DynamicSyncableId; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
    ): PR<SyncableId> => {
      if (typeof id === 'string') {
        // Already a SyncableId
        return makeSuccess(id);
      }

      switch (id.type) {
        case 'encrypted': {
          const encryptedAndSignedId = await this.encryptAndSignString(trace, id.plainId);
          if (!encryptedAndSignedId.ok) {
            return encryptedAndSignedId;
          }

          return makeSuccess(syncableEncryptedIdInfo.make(encryptedAndSignedId.value));
        }

        case 'time': {
          const store = this.weakStore_.deref();
          if (store === undefined) {
            return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
          }

          const shouldUseTrustedTime = await shouldUseTrustedTimeNamesInPath(trace, store, parentPath);
          if (!shouldUseTrustedTime.ok) {
            return shouldUseTrustedTime;
          }

          if (shouldUseTrustedTime.value) {
            return await generateTrustedTimeNameForSyncable(trace, store, { parentPath, uuid: id.uuid, getSha256ForItemProvenance });
          } else {
            return makeSuccess(timeNameInfo.make(`${makeIsoDateTime()}-${id.uuid}`));
          }
        }
      }
    }
  );

  public readonly isPathMarkedAsDeleted = makeAsyncResultFunc(
    [import.meta.filename, 'isPathMarkedAsDeleted'],
    async (trace, path: SyncablePath): PR<boolean> => {
      // TODO: TEMP - this should work as a live document
      // if (this.storeChangesDoc_ === undefined) {
      const storeChangesDoc = await this.getMutableSyncableStoreChangesDocument_(trace);
      if (!storeChangesDoc.ok) {
        return storeChangesDoc;
      }
      //   this.storeChangesDoc_ = storeChangesDoc.value;
      // }

      // return makeSuccess(this.storeChangesDoc_.document.isDeletedPath(path));
      return makeSuccess(storeChangesDoc.value.document.isDeletedPath(path));
    }
  );

  public readonly markPathAsDeleted = makeAsyncResultFunc(
    [import.meta.filename, 'markPathAsDeleted'],
    async (trace, path: SyncablePath): PR<undefined> => {
      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      const signedStoreChange = await store.cryptoService.generateSignedValue<SyncableStoreChange>(trace, {
        value: { type: 'delete', paths: [path] },
        valueSchema: syncableStoreChangeSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined
      });
      if (!signedStoreChange.ok) {
        return signedStoreChange;
      }

      // TODO: TEMP - this should work as a live document
      // if (this.storeChangesDoc_ === undefined) {
      const storeChangesDoc = await this.getMutableSyncableStoreChangesDocument_(trace);
      if (!storeChangesDoc.ok) {
        return storeChangesDoc;
      }
      //   this.storeChangesDoc_ = storeChangesDoc.value;
      // }

      // const storeChangeAdded = await this.storeChangesDoc_.document.addChange(trace, signedStoreChange.value);
      const storeChangeAdded = await storeChangesDoc.value.document.addChange(trace, signedStoreChange.value);
      if (!storeChangeAdded.ok) {
        return storeChangeAdded;
      }

      // const savedStoreChangesDoc = await this.storeChangesDoc_.save(trace);
      const savedStoreChangesDoc = await storeChangesDoc.value.save(trace);
      if (!savedStoreChangesDoc.ok) {
        return generalizeFailureResult(trace, savedStoreChangesDoc, 'conflict');
      }

      return makeSuccess(undefined);
    }
  );

  public readonly verifyAndDecryptBuffer = makeAsyncResultFunc(
    [import.meta.filename, 'verifyAndDecryptBuffer'],
    async (trace: Trace, signedEncryptedValue: Uint8Array): PR<Uint8Array> => {
      const accessControl = await this.getAccessControlDocument_(trace);
      /* node:coverage disable */
      if (!accessControl.ok) {
        return accessControl;
      }
      /* node:coverage enable */

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      return await verifyAndDecryptBinary(trace, signedEncryptedValue, {
        accessControlDoc: accessControl.value,
        cryptoService: store.cryptoService
      });
    }
  );

  public readonly verifyAndDecryptString = makeAsyncResultFunc(
    [import.meta.filename, 'verifyAndDecryptString'],
    async (trace: Trace, signedEncryptedString: string): PR<string> => {
      if (!base64String.is(signedEncryptedString)) {
        return makeFailure(new InternalSchemaValidationError(trace, { message: 'Expected Base64String' }));
      }

      const decodedId = await this.verifyAndDecryptBuffer(trace, base64String.toBuffer(signedEncryptedString));
      if (!decodedId.ok) {
        return decodedId;
      }

      return makeSuccess(Buffer.from(decodedId.value).toString('utf-8'));
    }
  );

  public readonly encryptAndSignBuffer = makeAsyncResultFunc(
    [import.meta.filename, 'encryptAndSignBuffer'],
    async (trace: Trace, value: Uint8Array): PR<Uint8Array> => {
      const accessControlDoc = await this.getAccessControlDocument_(trace);
      /* node:coverage disable */
      if (!accessControlDoc.ok) {
        return accessControlDoc;
      }
      /* node:coverage enable */

      const store = this.weakStore_.deref();
      if (store === undefined) {
        return makeFailure(new InternalStateError(trace, { message: 'store was released' }));
      }

      return await encryptAndSignBinary(trace, value, { accessControlDoc: accessControlDoc.value, cryptoService: store.cryptoService });
    }
  );

  public readonly encryptAndSignString = makeAsyncResultFunc(
    [import.meta.filename, 'encryptAndSignString'],
    async (trace: Trace, value: string): PR<string> => {
      const id = await this.encryptAndSignBuffer(trace, Buffer.from(value, 'utf-8'));
      if (!id.ok) {
        return id;
      }

      return makeSuccess(base64String.makeWithBuffer(id.value));
    }
  );
}
