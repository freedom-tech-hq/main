import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';

export const removeEncryptionForWebAuthnFromLocallyStoredEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      locallyStoredCredentialId
    }: {
      locallyStoredCredentialId: LocallyStoredCredentialId;
    }
  ): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const storedCredential = await emailCredentialStore.object(locallyStoredCredentialId).get(trace);
    if (!storedCredential.ok) {
      return storedCredential;
    }

    const storedAccessor = emailCredentialStore.mutableObject(locallyStoredCredentialId);
    const stored = await storedAccessor.getMutable(trace);
    if (!stored.ok) {
      return stored;
    }

    if (stored.value.storedValue.pwEncryptedForWebAuthn !== undefined) {
      stored.value.storedValue.pwEncryptedForWebAuthn = undefined;
      const updated = await storedAccessor.update(trace, stored.value);
      if (!updated.ok) {
        return generalizeFailureResult(trace, updated, 'out-of-date');
      }
    }

    return makeSuccess(undefined);
  }
);
