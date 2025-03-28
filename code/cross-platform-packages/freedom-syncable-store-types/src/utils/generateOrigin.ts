import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashForEmptyString } from 'freedom-crypto';
import type { CryptoService } from 'freedom-crypto-service';
import type { SignedSyncableOrigin, SyncablePath } from 'freedom-sync-types';
import { syncableOriginSchema, syncableOriginSignatureExtrasSchema } from 'freedom-sync-types';

export const generateOrigin = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      path,
      contentHash,
      cryptoService
    }: {
      path: SyncablePath;
      /** Use `undefined` if the path represents a folder-like item */
      contentHash: Sha256Hash | undefined;
      cryptoService: CryptoService;
    }
  ): PR<SignedSyncableOrigin> => {
    if (contentHash === undefined) {
      const folderContentHash = await generateSha256HashForEmptyString(trace);
      if (!folderContentHash.ok) {
        return folderContentHash;
      }

      contentHash = folderContentHash.value;
    }

    return await cryptoService.generateSignedValue(trace, {
      value: { contentHash },
      valueSchema: syncableOriginSchema,
      signatureExtras: { path },
      signatureExtrasSchema: syncableOriginSignatureExtrasSchema
    });
  }
);
