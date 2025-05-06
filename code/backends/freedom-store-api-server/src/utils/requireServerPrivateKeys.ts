import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import type { Result } from 'freedom-async/lib/types/Result';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { createMailAgentPrivateKeys, getMailAgentPrivateKeys } from 'freedom-db';

/**
 * Tests for the availability of server private keys.
 * In DEV mode also creates them, if missing.
 */
export const requireServerPrivateKeys = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  const serverPrivateKeys: Result<PrivateCombinationCryptoKeySet, 'conflict' | 'not-found'> = await getMailAgentPrivateKeys(trace);

  // Do not create the keys in production: it imposes risk of data divergence. A downtime would be less costly than that.
  DEV: {
    if (!serverPrivateKeys.ok && serverPrivateKeys.value.errorCode === 'not-found') {
      // Generate new keys
      const privateKeys = await generateCryptoCombinationKeySet(trace);
      if (!privateKeys.ok) {
        return privateKeys;
      }

      // Store them
      const result = await createMailAgentPrivateKeys(trace, privateKeys.value);
      if (!result.ok) {
        return result;
      }
    }
  }

  // This should not happen
  if (!serverPrivateKeys.ok) {
    return generalizeFailureResult(trace, serverPrivateKeys, ['conflict', 'not-found']);
  }

  return makeSuccess(undefined);
});
