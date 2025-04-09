import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { EmailUserId } from 'freedom-email-sync';

import { restoreUser } from '../../../tasks/user/restoreUser.ts';
import { generateSignedUserId } from './generateSignedUserId.ts';

export const createUserIdAndCryptoKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<{ userId: EmailUserId; privateKeys: PrivateCombinationCryptoKeySet }> => {
    const privateKeys = await generateCryptoCombinationKeySet(trace);
    if (!privateKeys.ok) {
      return privateKeys;
    }

    const generatedUserId = await generateSignedUserId(trace, { signingKeys: privateKeys.value });
    if (!generatedUserId.ok) {
      return generatedUserId;
    }

    // This is called restore, because it's also used for restoring, e.g. if a user is signing into a new device, but the initial setup is
    // the same logic
    const stored = await restoreUser(trace, { userId: generatedUserId.value, privateKeys: privateKeys.value });
    if (!stored.ok) {
      return stored;
    }

    return makeSuccess({ userId: generatedUserId.value, privateKeys: privateKeys.value });
  }
);
