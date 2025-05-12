import type { Result } from 'freedom-async';
import { allResultsMapped, debugTopic, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { objectEntries } from 'freedom-cast';
import { generalizeFailureResult } from 'freedom-common-errors';
import { extractSyncableItemTypeFromPath, type PushFolderLikeItem, type SyncablePath } from 'freedom-sync-types';
import { createViaSyncBundleAtPath, createViaSyncFolderAtPath } from 'freedom-syncable-store';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { pushToLocal } from '../../utils/pushToLocal.ts';

export const pushFolderLikeItemToLocal = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, userFs: MutableSyncableStore, item: PushFolderLikeItem, { path }: { path: SyncablePath }) => {
    DEV: debugTopic('SYNC', (log) => log(trace, `Pushing ${path.toShortString()} to local`));

    const itemType = extractSyncableItemTypeFromPath(path) as 'bundle' | 'folder';

    let created: Result<undefined, 'not-found' | 'wrong-type' | 'untrusted'>;
    switch (itemType) {
      case 'bundle':
        created = await createViaSyncBundleAtPath(trace, userFs, path, item.metadata);
        break;

      case 'folder':
        created = await createViaSyncFolderAtPath(trace, userFs, path, item.metadata);
        break;
    }
    if (!created.ok) {
      return generalizeFailureResult(trace, created, ['untrusted', 'wrong-type']);
    }

    const pushedSubItems = await allResultsMapped(trace, objectEntries(item.itemsById ?? {}), {}, async (trace, [id, subItem]) => {
      if (subItem === undefined) {
        return makeSuccess(undefined);
      }

      return await pushToLocal(trace, userFs, { basePath: path.append(id), item: subItem });
    });
    if (!pushedSubItems.ok) {
      return pushedSubItems;
    }

    return makeSuccess(undefined);
  }
);
