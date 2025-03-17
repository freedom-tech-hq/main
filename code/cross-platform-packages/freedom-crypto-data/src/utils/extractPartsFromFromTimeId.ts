import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { nonAnchoredIsoDateTimeRegex, nonAnchoredUuidRegex } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

import type { TimeId } from '../types/TrustedTimeId.ts';
import { timeIdInfo } from '../types/TrustedTimeId.ts';

const timeIdExtractionRegex = new RegExp(`^(${nonAnchoredIsoDateTimeRegex.source})-(${nonAnchoredUuidRegex.source})$`);

export const extractPartsFromTimeId = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, timeId: TimeId): PR<{ timeMSec: number; uuid: Uuid }> => {
    const nonPrefixedTimeId = timeIdInfo.removePrefix(timeId);

    const match = timeIdExtractionRegex.exec(nonPrefixedTimeId);
    if (match === null) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: 'Expected TimeId' }));
    }

    const date = new Date(match[1]);
    const uuid = match[2] as Uuid;

    return makeSuccess({ timeMSec: date.getTime(), uuid });
  }
);
