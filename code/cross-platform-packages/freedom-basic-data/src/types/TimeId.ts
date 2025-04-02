import { schema } from 'yaschema';

import { MAX_ID_LENGTH, MIN_ID_LENGTH } from '../consts/id.ts';
import { makeIdInfo } from '../utils/id/makeIdInfo.ts';
import { type IsoDateTime, nonAnchoredIsoDateTimeRegex } from './IsoDateTime.ts';
import type { Uuid } from './Uuid.ts';
import { nonAnchoredUuidRegex } from './Uuid.ts';

/**
 * Format: `<ISO time>-<UUID>`
 *
 * Example: `2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef`
 */
export const nonAnchoredTimeIdRegex = new RegExp(`${nonAnchoredIsoDateTimeRegex.source}-${nonAnchoredUuidRegex.source}`);
export const timeIdInfo = makeIdInfo<'T_', `${IsoDateTime}-${Uuid}`>('T_', {
  schemaOverride: schema
    .regex<`T_${IsoDateTime}-${Uuid}`>(new RegExp(`^T_${nonAnchoredTimeIdRegex.source}$`))
    .setAllowedLengthRange('T_'.length + MIN_ID_LENGTH, 'T_'.length + MAX_ID_LENGTH)
});
export type TimeId = typeof timeIdInfo.schema.valueType;

export const extractTimeMSecFromTimeId = (timeId: TimeId): number => {
  const match = nonAnchoredIsoDateTimeRegex.exec(timeIdInfo.removePrefix(timeId));
  if (match === null) {
    throw new Error('Invalid TimeId encountered');
  }

  const date = new Date(match[0]);
  return date.getTime();
};
