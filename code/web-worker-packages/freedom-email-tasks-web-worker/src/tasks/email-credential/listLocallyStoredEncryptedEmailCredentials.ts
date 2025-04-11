import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export interface EmailCredentialInfo {
  description?: string;
  localUuid: Uuid;
}

export const listLocallyStoredEncryptedEmailCredentials = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<EmailCredentialInfo[]> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const keys = await emailCredentialStore.keys.asc().keys(trace);
    if (!keys.ok) {
      return keys;
    }

    return await allResultsMapped(trace, keys.value, {}, async (trace, key) => {
      const storedCredential = await emailCredentialStore.object(key).get(trace);
      if (!storedCredential.ok) {
        return generalizeFailureResult(trace, storedCredential, 'not-found');
      }

      return makeSuccess({ description: storedCredential.value.description, localUuid: key });
    });
  }
);
