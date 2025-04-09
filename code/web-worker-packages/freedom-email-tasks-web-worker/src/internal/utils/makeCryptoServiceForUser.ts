import { makeAsyncResultFunc, uncheckedResult } from 'freedom-async';
import type { CryptoService } from 'freedom-crypto-service';
import { makeCryptoService } from 'freedom-crypto-service';
import type { EmailUserId } from 'freedom-email-sync';

import { getOrCreateKeyStoreForUser } from '../tasks/storage/getOrCreateKeyStoreForUser.ts';
import { getRequiredPrivateKeysForUser } from '../tasks/user/getRequiredPrivateKeysForUser.ts';

export const makeCryptoServiceForUser = ({ userId }: { userId: EmailUserId }): CryptoService =>
  makeCryptoService({
    getPrivateCryptoKeySetIds: makeAsyncResultFunc([import.meta.filename, 'getPrivateCryptoKeySetIds'], async (trace) => {
      const keyStore = await uncheckedResult(getOrCreateKeyStoreForUser(trace, { userId }));

      return await keyStore.keys.asc().keys(trace);
    }),

    getPrivateCryptoKeysById: makeAsyncResultFunc([import.meta.filename, 'getPrivateCryptoKeysById'], async (trace, id) => {
      const keyStore = await uncheckedResult(getOrCreateKeyStoreForUser(trace, { userId }));

      return await keyStore.object(id).get(trace);
    }),

    getMostRecentPrivateCryptoKeys: makeAsyncResultFunc(
      [import.meta.filename, 'getMostRecentPrivateCryptoKeys'],
      async (trace) => await getRequiredPrivateKeysForUser(trace, { userId })
    )
  });
