import type { PR } from 'freedom-async';
import { makeAsyncResultFunc } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getBinaryFromFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<Uint8Array, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const file = await getSyncableAtPath(trace, store, path, 'flatFile');
    if (!file.ok) {
      return file;
    }

    return file.value.getBinary(trace);
  }
);
