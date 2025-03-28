import type { PRFunc } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import type { TrustedTimeName } from 'freedom-crypto-data';

export interface TrustedTimeSource {
  readonly generateTrustedTimeName: PRFunc<TrustedTimeName, never, [{ parentPathHash: Sha256Hash; uuid: Uuid; contentHash: Sha256Hash }]>;
  readonly isTrustedTimeNameValid: PRFunc<
    boolean,
    never,
    [trustedTimeName: TrustedTimeName, { parentPathHash: Sha256Hash; contentHash: Sha256Hash }]
  >;
}
