import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DynamicSyncableId, SyncablePath } from 'freedom-sync-types';

import type { MutableSyncableFlatFileAccessor } from '../../types/MutableSyncableFlatFileAccessor.ts';
import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import { createBinaryFileAtPath } from './createBinaryFileAtPath.ts';

export const createStringFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: MutableSyncableStore,
    parentPath: SyncablePath,
    id: DynamicSyncableId,
    value: string
  ): PR<MutableSyncableFlatFileAccessor, 'conflict' | 'deleted' | 'not-found' | 'untrusted' | 'wrong-type'> =>
    await createBinaryFileAtPath(trace, store, parentPath, id, Buffer.from(value, 'utf-8'))
);
