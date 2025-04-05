import type { ChainableResult, PR } from 'freedom-async';
import { makeAsyncResultFunc, resolveChain } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import { SyncablePath } from 'freedom-sync-types';

import type { SyncableFileAccessor } from '../../types/SyncableFileAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getSyncableAtPath } from './getSyncableAtPath.ts';

export const getBinaryFromFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor:
      | SyncablePath
      | ChainableResult<SyncableFileAccessor, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>
  ): PR<Uint8Array, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const file = await (pathOrAccessor instanceof SyncablePath
      ? getSyncableAtPath(trace, store, pathOrAccessor, 'file')
      : resolveChain(pathOrAccessor));
    if (!file.ok) {
      return file;
    }

    return await file.value.getBinary(trace);
  }
);
