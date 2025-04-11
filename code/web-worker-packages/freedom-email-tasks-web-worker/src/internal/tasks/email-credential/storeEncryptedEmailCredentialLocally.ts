import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';

import { getEmailCredentialObjectStore } from '../../utils/getEmailCredentialObjectStore.ts';

export const storeEncryptedEmailCredentialLocally = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { description, encryptedEmailCredential }: { description: string; encryptedEmailCredential: Base64String }
  ): PR<undefined> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const uuid = makeUuid();

    const stored = await emailCredentialStore.mutableObject(uuid).create(trace, { encrypted: encryptedEmailCredential, description });
    if (!stored.ok) {
      return generalizeFailureResult(trace, stored, 'conflict');
    }

    return makeSuccess(undefined);
  }
);
