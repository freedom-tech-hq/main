import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { base64String, type Uuid } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import { decryptBufferWithPassword } from 'freedom-crypto';
import type { EmailUserId } from 'freedom-email-sync';
import { createInitialSyncableStoreStructureForUser, decryptEmailCredentialWithPassword } from 'freedom-email-user';

import { useActiveCredential } from '../../contexts/active-credential.ts';
import { getOrCreateEmailSyncableStore } from '../../internal/tasks/user/getOrCreateEmailSyncableStore.ts';
import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialPasswordType } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialPasswordType.ts';

export const activateUserWithLocallyStoredEncryptedEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      localCredentialUuid,
      password,
      passwordType
    }: { localCredentialUuid: Uuid; password: string; passwordType: LocallyStoredEncryptedEmailCredentialPasswordType }
  ): PR<{ userId: EmailUserId }, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const activeCredential = useActiveCredential(trace);

    const encryptedCredential = await emailCredentialStore.object(localCredentialUuid).get(trace);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    switch (passwordType) {
      case 'master':
        break;

      case 'biometrics': {
        if (encryptedCredential.value.pwEncryptedForBiometrics === undefined) {
          return makeFailure(
            new NotFoundError(trace, { message: `No biometrics credential found for ${localCredentialUuid}`, errorCode: 'not-found' })
          );
        }

        const decryptedMasterPassword = await decryptBufferWithPassword(trace, {
          encryptedValue: base64String.toBuffer(encryptedCredential.value.pwEncryptedForBiometrics),
          password
        });
        if (!decryptedMasterPassword.ok) {
          return decryptedMasterPassword;
        }

        password = Buffer.from(decryptedMasterPassword.value).toString('utf-8');

        break;
      }
    }

    const decryptedCredential = await decryptEmailCredentialWithPassword(trace, {
      encryptedEmailCredential: encryptedCredential.value.encrypted,
      password
    });
    if (!decryptedCredential.ok) {
      return decryptedCredential;
    }

    const syncableStoreResult = await getOrCreateEmailSyncableStore(trace, decryptedCredential.value);
    if (!syncableStoreResult.ok) {
      return syncableStoreResult;
    }
    const userFs = syncableStoreResult.value;

    // Calling this every time we activate a user in case our code has changed to need a different structure.  This ignores conflicts
    const createdStructure = await createInitialSyncableStoreStructureForUser(trace, userFs);
    if (!createdStructure.ok) {
      return createdStructure;
    }

    activeCredential.credential = decryptedCredential.value;

    return makeSuccess({ userId: decryptedCredential.value.userId });
  }
);
