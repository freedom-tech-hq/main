import type { PR } from 'freedom-async';
import { allResultsMapped, bestEffort, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';
import type { LocallyStoredCredentialId } from '../../types/id/LocallyStoredCredentialId.ts';

export const removeLocallyStoredEncryptedEmailCredentialForEmail = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, email: string): PR<undefined> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const allKeys = await emailCredentialStore.keys.asc().keys(trace);
    if (!allKeys.ok) {
      return allKeys;
    }

    const toBeDeleted: LocallyStoredCredentialId[] = [];

    const found = await allResultsMapped(trace, allKeys.value, {}, async (trace, locallyStoredCredentialId) => {
      const storedCredential = await emailCredentialStore.mutableObject(locallyStoredCredentialId).get(trace);
      if (!storedCredential.ok) {
        return storedCredential;
      }

      if (storedCredential.value.encryptedCredential.email === email) {
        toBeDeleted.push(locallyStoredCredentialId);
      }

      return makeSuccess(undefined);
    });
    if (!found.ok) {
      return generalizeFailureResult(trace, found, 'not-found');
    }

    if (toBeDeleted.length > 0) {
      await bestEffort(
        trace,
        allResultsMapped(
          trace,
          toBeDeleted,
          {},
          async (trace, locallyStoredCredentialId) => await emailCredentialStore.mutableObject(locallyStoredCredentialId).delete(trace)
        )
      );
    }

    return makeSuccess(undefined);
  }
);
