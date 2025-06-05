import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { EmailCredential } from 'freedom-email-api';

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

  return makeSuccess({ userId: generatedUserId.value, privateKeys: privateKeys.value });
});
