import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Base64String, Uuid } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import { makeUuid } from 'freedom-contexts';

import { getEmailCredentialObjectStore } from '../../internal/utils/getEmailCredentialObjectStore.ts';

export const importEmailCredential = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { description, encryptedEmailCredential }: { description: string; encryptedEmailCredential: Base64String }
  ): PR<{ locallyStoredCredentialUuid: Uuid }> => {
    const emailCredentialStore = await uncheckedResult(getEmailCredentialObjectStore(trace));

    const localUuid = makeUuid();

    const stored = await emailCredentialStore.mutableObject(localUuid).create(trace, { description, encrypted: encryptedEmailCredential });
    if (!stored.ok) {
      // Conflict should never happen since we're using a UUID
      return generalizeFailureResult(trace, stored, 'conflict');
    }

    return makeSuccess({ locallyStoredCredentialUuid: localUuid });
  }
);
