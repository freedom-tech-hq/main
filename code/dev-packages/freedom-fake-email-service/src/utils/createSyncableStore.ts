import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import type { SaltId, StorageRootId, SyncableItemMetadata } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from './getFsRootPathForStorageRootId.ts';
import { getFsStatsAtPath } from './getFsStatsAtPath.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';
import { getSaltsStore } from './getSaltsStore.ts';

export const createSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      storageRootId,
      metadata,
      creatorPublicKeys,
      saltsById
    }: {
      storageRootId: StorageRootId;
      metadata: Omit<SyncableItemMetadata, 'name'>;
      creatorPublicKeys: CombinationCryptoKeySet;
      saltsById: Partial<Record<SaltId, string>>;
    }
  ): PR<undefined, 'conflict'> => {
    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
    const saltsStore = await uncheckedResult(getSaltsStore(trace));
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const storedPublicKey = await publicKeyStore.mutableObject(creatorPublicKeys.id).create(trace, creatorPublicKeys);
    if (!storedPublicKey.ok && storedPublicKey.value.errorCode !== 'conflict') {
      // Ignoring if the public key was already stored
      return storedPublicKey;
    }

    const storedSalts = await saltsStore.mutableObject(storageRootId).create(trace, saltsById);
    if (!storedSalts.ok && storedSalts.value.errorCode !== 'conflict') {
      // Ignoring if the salts were already stored
      return storedSalts;
    }

    const hashedStorageRootId = await generateSha256HashFromString(trace, storageRootId);
    if (!hashedStorageRootId.ok) {
      return hashedStorageRootId;
    }

    const fsStats = await getFsStatsAtPath(trace, rootPath);
    if (!fsStats.ok) {
      return fsStats;
    } else if (fsStats.value.exists) {
      return makeFailure(new ConflictError(trace, { message: `Path already exists: ${rootPath}`, errorCode: 'conflict' }));
    } else {
      await fs.mkdir(rootPath);
    }

    // TODO: TEMP
    console.log('created syncable store dir', rootPath);

    const storeBacking = new FileSystemSyncableStoreBacking(rootPath);
    const initialized = await storeBacking.initialize(trace, metadata);
    if (!initialized.ok) {
      return initialized;
    }

    return makeSuccess(undefined);
  }
);
