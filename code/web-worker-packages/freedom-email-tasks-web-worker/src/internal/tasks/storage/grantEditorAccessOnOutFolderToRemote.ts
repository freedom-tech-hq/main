import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { getMailPaths } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { getMutableFolderAtPath } from 'freedom-syncable-store';

import { getOrCreateEmailSyncableStore } from '../user/getOrCreateEmailSyncableStore.ts';

export const grantEditorAccessOnOutFolderToRemote = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential, { remotePublicKeys }: { remotePublicKeys: CombinationCryptoKeySet }): PR<undefined> => {
    const syncableStore = await uncheckedResult(getOrCreateEmailSyncableStore(trace, credential));

    const mailPaths = await getMailPaths(syncableStore);

    const outFolderPath = mailPaths.out.value;
    const outFolder = await getMutableFolderAtPath(trace, syncableStore, outFolderPath);
    if (!outFolder.ok) {
      return generalizeFailureResult(trace, outFolder, ['not-found', 'untrusted', 'wrong-type']);
    }

    const remoteCurrentOutFolderRoles = await outFolder.value.getRolesByCryptoKeySetId(trace, {
      cryptoKeySetIds: [remotePublicKeys.id]
    });
    if (!remoteCurrentOutFolderRoles.ok) {
      return remoteCurrentOutFolderRoles;
    }

    if (remoteCurrentOutFolderRoles.value[remotePublicKeys.id] === undefined) {
      const addedRemoteEditorAccess = await outFolder.value.updateAccess(trace, {
        type: 'add-access',
        publicKeys: remotePublicKeys,
        role: 'editor'
      });
      if (!addedRemoteEditorAccess.ok) {
        return generalizeFailureResult(trace, addedRemoteEditorAccess, 'conflict');
      }
    }

    return makeSuccess(undefined);
  }
);
