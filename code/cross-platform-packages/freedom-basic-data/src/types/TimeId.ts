import { schema } from 'yaschema';

import { MAX_ID_LENGTH, MIN_ID_LENGTH } from '../consts/id.ts';
import { inline } from '../internal/utils/inline.ts';
import { makeUuid } from '../internal/utils/makeUuid.ts';
import { makeIdInfo } from '../utils/id/makeIdInfo.ts';
import { makeIsoDateTime } from '../utils/makeIsoDateTime.ts';
import { type IsoDateTime, nonAnchoredIsoDateTimeRegex } from './IsoDateTime.ts';
import type { Uuid } from './Uuid.ts';
import { nonAnchoredUuidRegex } from './Uuid.ts';

/**
 * Format: `T_<ISO time>-<UUID>`
 *
 * Example: `T_2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef`
 */
export const nonAnchoredTimeIdRegex = new RegExp(`T_${nonAnchoredIsoDateTimeRegex.source}-${nonAnchoredUuidRegex.source}`);
export const timeIdInfo = inline(() => {
  const defaultIdInfo = makeIdInfo<'T_', `${IsoDateTime}-${Uuid}`>('T_', {
    schemaOverride: schema
      .regex<`T_${IsoDateTime}-${Uuid}`>(new RegExp(`^${nonAnchoredTimeIdRegex.source}$`))
      .setAllowedLengthRange('T_'.length + MIN_ID_LENGTH, 'T_'.length + MAX_ID_LENGTH)
  });

  const out = defaultIdInfo as typeof defaultIdInfo & {
    make: (nonPrefixedValue?: `${IsoDateTime}-${Uuid}`) => TimeId;
    extractTimeMSec: (timeId: TimeId) => number;
  };

  const defaultMake = defaultIdInfo.make;
  out.make = (nonPrefixedValue?: `${IsoDateTime}-${Uuid}`) => defaultMake(nonPrefixedValue ?? `${makeIsoDateTime()}-${makeUuid()}`);

  out.extractTimeMSec = (timeId: TimeId) => {
    const match = nonAnchoredIsoDateTimeRegex.exec(defaultIdInfo.removePrefix(timeId));
    if (match === null) {
      throw new Error('Invalid TimeId encountered');
    }

    const date = new Date(match[0]);
    return date.getTime();
  };

  return out;
});
export type TimeId = typeof timeIdInfo.schema.valueType;
