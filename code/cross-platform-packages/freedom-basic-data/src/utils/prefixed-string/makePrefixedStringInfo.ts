import type { schema } from 'yaschema';

import type { PrefixedString } from '../../types/PrefixedString.ts';
import { makeNonAnchoredPrefixedStringRegex, makePrefixedStringSchema } from '../../types/PrefixedString.ts';
import type { PrefixedStringInfo } from '../../types/PrefixedStringInfo.ts';
import { isPrefixedString } from './isPrefixedString.ts';
import { makePrefixedStringParser } from './makePrefixedStringParser.ts';

/** Note that there's no runtime checking for the validity of the non-prefixed part -- though overriding the schema can protect at
 * serialization / deserialization time */
export const makePrefixedStringInfo = <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(
  prefix: PrefixT,
  options: {
    allowEmpty: boolean;
    isNonPrefixedValueValid: (nonPrefixedValue: string) => boolean;
    schemaOverride?: schema.RegexSchema<`${PrefixT}${NonPrefixedT}`>;
    nonAnchoredRegexOverride?: RegExp;
  }
): PrefixedStringInfo<PrefixT, NonPrefixedT> => ({
  prefix,
  schema: options.schemaOverride ?? makePrefixedStringSchema(prefix, { ...options }),
  nonAnchoredRegex: options.nonAnchoredRegexOverride ?? makeNonAnchoredPrefixedStringRegex(prefix),
  is: (value: string) => isPrefixedString<PrefixT, NonPrefixedT>(prefix, value, options),
  checked: (value: string) => (isPrefixedString<PrefixT, NonPrefixedT>(prefix, value, options) ? value : undefined),
  make: (nonPrefixedValue: NonPrefixedT) => `${prefix}${nonPrefixedValue}`,
  parse: makePrefixedStringParser(prefix),
  removePrefix: (value: PrefixedString<PrefixT, NonPrefixedT>) => {
    /* node:coverage disable */
    if (!isPrefixedString(prefix, value, options)) {
      throw new Error(`Expected PrefixedString<${JSON.stringify(prefix)}>`);
    }
    /* node:coverage enable */

    return value.substring(prefix.length) as NonPrefixedT;
  }
});
