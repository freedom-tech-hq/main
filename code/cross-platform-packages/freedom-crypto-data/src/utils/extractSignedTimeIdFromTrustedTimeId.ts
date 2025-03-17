import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import isPromise from 'is-promise';

import type { SignedTimeId, TrustedTimeId } from '../types/TrustedTimeId.ts';
import { signedTimeIdSchema, trustedTimeIdInfo } from '../types/TrustedTimeId.ts';

export const extractSignedTimeIdFromTrustedTimeId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, trustedTimeId: TrustedTimeId): PR<SignedTimeId> => {
    const signedTimeIdDeserialization = signedTimeIdSchema.deserializeAsync(trustedTimeIdInfo.removePrefix(trustedTimeId), {
      forceSync: true,
      validation: 'hard'
    });
    if (isPromise(signedTimeIdDeserialization)) {
      return makeFailure(new GeneralError(trace, 'Deserialization must be synchronous'));
    } else if (signedTimeIdDeserialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: signedTimeIdDeserialization.error }));
    }

    return makeSuccess(signedTimeIdDeserialization.deserialized);
  }
);
