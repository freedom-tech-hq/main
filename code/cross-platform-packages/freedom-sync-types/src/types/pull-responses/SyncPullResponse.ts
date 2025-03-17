import type { InSyncBundleFile } from './InSyncBundleFile.ts';
import type { InSyncFlatFile } from './InSyncFlatFile.ts';
import type { InSyncFolder } from './InSyncFolder.ts';
import type { OutOfSyncBundleFile } from './OutOfSyncBundleFile.ts';
import type { OutOfSyncFlatFile } from './OutOfSyncFlatFile.ts';
import type { OutOfSyncFolder } from './OutOfSyncFolder.ts';

export type SyncPullResponse = InSyncFolder | OutOfSyncFolder | InSyncFlatFile | OutOfSyncFlatFile | InSyncBundleFile | OutOfSyncBundleFile;
