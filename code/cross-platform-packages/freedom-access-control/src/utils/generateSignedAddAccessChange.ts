import type {
  AccessChange,
  AccessControlDocument,
  AddAccessChange,
  AddAccessChangeParams,
  TimedAccessChange,
  TrustedTimeSignedAccessChange
} from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SerializedValue } from 'freedom-basic-data';
import { makeSerializedValueSchema, timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import type { UserKeys } from 'freedom-crypto-service';
import { serialize } from 'freedom-serialization';
import type { TrustedTime } from 'freedom-trusted-time-source';
import type { Schema } from 'yaschema';

import { encryptAccessControlDocumentSecretKeysForUser } from './internal/encryptAccessControlDocumentSecretKeysForUser.ts';

export const generateSignedAddAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeForAccessChange,
      cryptoService,
      accessControlDoc,
      params,
      roleSchema,
      doesRoleHaveReadAccess
    }: {
      generateTrustedTimeForAccessChange: PRFunc<TrustedTime, never, [AccessChange<RoleT>]>;
      cryptoService: UserKeys;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<AddAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<TrustedTimeSignedAccessChange<RoleT>> => {
    /**
     * If the new user has read access, we need to encrypt the shared secret keys for them.
     *
     * If the new user doesn't have read access, we don't give them access to any of the shared secret keys -- but their public key will
     * still be included in the new role, so we'll potentially trust them to write / sign content.
     */
    const encryptedSecretKeysForNewUserBySharedKeysId = doesRoleHaveReadAccess(params.role)
      ? await encryptAccessControlDocumentSecretKeysForUser(trace, {
          cryptoService,
          accessControlDoc,
          userPublicKeys: params.publicKeys
        })
      : makeSuccess({});

    /* node:coverage disable */
    if (!encryptedSecretKeysForNewUserBySharedKeysId.ok) {
      return encryptedSecretKeysForNewUserBySharedKeysId;
    }
    /* node:coverage enable */

    const addAccessChange: AddAccessChange<RoleT> = {
      ...params,
      type: 'add-access',
      encryptedSecretKeysForNewUserBySharedKeysId: encryptedSecretKeysForNewUserBySharedKeysId.value
    };

    const trustedTime = await generateTrustedTimeForAccessChange(trace, addAccessChange);
    /* node:coverage disable */
    if (!trustedTime.ok) {
      return trustedTime;
    }
    /* node:coverage enable */

    const timeMSec = timeIdInfo.extractTimeMSec(trustedTime.value.timeId);

    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    const timedAccessChangeSchema = makeTimedAccessChangeSchema({ roleSchema });
    const serializedTimedAccessChangeSchema = makeSerializedValueSchema(timedAccessChangeSchema);
    const serializedAccessChange = await serialize(trace, { ...addAccessChange, timeMSec }, timedAccessChangeSchema);
    if (!serializedAccessChange.ok) {
      return serializedAccessChange;
    }

    const signedAccessChange = await generateSignedValue<SerializedValue<TimedAccessChange<RoleT>>>(trace, {
      value: serializedAccessChange.value,
      valueSchema: serializedTimedAccessChangeSchema,
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: privateKeys.value
    });
    if (!signedAccessChange.ok) {
      return signedAccessChange;
    }

    return makeSuccess({
      trustedTime: trustedTime.value,
      signedAccessChange: signedAccessChange.value
    });
  }
);
