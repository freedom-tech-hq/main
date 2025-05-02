import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncableOriginOptions, SyncablePath } from 'freedom-sync-types';
import type { MutableSyncableFileAccessor, MutableSyncableStore } from 'freedom-syncable-store-types';

import { createBinaryFileAtPath } from './createBinaryFileAtPath.ts';

export const createStringFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, value, trustedTimeSignature }: Partial<SyncableOriginOptions> & { name?: DynamicSyncableItemName; value: string }
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await createBinaryFileAtPath(trace, store, path, { name, value: Buffer.from(value, 'utf-8'), trustedTimeSignature })
);
