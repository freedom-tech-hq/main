import type { schema } from 'yaschema';

import type { PrefixedString } from './PrefixedString.ts';

export interface PrefixedStringInfo<PrefixT extends `${string}_`, NonPrefixedT extends string = string> {
  prefix: PrefixT;
  schema: schema.RegexSchema<PrefixedString<PrefixT, NonPrefixedT>>;
  nonAnchoredRegex: RegExp;
  is: (value: string) => value is PrefixedString<PrefixT, NonPrefixedT>;
  checked: (value: string) => PrefixedString<PrefixT, NonPrefixedT> | undefined;
  make: (nonPrefixedValue: NonPrefixedT) => PrefixedString<PrefixT, NonPrefixedT>;
  parse: (value: string, start?: number) => { value: PrefixedString<PrefixT, NonPrefixedT>; numUsedChars: number } | undefined;
  /** @throws if the specified value isn't the expected type */
  removePrefix: (value: PrefixedString<PrefixT, NonPrefixedT>) => NonPrefixedT;
}
