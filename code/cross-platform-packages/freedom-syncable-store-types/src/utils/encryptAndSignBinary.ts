import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { encryptBuffer } from 'freedom-crypto';
import type { CryptoService } from 'freedom-crypto-service';
import { decryptOneEncryptedValue } from 'freedom-crypto-service';

import type { SyncableStoreAccessControlDocument } from '../types/SyncableStoreAccessControlDocument.ts';

export const encryptAndSignBinary = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    value: Uint8Array,
    { accessControlDoc, cryptoService }: { accessControlDoc: SyncableStoreAccessControlDocument; cryptoService: CryptoService }
  ): PR<Uint8Array> => {
    const sharedSecrets = await accessControlDoc.getSharedSecrets(trace);
    /* node:coverage disable */
    if (!sharedSecrets.ok) {
      return sharedSecrets;
    }
    /* node:coverage enable */

    const selectedSharedSecretId = sharedSecrets.value[sharedSecrets.value.length - 1]?.id;
    /* node:coverage disable */
    if (selectedSharedSecretId === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'Failed to determine shared secret ID' }));
    }
    /* node:coverage enable */

    const selectedSharedSecret = sharedSecrets.value.find((sharedSecret) => sharedSecret.id === selectedSharedSecretId)!;

    // TODO: could be cached probably
    const sharedSecretKeys = await decryptOneEncryptedValue(trace, cryptoService, selectedSharedSecret.secretKeysEncryptedPerMember);
    /* node:coverage disable */
    if (!sharedSecretKeys.ok) {
      return sharedSecretKeys;
    }
    /* node:coverage enable */

    const encryptedValue = await encryptBuffer(trace, { value, encryptingKeys: sharedSecretKeys.value });
    /* node:coverage disable */
    if (!encryptedValue.ok) {
      return encryptedValue;
    }
    /* node:coverage enable */

    const signedEncryptedValue = await cryptoService.generateSignedBuffer(trace, { value: encryptedValue.value });
    /* node:coverage disable */
    if (!signedEncryptedValue.ok) {
      return signedEncryptedValue;
    }
    /* node:coverage enable */

    return makeSuccess(signedEncryptedValue.value);
  }
);
