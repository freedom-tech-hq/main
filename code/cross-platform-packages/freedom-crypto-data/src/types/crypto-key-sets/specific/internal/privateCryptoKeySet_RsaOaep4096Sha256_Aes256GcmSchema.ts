import { makeTrace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { asymmetricalAlgorithmByEncryptionMode } from '../../../../consts/asymmetricalAlgorithmByEncryptionMode.ts';
import { generatePemFromPrivateKey } from '../../../../utils/pem/generatePemFromPrivateKey.ts';
import { generatePemFromPublicKey } from '../../../../utils/pem/generatePemFromPublicKey.ts';
import { getPrivateKeyFromPem } from '../../../../utils/pem/getPrivateKeyFromPem.ts';
import { getPublicKeyFromPem } from '../../../../utils/pem/getPublicKeyFromPem.ts';
import { cryptoKeySetIdInfo } from '../../../CryptoKeySetId.ts';
import { privatePemSchema } from '../../../PrivatePem.ts';
import { publicPemSchema } from '../../../PublicPem.ts';
import { PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from '../PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';

const serializedSchema = schema.object({
  type: schema.string('private:RSA-OAEP/4096/SHA-256+AES/256/GCM'),
  id: cryptoKeySetIdInfo.schema,
  rsaPublicKey: publicPemSchema,
  rsaPrivateKey: privatePemSchema
});
type Serialized = typeof serializedSchema.valueType;

export const privateCryptoKeySet_RsaOaep4096Sha256_Aes256GcmSchema = schema.custom<
  PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm,
  Serialized
>({
  typeName: 'private:RSA-OAEP/4096/SHA-256+AES/256/GCM',
  isContainerType: true,
  serDes: {
    isValueType: (value): value is PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm =>
      value !== null &&
      typeof value === 'object' &&
      get(value, 'isCryptoKeySet') === true &&
      get(value, 'kind') === 'private:RSA-OAEP/4096/SHA-256+AES/256/GCM',
    serializedSchema: () => serializedSchema,
    serialize: async (value) => {
      const trace = makeTrace(import.meta.filename, 'serialize');

      const rsaPublicKeyPem = await generatePemFromPublicKey(trace, value.rsaPublicKey);
      /* node:coverage disable */
      if (!rsaPublicKeyPem.ok) {
        return { error: rsaPublicKeyPem.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      const rsaPrivateKeyPem = await generatePemFromPrivateKey(trace, value.rsaPrivateKey, 'pkcs8');
      /* node:coverage disable */
      if (!rsaPrivateKeyPem.ok) {
        return { error: rsaPrivateKeyPem.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return serializedSchema.serializeAsync({
        type: 'private:RSA-OAEP/4096/SHA-256+AES/256/GCM',
        id: value.id,
        rsaPublicKey: rsaPublicKeyPem.value,
        rsaPrivateKey: rsaPrivateKeyPem.value
      });
    },
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm>;
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

      const rsaPrivateKey = await getPrivateKeyFromPem(trace, deserialization.deserialized.rsaPrivateKey, 'pkcs8', {
        algorithm: asymmetricalAlgorithmByEncryptionMode['RSA-OAEP/4096/SHA-256'],
        usages: ['decrypt']
      });
      /* node:coverage disable */
      if (!rsaPrivateKey.ok) {
        return { error: rsaPrivateKey.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return {
        deserialized: new PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm(deserialization.deserialized.id, {
          rsaKeyPair: { publicKey: rsaPublicKey.value, privateKey: rsaPrivateKey.value }
        })
      };
    }
  }
});
