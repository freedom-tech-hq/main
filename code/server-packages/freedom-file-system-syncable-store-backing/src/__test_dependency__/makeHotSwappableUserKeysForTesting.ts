import type { UserKeys } from 'freedom-crypto-service';

export interface HotSwappableUserKeys extends UserKeys {
  hotSwap: (newCryptoService: UserKeys) => void;
}

export const makeHotSwappableUserKeysForTesting = (initialCryptoService: UserKeys): HotSwappableUserKeys => {
  let activeCryptoService = initialCryptoService;

  return {
    getPrivateCryptoKeySetIds: (...args) => activeCryptoService.getPrivateCryptoKeySetIds(...args),
    getPrivateCryptoKeySet: (...args) => activeCryptoService.getPrivateCryptoKeySet(...args),
    hotSwap: (newCryptoService) => {
      activeCryptoService = newCryptoService;
    }
  };
};
