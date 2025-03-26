import { type SharedKeys, sharedPublicKeysSchema, type SharedSecretKeys, sharedSecretKeysSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { makeSerializedValue } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import { generateCryptoEncryptDecryptKeySet } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';

export const generateSharedKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { cryptoService, cryptoKeySetIds }: { cryptoService: CryptoService; cryptoKeySetIds: CryptoKeySetId[] }
  ): PR<SharedKeys> => {
    // TODO: this is a pretty large piece of data and we need to share – so there's probably a much better way to do this
    const sharedEncryptDecryptKeys = await generateCryptoEncryptDecryptKeySet(trace);
    /* node:coverage disable */
    if (!sharedEncryptDecryptKeys.ok) {
      return sharedEncryptDecryptKeys;
    }
    /* node:coverage enable */

    const secretKeysEncryptedPerMember = await allResultsReduced(
      trace,
      cryptoKeySetIds,
      {},
      async (trace, cryptoKeySetId) =>
        await cryptoService.generateEncryptedValue(trace, {
          value: sharedEncryptDecryptKeys.value,
          valueSchema: sharedSecretKeysSchema,
          cryptoKeySetId: cryptoKeySetId
        }),
      async (_trace, out, encryptedSharedSecretKeys, cryptoKeySetId) => {
        out[cryptoKeySetId] = encryptedSharedSecretKeys;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>
    );
    /* node:coverage disable */
    if (!secretKeysEncryptedPerMember.ok) {
      return secretKeysEncryptedPerMember;
    }
    /* node:coverage enable */

    const publicKeysSerialization = await sharedPublicKeysSchema.serializeAsync(sharedEncryptDecryptKeys.value.publicOnly());
    if (publicKeysSerialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: publicKeysSerialization.error }));
    }

    return makeSuccess({
      id: sharedEncryptDecryptKeys.value.id,
      publicKeys: makeSerializedValue({
        deserializedValueSchema: sharedPublicKeysSchema,
        serializedValue: publicKeysSerialization.serialized
      }),
      secretKeysEncryptedPerMember: secretKeysEncryptedPerMember.value
    });
  }
);
