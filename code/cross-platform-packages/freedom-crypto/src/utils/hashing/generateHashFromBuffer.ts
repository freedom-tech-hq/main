import type { PR } from 'freedom-async';
import { GeneralError, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { HashingMode } from 'freedom-crypto-data';
import { preferredHashingMode } from 'freedom-crypto-data';

export const generateHashFromBuffer = async (
  trace: Trace,
  { mode = preferredHashingMode, value }: { mode?: HashingMode; value: Uint8Array }
): PR<Uint8Array> => {
  try {
    switch (mode) {
      case 'SHA-256':
        return makeSuccess(Buffer.from(await crypto.subtle.digest('SHA-256', value)));
    }
  } catch (e) {
    /* node:coverage ignore next */
    return makeFailure(new GeneralError(trace, e));
  }
};
