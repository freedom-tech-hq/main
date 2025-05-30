import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { EncryptedEmailCredential } from 'freedom-email-sync';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';
import { locallyStoredCredentialIdInfo } from '../../types/id/LocallyStoredCredentialId.ts';
import { removeLocallyStoredEncryptedEmailCredentialForEmail } from './removeLocallyStoredEncryptedEmailCredentialForEmail.ts';

export const importEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedCredential }: { encryptedCredential: EncryptedEmailCredential }
  ): PR<{ locallyStoredCredentialId: LocallyStoredCredentialId }> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const removedDuplicates = await removeLocallyStoredEncryptedEmailCredentialForEmail(trace, encryptedCredential.email);
    if (!removedDuplicates.ok) {
      return removedDuplicates;
    }

    const locallyStoredCredentialId = locallyStoredCredentialIdInfo.make(makeUuid());

    const stored = await emailCredentialStore.mutableObject(locallyStoredCredentialId).create(trace, { encryptedCredential });
    if (!stored.ok) {
      // Conflict should never happen since we're using a UUID
      return generalizeFailureResult(trace, stored, 'conflict');
    }

    return makeSuccess({ locallyStoredCredentialId });
  }
);
