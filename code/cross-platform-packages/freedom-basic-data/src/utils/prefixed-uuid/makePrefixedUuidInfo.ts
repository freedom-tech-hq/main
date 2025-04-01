import { v4 } from 'uuid';

import type { PrefixedStringInfo } from '../../types/PrefixedStringInfo.ts';
import { makeNonAnchoredPrefixedUuidRegex, makePrefixedUuidSchema } from '../../types/PrefixedUuid.ts';
import type { Uuid } from '../../types/Uuid.ts';
import { uuidSchema } from '../../types/Uuid.ts';
import { makePrefixedStringInfo } from '../prefixed-string/makePrefixedStringInfo.ts';

export const makePrefixedUuidInfo = <PrefixT extends `${string}_`>(prefix: PrefixT) => {
  const output = makePrefixedStringInfo(prefix, {
    allowEmpty: false,
    schemaOverride: makePrefixedUuidSchema(prefix),
    nonAnchoredRegexOverride: makeNonAnchoredPrefixedUuidRegex(prefix),
    isNonPrefixedValueValid: (nonPrefixedValue) => uuidSchema.regex.test(nonPrefixedValue)
  }) as Omit<PrefixedStringInfo<PrefixT, Uuid>, 'make'> & { make: (uuid?: Uuid) => `${PrefixT}${Uuid}` };

  output.make = (uuid?: Uuid) => `${prefix}${uuid ?? makeUuid()}`;

  return output;
};

// Helpers

const makeUuid = (): Uuid => v4() as Uuid;
