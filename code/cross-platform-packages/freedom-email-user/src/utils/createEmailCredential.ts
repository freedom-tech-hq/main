import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { SaltsById } from 'freedom-sync-types';
import { DEFAULT_SALT_ID } from 'freedom-sync-types';

import { EMAIL_APP_SALT_ID } from '../consts/salt-ids.ts';
import type { EmailCredential } from '../types/EmailCredential.ts';
import { generateSignedUserId } from './generateSignedUserId.ts';

export const createEmailCredential = makeAsyncResultFunc([import.meta.filename], async (trace): PR<EmailCredential> => {
  const privateKeys = await generateCryptoCombinationKeySet(trace);
  if (!privateKeys.ok) {
    return privateKeys;
  }

  const generatedUserId = await generateSignedUserId(trace, { signingKeys: privateKeys.value });
  if (!generatedUserId.ok) {
    return generatedUserId;
  }

  const saltsById: SaltsById = {
    [DEFAULT_SALT_ID]: makeUuid(),
    [EMAIL_APP_SALT_ID]: makeUuid()
  };

  return makeSuccess({ userId: generatedUserId.value, privateKeys: privateKeys.value, saltsById });
});
