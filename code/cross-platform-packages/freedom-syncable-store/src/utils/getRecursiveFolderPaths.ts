import type { PR } from 'freedom-async';
import { allResultsMapped, makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import type { SyncablePath } from 'freedom-sync-types';
import type { FolderStore, SyncableFolderAccessor } from 'freedom-syncable-store-types';
import { TaskQueue } from 'freedom-task-queue';

export const getRecursiveFolderPaths = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, folder: SyncableFolderAccessor): PR<SyncablePath[]> => {
    const queue = new TaskQueue('getRecursiveFolderPaths', trace);

    const out: SyncablePath[] = [];

    const makeProcessPathFunc =
      ({ store, path }: { store: FolderStore; path: SyncablePath }) =>
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
          return generalizeFailureResult(trace, processed, ['not-found', 'untrusted', 'wrong-type']);
        }

        return makeSuccess(undefined);
      };

    const rootPath = folder.path;
    queue.add(rootPath.toString(), makeProcessPathFunc({ store: folder, path: rootPath }));

    queue.start();
    try {
      await queue.wait();
    } finally {
      queue.stop();
    }

    return makeSuccess(out);
  }
);
