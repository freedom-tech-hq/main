import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { EmailAccess } from 'freedom-email-sync';
import { createBundleAtPath } from 'freedom-syncable-store';

import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import { getUserMailPaths } from './getUserMailPaths.ts';

export const createDefaultCollectionsForUser = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, access: EmailAccess): PR<undefined> => {
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
