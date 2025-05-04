import { makeAsyncResultFunc, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import type { Result } from 'freedom-async/lib/types/Result';
import { generalizeFailureResult } from 'freedom-common-errors';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { getPrivateKeyStore, getPublicKeyStore, getServerPrivateKeys } from 'freedom-db';

/**
 * Tests for the availability of server private keys.
 * In DEV mode also creates them, if missing.
 */
export const requireServerPrivateKeys = makeAsyncResultFunc([import.meta.filename], async (trace): PR<undefined> => {
  let serverPrivateKeys: Result<PrivateCombinationCryptoKeySet, 'conflict' | 'not-found'> = await getServerPrivateKeys(trace);

  // Do not create the keys in production: it imposes risk of data divergence. A downtime would be less costly than that.
  DEV: {
    if (!serverPrivateKeys.ok && serverPrivateKeys.value.errorCode === 'not-found') {
      serverPrivateKeys = await createServerPrivateKeys(trace);
    }
  }

  // This should not happen
  if (!serverPrivateKeys.ok) {
    return generalizeFailureResult(trace, serverPrivateKeys, ['conflict', 'not-found']);
  }

  return makeSuccess(undefined);
});

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
