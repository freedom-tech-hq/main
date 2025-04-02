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
import { extractTimeMSecFromTimeId } from 'freedom-basic-data';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateSignedValue } from 'freedom-crypto';
import type { SignedValue } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
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
      cryptoService: CryptoService;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<AddAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
      doesRoleHaveReadAccess: (role: RoleT) => boolean;
    }
  ): PR<{ trustedTime: TrustedTime; signedAccessChange: SignedValue<TimedAccessChange<RoleT>> }> => {
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

    const trustedTime = await generateTrustedTimeForAccessChange(trace, addAccessChange);
    /* node:coverage disable */
    if (!trustedTime.ok) {
      return trustedTime;
    }
    /* node:coverage enable */

    const timeMSec = extractTimeMSecFromTimeId(trustedTime.value.timeId);

    const signingKeys = await cryptoService.getSigningKeySet(trace);
    if (!signingKeys.ok) {
      return generalizeFailureResult(trace, signingKeys, 'not-found');
    }

    const signedAccessChange = await generateSignedValue<TimedAccessChange<RoleT>>(trace, {
      value: { ...addAccessChange, timeMSec },
      valueSchema: makeTimedAccessChangeSchema({ roleSchema }),
      signatureExtras: undefined,
      signatureExtrasSchema: undefined,
      signingKeys: signingKeys.value
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
