import type { Schema } from 'yaschema';

export const matchesSchema =
  <T>(schema: Schema<T>) =>
  (value: any): value is T =>
    schema.validate(value).error === undefined;
