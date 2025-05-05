import { describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { base64String, timeIdInfo } from 'freedom-basic-data';
import { makeTrace } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import { deserialize } from 'freedom-serialization';
import { expectDeepStrictEqual, expectOk } from 'freedom-testing-tools';

import { makeUserKeysForTesting } from '../../__test_dependency__/makeUserKeysForTesting.ts';
import { TestAccessControlDocument, testStoreRoleSchema } from '../../__test_dependency__/TestAccessControlDocument.ts';
import { generateInitialAccess } from '../generateInitialAccess.ts';
import { generateSignedAddAccessChange } from '../generateSignedAddAccessChange.ts';

describe('generateSignedAddAccessChange', () => {
  it('should work', async () => {
    const trace = makeTrace('test');

    const cryptoKeys1 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys1);

    const userKeys = makeUserKeysForTesting({ privateKeys: cryptoKeys1.value });

    const initialAccess = await generateInitialAccess(trace, {
      userKeys,
      initialAccess: [{ role: 'creator', publicKeys: cryptoKeys1.value.publicOnly() }],
      roleSchema: testStoreRoleSchema,
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(initialAccess);

    const deserializedInitialAccessState = await deserialize(trace, initialAccess.value.state.value);
    expectOk(deserializedInitialAccessState);

    expectDeepStrictEqual(deserializedInitialAccessState.value, { [cryptoKeys1.value.id]: 'creator' });

    const accessControlDoc = new TestAccessControlDocument();
    await accessControlDoc.initialize({ access: initialAccess.value });

    const accessControlState1 = await accessControlDoc.getAccessControlState(trace);
    expectOk(accessControlState1);

    expectDeepStrictEqual(accessControlState1.value, { [cryptoKeys1.value.id]: 'creator' });

    const cryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(cryptoKeys2);

    const signedAddAccessChange = await generateSignedAddAccessChange(trace, {
      userKeys,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: { publicKeys: cryptoKeys2.value.publicOnly(), role: 'editor' },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedAddAccessChange);

    const accessAdded = await accessControlDoc.addChange(trace, signedAddAccessChange.value.signedAccessChange);
    expectOk(accessAdded);

    const accessControlState2 = await accessControlDoc.getAccessControlState(trace);
    expectOk(accessControlState2);

    expectDeepStrictEqual(accessControlState2.value, {
      [cryptoKeys1.value.id]: 'creator',
      [cryptoKeys2.value.id]: 'editor'
    });
  });
});
