import { types } from 'freedom-email-api';
import { schema } from 'yaschema';

/**
 * Schema for server-side message storage
 */
export const dbMessageSchema = schema.omit(types.apiMessageSchema, [
  // Dynamic
  'hasAttachments'
]);

export type DbMessageIn = typeof dbMessageSchema.valueType;

export type DbMessageOut = Omit<DbMessageIn, 'updatedAt'> & {
  // I suppose an ORM should fix this divergence
  updatedAt: Date;
};
