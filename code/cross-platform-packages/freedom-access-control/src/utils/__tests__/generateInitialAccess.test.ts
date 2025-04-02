import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { generateInitialAccess } from '../generateInitialAccess.ts';

describe('generateInitialAccess', () => {
  it('should work', async (t: TestContext) => {
    const trace = makeTrace('test');

    const cryptoKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys);

    const cryptoService = makeCryptoServiceForTesting({ privateKeys: cryptoKeys.value });

    const initialAccess = await generateInitialAccess(trace, {
      cryptoService,
      initialState: { [cryptoKeys.value.id]: 'creator' },
      roleSchema: schema.string()
    });
    expectOk(initialAccess);

    t.assert.deepStrictEqual(initialAccess.value.state.value, { [cryptoKeys.value.id]: 'creator' });
  });
});
