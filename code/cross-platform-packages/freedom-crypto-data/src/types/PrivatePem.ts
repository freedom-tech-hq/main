import { schema } from 'yaschema';

export const privatePemSchema = schema.regex<`-----BEGIN PRIVATE KEY-----\n${string}\n-----END PRIVATE KEY-----`>(
  /^-----BEGIN PRIVATE KEY-----\n[^]+\n-----END PRIVATE KEY-----$/
);
export type PrivatePem = typeof privatePemSchema.valueType;
