import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CryptoService } from 'freedom-crypto-service';
import { makeCryptoService } from 'freedom-crypto-service';

import type { EmailUserId } from '../../types/EmailUserId.ts';
import { getCryptoKeysDb } from '../modules/internal/storage/getCryptoKeysDb.ts';
import { getRequiredCryptoKeysForUser } from '../modules/internal/user/getRequiredCryptoKeysForUser.ts';

export const makeCryptoServiceForUser = ({ userId }: { userId: EmailUserId }): CryptoService =>
  makeCryptoService({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc([import.meta.filename, 'getPrivateCryptoKeySetIds'], async (trace) => {
      const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

      const userCryptoKeysDb = cryptoKeysDb({ userId });
      return await userCryptoKeysDb.keys.asc().keys(trace);
    }),

    getPrivateCryptoKeysById: makeAsyncResultFunc([import.meta.filename, 'getPrivateCryptoKeysById'], async (trace, id) => {
      const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

      const userCryptoKeysDb = cryptoKeysDb({ userId });

      return await userCryptoKeysDb.object(id).get(trace);
    }),

    // TODO: add support for looking up public keys from other sources
    getPublicCryptoKeysById: makeAsyncResultFunc([import.meta.filename, 'getPublicCryptoKeysById'], async (trace, id) => {
      const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

      const userCryptoKeysDb = cryptoKeysDb({ userId });

      const found = await userCryptoKeysDb.object(id).get(trace);
      if (!found.ok) {
        return found;
      }

      return makeSuccess(found.value.publicOnly());
    }),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (trace) => await getRequiredCryptoKeysForUser(trace, { userId })
    )
  });
