import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { makeUserKeysForTesting } from 'freedom-crypto-service/tests';
import { deserialize } from 'freedom-serialization';
import { expectDeepStrictEqual, expectOk } from 'freedom-testing-tools';
import { schema } from 'yaschema';

import { generateInitialAccess } from '../generateInitialAccess.ts';

const roleSchema = schema.string();

describe('generateInitialAccess', () => {
  it('should work', async () => {
    const trace = makeTrace('test');

    const privateKeys = await generateCryptoCombinationKeySet(trace);
    expectOk(privateKeys);

    const userKeys = makeUserKeysForTesting({ privateKeys: privateKeys.value });

    const initialAccess = await generateInitialAccess(trace, {
      userKeys,
      initialAccess: [{ role: 'creator', publicKeys: privateKeys.value.publicOnly() }],
      roleSchema,
      doesRoleHaveReadAccess: () => true
    });
    expectOk(initialAccess);

    const deserializedInitialAccessState = await deserialize(trace, initialAccess.value.state.value);
    expectOk(deserializedInitialAccessState);

    expectDeepStrictEqual(deserializedInitialAccessState.value, { [privateKeys.value.id]: 'creator' });
  });
});
