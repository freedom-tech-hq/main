import type { TrustedTimeName } from 'freedom-crypto-data';
import { trustedTimeNameInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { AccessChange } from './AccessChange.ts';
import { makeAccessChangeSchema } from './AccessChange.ts';

export const makeTimedAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.allOf(
    makeAccessChangeSchema({ roleSchema }),
    schema.object({
      trustedTimeName: trustedTimeNameInfo.schema
    })
  );
export type TimedAccessChange<RoleT extends string> = AccessChange<RoleT> & { trustedTimeName: TrustedTimeName };
