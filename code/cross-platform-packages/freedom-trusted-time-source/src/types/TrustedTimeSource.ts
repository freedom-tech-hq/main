import type { PRFunc } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';

import type { TrustedTimeSignatureParams } from './TrustedTimeSignatureParams.ts';

export interface TrustedTimeSource {
  readonly generateTrustedTimeSignature: PRFunc<Base64String, never, [TrustedTimeSignatureParams]>;
  readonly isTrustedTimeSignatureValid: PRFunc<boolean, never, [trustedTimeSignature: Base64String, TrustedTimeSignatureParams]>;
}
