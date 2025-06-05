import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';
import type { EncryptedEmailCredential } from 'freedom-email-api';

import { type LocallyStoredCredentialId, locallyStoredCredentialIdInfo } from '../../../types/id/LocallyStoredCredentialId.ts';
import { getEmailCredentialObjectStore } from '../../utils/getEmailCredentialObjectStore.ts';

export const storeEncryptedEmailCredentialLocally = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { encryptedEmailCredential }: { encryptedEmailCredential: EncryptedEmailCredential }
  ): PR<{ locallyStoredCredentialId: LocallyStoredCredentialId }> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const locallyStoredCredentialId = locallyStoredCredentialIdInfo.make(makeUuid());

    const stored = await emailCredentialStore
      .mutableObject(locallyStoredCredentialId)
      .create(trace, { encryptedCredential: encryptedEmailCredential });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, 'conflict');
    }

    return makeSuccess({ locallyStoredCredentialId });
  }
);
