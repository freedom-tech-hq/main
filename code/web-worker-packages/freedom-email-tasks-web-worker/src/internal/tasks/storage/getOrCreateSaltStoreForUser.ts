import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { Cast } from 'freedom-cast';
import type { EmailUserId } from 'freedom-email-sync';
import { InMemoryObjectStore } from 'freedom-object-store-types';
import type { SaltId } from 'freedom-sync-types';
import { schema } from 'yaschema';

// TODO: TEMP
const globalCache: Record<EmailUserId, InMemoryObjectStore<SaltId, string>> = {};

export const getOrCreateSaltStoreForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (_trace, { userId }: { userId: EmailUserId }) => {
    const cached = globalCache[userId];
    if (cached !== undefined) {
      return makeSuccess(cached);
    }

    const output = new InMemoryObjectStore({
      schema: schema.string(),
      _keyType: Cast<SaltId>()
    });
    globalCache[userId] = output;

    return makeSuccess(output);
  }
);
