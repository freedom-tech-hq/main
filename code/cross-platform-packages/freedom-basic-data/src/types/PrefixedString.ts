import { escapeRegExp } from 'lodash-es';
import { schema } from 'yaschema';

export const makeNonAnchoredPrefixedStringRegex = <PrefixT extends `${string}_`>(prefix: PrefixT, nonAnchoredSuffixRegex?: RegExp) =>
  new RegExp(`${escapeRegExp(prefix)}${nonAnchoredSuffixRegex?.source ?? '[^]*'}`);
export const makePrefixedStringSchema = <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(
  prefix: PrefixT,
  { allowEmpty, nonAnchoredSuffixRegex }: { allowEmpty: boolean; nonAnchoredSuffixRegex?: RegExp }
) =>
  schema
    .regex<
      PrefixedString<PrefixT, NonPrefixedT>
    >(new RegExp(`^(?:${makeNonAnchoredPrefixedStringRegex(prefix, nonAnchoredSuffixRegex).source})$`))
    .setAllowedLengthRange(prefix.length + (allowEmpty ? 0 : 1), undefined);
export type PrefixedString<PrefixT extends `${string}_`, NonPrefixedT extends string = string> = `${PrefixT}${NonPrefixedT}`;
