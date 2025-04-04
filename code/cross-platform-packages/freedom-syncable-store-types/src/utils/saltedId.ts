import { GeneralError } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import { generateHashFromString } from 'freedom-crypto';
import type { SaltId, SyncableId, SyncableIdConfig, SyncableItemType } from 'freedom-sync-types';
import { DEFAULT_SALT_ID, makeSyncableId, unmarkedSyncableSaltedIdInfo } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';

const trace = makeTrace(import.meta.filename);

export interface SyncableSaltedIdConfig extends SyncableIdConfig {
  defaultSaltId?: SaltId;
}

export type SyncableSaltedIdSettings = SyncableItemType | SyncableSaltedIdConfig;

// Not using makeAsyncResultFunc here because we want this to be easily inlined for readability
export const saltedId =
  (settings: SyncableSaltedIdSettings, plainId: string) =>
  async (salt: SyncableStore | string | undefined): Promise<SyncableId> => {
    if (salt === undefined) {
      throw new GeneralError(trace, 'Salt is required');
    }

    const defaultSaltId = (typeof settings === 'string' ? undefined : settings.defaultSaltId) ?? DEFAULT_SALT_ID;

    const saltString = typeof salt === 'string' ? salt : salt.saltsById[defaultSaltId];
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
