import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getTrustedTimeSourcesForPath } from '../getTrustedTimeSourcesForPath.ts';
import { isTrustedTimeNameValid } from './isTrustedTimeNameValid.ts';

export const isTrustedTimeNameValidForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, trustedTimeName, contentHash }: { path: SyncablePath; trustedTimeName: TrustedTimeName; contentHash: Sha256Hash }
  ): PR<boolean, 'deleted' | 'not-found' | 'wrong-type'> => {
    const pathHash = await generateSha256HashFromString(trace, path.toString());
    if (!pathHash.ok) {
      return pathHash;
    }

    const trustedTimeSources = await getTrustedTimeSourcesForPath(trace, store, path);
    if (!trustedTimeSources.ok) {
      if (trustedTimeSources.value.errorCode === 'untrusted') {
        return makeSuccess(false);
      }
      return excludeFailureResult(trustedTimeSources, 'untrusted');
    }

    return await isTrustedTimeNameValid(trace, store, {
      trustedTimeName,
      pathHash: pathHash.value,
      contentHash,
      trustedTimeSources: trustedTimeSources.value
    });
  }
);
