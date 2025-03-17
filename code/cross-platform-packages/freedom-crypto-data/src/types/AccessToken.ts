import { schema } from 'yaschema';

import { cryptoKeySetIdInfo } from './CryptoKeySetId.ts';

/** This should usually be used in conjunction with `makeSignedValueSchema` */
export const accessTokenSchema = schema.object({
  cryptoKeySetId: cryptoKeySetIdInfo.schema,
  /** Time, in milliseconds */
  t: schema.number()
});

/** This should usually be used in conjunction with `makeSignedValue` */
export type AccessToken = typeof accessTokenSchema.valueType;
