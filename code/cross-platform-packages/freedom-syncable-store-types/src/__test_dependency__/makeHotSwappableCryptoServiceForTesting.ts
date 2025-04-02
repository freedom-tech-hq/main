import type { CryptoService } from 'freedom-crypto-service';

export interface HotSwappableCryptoService extends CryptoService {
  hotSwap: (newCryptoService: CryptoService) => void;
}

export const makeHotSwappableCryptoServiceForTesting = (initialCryptoService: CryptoService): HotSwappableCryptoService => {
  let activeCryptoService = initialCryptoService;

  return {
    getPrivateCryptoKeySetIds: (...args) => activeCryptoService.getPrivateCryptoKeySetIds(...args),
    getEncryptingKeySetForId: (...args) => activeCryptoService.getEncryptingKeySetForId(...args),
    getVerifyingKeySetForId: (...args) => activeCryptoService.getVerifyingKeySetForId(...args),
    getSigningKeySet: (...args) => activeCryptoService.getSigningKeySet(...args),
    getDecryptingKeySet: (...args) => activeCryptoService.getDecryptingKeySet(...args),
    hotSwap: (newCryptoService) => {
      activeCryptoService = newCryptoService;
    }
  };
};
