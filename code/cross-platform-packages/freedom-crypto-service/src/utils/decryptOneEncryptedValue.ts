import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure } from 'freedom-async';
import { objectKeys } from 'freedom-cast';
import { ForbiddenError, generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { decryptEncryptedValue } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';

import type { CryptoService } from '../types/CryptoService.ts';

/**
 * Decrypts the first value that the crypto service has access to.  Returns an error if the crypto service can't access any of the values.
 *
 * This is used for cases where the same value is re-encrypted multiple times, for different users, for example.
 */
export const decryptOneEncryptedValue = makeAsyncResultFunc(
  [import.meta.filename],
  async <T>(trace: Trace, cryptoService: CryptoService, encryptedValues: Partial<Record<CryptoKeySetId, EncryptedValue<T>>>): PR<T> => {
    const privateKeyIds = await cryptoService.getPrivateCryptoKeySetIds(trace);
    if (!privateKeyIds.ok) {
      return privateKeyIds;
    }

    const keyIdsSet = new Set(privateKeyIds.value);

    const keyId = objectKeys(encryptedValues).find((keyId) => keyIdsSet.has(keyId) && encryptedValues[keyId] !== undefined);
    if (keyId === undefined) {
      return makeFailure(new ForbiddenError(trace, { message: 'No key found to decrypt the encrypted value' }));
    }

    const encryptedValue = encryptedValues[keyId]!;

    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace, keyId);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    return await decryptEncryptedValue(trace, encryptedValue, { decryptingKeys: privateKeys.value });
  }
);
