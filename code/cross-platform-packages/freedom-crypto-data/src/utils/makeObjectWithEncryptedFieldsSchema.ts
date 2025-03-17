import type { Schema } from 'yaschema';
import { schema } from 'yaschema';

import type { EncryptedValue } from '../types/EncryptedValue.ts';
import { makeEncryptedValueSchema } from '../types/EncryptedValue.ts';

export const makeObjectWithEncryptedFieldsSchema = <ObjectT extends Record<string, any>>(objectSchema: schema.ObjectSchema<ObjectT>) => {
  const schemaEntries = Object.entries(objectSchema.map) as Array<[keyof ObjectT, Schema]>;

  type NewFieldMapType = { [KeyT in keyof ObjectT]: Schema<EncryptedValue<ObjectT[KeyT]>> };
  const newFieldMap = schemaEntries.reduce((out, [key, value]) => {
    out[key] = makeEncryptedValueSchema(value);
    return out;
  }, {} as Partial<NewFieldMapType>) as NewFieldMapType;

  return schema.object<{ [KeyT in keyof ObjectT]: EncryptedValue<ObjectT[KeyT]> }, 'no-infer'>(newFieldMap);
};

export type ObjectWithEncryptedFields<ObjectT extends Record<string, any>> = {
  [KeyT in keyof ObjectT]: EncryptedValue<ObjectT[KeyT]>;
};
