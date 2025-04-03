import type { PRFunc } from 'freedom-async';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

export interface CryptoService {
  readonly getPrivateCryptoKeySet: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id?: CryptoKeySetId]>;
  readonly getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
}
