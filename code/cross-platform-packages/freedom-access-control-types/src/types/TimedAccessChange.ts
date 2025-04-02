import type { NonNegativeInteger } from 'freedom-basic-data';
import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { AccessChange } from './AccessChange.ts';
import { makeAccessChangeSchema } from './AccessChange.ts';

export const makeTimedAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.allOf(makeAccessChangeSchema({ roleSchema }), schema.object({ timeMSec: nonNegativeIntegerSchema }));
export type TimedAccessChange<RoleT extends string> = AccessChange<RoleT> & { timeMSec: NonNegativeInteger };
