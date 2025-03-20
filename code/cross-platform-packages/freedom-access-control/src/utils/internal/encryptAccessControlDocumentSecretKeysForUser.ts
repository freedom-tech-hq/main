import type { AccessControlDocument, SharedSecretKeys } from 'freedom-access-control-types';
import { sharedSecretKeysSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { generateEncryptedValue } from 'freedom-crypto';
import type { CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';

import { getDecryptedSharedSecretKeysFromAccessControlDocument } from '../getDecryptedSharedSecretKeysFromAccessControlDocument.ts';

export const encryptAccessControlDocumentSecretKeysForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      cryptoService,
      accessControlDoc,
      userPublicKeyId
    }: { cryptoService: CryptoService; accessControlDoc: AccessControlDocument<RoleT>; userPublicKeyId: CryptoKeySetId }
  ): PR<Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>> => {
    const decryptedSharedSecretKeys = await getDecryptedSharedSecretKeysFromAccessControlDocument(trace, {
      cryptoService,
      accessControl: accessControlDoc
    });
    /* node:coverage disable */
    if (!decryptedSharedSecretKeys.ok) {
      return decryptedSharedSecretKeys;
    }
    /* node:coverage enable */

    const userEncryptingKeys = await cryptoService.getEncryptingKeySetForId(trace, userPublicKeyId);
    /* node:coverage disable */
    if (!userEncryptingKeys.ok) {
      return generalizeFailureResult(trace, userEncryptingKeys, 'not-found');
    }
    /* node:coverage enable */

    return allResultsReduced(
      trace,
      objectEntries(decryptedSharedSecretKeys.value),
      {},
      async (trace, [_sharedKeysId, decryptedSharedSecretKeys]): PR<EncryptedValue<SharedSecretKeys> | undefined> => {
        /* node:coverage disable */
        if (decryptedSharedSecretKeys === undefined) {
          return makeSuccess(undefined);
        }
        /* node:coverage enable */

        return generateEncryptedValue(trace, {
          value: decryptedSharedSecretKeys,
          valueSchema: sharedSecretKeysSchema,
          encryptingKeys: userEncryptingKeys.value
        });
      },
      async (_trace, out, encryptedSharedSecretKeys, [sharedKeysId, _decryptedSharedSecretKeys]) => {
        out[sharedKeysId] = encryptedSharedSecretKeys;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>
    );
  }
);
