import type {
  AccessChange,
  AccessControlDocument,
  ModifyAccessChange,
  ModifyAccessChangeParams,
  TimedAccessChange,
  TrustedTimeSignedAccessChange
} from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { SerializedValue } from 'freedom-basic-data';
import { makeSerializedValueSchema, timeIdInfo } from 'freedom-basic-data';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import type { EncryptingKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { serialize } from 'freedom-serialization';
import type { TrustedTime } from 'freedom-trusted-time-source';
import type { Schema } from 'yaschema';

import { generateSharedKeys } from './generateSharedKeys.ts';
import { encryptAccessControlDocumentSecretKeysForUser } from './internal/encryptAccessControlDocumentSecretKeysForUser.ts';

export const generateSignedModifyAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeForAccessChange,
      cryptoService,
      params,
      accessControlDoc,
      roleSchema,
      doesRoleHaveReadAccess
    }: {
      generateTrustedTimeForAccessChange: PRFunc<TrustedTime, never, [AccessChange<RoleT>]>;
      cryptoService: UserKeys;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<ModifyAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<TrustedTimeSignedAccessChange<RoleT>> => {
    const modifyAccessChange: ModifyAccessChange<RoleT> = { ...params, type: 'modify-access' };

    const trustedTime = await generateTrustedTimeForAccessChange(trace, modifyAccessChange);
    /* node:coverage disable */
    if (!trustedTime.ok) {
      return trustedTime;
    }
    /* node:coverage enable */

    const timeMSec = timeIdInfo.extractTimeMSec(trustedTime.value.timeId);

    const hadReadAccess = doesRoleHaveReadAccess(params.oldRole);
    const willHaveReadAccess = doesRoleHaveReadAccess(params.newRole);
    if (hadReadAccess !== willHaveReadAccess) {
      if (willHaveReadAccess) {
        // If the user is gaining read access, we need to encrypt the shared secret keys for them

        const userPublicKeys = await accessControlDoc.getPublicKeysById(trace, params.publicKeyId);
        if (!userPublicKeys.ok) {
          return generalizeFailureResult(trace, userPublicKeys, 'not-found');
        }

        const encryptedSecretKeysForModifiedUserBySharedKeysId = await encryptAccessControlDocumentSecretKeysForUser(trace, {
          cryptoService,
          accessControlDoc,
          userPublicKeys: userPublicKeys.value
        });
        if (!encryptedSecretKeysForModifiedUserBySharedKeysId.ok) {
          return encryptedSecretKeysForModifiedUserBySharedKeysId;
        }

        modifyAccessChange.encryptedSecretKeysForModifiedUserBySharedKeysId = encryptedSecretKeysForModifiedUserBySharedKeysId.value;
      } else {
        // If the user is losing read access, we need to create a new set of shared keys (and could eventually reencrypt old data)

        const usersWithReadAccessEncryptingKeySets: EncryptingKeySet[] = [];
        for (const [publicKeyId, role] of objectEntries(await accessControlDoc.accessControlState)) {
          if (publicKeyId === params.publicKeyId) {
            continue; // Skip the user we're modifying, since we know they're losing read access
          } else if (role === undefined) {
            continue; // Skip users with no role
          } else if (!doesRoleHaveReadAccess(role)) {
            continue; // Skip users who don't have read access
          }

          const publicKeys = await accessControlDoc.getPublicKeysById(trace, publicKeyId);
          if (!publicKeys.ok) {
            return generalizeFailureResult(trace, publicKeys, 'not-found');
          }

          usersWithReadAccessEncryptingKeySets.push(publicKeys.value.forEncrypting);
        }

        const newSharedKeys = await generateSharedKeys(trace, { encryptingKeySets: usersWithReadAccessEncryptingKeySets });
        /* node:coverage disable */
        if (!newSharedKeys.ok) {
          return newSharedKeys;
        }
        /* node:coverage enable */

        modifyAccessChange.newSharedKeys = newSharedKeys.value;
      }
    }

    const privateKeys = await cryptoService.getPrivateCryptoKeySet(trace);
    if (!privateKeys.ok) {
      return generalizeFailureResult(trace, privateKeys, 'not-found');
    }

    const timedAccessChangeSchema = makeTimedAccessChangeSchema({ roleSchema });
    const serializedTimedAccessChangeSchema = makeSerializedValueSchema(timedAccessChangeSchema);
    const serializedAccessChange = await serialize(trace, { ...modifyAccessChange, timeMSec }, timedAccessChangeSchema);
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
