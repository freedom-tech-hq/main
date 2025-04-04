import type { PRFunc } from 'freedom-async';
import type { CombinationCryptoKeySet, CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';

export interface CryptoService {
  readonly getPrivateCryptoKeySet: PRFunc<PrivateCombinationCryptoKeySet, 'not-found', [id?: CryptoKeySetId]>;
  readonly getPrivateCryptoKeySetIds: PRFunc<CryptoKeySetId[]>;
  // TODO: see if we can remove this
  readonly getPublicCryptoKeySetForId: PRFunc<CombinationCryptoKeySet, 'not-found', [id: CryptoKeySetId]>;
}
