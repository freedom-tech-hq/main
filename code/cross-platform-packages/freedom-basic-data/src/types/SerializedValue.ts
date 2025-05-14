import { get } from 'lodash-es';
import type { JsonValue, Schema } from 'yaschema';
import { schema } from 'yaschema';

export interface SerializedValue<T> {
  isSerializedValue: true;
  isStringSerializable: true;
  serializedValue: JsonValue;
  valueSchema: Schema<T>;
}

export const makeSerializedValue = <T>({
  valueSchema,
  serializedValue
}: {
  valueSchema: Schema<T>;
  serializedValue: JsonValue;
}): SerializedValue<T> => ({
  isSerializedValue: true,
  isStringSerializable: true,
  serializedValue,
  valueSchema
});

export const makeSerializedValueSchema = <T>(
  valueSchema: Schema<T>
): schema.CustomSchema<SerializedValue<T>, `SER_${string}`> & { valueSchema: Schema<T> } => {
  const modifiedCustomSchema = schema.custom<SerializedValue<T>, `SER_${string}`>({
    typeName: 'SerializedValue',
    serDes: {
      isValueType: (value): value is SerializedValue<T> =>
        value !== null && typeof value === 'object' && get(value, 'isSerializedValue') === true,
      serializedSchema: () => schema.regex(new RegExp(`^SER_`)),
      serialize: (value) => ({ serialized: `SER_${JSON.stringify(value.serializedValue)}` }),
      deserialize: (value) => {
        /* node:coverage disable */
        if (!value.startsWith('SER_')) {
          return { error: 'Expected "SER_" prefix', errorLevel: 'error', errorPath: '' };
        }
        /* node:coverage enable */
        const valueOffset = 'SER_'.length;

        const stringValue = value.substring(valueOffset);
        try {
          const serializedValue = JSON.parse(stringValue) as JsonValue;

          return {
            deserialized: makeSerializedValue<T>({
              valueSchema,
              serializedValue
            })
          };
        } catch (e) {
          /* node:coverage disable */
          if (e instanceof Error) {
            return { error: e.message, errorLevel: 'error', errorPath: '' };
          } else {
            return { error: 'Failed to deserialize serialized value', errorLevel: 'error', errorPath: '' };
          }
          /* node:coverage enable */
        }
      }
    }
  }) as schema.CustomSchema<SerializedValue<T>, `SER_${string}`> & { valueSchema: Schema<T> };

  modifiedCustomSchema.valueSchema = valueSchema;

  return modifiedCustomSchema;
};

export const isSerializedValue = <T>(value: any): value is SerializedValue<T> =>
  value !== null &&
  typeof value === 'object' &&
  'isSerializedValue' in value &&
  (value as { isSerializedValue: any }).isSerializedValue === true;
