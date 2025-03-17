import { makeTrace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { algorithmBySigningMode } from '../../../../consts/algorithmBySigningMode.ts';
import { generatePemFromPublicKey } from '../../../../utils/pem/generatePemFromPublicKey.ts';
import { getPublicKeyFromPem } from '../../../../utils/pem/getPublicKeyFromPem.ts';
import { cryptoKeySetIdInfo } from '../../../CryptoKeySetId.ts';
import { publicPemSchema } from '../../../PublicPem.ts';
import { CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from '../CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';

const serializedSchema = schema.object({
  type: schema.string('RSASSA-PKCS1-v1_5/4096/SHA-256'),
  id: cryptoKeySetIdInfo.schema,
  rsaPublicKey: publicPemSchema
});
type Serialized = typeof serializedSchema.valueType;

export const cryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema = schema.custom<CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, Serialized>({
  typeName: 'RSASSA-PKCS1-v1_5/4096/SHA-256',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 =>
      value !== null &&
      typeof value === 'object' &&
      get(value, 'isCryptoKeySet') === true &&
      get(value, 'kind') === 'RSASSA-PKCS1-v1_5/4096/SHA-256',
    serializedSchema: () => serializedSchema,
    serialize: async (value) => {
      const trace = makeTrace(import.meta.filename, 'serialize');

      const rsaPublicKeyPem = await generatePemFromPublicKey(trace, value.rsaPublicKey);
      /* node:coverage disable */
      if (!rsaPublicKeyPem.ok) {
        return { error: rsaPublicKeyPem.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return serializedSchema.serializeAsync({
        type: 'RSASSA-PKCS1-v1_5/4096/SHA-256',
        id: value.id,
        rsaPublicKey: rsaPublicKeyPem.value
      });
    },
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256>;
      }

      const trace = makeTrace(import.meta.filename, 'deserialize');

      const rsaPublicKey = await getPublicKeyFromPem(trace, deserialization.deserialized.rsaPublicKey, {
        algorithm: algorithmBySigningMode['RSASSA-PKCS1-v1_5/4096/SHA-256'],
        usages: ['verify']
      });
      /* node:coverage disable */
      if (!rsaPublicKey.ok) {
        return { error: rsaPublicKey.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return {
        deserialized: new CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(deserialization.deserialized.id, {
          rsaPublicKey: rsaPublicKey.value
        })
      };
    }
  }
});
