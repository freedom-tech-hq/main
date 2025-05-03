import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, uncheckedResult } from 'freedom-async';
import { base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractKeyIdFromSignature } from 'freedom-crypto';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getPublicKeyStore } from 'freedom-db';
import type { EmailUserId } from 'freedom-email-sync';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { storageRootIdInfo, SyncablePath } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export const getPublicKeysForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { userId }: { userId: EmailUserId }): PR<CombinationCryptoKeySet, 'not-found'> => {
    const storageRootId = storageRootIdInfo.make(userId);

    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const rootMetadata = await storeBacking.getMetadataAtPath(trace, new SyncablePath(storageRootId));
    if (!rootMetadata.ok) {
      return generalizeFailureResult(trace, rootMetadata, ['not-found', 'wrong-type']);
    }

    const creatorPublicKeysId = extractKeyIdFromSignature(trace, {
      signature: base64String.toBuffer(rootMetadata.value.provenance.origin.signature)
    });
    if (!creatorPublicKeysId.ok) {
      return generalizeFailureResult(trace, creatorPublicKeysId, 'not-found');
    }

    return await publicKeyStore.object(creatorPublicKeysId.value).get(trace);
  }
);
