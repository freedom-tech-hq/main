import { makeTrace } from 'freedom-contexts';
import { get } from 'lodash-es';
import type { DeserializationResult } from 'yaschema';
import { schema } from 'yaschema';

import { algorithmBySigningMode } from '../../../../consts/algorithmBySigningMode.ts';
import { generatePemFromPrivateKey } from '../../../../utils/pem/generatePemFromPrivateKey.ts';
import { generatePemFromPublicKey } from '../../../../utils/pem/generatePemFromPublicKey.ts';
import { getPrivateKeyFromPem } from '../../../../utils/pem/getPrivateKeyFromPem.ts';
import { getPublicKeyFromPem } from '../../../../utils/pem/getPublicKeyFromPem.ts';
import { cryptoKeySetIdInfo } from '../../../CryptoKeySetId.ts';
import { privatePemSchema } from '../../../PrivatePem.ts';
import { publicPemSchema } from '../../../PublicPem.ts';
import { PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from '../PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';

const serializedSchema = schema.object({
  type: schema.string('private:RSASSA-PKCS1-v1_5/4096/SHA-256'),
  id: cryptoKeySetIdInfo.schema,
  rsaPublicKey: publicPemSchema,
  rsaPrivateKey: privatePemSchema
});
type Serialized = typeof serializedSchema.valueType;

export const privateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256Schema = schema.custom<
  PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256,
  Serialized
>({
  typeName: 'private:RSASSA-PKCS1-v1_5/4096/SHA-256',
  serDes: {
    isValueType: (value): value is PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 =>
      value !== null &&
      typeof value === 'object' &&
      get(value, 'isCryptoKeySet') === true &&
      get(value, 'kind') === 'private:RSASSA-PKCS1-v1_5/4096/SHA-256',
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

      return await serializedSchema.serializeAsync({
        type: 'private:RSASSA-PKCS1-v1_5/4096/SHA-256',
        id: value.id,
        rsaPublicKey: rsaPublicKeyPem.value,
        rsaPrivateKey: rsaPrivateKeyPem.value
      });
    },
    deserialize: async (value) => {
      const deserialization = await serializedSchema.deserializeAsync(value);
      if (deserialization.error !== undefined) {
        return { ...deserialization, value: undefined } as DeserializationResult<PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256>;
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

      const rsaPrivateKey = await getPrivateKeyFromPem(trace, deserialization.deserialized.rsaPrivateKey, 'pkcs8', {
        algorithm: algorithmBySigningMode['RSASSA-PKCS1-v1_5/4096/SHA-256'],
        usages: ['sign']
      });
      /* node:coverage disable */
      if (!rsaPrivateKey.ok) {
        return { error: rsaPrivateKey.value.message, errorLevel: 'error', errorPath: '' };
      }
      /* node:coverage enable */

      return {
        deserialized: new PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256(deserialization.deserialized.id, {
          rsaKeyPair: { publicKey: rsaPublicKey.value, privateKey: rsaPrivateKey.value }
        })
      };
    }
  }
});
