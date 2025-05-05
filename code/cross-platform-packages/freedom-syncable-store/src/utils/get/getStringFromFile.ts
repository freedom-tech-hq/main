import type { ChainableResult, PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';
import type { SyncableFileAccessor, SyncableStore } from 'freedom-syncable-store-types';

import { getBinaryFromFile } from './getBinaryFromFile.ts';

/** `checkForDeletion` defaults to `true` */
export const getStringFromFile = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace: Trace,
    store: SyncableStore,
    pathOrAccessor: SyncablePath | ChainableResult<SyncableFileAccessor, 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'>,
    options: { checkForDeletion?: boolean } = {}
  ): PR<string, 'deleted' | 'format-error' | 'not-found' | 'untrusted' | 'wrong-type'> => {
    const binary = await getBinaryFromFile(trace, store, pathOrAccessor, options);
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
