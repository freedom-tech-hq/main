import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import isPromise from 'is-promise';

import type { TrustedTimeId } from '../types/TrustedTimeId.ts';
import { signedTimeIdSchema, trustedTimeIdInfo } from '../types/TrustedTimeId.ts';
import { extractPartsFromTimeId } from './extractPartsFromFromTimeId.ts';

export const extractPartsFromTrustedTimeId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, trustedTimeId: TrustedTimeId): PR<{ timeMSec: number; uuid: Uuid }> => {
    const signedTimeIdDeserialization = signedTimeIdSchema.deserializeAsync(trustedTimeIdInfo.removePrefix(trustedTimeId), {
      forceSync: true,
      validation: 'hard'
    });
    if (isPromise(signedTimeIdDeserialization)) {
      return makeFailure(new GeneralError(trace, 'Deserialization must be synchronous'));
    } else if (signedTimeIdDeserialization.error !== undefined) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: signedTimeIdDeserialization.error }));
    }

    return await extractPartsFromTimeId(trace, signedTimeIdDeserialization.deserialized.value);
  }
);
