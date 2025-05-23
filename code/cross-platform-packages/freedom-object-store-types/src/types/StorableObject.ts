import { nonNegativeIntegerSchema } from 'freedom-basic-data';
import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

export const makeStorableObjectSchema = <T>(storedValueSchema: Schema<T>) =>
  schema.object_noAutoOptional<StorableObject<T>>({
    storedValue: storedValueSchema,
    updateCount: nonNegativeIntegerSchema
  });
export interface StorableObject<T> {
  storedValue: T;
  updateCount: number;
}
