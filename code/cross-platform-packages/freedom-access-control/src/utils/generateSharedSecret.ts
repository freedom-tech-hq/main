import type { SharedSecret, SharedSecretKeys } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateCryptoEncryptDecryptKeySet } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';
import { decryptingKeySetSchema, encryptingKeySetSchema, privateKeySetSchema } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { schema } from 'yaschema';

export const generateSharedSecret = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    { cryptoService, cryptoKeySetIds }: { cryptoService: CryptoService; cryptoKeySetIds: CryptoKeySetId[] }
  ): PR<SharedSecret> => {
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
        cryptoService.generateEncryptedValue(trace, {
          value: sharedEncryptDecryptKeys.value,
          valueSchema: schema.allOf3(privateKeySetSchema, encryptingKeySetSchema, decryptingKeySetSchema),
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

    return makeSuccess({
      id: sharedEncryptDecryptKeys.value.id,
      secretKeysEncryptedPerMember: secretKeysEncryptedPerMember.value
    });
  }
);
