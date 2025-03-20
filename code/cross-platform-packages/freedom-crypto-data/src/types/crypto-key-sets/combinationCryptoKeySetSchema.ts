import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { cryptoKeySetIdInfo } from '../CryptoKeySetId.ts';
import { pureEncryptingKeySetSchema } from '../PureEncryptingKeySet.ts';
import { pureVerifyingKeySetSchema } from '../PureVerifyingKeySet.ts';
import { CombinationCryptoKeySet } from './CombinationCryptoKeySet.ts';

const serializedSchema = schema.object({
  type: schema.string('combination-crypto-key-set'),
  id: cryptoKeySetIdInfo.schema,
  verifyingKeySet: pureVerifyingKeySetSchema,
  encryptingKeySet: pureEncryptingKeySetSchema
});
type Serialized = typeof serializedSchema.valueType;

export const combinationCryptoKeySetSchema = schema.custom<CombinationCryptoKeySet, Serialized>({
  typeName: 'combination-crypto-key-set',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is CombinationCryptoKeySet => value instanceof CombinationCryptoKeySet,
    serializedSchema: () => serializedSchema,
    serialize: (value) =>
      serializedSchema.serializeAsync({
        type: 'combination-crypto-key-set',
        id: value.id,
        verifyingKeySet: value.verifyingKeySet,
        encryptingKeySet: value.encryptingKeySet
      }),
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<CombinationCryptoKeySet>;
      }

      return {
        deserialized: new CombinationCryptoKeySet(deserialization.deserialized.id, {
          verifyingKeySet: deserialization.deserialized.verifyingKeySet,
          encryptingKeySet: deserialization.deserialized.encryptingKeySet
        })
      };
    }
  }
});
