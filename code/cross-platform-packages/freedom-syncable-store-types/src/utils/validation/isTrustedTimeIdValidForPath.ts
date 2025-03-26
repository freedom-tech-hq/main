import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { TrustedTimeId } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';
import { StaticSyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getTrustedTimeSourcesForPath } from '../getTrustedTimeSourcesForPath.ts';
import { isTrustedTimeIdValid } from './isTrustedTimeIdValid.ts';

export const isTrustedTimeIdValidForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, trustedTimeId, contentHash }: { path: SyncablePath; trustedTimeId: TrustedTimeId; contentHash: Sha256Hash }
  ): PR<boolean, 'deleted' | 'not-found' | 'wrong-type'> => {
    const parentPathHash = await generateSha256HashFromString(
      trace,
      (path.parentPath ?? new StaticSyncablePath(path.storageRootId)).toString()
    );
    if (!parentPathHash.ok) {
      return parentPathHash;
    }

    const trustedTimeSources = await getTrustedTimeSourcesForPath(trace, store, path);
    if (!trustedTimeSources.ok) {
      if (trustedTimeSources.value.errorCode === 'untrusted') {
        return makeSuccess(false);
      }
      return excludeFailureResult(trustedTimeSources, 'untrusted');
    }

    return await isTrustedTimeIdValid(trace, store, {
      trustedTimeId,
      parentPathHash: parentPathHash.value,
      contentHash,
      trustedTimeSources: trustedTimeSources.value
    });
  }
);
