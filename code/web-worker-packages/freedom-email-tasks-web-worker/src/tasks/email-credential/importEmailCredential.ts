import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { EncryptedEmailCredential } from 'freedom-email-api';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredEncryptedEmailCredentialInfo } from '../../types/email-credential/LocallyStoredEncryptedEmailCredentialInfo.ts';
import { locallyStoredCredentialIdInfo } from '../../types/id/LocallyStoredCredentialId.ts';
import { getLocallyStoredEncryptedEmailCredentialInfoByEmail } from './getLocallyStoredEncryptedEmailCredentialInfoByEmail.ts';
import { removeLocallyStoredEncryptedEmailCredential } from './removeLocallyStoredEncryptedEmailCredential.ts';

export const importEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedCredential }: { encryptedCredential: EncryptedEmailCredential }
  ): PR<LocallyStoredEncryptedEmailCredentialInfo> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const existingLocallyStoredCredentialInfo = await getLocallyStoredEncryptedEmailCredentialInfoByEmail(trace, encryptedCredential.email);
    if (existingLocallyStoredCredentialInfo.ok) {
      const removedDuplicates = await removeLocallyStoredEncryptedEmailCredential(
        trace,
        existingLocallyStoredCredentialInfo.value.locallyStoredCredentialId
      );
      if (!removedDuplicates.ok) {
        return generalizeFailureResult(trace, removedDuplicates, 'not-found');
      }
    }

    const locallyStoredCredentialId = locallyStoredCredentialIdInfo.make(makeUuid());

    const storedCredential = await emailCredentialStore.mutableObject(locallyStoredCredentialId).create(trace, { encryptedCredential });
    if (!storedCredential.ok) {
      // Conflict should never happen since we're using a UUID
      return generalizeFailureResult(trace, storedCredential, 'conflict');
    }

    return makeSuccess({
      locallyStoredCredentialId,
      email: storedCredential.value.encryptedCredential.email,
      hasBiometricEncryption: storedCredential.value.pwEncryptedForBiometrics !== undefined
    });
  }
);
