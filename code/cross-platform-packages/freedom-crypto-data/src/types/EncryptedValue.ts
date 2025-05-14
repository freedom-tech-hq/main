import { withResolved } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import { get } from 'lodash-es';
import type { DeserializationResult, Schema } from 'yaschema';
import { schema } from 'yaschema';

export interface EncryptedValue<T> {
  isEncryptedValue: true;
  isStringSerializable: true;
  encryptedValue: Base64String;
  decryptedValueSchema: Schema<T>;
}

export const makeEncryptedValue = <T>({
  decryptedValueSchema,
  encryptedValue
}: {
  decryptedValueSchema: Schema<T>;
  encryptedValue: Base64String;
}): EncryptedValue<T> => ({
  isEncryptedValue: true,
  isStringSerializable: true,
  encryptedValue,
  decryptedValueSchema
});

export const makeEncryptedValueSchema = <T>(
  decryptedValueSchema: Schema<T>
): schema.CustomSchema<EncryptedValue<T>, `ENC_${string}`> & { decryptedValueSchema: Schema<T> } => {
  const modifiedCustomSchema = schema.custom<EncryptedValue<T>, `ENC_${string}`>({
    typeName: 'EncryptedValue',
    customValidation: (value) => base64String.schema.validateAsync(value.encryptedValue),
    serDes: {
      isValueType: (value): value is EncryptedValue<T> =>
        value !== null && typeof value === 'object' && get(value, 'isEncryptedValue') === true,
      serializedSchema: () => schema.regex(new RegExp(`^ENC_B64_`)),
      serialize: (value) => {
        const encryptedValueSerialization = base64String.schema.serializeAsync(value.encryptedValue);
        return withResolved(encryptedValueSerialization, (encryptedValueSerialization) => {
          /* node:coverage disable */
          if (encryptedValueSerialization.error !== undefined) {
            return encryptedValueSerialization;
          } else if (typeof encryptedValueSerialization.serialized !== 'string') {
            return { error: 'Expected string serialized value', errorLevel: 'error', errorPath: '' };
          }
          /* node:coverage enable */

          try {
            return { serialized: `ENC_${encryptedValueSerialization.serialized}` };
          } catch (e) {
            /* node:coverage disable */
            if (e instanceof Error) {
              return { error: e.message, errorLevel: 'error', errorPath: '' };
            } else {
              return { error: 'Failed to stringify JSON', errorLevel: 'error', errorPath: '' };
            }
            /* node:coverage enable */
          }
        });
      },
      deserialize: (value) => {
        /* node:coverage disable */
        if (!value.startsWith('ENC_')) {
          return { error: 'Expected "ENC_" prefix', errorLevel: 'error', errorPath: '' };
        }
        /* node:coverage enable */
        const valueOffset = 'ENC_'.length;

        const base64Value = value.substring(valueOffset);

        try {
          const encryptedValueDeserialization = base64String.schema.deserializeAsync(base64Value);
          return withResolved(encryptedValueDeserialization, (encryptedValueDeserialization) => {
            /* node:coverage disable */
            if (encryptedValueDeserialization.error !== undefined) {
              return { ...encryptedValueDeserialization, value: undefined } as DeserializationResult<EncryptedValue<T>>;
            }
            /* node:coverage enable */

            return {
              deserialized: makeEncryptedValue<T>({
                decryptedValueSchema,
                encryptedValue: encryptedValueDeserialization.deserialized
              })
            };
          });
        } catch (e) {
          /* node:coverage disable */
          if (e instanceof Error) {
            return { error: e.message, errorLevel: 'error', errorPath: '' };
          } else {
            return { error: 'Failed to deserialize encrypted value', errorLevel: 'error', errorPath: '' };
          }
          /* node:coverage enable */
        }
      }
    }
  }) as schema.CustomSchema<EncryptedValue<T>, `ENC_${string}`> & { decryptedValueSchema: Schema<T> };

  modifiedCustomSchema.decryptedValueSchema = decryptedValueSchema;

  return modifiedCustomSchema;
};

export const isEncryptedValue = <T>(value: any): value is EncryptedValue<T> =>
  value !== null &&
  typeof value === 'object' &&
  'isEncryptedValue' in value &&
  (value as { isEncryptedValue: any }).isEncryptedValue === true;
