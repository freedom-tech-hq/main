import type { SerializedValue } from 'freedom-basic-data';
import type { SignedValue } from 'freedom-crypto-data';
import type { TrustedTime } from 'freedom-trusted-time-source';

import type { TimedAccessChange } from './TimedAccessChange.ts';

export interface TrustedTimeSignedAccessChange<RoleT extends string> {
  trustedTime: TrustedTime;
  signedAccessChange: SignedValue<SerializedValue<TimedAccessChange<RoleT>>>;
}
