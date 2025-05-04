import type { AccessControlState, InitialAccess } from 'freedom-access-control-types';
import { makeAccessControlStateSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { makeSerializedValueSchema } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import { type CombinationCryptoKeySet, type CryptoKeySetId, type EncryptingKeySet, publicKeysByIdSchema } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { serialize } from 'freedom-serialization';
import { type Schema } from 'yaschema';

import { generateSharedKeys } from './generateSharedKeys.ts';

const serializedPublicKeysByIdSchema = makeSerializedValueSchema(publicKeysByIdSchema);

export const generateInitialAccess = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      userKeys,
      initialAccess,
      roleSchema,
      doesRoleHaveReadAccess
    }: {
      userKeys: UserKeys;
      initialAccess: Array<{ role: RoleT; publicKeys: CombinationCryptoKeySet }>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<InitialAccess<RoleT>> => {
    const privateKeys = await userKeys.getPrivateCryptoKeySet(trace);
    /* node:coverage disable */
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }
    /* node:coverage enable */

    const initialState: AccessControlState<RoleT> = {};
    const initialPublicKeysById: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> = {};
    const usersWithReadAccessEncryptingKeySets: EncryptingKeySet[] = [];
    for (const { role, publicKeys } of initialAccess) {
      initialState[publicKeys.id] = role;
      initialPublicKeysById[publicKeys.id] = publicKeys;
      if (doesRoleHaveReadAccess(role)) {
        usersWithReadAccessEncryptingKeySets.push(publicKeys.forEncrypting);
      }
    }

    const accessControlStateSchema = makeAccessControlStateSchema({ roleSchema });
    const serializedAccessControlStateSchema = makeSerializedValueSchema(accessControlStateSchema);
    const serializedInitialState = await serialize(trace, initialState, accessControlStateSchema);
    if (!serializedInitialState.ok) {
      return serializedInitialState;
    }

    const serializedPublicKeysById = await serialize(trace, initialPublicKeysById, publicKeysByIdSchema);
    if (!serializedPublicKeysById.ok) {
      return serializedPublicKeysById;
    }

    const signedState = await generateSignedValue(trace, {
      value: serializedInitialState.value,
      valueSchema: serializedAccessControlStateSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: privateKeys.value
    });
    /* node:coverage disable */
    if (!signedState.ok) {
      return signedState;
    }
    /* node:coverage enable */

    const signedPublicKeysById = await generateSignedValue(trace, {
      value: serializedPublicKeysById.value,
      valueSchema: serializedPublicKeysByIdSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: privateKeys.value
    });
    /* node:coverage disable */
    if (!signedPublicKeysById.ok) {
      return signedPublicKeysById;
    }
    /* node:coverage enable */

    const initialSharedKeys = await generateSharedKeys(trace, { encryptingKeySets: usersWithReadAccessEncryptingKeySets });
    /* node:coverage disable */
    if (!initialSharedKeys.ok) {
      return initialSharedKeys;
    }
    /* node:coverage enable */

    return makeSuccess({ state: signedState.value, publicKeysById: signedPublicKeysById.value, sharedKeys: [initialSharedKeys.value] });
  }
);
