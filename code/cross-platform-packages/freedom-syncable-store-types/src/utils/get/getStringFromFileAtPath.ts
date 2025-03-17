import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getBinaryFromFileAtPath } from './getBinaryFromFileAtPath.ts';

export const getStringFromFileAtPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    path: SyncablePath
  ): PR<string, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const binary = await getBinaryFromFileAtPath(trace, store, path);
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
