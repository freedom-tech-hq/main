import type { PR } from 'freedom-async';
import { excludeFailureResult, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Sha256Hash } from 'freedom-basic-data';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { TrustedTimeName } from 'freedom-crypto-data';
import type { OldSyncablePath } from 'freedom-sync-types';
import { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../../types/SyncableStore.ts';
import { getTrustedTimeSourcesForPath } from '../getTrustedTimeSourcesForPath.ts';
import { isTrustedTimeNameValid } from './isTrustedTimeNameValid.ts';

export const isTrustedTimeNameValidForPath = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { path, trustedTimeName, contentHash }: { path: OldSyncablePath; trustedTimeName: TrustedTimeName; contentHash: Sha256Hash }
  ): PR<boolean, 'deleted' | 'not-found' | 'wrong-type'> => {
    const parentPathHash = await generateSha256HashFromString(trace, (path.parentPath ?? new SyncablePath(path.storageRootId)).toString());
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

    return await isTrustedTimeNameValid(trace, store, {
      trustedTimeName,
      parentPathHash: parentPathHash.value,
      contentHash,
      trustedTimeSources: trustedTimeSources.value
    });
  }
);
