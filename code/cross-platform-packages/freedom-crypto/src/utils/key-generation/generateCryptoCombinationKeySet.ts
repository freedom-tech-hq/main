import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
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
    const signVerifyKeySet = await generateCryptoSignVerifyKeySet(trace, signingMode);
    if (!signVerifyKeySet.ok) {
      return signVerifyKeySet;
    }

    const encDecKeySet = await generateCryptoEncryptDecryptKeySet(trace, encryptionMode);
    if (!encDecKeySet.ok) {
      return encDecKeySet;
    }

    const id = cryptoKeySetIdInfo.make(`combo-${makeUuid()}`);

    return makeSuccess(
      new PrivateCombinationCryptoKeySet(id, { signVerifyKeySet: signVerifyKeySet.value, encDecKeySet: encDecKeySet.value })
    );
  }
);
