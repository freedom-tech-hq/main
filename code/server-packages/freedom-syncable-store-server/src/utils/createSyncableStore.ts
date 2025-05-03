import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getPublicKeyStore } from 'freedom-db'; // TODO: Revise importing freedom-db in this package. They should probably join one level above, but maybe not
import type { EmailUserId } from 'freedom-email-sync';
import { getFsStatsAtPath } from 'freedom-fake-email-service';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { storageRootIdInfo, type SyncableItemMetadata } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from '../internal/utils/getFsRootPathForStorageRootId.ts';

export const createSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      userId,
      metadata,
      creatorPublicKeys
    }: {
      userId: EmailUserId;
      metadata: Omit<SyncableItemMetadata, 'name'>;
      creatorPublicKeys: CombinationCryptoKeySet;
    }
  ): PR<undefined, 'conflict'> => {
    const storageRootId = storageRootIdInfo.make(userId);

    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const storedPublicKey = await publicKeyStore.mutableObject(creatorPublicKeys.id).create(trace, creatorPublicKeys);
    if (!storedPublicKey.ok && storedPublicKey.value.errorCode !== 'conflict') {
      // Ignoring if the public key was already stored
      return storedPublicKey;
    }

    const fsStats = await getFsStatsAtPath(trace, rootPath);
    if (!fsStats.ok) {
      return fsStats;
    } else if (fsStats.value.exists) {
      return makeFailure(new ConflictError(trace, { message: `Path already exists: ${rootPath}`, errorCode: 'conflict' }));
    } else {
      await fs.mkdir(rootPath);
    }

    console.log(`File system path for ${userId}\n  is:`, rootPath);

    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const initialized = await storeBacking.initialize(trace, metadata);
    if (!initialized.ok) {
      return initialized;
    }

    return makeSuccess(undefined);
  }
);
