import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { getOrCreate } from 'freedom-get-or-create';

import { getPrivateKeyStore } from './getPrivateKeyStore.ts';
import { getPublicKeyStore } from './getPublicKeyStore.ts';
import { getServerPrivateKeys } from './getServerPrivateKeys.ts';

export const createServerPrivateKeysIfNeeded = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace): PR<PrivateCombinationCryptoKeySet> =>
    await getOrCreate(trace, { get: getServerPrivateKeys, create: createServerPrivateKeys })
);

// Helpers

const createServerPrivateKeys = makeAsyncResultFunc(
  [import.meta.filename, 'createServerPrivateKeys'],
  async (trace): PR<PrivateCombinationCryptoKeySet, 'conflict'> => {
    const privateKeyStore = await uncheckedResult(getPrivateKeyStore(trace));
    const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));

    const privateKeys = await generateCryptoCombinationKeySet(trace);
    if (!privateKeys.ok) {
      return privateKeys;
    }

    const created = await privateKeyStore.mutableObject('server-keys').create(trace, privateKeys.value);
    if (!created.ok) {
      return created;
    }

    const storedPublicKey = await publicKeyStore.mutableObject(created.value.id).create(trace, created.value.publicOnly());
    if (!storedPublicKey.ok) {
      return generalizeFailureResult(trace, storedPublicKey, 'conflict');
    }

    return makeSuccess(created.value);
  }
);
