import type { TrustedTimeId } from 'freedom-crypto-data';
import { trustedTimeIdInfo } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { AccessChange } from './AccessChange.ts';
import { makeAccessChangeSchema } from './AccessChange.ts';

export const makeTimedAccessChangeSchema = <RoleT extends string>({ roleSchema }: { roleSchema: Schema<RoleT> }) =>
  schema.allOf(
    makeAccessChangeSchema({ roleSchema }),
    schema.object({
      trustedTimeId: trustedTimeIdInfo.schema
    })
  );
export type TimedAccessChange<RoleT extends string> = AccessChange<RoleT> & { trustedTimeId: TrustedTimeId };
