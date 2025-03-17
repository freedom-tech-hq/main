import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { testGenerateCryptoSignVerifyKeySet } from '../../../../utils/pem/__test_dependency__/testGenerateCryptoSignVerifyKeySet.ts';
import { CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from '../CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';
import { PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256 } from '../PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256.ts';

describe('PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256', () => {
  it('should work', async (t: TestContext) => {
    const signVerifyKeySet = await testGenerateCryptoSignVerifyKeySet();
    t.assert.strictEqual(signVerifyKeySet instanceof PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, true);
    t.assert.strictEqual(signVerifyKeySet.publicOnly() instanceof CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, true);
    t.assert.strictEqual(signVerifyKeySet.publicOnly().publicOnly() instanceof CryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, true);
    t.assert.strictEqual(signVerifyKeySet.forSigning instanceof PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, true);
    t.assert.strictEqual(signVerifyKeySet.forVerifying instanceof PrivateCryptoKeySet_RsaSsaPkcs1V1_5_4096Sha256, true);
  });
});
