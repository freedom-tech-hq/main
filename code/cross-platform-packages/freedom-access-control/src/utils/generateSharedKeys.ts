import { type SharedKeys, sharedPublicKeysSchema, type SharedSecretKeys, sharedSecretKeysSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generateCryptoEncryptDecryptKeySet, generateEncryptedValue } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue, EncryptingKeySet } from 'freedom-crypto-data';
import { serialize } from 'freedom-serialization';

export const generateSharedKeys = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { encryptingKeySets }: { encryptingKeySets: EncryptingKeySet[] }): PR<SharedKeys> => {
    // TODO: this is a pretty large piece of data and we need to share – so there's probably a much better way to do this
    const sharedEncryptDecryptKeys = await generateCryptoEncryptDecryptKeySet(trace);
    /* node:coverage disable */
    if (!sharedEncryptDecryptKeys.ok) {
      return sharedEncryptDecryptKeys;
    }
    /* node:coverage enable */

    const secretKeysEncryptedPerMember = await allResultsReduced(
      trace,
      encryptingKeySets,
      {},
      async (trace, encryptingKeys) => {
        return await generateEncryptedValue(trace, {
          value: sharedEncryptDecryptKeys.value,
          valueSchema: sharedSecretKeysSchema,
          encryptingKeys
        });
      },
      async (_trace, out, encryptedSharedSecretKeys, encryptingKeys) => {
        out[encryptingKeys.id] = encryptedSharedSecretKeys;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>
    );
    /* node:coverage disable */
    if (!secretKeysEncryptedPerMember.ok) {
      return secretKeysEncryptedPerMember;
    }
    /* node:coverage enable */

    const publicKeysSerialization = await serialize(trace, sharedEncryptDecryptKeys.value.publicOnly(), sharedPublicKeysSchema);
    if (!publicKeysSerialization.ok) {
      return publicKeysSerialization;
    }

    return makeSuccess({
      id: sharedEncryptDecryptKeys.value.id,
      publicKeys: publicKeysSerialization.value,
      secretKeysEncryptedPerMember: secretKeysEncryptedPerMember.value
    });
  }
);
