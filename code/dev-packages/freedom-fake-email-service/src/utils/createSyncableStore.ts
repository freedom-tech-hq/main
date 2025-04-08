import fs from 'node:fs/promises';

import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';
import { FileSystemSyncableStoreBacking } from 'freedom-file-system-syncable-store-backing';
import { DEFAULT_SALT_ID, type SaltId, storageRootIdInfo, type SyncableItemMetadata } from 'freedom-sync-types';

import { getFsRootPathForStorageRootId } from './getFsRootPathForStorageRootId.ts';
import { getFsStatsAtPath } from './getFsStatsAtPath.ts';
import { getOrCreateSaltStoreForUser } from './getOrCreateSaltStoreForUser.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';

export const createSyncableStore = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      userId,
      metadata,
      creatorPublicKeys,
      saltsById
    }: {
      userId: EmailUserId;
      metadata: Omit<SyncableItemMetadata, 'name'>;
      creatorPublicKeys: CombinationCryptoKeySet;
      saltsById: Partial<Record<SaltId, string>>;
    }
  ): PR<undefined, 'conflict'> => {
    const storageRootId = storageRootIdInfo.make(userId);

    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
    const saltStore = await uncheckedResult(getOrCreateSaltStoreForUser(trace, { userId }));
    const rootPath = await uncheckedResult(getFsRootPathForStorageRootId(trace, storageRootId));

    const storedPublicKey = await publicKeyStore.mutableObject(creatorPublicKeys.id).create(trace, creatorPublicKeys);
    if (!storedPublicKey.ok && storedPublicKey.value.errorCode !== 'conflict') {
      // Ignoring if the public key was already stored
      return storedPublicKey;
    }

    const defaultSalt = saltsById[DEFAULT_SALT_ID];
    if (defaultSalt !== undefined) {
      const storedSalts = await saltStore.mutableObject(DEFAULT_SALT_ID).create(trace, defaultSalt);
      if (!storedSalts.ok && storedSalts.value.errorCode !== 'conflict') {
        // Ignoring if the salts were already stored
        return storedSalts;
      }
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
