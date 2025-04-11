import type { PR } from 'freedom-async';
import { allResults, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';

import { writeKv } from '../../utils/writeKv.ts';

export const storeEncryptedEmailCredentialLocally = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { description, encryptedEmailCredential }: { description: string; encryptedEmailCredential: Base64String }
  ): PR<undefined> => {
    const uuid = makeUuid();

    const wrote = await allResults(trace, [
      writeKv(trace, `EMAIL_CREDENTIAL_${uuid}.encrypted`, encryptedEmailCredential),
      writeKv(trace, `EMAIL_CREDENTIAL_${uuid}.description`, description)
    ]);
    if (!wrote.ok) {
      return wrote;
    }

    return makeSuccess(undefined);
  }
);
