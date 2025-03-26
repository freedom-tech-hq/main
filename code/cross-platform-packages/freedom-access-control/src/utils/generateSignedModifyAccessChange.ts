import type { AccessChange, AccessControlDocument, TimedAccessChange } from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema } from 'freedom-access-control-types';
import type { ModifyAccessChange, ModifyAccessChangeParams } from 'freedom-access-control-types/lib/types/ModifyAccessChange.ts';
import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId, SignedValue, TrustedTimeId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { generateSharedKeys } from './generateSharedKeys.ts';
import { encryptAccessControlDocumentSecretKeysForUser } from './internal/encryptAccessControlDocumentSecretKeysForUser.ts';

export const generateSignedModifyAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeIdForAccessChange,
      cryptoService,
      params,
      accessControlDoc,
      roleSchema,
      doesRoleHaveReadAccess
    }: {
      generateTrustedTimeIdForAccessChange: PRFunc<TrustedTimeId, never, [AccessChange<RoleT>]>;
      cryptoService: CryptoService;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<ModifyAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<SignedValue<TimedAccessChange<RoleT>>> => {
    const modifyAccessChange: ModifyAccessChange<RoleT> = { ...params, type: 'modify-access' };

    const trustedTimeId = await generateTrustedTimeIdForAccessChange(trace, modifyAccessChange);
    /* node:coverage disable */
    if (!trustedTimeId.ok) {
      return trustedTimeId;
    }
    /* node:coverage enable */

    const hadReadAccess = doesRoleHaveReadAccess(params.oldRole);
    const willHaveReadAccess = doesRoleHaveReadAccess(params.newRole);
    if (hadReadAccess !== willHaveReadAccess) {
      if (willHaveReadAccess) {
        // If the user is gaining read access, we need to encrypt the shared secret keys for them

        const encryptedSecretKeysForModifiedUserBySharedKeysId = await encryptAccessControlDocumentSecretKeysForUser(trace, {
          cryptoService,
          accessControlDoc,
          userPublicKeyId: params.publicKeyId
        });
        if (!encryptedSecretKeysForModifiedUserBySharedKeysId.ok) {
          return encryptedSecretKeysForModifiedUserBySharedKeysId;
        }

        modifyAccessChange.encryptedSecretKeysForModifiedUserBySharedKeysId = encryptedSecretKeysForModifiedUserBySharedKeysId.value;
      } else {
        // If the user is losing read access, we need to create a new set of shared keys (and could eventually reencrypt old data)

        const usersWithReadAccessPublicKeyIds: CryptoKeySetId[] = [];
        for (const [publicKeyId, role] of objectEntries(accessControlDoc.accessControlState)) {
          if (publicKeyId === params.publicKeyId) {
            continue; // Skip the user we're modifying, since we know they're losing read access
          } else if (role === undefined) {
            continue; // Skip users with no role
          } else if (!doesRoleHaveReadAccess(role)) {
            continue; // Skip users who don't have read access
          }

          usersWithReadAccessPublicKeyIds.push(publicKeyId);
        }

        const newSharedKeys = await generateSharedKeys(trace, { cryptoService, cryptoKeySetIds: usersWithReadAccessPublicKeyIds });
        /* node:coverage disable */
        if (!newSharedKeys.ok) {
          return newSharedKeys;
        }
        /* node:coverage enable */

        modifyAccessChange.newSharedKeys = newSharedKeys.value;
      }
    }

    return await cryptoService.generateSignedValue<TimedAccessChange<RoleT>>(trace, {
      value: { ...modifyAccessChange, trustedTimeId: trustedTimeId.value },
      valueSchema: makeTimedAccessChangeSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
  }
);
