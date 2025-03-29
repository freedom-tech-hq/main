import type { PR } from 'freedom-async';
import { allResultsNamed, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import type { EncryptionMode, SigningMode } from 'freedom-crypto-data';
import { cryptoKeySetIdInfo, preferredEncryptionMode, preferredSigningMode, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

import { generateCryptoEncryptDecryptKeySet } from './generateCryptoEncryptDecryptKeySet.ts';
import { generateCryptoSignVerifyKeySet } from './generateCryptoSignVerifyKeySet.ts';

export const generateCryptoCombinationKeySet = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    {
      encryptionMode = preferredEncryptionMode,
      signingMode = preferredSigningMode
    }: { encryptionMode?: EncryptionMode; signingMode?: SigningMode } = {}
  ): PR<PrivateCombinationCryptoKeySet> => {
    const id = cryptoKeySetIdInfo.make(`combo-${makeUuid()}`);

    const results = await allResultsNamed(
      trace,
      {},
      {
        signVerifyKeySet: generateCryptoSignVerifyKeySet(trace, id, signingMode),
        encDecKeySet: generateCryptoEncryptDecryptKeySet(trace, id, encryptionMode)
      }
    );
    if (!results.ok) {
      return results;
    }
    const { signVerifyKeySet, encDecKeySet } = results.value;

    return makeSuccess(new PrivateCombinationCryptoKeySet(id, { signVerifyKeySet, encDecKeySet }));
  }
);
