import { GeneralError } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { generateHashFromString } from 'freedom-crypto';
import type { SyncableId, SyncableIdSettings } from 'freedom-sync-types';
import { makeSyncableId, unmarkedSyncableSaltedIdInfo } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';

const trace = makeTrace(import.meta.filename);

// Not using makeAsyncResultFunc here because we want this to be easily inlined for readability
export const saltedId =
  (settings: SyncableIdSettings, plainId: string) =>
  async (salt: SyncableStore | string | undefined): Promise<SyncableId> => {
    if (salt === undefined) {
      throw new GeneralError(trace, 'Salt is required');
    }

    const saltString = typeof salt === 'string' ? salt : salt.defaultSalt;
    if (saltString === undefined) {
      throw new GeneralError(trace, 'Salt is required');
    }

    // TODO: could probably cache these
    const hash = await generateHashFromString(trace, { value: `${saltString}:${plainId}` });
    if (!hash.ok) {
      // This shouldn't really ever happen
      throw new GeneralError(trace, hash.value);
    }

    return makeSyncableId(settings, unmarkedSyncableSaltedIdInfo.make(Buffer.from(hash.value).toString('base64')));
  };
