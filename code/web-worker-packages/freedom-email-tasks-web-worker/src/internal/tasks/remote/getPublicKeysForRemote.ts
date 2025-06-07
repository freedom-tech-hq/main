import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_MIN_MSEC } from 'freedom-basic-data';
import type { CombinationCryptoKeySet } from 'freedom-crypto-data';
import { makeApiFetchTask } from 'freedom-fetching';
import { InMemoryCache } from 'freedom-in-memory-cache';
import { api } from 'freedom-store-api-server-api';
import { getDefaultApiRoutingContext } from 'yaschema-api';

const getPublicKeysFromRemote = makeApiFetchTask([import.meta.filename, 'getPublicKeysFromRemote'], api.publicKeys.GET);

const globalCache = new InMemoryCache<'remote-public-keys', Promise<CombinationCryptoKeySet>>({
  cacheDurationMSec: 30 * ONE_MIN_MSEC,
  shouldResetIntervalOnGet: false
});

const globalCacheOwner = {};

export const getPublicKeysForRemote = makeAsyncResultFunc([import.meta.filename], async (trace): PR<CombinationCryptoKeySet> => {
  const publicKeys = await globalCache.getOrCreate(globalCacheOwner, 'remote-public-keys', async (): Promise<CombinationCryptoKeySet> => {
    const publicKeys = await getPublicKeysFromRemote(trace, { context: getDefaultApiRoutingContext() });
    if (!publicKeys.ok) {
      throw new GeneralError(trace, publicKeys.value);
    }

    return publicKeys.value.body;
  });
  return makeSuccess(publicKeys);
});
