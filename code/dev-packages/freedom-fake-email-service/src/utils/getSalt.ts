import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { ObjectStore } from 'freedom-object-store-types';
import type { SaltId } from 'freedom-sync-types';

export const getSalt = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, saltStore: ObjectStore<SaltId, string>, saltId: SaltId): PR<string, 'not-found'> =>
    await saltStore.object(saltId).get(trace)
);
