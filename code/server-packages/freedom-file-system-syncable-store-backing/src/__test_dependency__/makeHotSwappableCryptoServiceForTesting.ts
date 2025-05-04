import type { UserKeys } from 'freedom-crypto-service';

export interface HotSwappableCryptoService extends UserKeys {
  hotSwap: (newCryptoService: UserKeys) => void;
}

export const makeHotSwappableCryptoServiceForTesting = (initialCryptoService: UserKeys): HotSwappableCryptoService => {
  let activeCryptoService = initialCryptoService;

  return {
    getPrivateCryptoKeySetIds: (...args) => activeCryptoService.getPrivateCryptoKeySetIds(...args),
    getPrivateCryptoKeySet: (...args) => activeCryptoService.getPrivateCryptoKeySet(...args),
    hotSwap: (newCryptoService) => {
      activeCryptoService = newCryptoService;
    }
  };
};
