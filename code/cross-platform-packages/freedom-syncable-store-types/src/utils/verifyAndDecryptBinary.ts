import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { decryptBuffer, extractKeyIdFromEncryptedBuffer, extractValueFromSignedBuffer } from 'freedom-crypto';
import type { CryptoService } from 'freedom-crypto-service';
import { decryptOneEncryptedValue } from 'freedom-crypto-service';

import type { SyncableStoreAccessControlDocument } from '../types/SyncableStoreAccessControlDocument.ts';

export const verifyAndDecryptBinary = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    signedEncryptedValue: Uint8Array,
    { accessControlDoc, cryptoService }: { accessControlDoc: SyncableStoreAccessControlDocument; cryptoService: CryptoService }
  ): PR<Uint8Array> => {
    const sharedSecrets = await accessControlDoc.getSharedSecrets(trace);
    /* node:coverage disable */
    if (!sharedSecrets.ok) {
      return sharedSecrets;
    }
    /* node:coverage enable */

    const isSignatureValid = await cryptoService.isSignatureValidForSignedBuffer(trace, {
      signedBuffer: signedEncryptedValue
    });
    /* node:coverage disable */
    if (!isSignatureValid.ok) {
      return isSignatureValid;
    } else if (!isSignatureValid.value) {
      /* node:coverage enable */
      return makeFailure(new InternalStateError(trace, { message: 'Invalid signature' }));
    }

    const encryptedValue = extractValueFromSignedBuffer(trace, { signedBuffer: signedEncryptedValue });
    /* node:coverage disable */
    if (!encryptedValue.ok) {
      return encryptedValue;
    }
    /* node:coverage enable */

    const selectedSharedSecretId = await extractKeyIdFromEncryptedBuffer(trace, { encryptedValue: encryptedValue.value });
    /* node:coverage disable */
    if (!selectedSharedSecretId.ok) {
      if (selectedSharedSecretId.value.errorCode === 'not-found') {
        return makeFailure(
          new InternalStateError(trace, {
            message: 'Failed to extract shared secret ID from encrypted value',
            cause: selectedSharedSecretId.value
          })
        );
      }
      return excludeFailureResult(selectedSharedSecretId, 'not-found');
    }
    /* node:coverage enable */

    const selectedSharedSecret = sharedSecrets.value.find((sharedSecret) => sharedSecret.id === selectedSharedSecretId.value)!;

    // TODO: could be cached probably
    const sharedSecretKeys = await decryptOneEncryptedValue(trace, cryptoService, selectedSharedSecret.secretKeysEncryptedPerMember);
    /* node:coverage disable */
    if (!sharedSecretKeys.ok) {
      return sharedSecretKeys;
    }
    /* node:coverage enable */

    const decryptedValue = await decryptBuffer(trace, { encryptedValue: encryptedValue.value, decryptingKeys: sharedSecretKeys.value });
    /* node:coverage disable */
    if (!decryptedValue.ok) {
      return decryptedValue;
    }
    /* node:coverage enable */

    return makeSuccess(decryptedValue.value);
  }
);
