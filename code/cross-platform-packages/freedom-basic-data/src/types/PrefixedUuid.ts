import { schema } from 'yaschema';

import { makeNonAnchoredPrefixedStringRegex, makePrefixedStringSchema } from './PrefixedString.ts';
import { nonAnchoredUuidRegex, type Uuid } from './Uuid.ts';

const UUID_LENGTH = 36; // Including hyphens

export const makeNonAnchoredPrefixedUuidRegex = <PrefixT extends `${string}_`>(prefix: PrefixT) =>
  makeNonAnchoredPrefixedStringRegex<PrefixT>(prefix, nonAnchoredUuidRegex);
export const makePrefixedUuidSchema = <PrefixT extends `${string}_`>(prefix: PrefixT) =>
  makePrefixedStringSchema<PrefixT, Uuid>(prefix, {
    allowEmpty: false,
    nonAnchoredSuffixRegex: nonAnchoredUuidRegex
  }).setAllowedLengthRange(prefix.length + UUID_LENGTH, prefix.length + UUID_LENGTH);
export type PrefixedUuid<PrefixT extends `${string}_`> = `${PrefixT}${Uuid}`;

const tailAnchoredUuidRegex = new RegExp(`_(${nonAnchoredUuidRegex.source})$`);
export const isPrefixedUuid = (value: string): value is PrefixedUuid<`${string}_`> => tailAnchoredUuidRegex.test(value);
export const extractUuidFromPrefixedUuid = (prefixedUuid: PrefixedUuid<`${string}_`>): Uuid => {
  const match = tailAnchoredUuidRegex.exec(prefixedUuid);
  if (match === null) {
    throw new Error(`Invalid PrefixedUuid encountered`);
  }

  return match[1] as Uuid;
};

export const nonAnchoredAnyPrefixUuidRegex = new RegExp(`[^]*_${nonAnchoredUuidRegex.source}`);
export const anyPrefixedUuidSchema = schema.regex<PrefixedUuid<`${string}_`>>(new RegExp(`^${nonAnchoredAnyPrefixUuidRegex.source}$`));
export type AnyPrefixedUuid = typeof anyPrefixedUuidSchema.valueType;
