import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { testGenerateCryptoEncryptDecryptKeySet } from '../../../../utils/pem/__test_dependency__/testGenerateCryptoEncryptDecryptKeySet.ts';
import { CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from '../CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';
import { PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm } from '../PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm.ts';

describe('PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm', () => {
  it('should work', async (t: TestContext) => {
    const encDecKeySet = await testGenerateCryptoEncryptDecryptKeySet();
    t.assert.strictEqual(encDecKeySet instanceof PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, true);
    t.assert.strictEqual(encDecKeySet.publicOnly() instanceof CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, true);
    t.assert.strictEqual(encDecKeySet.publicOnly().publicOnly() instanceof CryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, true);
    t.assert.strictEqual(encDecKeySet.forDecrypting instanceof PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, true);
    t.assert.strictEqual(encDecKeySet.forEncrypting instanceof PrivateCryptoKeySet_RsaOaep4096Sha256_Aes256Gcm, true);

    const aesKey = await encDecKeySet.getAesKey();
    t.assert.deepStrictEqual(aesKey.algorithm, { length: 256, name: 'AES-GCM' });

    const rawAesKey1 = await encDecKeySet.getRawAesKey();
    t.assert.strictEqual(rawAesKey1.raw.byteLength > 0, true);

    encDecKeySet.rotateAesKey();

    const rawAesKey2 = await encDecKeySet.getRawAesKey();
    t.assert.notDeepEqual(Array.from(rawAesKey2.raw), Array.from(rawAesKey1.raw));
  });
});
