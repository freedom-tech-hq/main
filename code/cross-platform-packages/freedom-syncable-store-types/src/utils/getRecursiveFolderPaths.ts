import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { StaticSyncablePath } from 'freedom-sync-types';
import { TaskQueue } from 'freedom-task-queue';

import type { FolderStore } from '../types/FolderStore.ts';

export const getRecursiveFolderPaths = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, store: FolderStore): PR<StaticSyncablePath[]> => {
    const queue = new TaskQueue(trace);

    const out: StaticSyncablePath[] = [];

    const makeProcessPathFunc =
      ({ store, path }: { store: FolderStore; path: StaticSyncablePath }) =>
      async (trace: Trace): PR<undefined> => {
        const folderIds = await store.getIds(trace, { type: 'folder' });
        if (!folderIds.ok) {
          return folderIds;
        }

        for (const folderId of folderIds.value) {
          out.push(path.append(folderId));
        }

        const processed = await allResultsMapped(trace, folderIds.value, {}, async (trace, folderId) => {
          const subFolder = await store.get(trace, folderId, 'folder');
          if (!subFolder.ok) {
            return subFolder;
          }

          const subFolderPath = path.append(folderId);
          queue.add(subFolderPath.toString(), makeProcessPathFunc({ store: subFolder.value, path: subFolderPath }));

          return makeSuccess(undefined);
        });
        if (!processed.ok) {
          return generalizeFailureResult(trace, processed, ['deleted', 'not-found', 'wrong-type']);
        }

        return makeSuccess(undefined);
      };

    const rootPath = store.path;
    queue.add(rootPath.toString(), makeProcessPathFunc({ store, path: rootPath }));

    queue.start();
    try {
      await queue.wait();
    } finally {
      queue.stop();
    }

    return makeSuccess(out);
  }
);
