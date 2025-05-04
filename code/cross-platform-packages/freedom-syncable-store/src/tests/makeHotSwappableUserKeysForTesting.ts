import type { UserKeys } from 'freedom-crypto-service';

export interface HotSwappableUserKeys extends UserKeys {
  hotSwap: (newUserKeys: UserKeys) => void;
}

export const makeHotSwappableUserKeysForTesting = (initialUserKeys: UserKeys): HotSwappableUserKeys => {
  let activeUserKeys = initialUserKeys;

  return {
    getPrivateCryptoKeySetIds: (...args) => activeUserKeys.getPrivateCryptoKeySetIds(...args),
    getPrivateCryptoKeySet: (...args) => activeUserKeys.getPrivateCryptoKeySet(...args),
    hotSwap: (newUserKeys) => {
      activeUserKeys = newUserKeys;
    }
  };
};
