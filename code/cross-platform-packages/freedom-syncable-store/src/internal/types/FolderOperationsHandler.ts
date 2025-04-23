import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import { generalizeFailureResult, InternalSchemaValidationError, InternalStateError } from 'freedom-common-errors';
import { type Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import type { DynamicSyncableItemName, SyncableItemName, SyncablePath } from 'freedom-sync-types';
import { encName, syncableEncryptedItemNameInfo } from 'freedom-sync-types';
import type { MutableSyncableStore, SaveableDocument } from 'freedom-syncable-store-types';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import type { SyncableStoreAccessControlDocument } from '../../types/SyncableStoreAccessControlDocument.ts';
import type { SyncableStoreChange } from '../../types/SyncableStoreChange.ts';
import { syncableStoreChangeSchema } from '../../types/SyncableStoreChange.ts';
import type { SyncableStoreChangesDocument } from '../../types/SyncableStoreChangesDocument.ts';
import { encryptAndSignBinary } from '../../utils/encryptAndSignBinary.ts';
import { verifyAndDecryptBinary } from '../../utils/verifyAndDecryptBinary.ts';

export class FolderOperationsHandler {
  private getAccessControlDocument_: PRFunc<SyncableStoreAccessControlDocument>;
  private getMutableSyncableStoreChangesDocument_: PRFunc<SaveableDocument<SyncableStoreChangesDocument>>;
  private readonly weakStore_: WeakRef<MutableSyncableStore>;

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

  public readonly generateNewSyncableItemName = makeAsyncResultFunc(
    [import.meta.filename, 'generateNewSyncableItemName'],
    async (
      trace: Trace,
      { name }: { path: SyncablePath; name: DynamicSyncableItemName; getSha256ForItemProvenance: PRFunc<Sha256Hash> }
    ): PR<SyncableItemName> => {
      if (typeof name === 'string') {
        // Already a SyncableItemName
        return makeSuccess(name);
      }

      switch (name.type) {
        case 'encrypted': {
          const encryptedAndSignedName = await this.encryptAndSignString(trace, name.plainName);
          if (!encryptedAndSignedName.ok) {
            return encryptedAndSignedName;
          }

          return makeSuccess(syncableEncryptedItemNameInfo.make(encryptedAndSignedName.value));
        }
      }
    }
  );

  public readonly getDynamicName = makeAsyncResultFunc(
    [import.meta.filename, 'getDynamicName'],
    async (trace, name: SyncableItemName): PR<DynamicSyncableItemName> => {
      if (syncableEncryptedItemNameInfo.is(name)) {
        const decryptedName = await this.verifyAndDecryptString(trace, syncableEncryptedItemNameInfo.removePrefix(name));
        if (!decryptedName.ok) {
          return decryptedName;
        }

        return makeSuccess(encName(decryptedName.value));
      } else {
        return makeSuccess(name);
      }
    }
  );

  public readonly isPathMarkedAsDeleted = makeAsyncResultFunc(
    [import.meta.filename, 'isPathMarkedAsDeleted'],
    async (trace, path: SyncablePath): PR<boolean> => {
      const storeChangesDoc = await disableLam(trace, true, (trace) => this.getMutableSyncableStoreChangesDocument_(trace));
      if (!storeChangesDoc.ok) {
        // If there's an error loading the changes document (usually because it hasn't synced yet), assume the path is not deleted.  This is
        // generally safe because it's only potentially extra data that will eventually be cleaned up
        return makeSuccess(false);
      }

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

      const privateKeys = await store.cryptoService.getPrivateCryptoKeySet(trace);
      if (!privateKeys.ok) {
        return generalizeFailureResult(trace, privateKeys, 'not-found');
      }

      const signedStoreChange = await generateSignedValue<SyncableStoreChange>(trace, {
        value: { type: 'delete', paths: [path] },
        valueSchema: syncableStoreChangeSchema,
        signatureExtras: undefined,
        signatureExtrasSchema: undefined,
        signingKeys: privateKeys.value
      });
      if (!signedStoreChange.ok) {
        return signedStoreChange;
      }

      const storeChangesDoc = await this.getMutableSyncableStoreChangesDocument_(trace);
      if (!storeChangesDoc.ok) {
        return storeChangesDoc;
      }

      const storeChangeAdded = await storeChangesDoc.value.document.addChange(trace, signedStoreChange.value);
      if (!storeChangeAdded.ok) {
        return storeChangeAdded;
      }

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
