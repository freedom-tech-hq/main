import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailCredential } from 'freedom-email-user';
import { getUserMailPaths, mailCollectionTypes } from 'freedom-email-user';
import { createBundleAtPath } from 'freedom-syncable-store-types';

import { getOrCreateEmailAccessForUser } from './getOrCreateEmailAccessForUser.ts';

export const createDefaultCollectionsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, credential: EmailCredential): PR<undefined> => {
    const access = await uncheckedResult(getOrCreateEmailAccessForUser(trace, credential));

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    const createdAllCollectionsBundles = await allResultsMapped(
      trace,
      mailCollectionTypes,
      {},
      async (trace, collectionType) => await createBundleAtPath(trace, userFs, paths.collections[collectionType].value)
    );
    if (!createdAllCollectionsBundles.ok) {
      return generalizeFailureResult(trace, createdAllCollectionsBundles, ['conflict', 'deleted', 'not-found', 'untrusted', 'wrong-type']);
    }

    return makeSuccess(undefined);
  }
);
