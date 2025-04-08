import type { SyncableId } from 'freedom-sync-types';

import type { MailCollectionType } from '../types/MailCollectionType.ts';
import { mailCollectionTypes } from '../types/MailCollectionType.ts';
import type { getUserMailPaths } from './getUserMailPaths.ts';

export const getCollectionIdsFromSaltedCollectionIds = (paths: Awaited<ReturnType<typeof getUserMailPaths>>) => {
  return mailCollectionTypes.reduce(
    (out, collectionType) => {
      out[paths.collections[collectionType].value.lastId!] = collectionType;
      return out;
    },
    {} as Partial<Record<SyncableId, MailCollectionType>>
  );
};
