import type { ChainableResult, PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableFileAccessor } from '../../types/SyncableFileAccessor.ts';
import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getBinaryFromFile } from './getBinaryFromFile.ts';

export const getStringFromFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor:
      | SyncablePath
      | ChainableResult<SyncableFileAccessor, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>
  ): PR<string, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const binary = await getBinaryFromFile(trace, store, pathOrAccessor);
    if (!binary.ok) {
      return binary;
    }

    try {
      return makeSuccess(Buffer.from(binary.value).toString('utf-8'));
    } catch (e) {
      /* node:coverage ignore next */
      return makeFailure(new GeneralError(trace, e, 'format-error'));
    }
  }
);
