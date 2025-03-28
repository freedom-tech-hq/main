import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import isPromise from 'is-promise';

import type { SignedTimeName, TrustedTimeName } from '../types/TrustedTimeName.ts';
import { signedTimeNameSchema, trustedTimeNameInfo } from '../types/TrustedTimeName.ts';

export const extractSignedTimeNameFromTrustedTimeName = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, trustedTimeName: TrustedTimeName): PR<SignedTimeName> => {
    const signedTimeNameDeserialization = signedTimeNameSchema.deserializeAsync(trustedTimeNameInfo.removePrefix(trustedTimeName), {
      forceSync: true,
      validation: 'hard'
    });
    if (isPromise(signedTimeNameDeserialization)) {
      return makeFailure(new GeneralError(trace, 'Deserialization must be synchronous'));
    } else if (signedTimeNameDeserialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: signedTimeNameDeserialization.error }));
    }

    return makeSuccess(signedTimeNameDeserialization.deserialized);
  }
);
