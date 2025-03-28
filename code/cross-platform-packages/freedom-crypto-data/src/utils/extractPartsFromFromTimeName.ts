import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { nonAnchoredIsoDateTimeRegex, nonAnchoredUuidRegex } from 'freedom-basic-data';
import { InternalSchemaValidationError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';

import type { TimeName } from '../types/TrustedTimeName.ts';
import { timeNameInfo } from '../types/TrustedTimeName.ts';

const timeNameExtractionRegex = new RegExp(`^(${nonAnchoredIsoDateTimeRegex.source})-(${nonAnchoredUuidRegex.source})$`);

export const extractPartsFromTimeName = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace: Trace, timeName: TimeName): PR<{ timeMSec: number; uuid: Uuid }> => {
    const nonPrefixedTimeName = timeNameInfo.removePrefix(timeName);

    const match = timeNameExtractionRegex.exec(nonPrefixedTimeName);
    if (match === null) {
      return makeFailure(new InternalSchemaValidationError(trace, { message: 'Expected TimeName' }));
    }

    const date = new Date(match[1]);
    const uuid = match[2] as Uuid;

    return makeSuccess({ timeMSec: date.getTime(), uuid });
  }
);
