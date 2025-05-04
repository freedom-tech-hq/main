import type { AccessControlDocument, SharedSecretKeys } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
import { decryptOneEncryptedValue } from 'freedom-crypto-service';

export const getDecryptedSharedSecretKeysFromAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    { cryptoService, accessControl }: { cryptoService: UserKeys; accessControl: AccessControlDocument<RoleT> }
  ): PR<Partial<Record<CryptoKeySetId, SharedSecretKeys>>> => {
    const sharedKeys = await accessControl.getSharedKeys(trace);
    /* node:coverage disable */
    if (!sharedKeys.ok) {
      return sharedKeys;
    }
    /* node:coverage enable */

    return await allResultsReduced(
      trace,
      sharedKeys.value,
      {},
      async (trace, sharedKeys) => await decryptOneEncryptedValue(trace, cryptoService, sharedKeys.secretKeysEncryptedPerMember),
      async (_trace, out, decryptedSharedSecretKeys, sharedKeys) => {
        out[sharedKeys.id] = decryptedSharedSecretKeys;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, SharedSecretKeys>>
    );
  }
);
