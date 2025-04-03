import type { SerializedValue } from 'freedom-basic-data';
import type { CombinationCryptoKeySet, CryptoKeySetId, SignedValue } from 'freedom-crypto-data';

import type { AccessControlState } from './AccessControlState.ts';
import type { SharedKeys } from './SharedKeys.ts';

export interface InitialAccess<RoleT extends string> {
  state: SignedValue<SerializedValue<AccessControlState<RoleT>>>;
  publicKeysById: SignedValue<SerializedValue<Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>>>>;
  sharedKeys: SharedKeys[];
}
