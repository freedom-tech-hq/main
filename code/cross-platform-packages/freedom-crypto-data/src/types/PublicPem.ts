import { schema } from 'yaschema';

export const publicPemSchema = schema.regex<`-----BEGIN PUBLIC KEY-----\n${string}\n-----END PUBLIC KEY-----`>(
  /^-----BEGIN PUBLIC KEY-----\n[^]+\n-----END PUBLIC KEY-----$/
);
export type PublicPem = typeof publicPemSchema.valueType;
