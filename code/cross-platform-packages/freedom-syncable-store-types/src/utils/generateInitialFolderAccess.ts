import { generateInitialAccess } from 'freedom-access-control';
import type { AccessControlState, InitialAccess } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';

import type { SyncableStore } from '../types/SyncableStore.ts';
import type { SyncableStoreRole } from '../types/SyncableStoreRole.ts';
import { syncableStoreRoleSchema } from '../types/SyncableStoreRole.ts';

export const generateInitialFolderAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore): PR<InitialAccess<SyncableStoreRole>> => {
    const privateKeyIds = await store.cryptoService.getPrivateCryptoKeySetIds(trace);
    if (!privateKeyIds.ok) {
      return privateKeyIds;
    }

    // If this folder is being created by a non-root-creator user, then we need to ensure that the creator's encrypting key is added to the
    // shared keys.  Otherwise, this folder will be rejected
    const isRootCreator = privateKeyIds.value.includes(store.creatorCryptoKeySetId);

    // Only root creators can have the creator role.  Other folder creators are initialized with an owner role
    const folderCreatorRole = isRootCreator ? 'creator' : 'owner';

    const initialState: AccessControlState<SyncableStoreRole> = { [privateKeyIds.value[0]]: folderCreatorRole };

    if (!isRootCreator) {
      const creatorEncryptingKeySet = await store.cryptoService.getEncryptingKeySetForId(trace, store.creatorCryptoKeySetId);
      if (!creatorEncryptingKeySet.ok) {
        return generalizeFailureResult(trace, creatorEncryptingKeySet, 'not-found');
      }

      initialState[creatorEncryptingKeySet.value.id] = 'creator';
    }

    return await generateInitialAccess(trace, { cryptoService: store.cryptoService, initialState, roleSchema: syncableStoreRoleSchema });
  }
);
