import type { PR, PRFunc } from 'freedom-async';
import { excludeFailureResult, firstSuccessResult, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import {
  decryptEncryptedValue,
  extractKeyIdFromEncryptedValue,
  extractKeyIdFromSignedBuffer,
  extractKeyIdFromSignedValue,
  generateEncryptedValue,
  generateSignedBuffer,
  generateSignedValue,
  isSignatureValidForSignedBuffer,
  isSignedValueValid
} from 'freedom-crypto';
import type {
  CombinationCryptoKeySet,
  CryptoKeySetId,
  EncryptedValue,
  EncryptingKeySet,
  EncryptionMode,
  PrivateCombinationCryptoKeySet,
  SignedValue,
  SigningMode,
  VerifyingKeySet
} from 'freedom-crypto-data';
import { disableLam } from 'freedom-trace-logging-and-metrics';
import type { Schema } from 'yaschema';

import type { CryptoService } from '../types/CryptoService.ts';

export const makeCryptoService = ({
  getCryptoKeySetIds,
  getCryptoKeysById,
  getPublicCryptoKeysById,
  getMostRecentCryptoKeys
}: {
  getCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
  getCryptoKeysById: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
  getPublicCryptoKeysById: PRFunc<CombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
  getMostRecentCryptoKeys: PRFunc<PrivateCombinationCryptoKeySet>;
}): CryptoService => ({
  getCryptoKeySetIds,

  decryptEncryptedValue: makeAsyncResultFunc([import.meta.filename, 'decryptEncryptedValue'], async (trace, encryptedValue) => {
    const decryptingKeyId = await extractKeyIdFromEncryptedValue(trace, { encryptedValue });
    if (!decryptingKeyId.ok) {
      return generalizeFailureResult(trace, decryptingKeyId, 'not-found');
    }

    const cryptoKeys = await getCryptoKeysById(trace, decryptingKeyId.value);
    if (!cryptoKeys.ok) {
      return generalizeFailureResult(trace, cryptoKeys, 'not-found');
    }

    return decryptEncryptedValue(trace, encryptedValue, { decryptingKeys: cryptoKeys.value });
  }),

  generateEncryptedValue: makeAsyncResultFunc(
    [import.meta.filename, 'generateEncryptedValue'],
    async <T>(
      trace: Trace,
      {
        cryptoKeySetId,
        value,
        valueSchema,
        ...options
      }: { cryptoKeySetId?: CryptoKeySetId; value: T; valueSchema: Schema<T>; mode?: EncryptionMode; includeKeyId?: boolean }
    ): PR<EncryptedValue<T>> => {
      const cryptoKeys = await (cryptoKeySetId === undefined ? getMostRecentCryptoKeys(trace) : getCryptoKeysById(trace, cryptoKeySetId));
      if (!cryptoKeys.ok) {
        return generalizeFailureResult(trace, cryptoKeys, 'not-found');
      }

      return generateEncryptedValue(trace, { ...options, value, valueSchema, encryptingKeys: cryptoKeys.value });
    }
  ),

  generateSignedBuffer: makeAsyncResultFunc(
    [import.meta.filename, 'generateSignedBuffer'],
    async (trace, { cryptoKeySetId, ...options }: { cryptoKeySetId?: CryptoKeySetId; value: Uint8Array; mode?: SigningMode }) => {
      const cryptoKeys = await (cryptoKeySetId === undefined ? getMostRecentCryptoKeys(trace) : getCryptoKeysById(trace, cryptoKeySetId));
      if (!cryptoKeys.ok) {
        return generalizeFailureResult(trace, cryptoKeys, 'not-found');
      }

      return generateSignedBuffer(trace, { ...options, signingKeys: cryptoKeys.value });
    }
  ),

  generateSignedValue: makeAsyncResultFunc(
    [import.meta.filename, 'generateSignedValue'],
    async <T, SignatureExtrasT = never>(
      trace: Trace,
      {
        cryptoKeySetId,
        ...options
      }: {
        cryptoKeySetId?: CryptoKeySetId;
        value: T;
        valueSchema: Schema<T>;
        signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
        signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
        mode?: SigningMode;
      }
    ): PR<SignedValue<T, SignatureExtrasT>> => {
      const cryptoKeys = await (cryptoKeySetId === undefined ? getMostRecentCryptoKeys(trace) : getCryptoKeysById(trace, cryptoKeySetId));
      if (!cryptoKeys.ok) {
        return generalizeFailureResult(trace, cryptoKeys, 'not-found');
      }

      return generateSignedValue(trace, { ...options, signingKeys: cryptoKeys.value });
    }
  ),

  getEncryptingKeySetForId: makeAsyncResultFunc(
    [import.meta.filename, 'getEncryptingKeySetForId'],
    // TODO: should be able to look up keys for other users from key server
    async (trace, id: CryptoKeySetId): PR<EncryptingKeySet, 'not-found'> => {
      const found = await disableLam(trace, 'not-found', (trace) =>
        firstSuccessResult(trace, [getCryptoKeysById(trace, id), getPublicCryptoKeysById(trace, id)])
      );
      if (!found.ok) {
        return excludeFailureResult(found, 'empty-data-set');
      }

      return makeSuccess(found.value.forEncrypting);
    }
  ),

  getVerifyingKeySetForId: makeAsyncResultFunc(
    [import.meta.filename, 'getVerifyingKeySetForId'],
    // TODO: should be able to look up keys for other users from key server
    async (trace, id: CryptoKeySetId): PR<VerifyingKeySet, 'not-found'> => {
      const found = await disableLam(trace, 'not-found', (trace) =>
        firstSuccessResult(trace, [getCryptoKeysById(trace, id), getPublicCryptoKeysById(trace, id)])
      );
      if (!found.ok) {
        return excludeFailureResult(found, 'empty-data-set');
      }

      return makeSuccess(found.value.forVerifying);
    }
  ),

  isSignatureValidForSignedBuffer: makeAsyncResultFunc(
    [import.meta.filename, 'isSignatureValidForSignedBuffer'],
    async (trace, { signedBuffer }: { signedBuffer: Uint8Array }): PR<boolean> => {
      const verifyingKeyId = extractKeyIdFromSignedBuffer(trace, { signedBuffer });
      /* node:coverage disable */
      if (!verifyingKeyId.ok) {
        if (verifyingKeyId.value.errorCode === 'not-found') {
          return makeFailure(
            new InternalStateError(trace, {
              message: 'Failed to extract verifying key ID from signed buffer',
              cause: verifyingKeyId.value
            })
          );
        }
        return excludeFailureResult(verifyingKeyId, 'not-found');
      }
      /* node:coverage enable */

      // TODO: should be able to look up keys for other users
      const cryptoKeys = await getCryptoKeysById(trace, verifyingKeyId.value);
      if (!cryptoKeys.ok) {
        return generalizeFailureResult(trace, cryptoKeys, 'not-found');
      }

      return isSignatureValidForSignedBuffer(trace, { signedBuffer, verifyingKeys: cryptoKeys.value });
    }
  ),

  isSignedValueValid: makeAsyncResultFunc(
    [import.meta.filename, 'isSignedValueValid'],
    async <T, SignatureExtrasT>(
      trace: Trace,
      signedValue: SignedValue<T, SignatureExtrasT>,
      signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>,
      options?: { cryptoKeySetId?: CryptoKeySetId }
    ): PR<boolean> => {
      const verifyingKeyId = extractKeyIdFromSignedValue(trace, { signedValue });
      /* node:coverage disable */
      if (!verifyingKeyId.ok) {
        if (verifyingKeyId.value.errorCode === 'not-found') {
          return makeFailure(
            new InternalStateError(trace, {
              message: 'Failed to extract verifying key ID from signed value',
              cause: verifyingKeyId.value
            })
          );
        }
        return excludeFailureResult(verifyingKeyId, 'not-found');
      }
      /* node:coverage enable */

      // TODO: should be able to look up keys for other users
      const cryptoKeys = await getCryptoKeysById(trace, verifyingKeyId.value);
      if (!cryptoKeys.ok) {
        return generalizeFailureResult(trace, cryptoKeys, 'not-found');
      }

      return isSignedValueValid(trace, signedValue, signatureExtras, { ...options, verifyingKeys: cryptoKeys.value });
    }
  )
});
