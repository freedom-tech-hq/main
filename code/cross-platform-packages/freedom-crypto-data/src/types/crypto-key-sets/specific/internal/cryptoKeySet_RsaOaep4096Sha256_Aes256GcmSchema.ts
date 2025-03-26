import { makeTrace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { asymmetricalAlgorithmByEncryptionMode } from '../../../../consts/asymmetricalAlgorithmByEncryptionMode.ts';
import { generatePemFromPublicKey } from '../../../../utils/pem/generatePemFromPublicKey.ts';
import { getPublicKeyFromPem } from '../../../../utils/pem/getPublicKeyFromPem.ts';
import { cryptoKeySetIdInfo } from '../../../CryptoKeySetId.ts';
import { publicPemSchema } from '../../../PublicPem.ts';
import { CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from '../CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';

const serializedSchema = schema.object({
  type: schema.string('RSA-OAEP/4096/SHA-256+AES/256/GCM'),
  id: cryptoKeySetIdInfo.schema,
  rsaPublicKey: publicPemSchema
});
type Serialized = typeof serializedSchema.valueType;

export const cryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema = schema.custom<CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, Serialized>({
  typeName: 'RSA-OAEP/4096/SHA-256+AES/256/GCM',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm =>
      value !== null &&
      typeof value === 'object' &&
      get(value, 'isCryptoKeySet') === true &&
      get(value, 'kind') === 'RSA-OAEP/4096/SHA-256+AES/256/GCM',
    serializedSchema: () => serializedSchema,
    serialize: async (value) => {
      const trace = makeTrace(import.meta.filename, 'serialize');

      const rsaPublicKeyPem = await generatePemFromPublicKey(trace, value.rsaPublicKey);
      /* node:coverage disable */
      if (!rsaPublicKeyPem.ok) {
        return { error: rsaPublicKeyPem.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return await serializedSchema.serializeAsync({
        type: 'RSA-OAEP/4096/SHA-256+AES/256/GCM',
        id: value.id,
        rsaPublicKey: rsaPublicKeyPem.value
      });
    },
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm>;
      }

      const trace = makeTrace(import.meta.filename, 'deserialize');

      const rsaPublicKey = await getPublicKeyFromPem(trace, deserialization.deserialized.rsaPublicKey, {
        algorithm: asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
        usages: ['encrypt']
      });
      /* node:coverage disable */
      if (!rsaPublicKey.ok) {
        return { error: rsaPublicKey.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return {
        deserialized: new CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm(deserialization.deserialized.id, {
          rsaPublicKey: rsaPublicKey.value
        })
      };
    }
  }
});
