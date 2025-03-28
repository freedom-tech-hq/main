import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableItemName, SyncablePath } from 'freedom-sync-types';

import type { MutableSyncableFileAccessor } from '../../types/MutableSyncableFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createBinaryFileAtPath } from './createBinaryFileAtPath.ts';

export const createStringFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    path: SyncablePath,
    { name, value }: { name?: DynamicSyncableItemName; value: string }
  ): PR<MutableSyncableFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await createBinaryFileAtPath(trace, store, path, { name, value: Buffer.from(value, 'utf-8') })
);
