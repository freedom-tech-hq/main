import type { SignedValue } from 'freedom-crypto-data';

import type { AccessControlState } from './AccessControlState.ts';
import type { SharedKeys } from './SharedKeys.ts';

export interface InitialAccess<RoleT extends string> {
  state: SignedValue<AccessControlState<RoleT>>;
  sharedKeys: SharedKeys[];
}
