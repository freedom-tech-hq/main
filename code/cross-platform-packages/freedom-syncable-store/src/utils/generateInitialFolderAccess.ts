import { generateInitialAccess } from 'freedom-access-control';
import type { InitialAccess } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import type { SyncableStore, SyncableStoreRole } from 'freedom-syncable-store-types';
import { syncableStoreRoleSchema } from 'freedom-syncable-store-types';

import { doesSyncableStoreRoleHaveReadAccess } from './doesSyncableStoreRoleHaveReadAccess.ts';

export const generateInitialFolderAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: SyncableStore): PR<InitialAccess<SyncableStoreRole>> => {
    const privateKeys = await store.userKeys.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    // If this folder is being created by a non-root-creator user, then we need to ensure that the creator's encrypting key is added to the
    // shared keys.  Otherwise, this folder will be rejected
    const isRootCreator = privateKeys.value.id === store.creatorPublicKeys.id;

    // Only root creators can have the creator role.  Other folder creators are initialized with an owner role
    const folderCreatorRole = isRootCreator ? 'creator' : 'owner';

    const initialAccess: Array<{ role: SyncableStoreRole; publicKeys: CombinationCryptoKeySet }> = [
      { role: folderCreatorRole, publicKeys: privateKeys.value.publicOnly() }
    ];

    if (!isRootCreator) {
      initialAccess.push({ role: 'creator', publicKeys: store.creatorPublicKeys });
    }

    return await generateInitialAccess(trace, {
      userKeys: store.userKeys,
      initialAccess,
      roleSchema: syncableStoreRoleSchema,
      doesRoleHaveReadAccess: doesSyncableStoreRoleHaveReadAccess
    });
  }
);
