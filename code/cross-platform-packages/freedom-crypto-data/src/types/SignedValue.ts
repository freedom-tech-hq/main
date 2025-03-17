import { withResolved } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';
import { base64String } from 'freedom-basic-data';
import type { DeserializationResult, JsonValue, Schema } from 'yaschema';
import { schema } from 'yaschema';

export interface SignedValue<T, SignatureExtrasT = never> {
  isStringSerializable: true;
  signature: Base64String;
  value: T;
  valueSchema: Schema<T>;
  signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
}

export const makeSignedValue = <T, SignatureExtrasT = never>(
  value: Omit<SignedValue<T, SignatureExtrasT>, 'isStringSerializable'>
): SignedValue<T, SignatureExtrasT> => ({
  ...value,
  isStringSerializable: true
});

export const makeSignedValueSchema = <T, SignatureExtrasT = never>(
  valueSchema: Schema<T>,
  signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>
): schema.CustomSchema<SignedValue<T, SignatureExtrasT>, string> & {
  valueSchema: Schema<T>;
  signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
} => {
  const modifiedCustomSchema = schema.custom<SignedValue<T, SignatureExtrasT>, string>({
    typeName: 'SignedValue',
    isContainerType: true,
    customValidation: (value) => valueSchema.validateAsync(value.value),
    serDes: {
      isValueType: (value): value is SignedValue<T, SignatureExtrasT> =>
        value !== null &&
        typeof value === 'object' &&
        'signature' in value &&
        'value' in value &&
        typeof (value as { signature: any }).signature === 'string' &&
        base64String.is((value as { signature: string }).signature),
      serializedSchema: () => schema.regex(new RegExp(`^SIG_B64_[^|]+\\|`)),
      serialize: (value) => {
        const valueSerialization = valueSchema.serializeAsync(value.value);
        return withResolved(valueSerialization, (valueSerialization) => {
          /* node:coverage disable */
          if (valueSerialization.error !== undefined) {
            return valueSerialization;
          }
          /* node:coverage enable */

          try {
            return { serialized: `SIG_${value.signature}|${JSON.stringify(valueSerialization.serialized)}` };
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
        if (!value.startsWith('SIG_')) {
          return { error: 'Expected "SIG_" prefix', errorLevel: 'error', errorPath: '' };
        }
        /* node:coverage enable */
        const valueOffset = 'SIG_'.length;

        const signaturePartOffset = valueOffset;
        const pipeIndex = value.indexOf('|', valueOffset);
        /* node:coverage disable */
        if (pipeIndex < 0) {
          return { error: 'Expected "|" delimiter', errorLevel: 'error', errorPath: '' };
        }
        /* node:coverage enable */

        const uncheckedSignature = value.substring(signaturePartOffset, pipeIndex);
        /* node:coverage disable */
        if (!base64String.is(uncheckedSignature)) {
          return { error: `Expected ${JSON.stringify(base64String.prefix)} prefix`, errorLevel: 'error', errorPath: '' };
        }
        /* node:coverage enable */
        const signature = uncheckedSignature;

        const jsonString = value.substring(pipeIndex + '|'.length);

        try {
          const jsonPart = JSON.parse(jsonString) as JsonValue;
          const valueDeserialization = valueSchema.deserializeAsync(jsonPart);
          return withResolved(valueDeserialization, (valueDeserialization) => {
            /* node:coverage disable */
            if (valueDeserialization.error !== undefined) {
              return { ...valueDeserialization, value: undefined } as DeserializationResult<SignedValue<T, SignatureExtrasT>>;
            }
            /* node:coverage enable */

            return {
              deserialized: makeSignedValue({ signature, value: valueDeserialization.deserialized, valueSchema, signatureExtrasSchema })
            };
          });
        } catch (e) {
          /* node:coverage disable */
          if (e instanceof Error) {
            return { error: e.message, errorLevel: 'error', errorPath: '' };
          } else {
            return { error: 'Failed to parse JSON', errorLevel: 'error', errorPath: '' };
          }
          /* node:coverage enable */
        }
      }
    }
  }) as schema.CustomSchema<SignedValue<T, SignatureExtrasT>, string> & {
    valueSchema: Schema<T>;
    signatureExtrasSchema: [SignatureExtrasT] extends [never] ? undefined : Schema<SignatureExtrasT>;
  };

  modifiedCustomSchema.valueSchema = valueSchema;
  modifiedCustomSchema.signatureExtrasSchema = signatureExtrasSchema;

  return modifiedCustomSchema;
};
