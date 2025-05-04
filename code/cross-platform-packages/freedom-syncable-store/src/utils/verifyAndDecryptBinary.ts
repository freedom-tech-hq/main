import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import {
  decryptBuffer,
  extractKeyIdFromEncryptedBuffer,
  extractKeyIdFromSignedBuffer,
  extractValueFromSignedBuffer,
  isSignatureValidForSignedBuffer
} from 'freedom-crypto';
import type { UserKeys } from 'freedom-crypto-service';
import { decryptOneEncryptedValue } from 'freedom-crypto-service';
import type { ISyncableStoreAccessControlDocument } from 'freedom-syncable-store-types';

export const verifyAndDecryptBinary = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    signedEncryptedValue: Uint8Array,
    { accessControlDoc, userKeys }: { accessControlDoc: ISyncableStoreAccessControlDocument; userKeys: UserKeys }
  ): PR<Uint8Array> => {
    const sharedKeys = await accessControlDoc.getSharedKeys(trace);
    /* node:coverage disable */
    if (!sharedKeys.ok) {
      return sharedKeys;
    }
    /* node:coverage enable */

    const signedByKeyId = extractKeyIdFromSignedBuffer(trace, { signedBuffer: signedEncryptedValue });
    if (!signedByKeyId.ok) {
      return generalizeFailureResult(trace, signedByKeyId, 'not-found');
    }

    const signedByPublicKeys = await accessControlDoc.getPublicKeysById(trace, signedByKeyId.value);
    if (!signedByPublicKeys.ok) {
      return generalizeFailureResult(trace, signedByPublicKeys, 'not-found');
    }

    const isSignatureValid = await isSignatureValidForSignedBuffer(trace, {
      signedBuffer: signedEncryptedValue,
      verifyingKeys: signedByPublicKeys.value
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

    const selectedSharedKeysId = await extractKeyIdFromEncryptedBuffer(trace, { encryptedValue: encryptedValue.value });
    /* node:coverage disable */
    if (!selectedSharedKeysId.ok) {
      if (selectedSharedKeysId.value.errorCode === 'not-found') {
        return makeFailure(
          new InternalStateError(trace, {
            message: 'Failed to extract shared key set ID from encrypted value',
            cause: selectedSharedKeysId.value
          })
        );
      }
      return excludeFailureResult(selectedSharedKeysId, 'not-found');
    }
    /* node:coverage enable */

    const selectedSharedKeys = sharedKeys.value.find((sharedSecret) => sharedSecret.id === selectedSharedKeysId.value)!;

    // TODO: could be cached probably
    const decryptedSharedSecretKeys = await decryptOneEncryptedValue(trace, userKeys, selectedSharedKeys.secretKeysEncryptedPerMember);
    /* node:coverage disable */
    if (!decryptedSharedSecretKeys.ok) {
      return decryptedSharedSecretKeys;
    }
    /* node:coverage enable */

    const decryptedValue = await decryptBuffer(trace, {
      encryptedValue: encryptedValue.value,
      decryptingKeys: decryptedSharedSecretKeys.value
    });
    /* node:coverage disable */
    if (!decryptedValue.ok) {
      return decryptedValue;
    }
    /* node:coverage enable */

    return makeSuccess(decryptedValue.value);
  }
);
