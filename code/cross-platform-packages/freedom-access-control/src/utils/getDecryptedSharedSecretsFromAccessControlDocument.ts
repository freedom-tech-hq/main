import type { AccessControlDocument, SharedSecretKeys } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { allResultsReduced, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId } from 'freedom-crypto-data';
import type { CryptoService } from 'freedom-crypto-service';
import { decryptOneEncryptedValue } from 'freedom-crypto-service';

export const getDecryptedSharedSecretsFromAccessControlDocument = makeAsyncResultFunc(
  [import.meta.filename],
  async <RoleT extends string>(
    trace: Trace,
    { cryptoService, accessControl }: { cryptoService: CryptoService; accessControl: AccessControlDocument<RoleT> }
  ): PR<Partial<Record<CryptoKeySetId, SharedSecretKeys>>> => {
    const sharedSecrets = await accessControl.getSharedSecrets(trace);
    /* node:coverage disable */
    if (!sharedSecrets.ok) {
      return sharedSecrets;
    }
    /* node:coverage enable */

    return allResultsReduced(
      trace,
      sharedSecrets.value,
      {},
      async (trace, sharedSecret) => decryptOneEncryptedValue(trace, cryptoService, sharedSecret.secretKeysEncryptedPerMember),
      async (_trace, out, decrypted, sharedSecret) => {
        out[sharedSecret.id] = decrypted;
        return makeSuccess(out);
      },
      {} as Partial<Record<CryptoKeySetId, SharedSecretKeys>>
    );
  }
);
