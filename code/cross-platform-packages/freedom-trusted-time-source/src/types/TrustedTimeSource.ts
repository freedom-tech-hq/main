import type { PRFunc } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import type { TrustedTimeId } from 'freedom-crypto-data';

export interface TrustedTimeSource {
  readonly generateTrustedTimeId: PRFunc<TrustedTimeId, never, [{ parentPathHash: Sha256Hash; uuid: Uuid; contentHash: Sha256Hash }]>;
  readonly isTrustedTimeIdValid: PRFunc<
    boolean,
    never,
    [trustedTimeId: TrustedTimeId, { parentPathHash: Sha256Hash; contentHash: Sha256Hash }]
  >;
}
