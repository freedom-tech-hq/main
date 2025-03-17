import type { PrefixedString } from '../../types/PrefixedString.ts';

/** Checks if the specified value starts with the specified prefix.  There's no runtime checking for the validity of the non-prefixed part */
export const isPrefixedString = <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(
  prefix: PrefixT,
  value: string,
  { allowEmpty, isNonPrefixedValueValid }: { allowEmpty: boolean; isNonPrefixedValueValid: (nonPrefixedValue: string) => boolean }
): value is PrefixedString<PrefixT, NonPrefixedT> =>
  value.startsWith(prefix) && (allowEmpty || value.length > prefix.length) && isNonPrefixedValueValid(value.substring(prefix.length));
