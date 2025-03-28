import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import isPromise from 'is-promise';

import type { TrustedTimeName } from '../types/TrustedTimeName.ts';
import { signedTimeNameSchema, trustedTimeNameInfo } from '../types/TrustedTimeName.ts';
import { extractPartsFromTimeName } from './extractPartsFromFromTimeName.ts';

export const extractPartsFromTrustedTimeName = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, trustedTimeName: TrustedTimeName): PR<{ timeMSec: number; uuid: Uuid }> => {
    const signedTimeNameDeserialization = signedTimeNameSchema.deserializeAsync(trustedTimeNameInfo.removePrefix(trustedTimeName), {
      forceSync: true,
      validation: 'hard'
    });
    if (isPromise(signedTimeNameDeserialization)) {
      return makeFailure(new GeneralError(trace, 'Deserialization must be synchronous'));
    } else if (signedTimeNameDeserialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: signedTimeNameDeserialization.error }));
    }

    return await extractPartsFromTimeName(trace, signedTimeNameDeserialization.deserialized.value);
  }
);
