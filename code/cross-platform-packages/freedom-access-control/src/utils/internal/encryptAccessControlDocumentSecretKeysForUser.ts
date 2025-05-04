import type { AccessControlDocument, SharedSecretKeys } from 'freedom-access-control-types';
import { sharedSecretKeysSchema } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import type { Trace } from 'freedom-contexts';
import { generateEncryptedValue } from 'freedom-crypto';
import type { CombinationCryptoKeySet, CryptoKeySetId, EncryptedValue } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';

import { getDecryptedSharedSecretKeysFromAccessControlDocument } from '../getDecryptedSharedSecretKeysFromAccessControlDocument.ts';

export const encryptAccessControlDocumentSecretKeysForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    {
      userKeys,
      accessControlDoc,
      userPublicKeys
    }: { userKeys: UserKeys; accessControlDoc: AccessControlDocument<RoleT>; userPublicKeys: CombinationCryptoKeySet }
  ): PR<Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>> => {
    const decryptedSharedSecretKeys = await getDecryptedSharedSecretKeysFromAccessControlDocument(trace, {
      userKeys,
      accessControl: accessControlDoc
    });
    /* node:coverage disable */
    if (!decryptedSharedSecretKeys.ok) {
      return decryptedSharedSecretKeys;
    }
    /* node:coverage enable */

    return await allResultsReduced(
      trace,
      objectEntries(decryptedSharedSecretKeys.value),
      {},
      async (trace, [_sharedKeysId, decryptedSharedSecretKeys]): PR<EncryptedValue<SharedSecretKeys> | undefined> => {
        /* node:coverage disable */
        if (decryptedSharedSecretKeys === undefined) {
          return makeSuccess(undefined);
        }
        /* node:coverage enable */

        return await generateEncryptedValue(trace, {
          value: decryptedSharedSecretKeys,
          valueSchema: sharedSecretKeysSchema,
          encryptingKeys: userPublicKeys
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
