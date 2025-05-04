import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateSha256HashForEmptyString, generateSignedValue } from 'freedom-crypto';
import type { UserKeys } from 'freedom-crypto-service';
import type { SignedSyncableOrigin, SyncableItemName, SyncableItemType, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import { syncableOriginSchema, syncableOriginSignatureExtrasSchema } from 'freedom-sync-types';

export const generateOrigin = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      path,
      type,
      name,
      contentHash,
      trustedTimeSignature,
      cryptoService
    }: SyncableOriginOptions & {
      path: SyncablePath;
      type: SyncableItemType;
      name: SyncableItemName;
      /** Use `undefined` if the path represents a folder-like item */
      contentHash: Sha256Hash | undefined;
      cryptoService: UserKeys;
    }
  ): PR<SignedSyncableOrigin> => {
    if (contentHash === undefined) {
      const folderContentHash = await generateSha256HashForEmptyString(trace);
      if (!folderContentHash.ok) {
        return folderContentHash;
      }

      contentHash = folderContentHash.value;
    }

    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    return await generateSignedValue(trace, {
      value: { contentHash, trustedTimeSignature },
      valueSchema: syncableOriginSchema,
      signatureExtras: { path, type, name },
      signatureExtrasSchema: syncableOriginSignatureExtrasSchema,
      signingKeys: privateKeys.value
    });
  }
);
