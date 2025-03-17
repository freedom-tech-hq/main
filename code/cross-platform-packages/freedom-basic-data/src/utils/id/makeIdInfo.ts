import type { schema } from 'yaschema';

import { MAX_ID_LENGTH, MIN_ID_LENGTH } from '../../consts/id.ts';
import { makeIdSchema } from '../../types/Id.ts';
import type { PrefixedStringInfo } from '../../types/PrefixedStringInfo.ts';
import { makePrefixedStringInfo } from '../prefixed-string/makePrefixedStringInfo.ts';

export const makeIdInfo = <PrefixT extends `${string}_`, NonPrefixedT extends string = string>(
  prefix: PrefixT,
  options?: { schemaOverride?: schema.RegexSchema<`${PrefixT}${NonPrefixedT}`> }
): PrefixedStringInfo<PrefixT, NonPrefixedT> =>
  makePrefixedStringInfo<PrefixT, NonPrefixedT>(prefix, {
    schemaOverride: options?.schemaOverride ?? (makeIdSchema(prefix) as schema.RegexSchema<`${PrefixT}${NonPrefixedT}`>),
    allowEmpty: false,
    isNonPrefixedValueValid: (nonPrefixedValue) => nonPrefixedValue.length >= MIN_ID_LENGTH && nonPrefixedValue.length <= MAX_ID_LENGTH
  });
