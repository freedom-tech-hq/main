import { schema } from 'yaschema';

import { makeIdSchema } from './Id.ts';

export const sessionTokenDetailsSchema = schema.object({
  sessionId: makeIdSchema('SESSION_'),
  /** Once this token expires, session validity needs to be rechecked and a new token can be generated if appropriate */
  expiresAtTimeMSec: schema.number(),
  isVerified: schema.boolean()
});
export type SessionTokenDetails = typeof sessionTokenDetailsSchema.valueType;
