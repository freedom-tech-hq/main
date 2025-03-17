import type {
  AccessChange,
  AccessControlDocument,
  AddAccessChange,
  AddAccessChangeParams,
  SharedSecretKeys,
  TimedAccessChange
} from 'freedom-access-control-types';
import { makeTimedAccessChangeSchema, sharedSecretKeysSchema } from 'freedom-access-control-types';
import type { PR, PRFunc } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateEncryptedValue } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue, SignedValue, TrustedTimeId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import type { Schema } from 'yaschema';

import { getDecryptedSharedSecretsFromAccessControlDocument } from './getDecryptedSharedSecretsFromAccessControlDocument.ts';

export const generateSignedAddAccessChange = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      generateTrustedTimeIdForAccessChange,
      cryptoService,
      accessControlDoc,
      params,
      roleSchema
    }: {
      generateTrustedTimeIdForAccessChange: PRFunc<TrustedTimeId, never, [AccessChange<RoleT>]>;
      cryptoService: CryptoService;
      accessControlDoc: AccessControlDocument<RoleT>;
      params: Omit<AddAccessChangeParams<RoleT>, 'type'>;
      roleSchema: Schema<RoleT>;
    }
  ): PR<SignedValue<TimedAccessChange<RoleT>>> => {
    const decryptedSharedSecrets = await getDecryptedSharedSecretsFromAccessControlDocument(trace, {
      cryptoService,
      accessControl: accessControlDoc
    });
    /* node:coverage disable */
    if (!decryptedSharedSecrets.ok) {
      return decryptedSharedSecrets;
    }
    /* node:coverage enable */

    const newUserEncryptingKeys = await cryptoService.getEncryptingKeySetForId(trace, params.publicKeyId);
    /* node:coverage disable */
    if (!newUserEncryptingKeys.ok) {
      return generalizeFailureResult(trace, newUserEncryptingKeys, 'not-found');
    }
    /* node:coverage enable */

    const encryptedSecretKeysForNewUserBySharedSecretId = await allResultsReduced(
      trace,
      objectEntries(decryptedSharedSecrets.value),
      {},
      async (trace, [_sharedSecretId, decryptedSharedSecret]): PR<EncryptedValue<SharedSecretKeys> | undefined> => {
        /* node:coverage disable */
        if (decryptedSharedSecret === undefined) {
          return makeSuccess(undefined);
        }
        /* node:coverage enable */

        return generateEncryptedValue(trace, {
          value: decryptedSharedSecret,
          valueSchema: sharedSecretKeysSchema,
          encryptingKeys: newUserEncryptingKeys.value
        });
      },
      async (_trace, out, encryptedSharedSecret, [sharedSecretId, _decryptedSharedSecret]) => {
        out[sharedSecretId] = encryptedSharedSecret;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>
    );
    /* node:coverage disable */
    if (!encryptedSecretKeysForNewUserBySharedSecretId.ok) {
      return encryptedSecretKeysForNewUserBySharedSecretId;
    }
    /* node:coverage enable */

    const addAccessChange: AddAccessChange<RoleT> = {
      ...params,
      type: 'add-access',
      encryptedSecretKeysForNewUserBySharedSecretId: encryptedSecretKeysForNewUserBySharedSecretId.value
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
