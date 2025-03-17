import type { PR } from 'freedom-async';
import { allResultsMappedSkipFailures, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { Sha256Hash, Uuid } from 'freedom-basic-data';
import { generalizeFailureResult, InternalStateError } from 'freedom-common-errors';
import { generateSha256HashFromString } from 'freedom-crypto';
import type { TrustedTimeId } from 'freedom-crypto-data';
import type { SyncablePath } from 'freedom-sync-types';

import type { SyncableStore } from '../types/SyncableStore.ts';
import { generateSelfSignedTrustedTimeId } from './generateSelfSignedTrustedTimeId.ts';
import { getCryptoKeyIdForHighestCurrentUserRoleAtPath } from './getCryptoKeyIdForHighestCurrentUserRoleAtPath.ts';
import { getTrustedTimeSourcesForPath } from './getTrustedTimeSourcesForPath.ts';

export const generateTrustedTimeId = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    store: SyncableStore,
    { parentPath, uuid, contentHash }: { parentPath: SyncablePath; uuid: Uuid; contentHash: Sha256Hash }
  ): PR<TrustedTimeId> => {
    const parentPathHash = await generateSha256HashFromString(trace, parentPath.toString());
    if (!parentPathHash.ok) {
      return parentPathHash;
    }

    const roleAndCryptoKeySetId = await getCryptoKeyIdForHighestCurrentUserRoleAtPath(trace, store, {
      // Acceptance is relative to the permissions of the parent folder since the item is being added to it
      path: parentPath
    });
    if (!roleAndCryptoKeySetId.ok) {
      return generalizeFailureResult(trace, roleAndCryptoKeySetId, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    // If the user is a creator, they can sign their own trusted time IDs
    if (roleAndCryptoKeySetId.value.role === 'creator') {
      return generateSelfSignedTrustedTimeId(trace, store, {
        parentPathHash: parentPathHash.value,
        uuid,
        contentHash
      });
    }

    const trustedTimeSources = await getTrustedTimeSourcesForPath(trace, store, parentPath);
    if (!trustedTimeSources.ok) {
      return generalizeFailureResult(trace, trustedTimeSources, ['deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    const trustedTimeIds = await allResultsMappedSkipFailures(
      trace,
      trustedTimeSources.value,
      { onSuccess: 'stop', skipErrorCodes: ['generic'] },
      async (trace, trustedTimeSource) =>
        trustedTimeSource.generateTrustedTimeId(trace, { parentPathHash: parentPathHash.value, uuid, contentHash })
    );
    if (!trustedTimeIds.ok) {
      return trustedTimeIds;
    }

    const trustedTimeId = trustedTimeIds.value.find((id) => id !== undefined);
    if (trustedTimeId === undefined) {
      return makeFailure(new InternalStateError(trace, { message: 'Failed to generate a trusted time ID' }));
    }

    return makeSuccess(trustedTimeId);
  }
);
