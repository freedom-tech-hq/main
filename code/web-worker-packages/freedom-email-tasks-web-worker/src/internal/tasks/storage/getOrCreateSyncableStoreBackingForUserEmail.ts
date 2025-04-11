import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { EmailUserId } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { OpfsSyncableStoreBacking } from 'freedom-opfs-syncable-store-backing';
import { storageRootIdInfo, SyncablePath } from 'freedom-sync-types';
import { generateProvenanceForNewSyncableStore, type SyncableStoreBacking } from 'freedom-syncable-store-types';

import { makeCryptoServiceForUser } from '../../utils/makeCryptoServiceForUser.ts';

// TODO: TEMP
const globalCache: Record<EmailUserId, SyncableStoreBacking> = {};

export const getOrCreateSyncableStoreBackingForUserEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<SyncableStoreBacking> => {
    const cached = globalCache[credential.userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const cryptoService = makeCryptoServiceForUser(credential);

    const storageRootId = storageRootIdInfo.make(credential.userId);
    const provenance = await generateProvenanceForNewSyncableStore(trace, {
      storageRootId,
      cryptoService,
      trustedTimeSignature: undefined
    });
    if (!provenance.ok) {
      return provenance;
    }

    const hashedStorageRootId = await generateSha256HashFromString(trace, storageRootId);
    if (!hashedStorageRootId.ok) {
      return hashedStorageRootId;
    }

    const systemRoot = await navigator.storage.getDirectory();
    const userRoot = await systemRoot.getDirectoryHandle(encodeURIComponent(hashedStorageRootId.value), { create: true });

    const output = new OpfsSyncableStoreBacking(userRoot, new SyncablePath(storageRootId));
    const initialized = await output.initialize(trace, { provenance: provenance.value });
    if (!initialized.ok) {
      return initialized;
    }

    // const output = new InMemorySyncableStoreBacking({ provenance: provenance.value });
    globalCache[credential.userId] = output;

    return makeSuccess(output);
  }
);
