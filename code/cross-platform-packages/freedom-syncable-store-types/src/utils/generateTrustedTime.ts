import type { PR } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { type Sha256Hash, timeIdInfo } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import type { SyncablePath } from 'freedom-sync-types';
import type { TrustedTime } from 'freedom-trusted-time-source';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateSelfSignedTrustedTime } from './generateSelfSignedTrustedTime.ts';
import { getCryptoKeyIdForHighestCurrentUserRoleAtPath } from './getCryptoKeyIdForHighestCurrentUserRoleAtPath.ts';
import { getTrustedTimeSourcesForPath } from './getTrustedTimeSourcesForPath.ts';

export const generateTrustedTime = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPath, contentHash }: { parentPath: SyncablePath; contentHash: Sha256Hash }
  ): PR<TrustedTime> => {
    const roleAndCryptoKeySetId = await getCryptoKeyIdForHighestCurrentUserRoleAtPath(trace, store, {
      // Acceptance is relative to the permissions of the parent folder since the item is being added to it
      path: parentPath
    });
    if (!roleAndCryptoKeySetId.ok) {
      return generalizeFailureResult(trace, roleAndCryptoKeySetId, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // If the user is a creator, they can sign their own trusted time names
    if (roleAndCryptoKeySetId.value.role === 'creator') {
      return await generateSelfSignedTrustedTime(trace, store, { parentPath, contentHash });
    }

    const trustedTimeSources = await getTrustedTimeSourcesForPath(trace, store, parentPath);
    if (!trustedTimeSources.ok) {
      return generalizeFailureResult(trace, trustedTimeSources, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const timeId = timeIdInfo.make();

    const trustedTimeSignatures = await allResultsMappedSkipFailures(
      trace,
      trustedTimeSources.value,
      { onSuccess: 'stop', skipErrorCodes: ['generic'] },
      async (trace, trustedTimeSource) =>
        await trustedTimeSource.generateTrustedTimeSignature(trace, { timeId, parentPath: parentPath.toString(), contentHash })
    );
    if (!trustedTimeSignatures.ok) {
      return trustedTimeSignatures;
    }

    const trustedTimeSignature = trustedTimeSignatures.value.find((id) => id !== undefined);
    if (trustedTimeSignature === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'Failed to generate a trusted time name' }));
    }

    return makeSuccess({ timeId, trustedTimeSignature });
  }
);
