import type {
  AccessChange,
  AccessControlDocument,
  AddAccessChange,
  AddAccessChangeParams,
  TimedAccessChange
} from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SignedValue, TrustedTimeId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { encryptAccessControlDocumentSecretKeysForUser } from './internal/encryptAccessControlDocumentSecretKeysForUser.ts';

export const generateSignedAddAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeIdForAccessChange,
      cryptoService,
      accessControlDoc,
      params,
      roleSchema,
      doesRoleHaveReadAccess
    }: {
      generateTrustedTimeIdForAccessChange: PRFunc<TrustedTimeId, never, [AccessChange<RoleT>]>;
      cryptoService: CryptoService;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<AddAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<SignedValue<TimedAccessChange<RoleT>>> => {
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
          userPublicKeyId: params.publicKeyId
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

    const trustedTimeId = await generateTrustedTimeIdForAccessChange(trace, addAccessChange);
    /* node:coverage disable */
    if (!trustedTimeId.ok) {
      return trustedTimeId;
    }
    /* node:coverage enable */

    return cryptoService.generateSignedValue<TimedAccessChange<RoleT>>(trace, {
      value: { ...addAccessChange, trustedTimeId: trustedTimeId.value },
      valueSchema: makeTimedAccessChangeSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined
    });
  }
);
