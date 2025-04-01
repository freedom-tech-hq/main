import type { PR } from 'freedom-async';
import { computeAsyncOnce, excludeFailureResult, makeAsyncResultFunc, makeFailure, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult, InternalStateError, UnauthorizedError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';
import {
  extractKeyIdFromSignedBuffer,
  extractKeyIdFromSignedValue,
  generateEncryptedValue,
  isSignatureValidForSignedBuffer,
  isSignedValueValid
} from 'freedom-crypto';
import type {
  CryptoKeySetId,
  EncryptedValue,
  EncryptingKeySet,
  EncryptionMode,
  SignedValue,
  SigningMode,
  VerifyingKeySet
} from 'freedom-crypto-data';
import { type CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { getPublicKeyStore } from './getPublicKeyStore.ts';

const secretKey = makeUuid();

export const getCryptoService = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace) =>
    await computeAsyncOnce([import.meta.filename], secretKey, async (trace): PR<CryptoService> => {
      const publicKeyStore = await uncheckedResult(getPublicKeyStore(trace));

      return makeSuccess({
        getPrivateCryptoKeySetIds: makeAsyncResultFunc(
          [import.meta.filename, 'getPrivateCryptoKeySetIds'],
          async (_trace): PR<CryptoKeySetId[]> => makeSuccess([])
        ),

        decryptEncryptedValue: makeAsyncResultFunc(
          [import.meta.filename, 'decryptEncryptedValue'],
          async <T>(trace: Trace, _encryptedValue: EncryptedValue<T>): PR<T> =>
            makeFailure(new UnauthorizedError(trace, { message: 'No decryption key available' }))
        ),

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
            if (cryptoKeySetId === undefined) {
              return makeFailure(new UnauthorizedError(trace, { message: 'No default encryption key available' }));
            }

            const cryptoKeys = await publicKeyStore.object(cryptoKeySetId).get(trace);
            if (!cryptoKeys.ok) {
              return generalizeFailureResult(trace, cryptoKeys, 'not-found');
            }

            return await generateEncryptedValue(trace, { ...options, value, valueSchema, encryptingKeys: cryptoKeys.value });
          }
        ),

        generateSignedBuffer: makeAsyncResultFunc(
          [import.meta.filename, 'generateSignedBuffer'],
          async (trace, _args: { cryptoKeySetId?: CryptoKeySetId; value: Uint8Array; mode?: SigningMode }): PR<Uint8Array> =>
            makeFailure(new UnauthorizedError(trace, { message: 'No signing key available' }))
        ),

        generateSignedValue: makeAsyncResultFunc(
          [import.meta.filename, 'generateSignedValue'],
          async <T, SignatureExtrasT = never>(
            trace: Trace,
            _args: {
              cryptoKeySetId?: CryptoKeySetId;
              value: T;
              valueSchema: Schema<T>;
              signatureExtras: [SignatureExtrasT] extends [never] ? undefined : NoInfer<SignatureExtrasT>;
              signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
              mode?: SigningMode;
            }
          ): PR<SignedValue<T, SignatureExtrasT>> => makeFailure(new UnauthorizedError(trace, { message: 'No signing key available' }))
        ),

        getEncryptingKeySetForId: makeAsyncResultFunc(
          [import.meta.filename, 'getEncryptingKeySetForId'],
          async (trace, id: CryptoKeySetId): PR<EncryptingKeySet, 'not-found'> => {
            const cryptoKeys = await publicKeyStore.object(id).get(trace);
            if (!cryptoKeys.ok) {
              return cryptoKeys;
            }

            return makeSuccess(cryptoKeys.value.forEncrypting);
          }
        ),

        getVerifyingKeySetForId: makeAsyncResultFunc(
          [import.meta.filename, 'getVerifyingKeySetForId'],
          async (trace, id: CryptoKeySetId): PR<VerifyingKeySet, 'not-found'> => {
            const cryptoKeys = await publicKeyStore.object(id).get(trace);
            if (!cryptoKeys.ok) {
              return cryptoKeys;
            }

            return makeSuccess(cryptoKeys.value.forVerifying);
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
            const cryptoKeys = await publicKeyStore.object(verifyingKeyId.value).get(trace);
            if (!cryptoKeys.ok) {
              return generalizeFailureResult(trace, cryptoKeys, 'not-found');
            }

            return await isSignatureValidForSignedBuffer(trace, { signedBuffer, verifyingKeys: cryptoKeys.value });
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
            const cryptoKeys = await publicKeyStore.object(verifyingKeyId.value).get(trace);
            if (!cryptoKeys.ok) {
              return generalizeFailureResult(trace, cryptoKeys, 'not-found');
            }

            return await isSignedValueValid(trace, signedValue, signatureExtras, { ...options, verifyingKeys: cryptoKeys.value });
          }
        )
      } satisfies CryptoService);
    })
);
