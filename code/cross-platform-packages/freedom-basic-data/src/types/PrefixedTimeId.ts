import { escapeRegExp } from 'lodash-es';
import { schema } from 'yaschema';

import { MAX_ID_LENGTH, MIN_ID_LENGTH } from '../consts/id.ts';
import { makeUuid } from '../internal/utils/makeUuid.ts';
import { makeIdInfo } from '../utils/id/makeIdInfo.ts';
import { makeIsoDateTime } from '../utils/makeIsoDateTime.ts';
import { type IsoDateTime, nonAnchoredIsoDateTimeRegex } from './IsoDateTime.ts';
import type { Uuid } from './Uuid.ts';
import { nonAnchoredUuidRegex } from './Uuid.ts';

export const makeNonAnchoredPrefixedTimeIdRegex = <PrefixT extends `${string}_`>(prefix: PrefixT) =>
  new RegExp(`${escapeRegExp(prefix)}${nonAnchoredIsoDateTimeRegex.source}-${nonAnchoredUuidRegex.source}`);
export const makePrefixedTimeIdInfo = <PrefixT extends `${string}_`>(prefix: PrefixT) => {
  const defaultIdInfo = makeIdInfo<PrefixT, `${IsoDateTime}-${Uuid}`>(prefix, {
    nonAnchoredRegexOverride: makeNonAnchoredPrefixedTimeIdRegex(prefix),
    schemaOverride: schema
      .regex<`${PrefixT}${IsoDateTime}-${Uuid}`>(new RegExp(`^${makeNonAnchoredPrefixedTimeIdRegex(prefix).source}$`))
      .setAllowedLengthRange(prefix.length + MIN_ID_LENGTH, prefix.length + MAX_ID_LENGTH)
  });

  const out = defaultIdInfo as typeof defaultIdInfo & {
    make: (nonPrefixedValue?: `${IsoDateTime}-${Uuid}`) => PrefixedTimeId<PrefixT>;
    extractTimeMSec: (prefixedTimeId: PrefixedTimeId<PrefixT>) => number;
  };

  const defaultMake = defaultIdInfo.make;
  out.make = (nonPrefixedValue?: `${IsoDateTime}-${Uuid}`) => defaultMake(nonPrefixedValue ?? `${makeIsoDateTime()}-${makeUuid()}`);

  out.extractTimeMSec = (prefixedTimeId: PrefixedTimeId<PrefixT>) => {
    const match = nonAnchoredIsoDateTimeRegex.exec(defaultIdInfo.removePrefix(prefixedTimeId));
    if (match === null) {
      throw new Error(`Invalid PrefixedTimeId<${JSON.stringify(prefix)}> encountered`);
    }

    const date = new Date(match[0]);
    return date.getTime();
  };

  return out;
};
export type PrefixedTimeId<PrefixT extends `${string}_`> = `${PrefixT}${IsoDateTime}-${Uuid}`;

export const nonAnchoredAnyPrefixTimeIdRegex = new RegExp(`[^]*_${nonAnchoredIsoDateTimeRegex.source}-${nonAnchoredUuidRegex.source}`);
export const anyPrefixedTimeIdSchema = schema.regex<PrefixedTimeId<`${string}_`>>(
  new RegExp(`^${nonAnchoredAnyPrefixTimeIdRegex.source}$`)
);
export type AnyPrefixedTimeId = typeof anyPrefixedTimeIdSchema.valueType;
