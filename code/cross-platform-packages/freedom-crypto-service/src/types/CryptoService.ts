import type { PRFunc } from 'freedom-async';
import type { CryptoKeySetId, DecryptingKeySet, EncryptingKeySet, SigningKeySet, VerifyingKeySet } from 'freedom-crypto-data';

export interface CryptoService {
  readonly getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;

  readonly getEncryptingKeySetForId: PRFunc<EncryptingKeySet, 'not-found', [id: CryptoKeySetId]>;
  readonly getVerifyingKeySetForId: PRFunc<VerifyingKeySet, 'not-found', [id: CryptoKeySetId]>;

  readonly getSigningKeySet: PRFunc<SigningKeySet, 'not-found', [id?: CryptoKeySetId]>;
  readonly getDecryptingKeySet: PRFunc<DecryptingKeySet, 'not-found', [id?: CryptoKeySetId]>;
}
