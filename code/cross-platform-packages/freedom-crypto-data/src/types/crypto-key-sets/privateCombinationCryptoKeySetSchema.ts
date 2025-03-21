import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { cryptoKeySetIdInfo } from '../CryptoKeySetId.ts';
import { pureDecryptingKeySetSchema } from '../PureDecryptingKeySet.ts';
import { pureEncryptingKeySetSchema } from '../PureEncryptingKeySet.ts';
import { pureSigningKeySetSchema } from '../PureSigningKeySet.ts';
import { pureVerifyingKeySetSchema } from '../PureVerifyingKeySet.ts';
import { PrivateCombinationCryptoKeySet } from './PrivateCombinationCryptoKeySet.ts';

const serializedSchema = schema.object({
  type: schema.string('private:combination-crypto-key-set'),
  id: cryptoKeySetIdInfo.schema,
  signVerifyKeySet: schema.allOf(pureSigningKeySetSchema, pureVerifyingKeySetSchema),
  encDecKeySet: schema.allOf(pureEncryptingKeySetSchema, pureDecryptingKeySetSchema)
});
type Serialized = typeof serializedSchema.valueType;

export const privateCombinationCryptoKeySetSchema = schema.custom<PrivateCombinationCryptoKeySet, Serialized>({
  typeName: 'private:combination-crypto-key-set',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is PrivateCombinationCryptoKeySet => value instanceof PrivateCombinationCryptoKeySet,
    serializedSchema: () => serializedSchema,
    serialize: (value) =>
      serializedSchema.serializeAsync({
        type: 'private:combination-crypto-key-set',
        id: value.id,
        signVerifyKeySet: value.signVerifyKeySet,
        encDecKeySet: value.encDecKeySet
      }),
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<PrivateCombinationCryptoKeySet>;
      }

      return {
        deserialized: new PrivateCombinationCryptoKeySet(deserialization.deserialized.id, {
          signVerifyKeySet: deserialization.deserialized.signVerifyKeySet,
          encDecKeySet: deserialization.deserialized.encDecKeySet
        })
      };
    }
  }
});
