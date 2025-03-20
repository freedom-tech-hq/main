import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { CryptoService } from 'freedom-crypto-service';
import { makeCryptoService } from 'freedom-crypto-service';

import type { EmailUserId } from '../../types/EmailUserId.js';
import { getCryptoKeysDb } from '../modules/internal/storage/getCryptoKeysDb.js';
import { getRequiredCryptoKeysForUser } from '../modules/internal/user/getRequiredCryptoKeysForUser.js';

export const makeCryptoServiceForUser = ({ userId }: { userId: EmailUserId }): CryptoService =>
  makeCryptoService({
    getCryptoKeySetIds: makeAsyncResultFunc([import.meta.filename, 'getCryptoKeySetIds'], async (trace) => {
      const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

      const userCryptoKeysDb = cryptoKeysDb({ userId });
      return userCryptoKeysDb.keys.asc().keys(trace);
    }),

    getCryptoKeysById: makeAsyncResultFunc([import.meta.filename, 'getCryptoKeysById'], async (trace, id) => {
      const cryptoKeysDb = await uncheckedResult(getCryptoKeysDb(trace));

      const userCryptoKeysDb = cryptoKeysDb({ userId });

      return userCryptoKeysDb.object(id).get(trace);
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

    getMostRecentCryptoKeys: makeAsyncResultFunc([import.meta.filename, 'getMostRecentCryptoKeys'], async (trace) =>
      getRequiredCryptoKeysForUser(trace, { userId })
    )
  });
