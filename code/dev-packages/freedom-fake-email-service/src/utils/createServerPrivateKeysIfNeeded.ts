import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { privateCombinationCryptoKeySetSchema } from 'freedom-crypto-data';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { getPublicKeyStore } from './getPublicKeyStore.ts';
import { getServerPrivateKeys } from './getServerPrivateKeys.ts';
import { kvSetValue } from './mockKvDb.ts';

export const createServerPrivateKeysIfNeeded = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));

  let keys = await disableLam(trace, 'not-found', (trace) => getServerPrivateKeys(trace));
  if (!keys.ok) {
    // If not found, try to create
    if (keys.value.errorCode === 'not-found') {
      const privateKeys = await generateCryptoCombinationKeySet(trace);
      if (!privateKeys.ok) {
        return privateKeys;
      }

      const createdKeys = await kvSetValue(trace, 'server-keys', privateCombinationCryptoKeySetSchema, privateKeys.value);
      // If creating fails, another process might have just created, try to get again
      if (!createdKeys.ok) {
        if (createdKeys.value.errorCode === 'conflict') {
          keys = await getServerPrivateKeys(trace);
          // If it still fails, return the error
          if (!keys.ok) {
            return generalizeFailureResult(trace, keys, 'not-found');
          }

          return makeSuccess(undefined);
        } else {
          return excludeFailureResult(createdKeys, 'conflict');
        }
      }

      const storedPublicKey = await publicKeyStore.mutableObject(createdKeys.value.id).create(trace, createdKeys.value.publicOnly());
      if (!storedPublicKey.ok) {
        return generalizeFailureResult(trace, storedPublicKey, 'conflict');
      }

      return makeSuccess(undefined);
    } else {
      return excludeFailureResult(keys, 'not-found');
    }
  }

  return makeSuccess(undefined);
});
