import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getMailPaths } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { getMutableFolderAtPath } from 'freedom-syncable-store';

import { getOrCreateEmailAccessForUser } from '../user/getOrCreateEmailAccessForUser.ts';

export const grantAppenderAccessOnStorageFolderToRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential, { remotePublicKeys }: { remotePublicKeys: CombinationCryptoKeySet }): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const mailPaths = await getMailPaths(userFs);

    const storageFolderPath = mailPaths.storage.value;
    const storageFolder = await getMutableFolderAtPath(trace, userFs, storageFolderPath);
    if (!storageFolder.ok) {
      return generalizeFailureResult(trace, storageFolder, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const remoteCurrentStorageFolderRoles = await storageFolder.value.getRolesByCryptoKeySetId(trace, {
      cryptoKeySetIds: [remotePublicKeys.id]
    });
    if (!remoteCurrentStorageFolderRoles.ok) {
      return remoteCurrentStorageFolderRoles;
    }

    if (remoteCurrentStorageFolderRoles.value[remotePublicKeys.id] === undefined) {
      const addedRemoteAppenderAccess = await storageFolder.value.updateAccess(trace, {
        type: 'add-access',
        publicKeys: remotePublicKeys,
        role: 'appender'
      });
      if (!addedRemoteAppenderAccess.ok) {
        return generalizeFailureResult(trace, addedRemoteAppenderAccess, 'conflict');
      }
    }

    return makeSuccess(undefined);
  }
);
