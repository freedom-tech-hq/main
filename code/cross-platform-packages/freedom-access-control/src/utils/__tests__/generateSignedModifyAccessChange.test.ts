import assert from 'node:assert';
import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import { makeSuccess } from 'freedom-async';
import { base64String, makeIsoDateTime, timeIdInfo } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { makeTrace, makeUuid } from 'freedom-contexts';
import { generateCryptoCombinationKeySet } from 'freedom-crypto';
import type { PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import { expectOk } from 'freedom-testing-tools';

import type { TestingCryptoService } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { makeCryptoServiceForTesting } from '../../__test_dependency__/makeCryptoServiceForTesting.ts';
import { TestAccessControlDocument, testStoreRoleSchema } from '../../__test_dependency__/TestAccessControlDocument.ts';
import { generateInitialAccess } from '../generateInitialAccess.ts';
import { generateSignedAddAccessChange } from '../generateSignedAddAccessChange.ts';
import { generateSignedModifyAccessChange } from '../generateSignedModifyAccessChange.ts';

describe('generateSignedModifyAccessChange', () => {
  let trace!: Trace;
  let cryptoKeys1!: PrivateCombinationCryptoKeySet;
  let cryptoKeys2!: PrivateCombinationCryptoKeySet;
  let cryptoService!: TestingCryptoService;
  let accessControlDoc!: TestAccessControlDocument;

  beforeEach(async () => {
    trace = makeTrace('test');

    const internalCryptoKeys1 = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys1);
    cryptoKeys1 = internalCryptoKeys1.value;

    cryptoService = makeCryptoServiceForTesting({ privateKeys: cryptoKeys1 });

    const initialAccess = await generateInitialAccess(trace, {
      cryptoService,
      initialState: { [cryptoKeys1.id]: 'creator' },
      roleSchema: testStoreRoleSchema
    });
    expectOk(initialAccess);

    assert.deepStrictEqual(initialAccess.value.state.value, { [cryptoKeys1.id]: 'creator' });

    accessControlDoc = new TestAccessControlDocument({ initialAccess: initialAccess.value });

    const internalCryptoKeys2 = await generateCryptoCombinationKeySet(trace);
    expectOk(internalCryptoKeys2);
    cryptoKeys2 = internalCryptoKeys2.value;

    cryptoService.addPublicKeys({ publicKeys: cryptoKeys2 });
  });

  it('should work maintaining read access', async (t: TestContext) => {
    const signedAddAccessChange = await generateSignedAddAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        role: 'editor'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedAddAccessChange);

    const accessAdded = await accessControlDoc.addChange(trace, signedAddAccessChange.value.signedAccessChange);
    expectOk(accessAdded);

    const signedModifyAccessChange = await generateSignedModifyAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        oldRole: 'editor',
        newRole: 'viewer'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedModifyAccessChange);

    const accessModified = await accessControlDoc.addChange(trace, signedModifyAccessChange.value.signedAccessChange);
    expectOk(accessModified);

    t.assert.deepStrictEqual(accessControlDoc.accessControlState, {
      [cryptoKeys1.id]: 'creator',
      [cryptoKeys2.id]: 'viewer'
    });
  });

  it('should work dropping read access', async (t: TestContext) => {
    const signedAddAccessChange = await generateSignedAddAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        role: 'editor'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedAddAccessChange);

    const accessAdded = await accessControlDoc.addChange(trace, signedAddAccessChange.value.signedAccessChange);
    expectOk(accessAdded);

    const signedModifyAccessChange = await generateSignedModifyAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        oldRole: 'editor',
        newRole: 'appender'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedModifyAccessChange);
    t.assert.strictEqual(signedModifyAccessChange.value.signedAccessChange.value.type, 'modify-access');
    if (signedModifyAccessChange.value.signedAccessChange.value.type === 'modify-access') {
      t.assert.notStrictEqual(signedModifyAccessChange.value.signedAccessChange.value.newSharedKeys, undefined);
    }

    const accessModified = await accessControlDoc.addChange(trace, signedModifyAccessChange.value.signedAccessChange);
    expectOk(accessModified);

    t.assert.deepStrictEqual(accessControlDoc.accessControlState, {
      [cryptoKeys1.id]: 'creator',
      [cryptoKeys2.id]: 'appender'
    });
  });

  it('should work adding read access', async (t: TestContext) => {
    const signedAddAccessChange = await generateSignedAddAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        role: 'appender'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedAddAccessChange);

    const accessAdded = await accessControlDoc.addChange(trace, signedAddAccessChange.value.signedAccessChange);
    expectOk(accessAdded);

    const signedModifyAccessChange = await generateSignedModifyAccessChange(trace, {
      cryptoService,
      accessControlDoc,
      roleSchema: testStoreRoleSchema,
      // Not validating trusted times here
      generateTrustedTimeForAccessChange: async () =>
        makeSuccess({
          timeId: timeIdInfo.make(`${makeIsoDateTime()}-${makeUuid()}`),
          trustedTimeSignature: base64String.makeWithUtf8String('test')
        }),
      params: {
        publicKeyId: cryptoKeys2.id,
        oldRole: 'appender',
        newRole: 'viewer'
      },
      doesRoleHaveReadAccess: (role) => role !== 'appender'
    });
    expectOk(signedModifyAccessChange);
    t.assert.strictEqual(signedModifyAccessChange.value.signedAccessChange.value.type, 'modify-access');
    if (signedModifyAccessChange.value.signedAccessChange.value.type === 'modify-access') {
      t.assert.notStrictEqual(
        signedModifyAccessChange.value.signedAccessChange.value.encryptedSecretKeysForModifiedUserBySharedKeysId,
        undefined
      );
    }

    const accessModified = await accessControlDoc.addChange(trace, signedModifyAccessChange.value.signedAccessChange);
    expectOk(accessModified);

    t.assert.deepStrictEqual(accessControlDoc.accessControlState, {
      [cryptoKeys1.id]: 'creator',
      [cryptoKeys2.id]: 'viewer'
    });
  });
});
