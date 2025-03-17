import type { SignedValue } from 'freedom-crypto-data';

import type { AccessControlState } from './AccessControlState.ts';
import type { SharedSecret } from './SharedSecret.ts';

export interface InitialAccess<RoleT extends string> {
  state: SignedValue<AccessControlState<RoleT>>;
  sharedSecrets: SharedSecret[];
}
