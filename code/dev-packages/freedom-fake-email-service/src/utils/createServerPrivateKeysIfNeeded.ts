import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { disableLam } from 'freedom-trace-logging-and-metrics';

import { getPrivateKeyStore } from './getPrivateKeyStore.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';

export const createServerPrivateKeysIfNeeded = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));
  const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));

  let keys = await disableLam(trace, 'not-found', (trace) => privateKeyStore.object('server-keys').get(trace));
  if (!keys.ok) {
    // If not found, try to create
    if (keys.value.errorCode === 'not-found') {
      const privateKeys = await generateCryptoCombinationKeySet(trace);
      if (!privateKeys.ok) {
        return privateKeys;
      }

      const createdKeys = await privateKeyStore.mutableObject('server-keys').create(trace, privateKeys.value);
      // If creating fails, another process might have just created, try to get again
      if (!createdKeys.ok) {
        if (createdKeys.value.errorCode === 'conflict') {
          keys = await privateKeyStore.object('server-keys').get(trace);
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
