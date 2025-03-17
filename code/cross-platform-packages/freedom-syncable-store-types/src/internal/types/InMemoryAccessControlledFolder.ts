import type { StaticSyncablePath, SyncableProvenance } from 'freedom-sync-types';
import { invalidProvenance } from 'freedom-sync-types';

import type { MutableSyncableStore } from '../../types/MutableSyncableStore.ts';
import type { SyncTracker } from '../../types/SyncTracker.ts';
import { InMemoryAccessControlledFolderBase } from './InMemoryAccessControlledFolderBase.ts';
import { InMemoryEncryptedBundle } from './InMemoryEncryptedBundle.ts';
import { InMemoryFolder } from './InMemoryFolder.ts';
import { InMemoryPlainBundle } from './InMemoryPlainBundle.ts';

// TODO: need to figure out reasonable way of handling partially loaded data, especially for .access-control bundles, since both uploads and downloads are multi-part and async
export class InMemoryAccessControlledFolder extends InMemoryAccessControlledFolderBase {
  constructor({
    store,
    syncTracker,
    path,
    provenance
  }: {
    store: WeakRef<MutableSyncableStore>;
    syncTracker: SyncTracker;
    path: StaticSyncablePath;
    provenance: SyncableProvenance;
  }) {
    super({ syncTracker, path, provenance });

    const folderOperationsHandler = this.makeFolderOperationsHandler_(store);
    this.deferredInit_({
      store,
      folderOperationsHandler,
      plainBundle: new InMemoryPlainBundle({
        store,
        syncTracker,
        folderOperationsHandler,
        path,
        provenance: invalidProvenance,
        supportsDeletion: false
      }),
      folder: new InMemoryFolder({
        store,
        syncTracker,
        folderOperationsHandler,
        path
      }),
      encryptedBundle: new InMemoryEncryptedBundle({
        store,
        syncTracker,
        folderOperationsHandler,
        provenance: invalidProvenance,
        path
      })
    });
  }
}
