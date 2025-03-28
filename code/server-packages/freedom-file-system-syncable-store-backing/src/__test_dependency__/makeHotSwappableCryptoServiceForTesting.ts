import type { CryptoService } from 'freedom-crypto-service';

export interface HotSwappableCryptoService extends CryptoService {
  hotSwap: (newCryptoService: CryptoService) => void;
}

export const makeHotSwappableCryptoServiceForTesting = (initialCryptoService: CryptoService): HotSwappableCryptoService => {
  let activeCryptoService = initialCryptoService;

  return {
    getCryptoKeySetIds: (...args) => activeCryptoService.getCryptoKeySetIds(...args),
    decryptEncryptedValue: (...args) => activeCryptoService.decryptEncryptedValue(...args),
    generateEncryptedValue: (...args) => activeCryptoService.generateEncryptedValue(...args),
    generateSignedBuffer: (...args) => activeCryptoService.generateSignedBuffer(...args),
    generateSignedValue: (...args) => activeCryptoService.generateSignedValue(...args),
    getEncryptingKeySetForId: (...args) => activeCryptoService.getEncryptingKeySetForId(...args),
    getVerifyingKeySetForId: (...args) => activeCryptoService.getVerifyingKeySetForId(...args),
    isSignatureValidForSignedBuffer: (...args) => activeCryptoService.isSignatureValidForSignedBuffer(...args),
    isSignedValueValid: (...args) => activeCryptoService.isSignedValueValid(...args),
    hotSwap: (newCryptoService) => {
      activeCryptoService = newCryptoService;
    }
  };
};
