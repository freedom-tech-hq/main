import { escapeRegExp } from 'lodash-es';
import { schema } from 'yaschema';

export const makeNonAnchoredPrefixedStringRegex = <PrefixT extends `${string}_`>(prefix: PrefixT) =>
  new RegExp(`${escapeRegExp(prefix)}[^]*`);
export const makePrefixedStringSchema = <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(
  prefix: PrefixT,
  { allowEmpty }: { allowEmpty: boolean }
) =>
  schema
    .regex<PrefixedString<PrefixT, NonPrefixedT>>(new RegExp(`^(?:${makeNonAnchoredPrefixedStringRegex(prefix).source})$`))
    .setAllowedLengthRange(prefix.length + (allowEmpty ? 0 : 1), undefined);
export type PrefixedString<PrefixT extends `${string}_`, NonPrefixedT extends string = string> = `${PrefixT}${NonPrefixedT}`;
