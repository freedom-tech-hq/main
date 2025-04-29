import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Uuid } from 'freedom-contexts';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const removeEncryptionForBiometricsFromLocallyStoredEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      localCredentialUuid
    }: {
      localCredentialUuid: Uuid;
    }
  ): PR<undefined, 'not-found'> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const encryptedCredential = await emailCredentialStore.object(localCredentialUuid).get(trace);
    if (!encryptedCredential.ok) {
      return encryptedCredential;
    }

    const storedAccessor = emailCredentialStore.mutableObject(localCredentialUuid);
    const stored = await storedAccessor.getMutable(trace);
    if (!stored.ok) {
      return stored;
    }

    if (stored.value.storedValue.pwEncryptedForBiometrics !== undefined) {
      stored.value.storedValue.pwEncryptedForBiometrics = undefined;
      const updated = await storedAccessor.update(trace, stored.value);
      if (!updated.ok) {
        return generalizeFailureResult(trace, updated, 'out-of-date');
      }
    }

    return makeSuccess(undefined);
  }
);
