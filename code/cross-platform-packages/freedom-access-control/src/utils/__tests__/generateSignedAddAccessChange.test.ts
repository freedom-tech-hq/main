import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { trustedTimeIdInfo } from 'freedom-crypto-data';
import { expectOk } from 'freedom-testing-tools';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { TestAccessControlDocument, testStoreRoleSchema } from '../../__test_dependency__/TestAccessControlDocument.ts';
import { generateInitialAccess } from '../generateInitialAccess.ts';
import { generateSignedAddAccessChange } from '../generateSignedAddAccessChange.ts';

describe('generateSignedAddAccessChange', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const cryptoKeys1 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys1);

    const cryptoService = makeCryptoServiceForTesting({ cryptoKeys: cryptoKeys1.value });

    const initialAccess = await generateInitialAccess(trace, {
      cryptoService,
      initialState: { [cryptoKeys1.value.id]: 'creator' },
      roleSchema: testStoreRoleSchema
    });
    expectOk(initialAccess);

    t.assert.deepStrictEqual(initialAccess.value.state.value, { [cryptoKeys1.value.id]: 'creator' });

    const accessControlDoc = new TestAccessControlDocument({ initialAccess: initialAccess.value });

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    cryptoService.addPublicKeys({ publicKeys: cryptoKeys2.value.publicOnly() });

    const signedAddAccessChange = await generateSignedAddAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted time IDs here
      generateTrustedTimeIdForAccessChange: async () => makeSuccess(trustedTimeIdInfo.make('test')),
      params: {
        publicKeyId: cryptoKeys2.value.id,
        role: 'editor'
      }
    });
    expectOk(signedAddAccessChange);

    const accessAdded = await accessControlDoc.addChange(trace, signedAddAccessChange.value);
    expectOk(accessAdded);

    t.assert.deepStrictEqual(accessControlDoc.accessControlState, {
      [cryptoKeys1.value.id]: 'creator',
      [cryptoKeys2.value.id]: 'editor'
    });
  });
});
