import type { CryptoService } from 'freedom-crypto-service';

export interface HotSwappableCryptoService extends CryptoService {
  hotSwap: (newCryptoService: CryptoService) => void;
}

export const makeHotSwappableCryptoServiceForTesting = (initialCryptoService: CryptoService): HotSwappableCryptoService => {
  let activeCryptoService = initialCryptoService;

  return {
    getPrivateCryptoKeySetIds: (...args) => activeCryptoService.getPrivateCryptoKeySetIds(...args),
    getPrivateCryptoKeySet: (...args) => activeCryptoService.getPrivateCryptoKeySet(...args),
    getPublicCryptoKeySetForId: (...args) => activeCryptoService.getPublicCryptoKeySetForId(...args),
    hotSwap: (newCryptoService) => {
      activeCryptoService = newCryptoService;
    }
  };
};
